/**
 * Pre-Processor Utility
 * Step 0 of the extraction pipeline
 * 
 * Responsibilities:
 * - Clean HTML to plain text
 * - Detect language (FR/EN/IT/ES/DE)
 * - Detect currency (EUR/MAD/USD)
 * - Extract raw numeric values
 */

export interface PreProcessorResult {
    cleanText: string;
    languageHint: 'fr' | 'en' | 'it' | 'es' | 'de' | 'unknown';
    currencyHint: 'EUR' | 'MAD' | 'USD' | 'unknown';
    detectedNumbers: number[];
}

/**
 * Clean HTML and remove unnecessary whitespace
 */
function cleanHtml(text: string): string {
    // Remove HTML tags
    let clean = text.replace(/<[^>]*>/g, ' ');

    // Decode common HTML entities
    clean = clean
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Normalize whitespace
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
}

/**
 * Detect language based on common words
 */
function detectLanguage(text: string): PreProcessorResult['languageHint'] {
    const lowerText = text.toLowerCase();

    // Language indicators with weights
    const indicators = {
        fr: ['réservation', 'confirmé', 'nombre', 'adultes', 'enfants', 'prix', 'total', 'date', 'lieu', 'transfert'],
        en: ['reservation', 'booking', 'confirmed', 'adults', 'children', 'price', 'total', 'date', 'location', 'transfer'],
        it: ['prenotazione', 'confermato', 'adulti', 'bambini', 'prezzo', 'totale', 'data', 'luogo', 'trasferimento'],
        es: ['reserva', 'confirmado', 'adultos', 'niños', 'precio', 'total', 'fecha', 'lugar', 'traslado'],
        de: ['buchung', 'bestätigt', 'erwachsene', 'kinder', 'preis', 'gesamt', 'datum', 'ort', 'transfer']
    };

    const scores: Record<string, number> = {};

    for (const [lang, words] of Object.entries(indicators)) {
        scores[lang] = words.filter(word => lowerText.includes(word)).length;
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'unknown';

    const detectedLang = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    return (detectedLang as PreProcessorResult['languageHint']) || 'unknown';
}

/**
 * Detect currency based on symbols and codes
 */
function detectCurrency(text: string): PreProcessorResult['currencyHint'] {
    // Check for currency symbols and codes
    if (text.includes('€') || /\bEUR\b/i.test(text)) return 'EUR';
    if (text.includes('د.م.') || /\bMAD\b/i.test(text) || /\bDH\b/i.test(text)) return 'MAD';
    if (text.includes('$') || /\bUSD\b/i.test(text)) return 'USD';

    return 'unknown';
}

/**
 * Extract all numeric values from text
 */
function extractNumbers(text: string): number[] {
    // Match numbers with optional decimal points and thousand separators
    const numberPattern = /\b\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{1,2})?\b/g;
    const matches = text.match(numberPattern) || [];

    return matches.map(match => {
        // Normalize: remove spaces, replace comma with dot if it's a decimal separator
        let normalized = match.replace(/\s/g, '');

        // If comma is followed by 2 digits, it's a decimal separator
        if (/,\d{2}$/.test(normalized)) {
            normalized = normalized.replace(',', '.');
        } else {
            // Otherwise, remove commas (thousand separators)
            normalized = normalized.replace(/,/g, '');
        }

        return parseFloat(normalized);
    }).filter(n => !isNaN(n));
}

/**
 * Main pre-processor function
 */
export function preProcess(rawText: string): PreProcessorResult {
    const cleanText = cleanHtml(rawText);
    const languageHint = detectLanguage(cleanText);
    const currencyHint = detectCurrency(cleanText);
    const detectedNumbers = extractNumbers(cleanText);

    return {
        cleanText,
        languageHint,
        currencyHint,
        detectedNumbers
    };
}
