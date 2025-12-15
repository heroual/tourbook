/**
 * Viator Platform Prompt
 * Specialized extraction for Viator reservation emails
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getViatorPrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (Viator):
- Reference format: Numeric booking number
- Pickup time and location often specified

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
