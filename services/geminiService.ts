import { ExtractionResult } from '../types';

const apiKey = process.env.API_KEY || '';



export const parseReservationEmail = async (emailContent: string): Promise<ExtractionResult | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  try {
    if (!emailContent || emailContent.trim() === "") {
      console.warn("Email content is empty, skipping Gemini call.");
      return null;
    }

    // Direct REST API call to bypass SDK issues
    console.log("🚀 USING REST API VERSION - SDK REMOVED");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant for a travel agency. Extract reservation details from the following email text.
      
      Supported Platforms & Specific Instructions:
      1. **GetYourGuide**: 
         - Extract the "Reference Number" (e.g., GYG...) as 'reservation_id'.
         - Extract the "Client" name.
         - Extract the "Pickup" location if mentioned.
      2. **Chems Ayour**:
         - Extract "Réservation N°" as 'reservation_id'.
         - Extract "Lieu de Pick-up" or "Pick-up" as 'pickup_address'.
         - Extract "Total" as 'total_amount'.
      3. **Civitatis**:
         - Extract the Civitatis booking reference.
      
      General Rules:
      - If a field is missing, return null or an empty string/0 as appropriate.
      - Ensure dates are strictly YYYY-MM-DD.
      - For 'people_count', sum up adults and children (e.g., "2 x Adults" + "1 x Child" = 3).
      - For 'transport_included', return true if "Pick-up" or "Transfert" is mentioned/included.
      - Clean up price strings (remove currency symbols like "DH", "د.م.", "€").
      
      Email Content:
      ${emailContent}
      
      Output strictly valid JSON only.`
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
    console.log("Gemini REST Response:", json);

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("Gemini returned empty text.");
      throw new Error("Empty response from AI");
    }

    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText) as ExtractionResult;
    return data;
  } catch (error) {
    console.error("Error parsing email with Gemini:", error);
    console.log("Falling back to Regex extraction...");
    return parseWithRegex(emailContent);
  }
};

// Fallback Regex Parser
const parseWithRegex = (text: string): ExtractionResult => {
  const result: ExtractionResult = {
    platform: "Unknown",
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

  // 1. Detect Platform
  if (text.includes("GetYourGuide") || text.includes("GYG")) result.platform = "GetYourGuide";
  else if (text.includes("Chems Ayour")) result.platform = "Chems Ayour";
  else if (text.includes("Civitatis")) result.platform = "Civitatis";
  else if (text.includes("Viator")) result.platform = "Viator";

  // 2. Extract Reservation ID
  const refMatch = text.match(/(?:Reference Number|Réservation N°|Booking Reference|Order ID)[:\s#]*([A-Z0-9]+)/i);
  if (refMatch) result.reservation_id = refMatch[1];

  // 3. Extract Name
  const nameMatch = text.match(/(?:Client|Customer|Nom|Name)[:\s]*([A-Za-z\s]+)/i);
  if (nameMatch) result.customer_name = nameMatch[1].trim();

  // 4. Extract People Count
  // Matches: "2 x Adults", "2 Adults", "Adultes: 2"
  const adultMatch = text.match(/(\d+)\s*x?\s*(?:Adults?|Adultes?)/i);
  const childMatch = text.match(/(\d+)\s*x?\s*(?:Children?|Enfants?)/i);
  let count = 0;
  if (adultMatch) count += parseInt(adultMatch[1]);
  if (childMatch) count += parseInt(childMatch[1]);
  if (count > 0) result.people_count = count;

  // 5. Extract Price
  // Matches: "1 200,00", "1200.00", "Price: 500"
  const priceMatch = text.match(/(?:Price|Prix|Total|Montant)[:\s]*([\d\s,.]+)/i);
  if (priceMatch) {
    // Clean string: remove spaces, replace comma with dot
    const cleanPrice = priceMatch[1].replace(/\s/g, '').replace(',', '.');
    result.total_amount = parseFloat(cleanPrice) || 0;
  }

  // 6. Extract Pickup
  const pickupMatch = text.match(/(?:Pick-up|Lieu de départ|Meeting point)[:\s]*([^\n]+)/i);
  if (pickupMatch) {
    result.pickup_address = pickupMatch[1].trim();
    result.transport_included = true;
  }

  return result;
};