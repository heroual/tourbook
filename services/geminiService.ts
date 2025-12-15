/**
 * Gemini AI Service - Multi-Step Extraction Pipeline
 * 
 * Architecture:
 * Step 0: Pre-Processing (HTML cleaning, language/currency detection)
 * Step 1: Platform Routing (identify reservation platform)
 * Step 2: Platform-Specific AI Extraction
 * Step 3: Validation & Normalization
 * Step 4: Regex Fallback (if AI fails)
 */

import { ExtractionResult } from '../types';
import { preProcess, PreProcessorResult } from './preprocessor';
import { identifyPlatform, Platform } from './platformRouter';
import { normalizeCurrency } from './currencyNormalizer';
import { validateReservation, ValidationFlag } from './validator';
import { getGetYourGuidePrompt } from './prompts/getYourGuidePrompt';
import { getViatorPrompt } from './prompts/viatorPrompt';
import { getCivitatisPrompt } from './prompts/civitatisPrompt';
import { getChemsAyourPrompt } from './prompts/chemsAyourPrompt';
import { getAirbnbPrompt } from './prompts/airbnbPrompt';
import { getGenericPrompt } from './prompts/genericPrompt';

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('[GeminiService] Multi-Step Pipeline v3.0 initialized');

/**
 * Get platform-specific prompt
 */
function getPlatformPrompt(
  platform: Platform,
  language: string,
  currency: string
): string {
  switch (platform) {
    case 'GetYourGuide':
      return getGetYourGuidePrompt(language, currency);
    case 'Viator':
      return getViatorPrompt(language, currency);
    case 'Civitatis':
      return getCivitatisPrompt(language, currency);
    case 'Chems Ayour':
      return getChemsAyourPrompt(language, currency);
    case 'Airbnb':
      return getAirbnbPrompt(language, currency);
    default:
      return getGenericPrompt(language, currency);
  }
}

/**
 * Extract data using AI with platform-specific prompt
 */
async function extractWithAI(
  cleanText: string,
  platform: Platform,
  preprocessResult: PreProcessorResult
): Promise<ExtractionResult | null> {
  try {
    const prompt = getPlatformPrompt(
      platform,
      preprocessResult.languageHint,
      preprocessResult.currencyHint
    );

    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nEmail Content:\n${cleanText}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('[GeminiService] Empty AI response');
      return null;
    }

    // Clean up markdown code blocks if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson) as ExtractionResult;

    console.log('[GeminiService] AI extraction successful for platform:', platform);
    return data;
  } catch (error) {
    console.error('[GeminiService] AI extraction failed:', error);
    return null;
  }
}

/**
 * Enhanced Regex Fallback with platform-specific patterns
 */
