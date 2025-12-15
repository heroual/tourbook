/**
 * Civitatis Platform Prompt
 * Specialized extraction for Civitatis reservation emails
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getCivitatisPrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (Civitatis):
- Reference format: Alphanumeric code
- Often in Spanish or multilingual

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
