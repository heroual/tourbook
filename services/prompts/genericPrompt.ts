/**
 * Generic Platform Prompt
 * Fallback extraction for unknown platforms
 */

export function getGenericPrompt(language: string, currency: string): string {
    return `You are an expert in extracting reservation data from emails.

CRITICAL RULES:
1. Extract ONLY factual values from the email
2. NEVER extract labels as values
3. Prefer table data over paragraphs
4. Prefer numeric values over textual descriptions
5. If a field is missing, return null
6. NEVER invent data

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Extract the following fields in strict JSON format:
{
  "platform": "Unknown",
  "reservation_id": string | null,
  "customer_name": string,
  "email": string | null,
  "phone": string | null,
  "people_count": number,
  "adults_count": number | null,
  "children_count": number | null,
  "activity_date": string (YYYY-MM-DD),
  "activity_type": string,
  "transport_included": boolean,
  "pickup_address": string | null,
  "total_amount": number,
  "payment_status": string,
  "menu_choice": string | null,
  "notes": string | null
}

Return ONLY valid JSON, no markdown, no explanations.`;
}
