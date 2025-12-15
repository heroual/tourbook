/**
 * Chems Ayour Platform Prompt
 * Specialized extraction for Chems Ayour reservation emails
 */

import { SYSTEM_INSTRUCTIONS } from './systemInstructions';

export function getChemsAyourPrompt(language: string, currency: string): string {
  return `${SYSTEM_INSTRUCTIONS}

PLATFORM-SPECIFIC PATTERNS (Chems Ayour):
- Reference format: CA- followed by numbers
- Often includes menu choice (Tradition, Royal, etc.)
- Primarily in French
- Includes pickup location for dinner shows

LANGUAGE CONTEXT: ${language}
CURRENCY CONTEXT: ${currency}

Return ONLY valid JSON matching the strict format defined above.`;
}
