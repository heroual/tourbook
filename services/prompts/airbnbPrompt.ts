/**
 * Airbnb Platform Prompt
 * Specialized extraction for Airbnb Experiences reservation emails
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getAirbnbPrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (Airbnb):
- Reference format: Alphanumeric confirmation code
- Experience name and host information
- Meeting point details

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
