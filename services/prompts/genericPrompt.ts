/**
 * Generic Platform Prompt
 * Fallback extraction for unknown platforms
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getGenericPrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (Generic/Unknown):
- Try to identify any booking reference
- Look for standard reservation patterns

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
