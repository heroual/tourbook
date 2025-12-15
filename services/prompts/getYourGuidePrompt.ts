/**
 * GetYourGuide Platform Prompt
 * Specialized extraction for GetYourGuide reservation emails
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getGetYourGuidePrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (GetYourGuide):
- Reference format: GYG followed by alphanumeric (e.g., GYG6H8L4LKA5)
- Email format: customer-xxx@reply.getyourguide.com
- Date format: "Month DD, YYYY HH:MM AM/PM" or "DD/MM/YYYY"

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
