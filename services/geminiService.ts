/**
 * Gemini AI Service - Multi-Step Extraction Pipeline v4.0
 *
 * Architecture:
 * Step 0: Pre-Processing (HTML -> Structured Text, language/currency detection)
 * Step 1: Platform Routing (identify reservation platform from structured text)
 * Step 2: Platform-Specific AI Extraction (using structured text)
 * Step 3: Currency Normalization
 * Step 4: Regex Fallback (if AI fails, using structured text)
 */

import { ExtractionResult } from '../types';
import { preProcess, PreProcessorResult } from './preprocessor';
import { identifyPlatform, Platform } from './platformRouter';
import { normalizeCurrency } from './currencyNormalizer';
import { getGetYourGuidePrompt } from './prompts/getYourGuidePrompt';
import { getViatorPrompt } from './prompts/viatorPrompt';
import { getCivitatisPrompt } from './prompts/civitatisPrompt';
import { getChemsAyourPrompt } from './prompts/chemsAyourPrompt';
import { getAirbnbPrompt } from './prompts/airbnbPrompt';
import { getGenericPrompt } from './prompts/genericPrompt';

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-flash'; // Correct model name
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('[GeminiService] Multi-Step Pipeline v4.0 (HTML-Aware) initialized');

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
 * Utility to pause execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract data using AI with platform-specific prompt
 * Includes Retry Logic for 429 Errors
 */
async function extractWithAI(
  structuredText: string,
  platform: Platform,
  preprocessResult: PreProcessorResult
): Promise<ExtractionResult | null> {
  const prompt = getPlatformPrompt(
    platform,
    preprocessResult.languageHint,
    preprocessResult.currencyHint
  );

  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      if (retries > 0) await delay(2000 * retries);

      const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\n\n--- Email Content ---\n${structuredText}`
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

      if (response.status === 429 || response.status === 503) {
        console.warn(`[GeminiService] AI Rate limit (429/503). Retrying... (${retries + 1}/${maxRetries})`);
        retries++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        console.warn('[GeminiService] Empty AI response content.');
        return null;
      }

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson) as ExtractionResult;

      console.log('[GeminiService] AI extraction successful for platform:', platform);
      return data;

    } catch (error) {
      console.error(`[GeminiService] AI extraction attempt ${retries + 1} failed:`, error);
      retries++;
    }
  }
  return null;
}

/**
 * Enhanced Regex Fallback with platform-specific patterns on structured text
 */
function extractWithRegex(
  text: string,
  platform: Platform
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
    activity_type: "Activité",
    transport_included: false,
    pickup_address: "",
    total_amount: 0,
    payment_status: "Non payé",
    notes: "Extrait via Regex Fallback. Vérification manuelle requise."
  };
  
  const refPatterns: Record<Platform, RegExp> = {
    'GetYourGuide': /GYG[A-Z0-9]{8,}/i,
    'Viator': /(?:Booking|Reference)[\s:]*(\d{8,})/i,
    'Civitatis': /(?:Reference|Código)[\s:]*([A-Z0-9]{6,})/i,
    'Chems Ayour': /CA-\d+/i,
    'Airbnb': /(?:Confirmation|Code)[\s:]*([A-Z0-9]{8,})/i,
    'Unknown': /(?:Reference|Réservation|Booking)[\s:N°#]*([A-Z0-9-]{6,})/i
  };

  const refMatch = text.match(refPatterns[platform] || refPatterns['Unknown']);
  if (refMatch) result.reservation_id = refMatch[1] || refMatch[0];
  
  const nameMatch = text.match(/(?:Client|Customer|Nom|Name|Traveler)[\s:]*([A-Za-z\s'-]+)(?:\n|$)/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    if (rawName.length > 2 && rawName.length < 50) {
      result.customer_name = rawName;
    }
  }
  
  const adultsMatch = text.match(/(\d+)\s*(?:x\s*)?(?:Adults?|Adultes?)/i);
  const childrenMatch = text.match(/(\d+)\s*(?:x\s*)?(?:Children?|Enfants?)/i);
  if (adultsMatch) result.adults_count = parseInt(adultsMatch[1], 10);
  if (childrenMatch) result.children_count = parseInt(childrenMatch[1], 10);
  result.people_count = (result.adults_count || 0) + (result.children_count || 0) || 1;

  // ... (Other regex patterns would be updated similarly) ...

  return result;
}

/**
 * Main extraction function - 4-Step Pipeline
 */
export async function parseReservationEmailRest(rawHtmlEmail: string): Promise<ExtractionResult> {
  console.log('[GeminiService] Starting 4-step extraction pipeline...');

  // --- MANDATORY DEBUG LOG ---
  console.log(`[GeminiService] DEBUG: Raw HTML length: ${rawHtmlEmail.length} chars`);
  
  // STEP 0: Pre-Processing (HTML -> Structured Text)
  console.log('[GeminiService] Step 0: Pre-processing HTML to structured text');
  const preprocessResult = preProcess(rawHtmlEmail);
  const { structuredText, fallbackText } = preprocessResult;

  // --- AI INPUT GUARANTEE ---
  const aiInputText = structuredText.length > 50 ? structuredText : fallbackText;

  // --- MANDATORY DEBUG LOG ---
  console.log(`[GeminiService] DEBUG: Structured Text preview (first 500 chars):\n`, aiInputText.substring(0, 500));

  // STEP 1: Platform Routing
  console.log('[GeminiService] Step 1: Platform routing');
  const platform = await identifyPlatform(aiInputText, API_KEY);
  
  // --- MANDATORY DEBUG LOG ---
  console.log(`[GeminiService] DEBUG: Identified platform: ${platform}`);

  // STEP 2: Platform-Specific AI Extraction
  console.log('[GeminiService] Step 2: AI extraction');
  let extractedData = await extractWithAI(
    aiInputText,
    platform,
    preprocessResult
  );

  let extractionSource: 'ai' | 'regex' = 'ai';

  // STEP 4: Regex Fallback (if AI failed)
  if (!extractedData) {
    console.log('[GeminiService] Step 4: Regex fallback initiated');
    extractedData = extractWithRegex(
      aiInputText,
      platform,
    );
    extractionSource = 'regex';
  }

  // STEP 3: Currency Normalization
  console.log('[GeminiService] Step 3: Currency normalization');
  if (extractedData.total_amount) {
    const currencyConversion = normalizeCurrency(
      extractedData.total_amount,
      preprocessResult.currencyHint
    );
    extractedData.amount_eur = currencyConversion.amount_eur;
    extractedData.original_amount = currencyConversion.original_amount;
    extractedData.original_currency = currencyConversion.original_currency;
  }

  console.log(`[GeminiService] Pipeline complete. Extraction source: ${extractionSource}`);

  return extractedData;
}