function extractWithRegex(
  text: string,
  platform: Platform,
  preprocessResult: PreProcessorResult
): ExtractionResult {
  console.log('[GeminiService] Using regex fallback for platform:', platform);

  const result: ExtractionResult = {
    platform: platform,
    reservation_id: "",
    customer_name: "",
    email: "",
    phone: "",
    people_count: 1,
    activity_date: new Date().toISOString().split('T')[0],
    activity_type: "Activity",
    transport_included: false,
    pickup_address: "",
    total_amount: 0,
    payment_status: "Non payé",
    notes: "Extracted via Regex Fallback"
  };

  // Platform-specific reservation ID patterns
  const refPatterns: Record<Platform, RegExp> = {
    'GetYourGuide': /GYG[A-Z0-9]{8,}/i,
    'Viator': /(?:Booking|Reference)[:\s#]*(\d{8,})/i,
    'Civitatis': /(?:Reference|Código)[:\s#]*([A-Z0-9]{6,})/i,
    'Chems Ayour': /CA-\d+/i,
    'Airbnb': /(?:Confirmation|Code)[:\s#]*([A-Z0-9]{8,})/i,
    'Unknown': /(?:Reference Number|Réservation N°|Booking Reference|Order ID|Numéro de référence)[:\s#]*([A-Z0-9]+)/i
  };

  const refMatch = text.match(refPatterns[platform] || refPatterns['Unknown']);
  if (refMatch) result.reservation_id = refMatch[1] || refMatch[0];

  // Extract Name
  const nameMatch = text.match(/(?:Client|Customer|Nom|Name|Traveler|Client·e principal·e)[:\s]*([A-Za-z\s]+)(?:\n|$)/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    const invalidNames = ["details", "email", "phone", "telephone", "adults", "participants", "total", "price", "date"];
    if (!invalidNames.includes(rawName.toLowerCase()) && rawName.length > 2) {
      result.customer_name = rawName;
    }
  }

  // Extract People Count & Breakdown
  const adultsMatch = text.match(/(\d+)\s*(?:x\s*)?(?:Adults?|Adultes?)/i);
  const childrenMatch = text.match(/(\d+)\s*(?:x\s*)?(?:Children?|Enfants?)/i);

  if (adultsMatch) result.adults_count = parseInt(adultsMatch[1]);
  if (childrenMatch) result.children_count = parseInt(childrenMatch[1]);

  result.people_count = (result.adults_count || 0) + (result.children_count || 0) || 1;

  // Extract Activity Name
  const activityMatch = text.match(/(?:Activity|Tour|Item|Option|Activité|Détails activité)[:\s]*([^\n]+)/i);
  if (activityMatch && activityMatch[1].trim().length > 3) {
    result.activity_type = activityMatch[1].trim();
  }

  // Extract Date
  const dateMatch = text.match(/(?:Date|Activity Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (dateMatch) {
    try {
      const date = new Date(dateMatch[1]);
      if (!isNaN(date.getTime())) {
        result.activity_date = date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Keep default date
    }
  }

  // Extract Amount
  const amountMatch = text.match(/(?:Total|Prix|Price|Amount)[:\s]*(?:€|EUR|MAD|USD|\$|د\.م\.)?\s*([\d.,\s]+)/i);
  if (amountMatch) {
    const cleanPrice = amountMatch[1].replace(/[^\d.,]/g, '').replace(',', '.');
    result.total_amount = parseFloat(cleanPrice) || 0;
  }

  // Extract Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) result.email = emailMatch[1];

  // Extract Phone
  const phoneMatch = text.match(/(?:Phone|Téléphone|N°\s*de\s*téléphone)[:\s]*([\+\d\s\-()]+)/i);
  if (phoneMatch) result.phone = phoneMatch[1].trim();

  // Extract Menu Choice (for Chems Ayour)
  if (platform === 'Chems Ayour') {
    const menuMatch = text.match(/Menu[:\s]*(Tradition|Royal|Premium)/i);
    if (menuMatch) result.menu_choice = menuMatch[1];
  }

  // Extract Transport
  result.transport_included = /(?:Pick-up|Transfert|Transport)[:\s]*(?:Oui|Yes|Included)/i.test(text);

  const pickupMatch = text.match(/(?:Pick-up|Lieu de départ|Meeting point)[:\s]*([^\n]+)/i);
  if (pickupMatch) result.pickup_address = pickupMatch[1].trim();

  return result;
}

/**
 * Main extraction function - 4-Step Pipeline
 */
export async function parseReservationEmailRest(emailContent: string): Promise<ExtractionResult> {
  console.log('[GeminiService] Starting 4-step extraction pipeline');

  // STEP 0: Pre-Processing
  console.log('[GeminiService] Step 0: Pre-processing');
  const preprocessResult = preProcess(emailContent);
  console.log('[GeminiService] Detected:', {
    language: preprocessResult.languageHint,
    currency: preprocessResult.currencyHint,
    numbers: preprocessResult.detectedNumbers.length
  });

  // STEP 1: Platform Routing
  console.log('[GeminiService] Step 1: Platform routing');
  const platform = await identifyPlatform(preprocessResult.cleanText, API_KEY);
  console.log('[GeminiService] Identified platform:', platform);

  // STEP 2: Platform-Specific AI Extraction
  console.log('[GeminiService] Step 2: AI extraction');
  let extractedData = await extractWithAI(
    preprocessResult.cleanText,
    platform,
    preprocessResult
  );

  let extractionSource: 'ai' | 'regex' = 'ai';

  // STEP 4: Regex Fallback (if AI failed)
  if (!extractedData) {
    console.log('[GeminiService] Step 4: Regex fallback');
    extractedData = extractWithRegex(
      preprocessResult.cleanText,
      platform,
      preprocessResult
    );
    extractionSource = 'regex';
  }

  // STEP 3: Currency Normalization
  console.log('[GeminiService] Step 3: Currency normalization');
  const currencyConversion = normalizeCurrency(
    extractedData.total_amount,
    preprocessResult.currencyHint
  );

  extractedData.amount_eur = currencyConversion.amount_eur;
  extractedData.original_amount = currencyConversion.original_amount;
  extractedData.original_currency = currencyConversion.original_currency;

  console.log('[GeminiService] Pipeline complete. Extraction source:', extractionSource);

  return extractedData;
}