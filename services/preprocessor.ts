/**
 * Pre-Processor Utility - HTML to Structured Text Engine
 * Step 0 of the extraction pipeline
 *
 * Responsibilities:
 * - Ingest raw HTML content from Gmail.
 * - Parse HTML and convert it into a clean, structured text format for the AI.
 * - Detect language (FR/EN/IT/ES/DE).
 * - Detect currency (EUR/MAD/USD).
 * - Extract raw numeric values.
 */

import * as cheerio from 'cheerio';

export interface PreProcessorResult {
    rawHtml: string;
    structuredText: string;
    fallbackText: string;
    languageHint: 'fr' | 'en' | 'it' | 'es' | 'de' | 'unknown';
    currencyHint: 'EUR' | 'MAD' | 'USD' | 'unknown';
    detectedNumbers: number[];
}

/**
 * Converts raw HTML into a clean, structured, and ordered text format
 * optimized for AI analysis. It prioritizes semantic tags like tables,
 * lists, and headers.
 *
 * @param html The raw HTML string from the email body.
 * @returns A structured text string.
 */
function htmlToStructuredText(html: string): string {
    if (!html) return '';

    const $ = cheerio.load(html);

    // 1. Remove noise: scripts, styles, and head
    $('script, style, head').remove();

    // 2. Process the body to extract content in a structured way
    const blocks: string[] = [];

    // Give a higher weight to elements that are more likely to contain the main content
    const selectors = [
        'table',        // Reservation details are often in tables
        'h1', 'h2', 'h3', // Headings
        'p',            // Paragraphs
        'ul', 'ol',     // Lists
        'div',          // General purpose containers
    ];

    $(selectors.join(','), 'body').each((_, element) => {
        const $el = $(element);
        let blockText = '';

        // Prevent processing elements inside already processed containers (like a p inside a table)
        if ($el.parents('table, ul, ol').length > 0 && !$el.is('p')) {
            return;
        }

        switch (element.tagName) {
            case 'table':
                blockText = processTable($el);
                break;
            case 'h1':
            case 'h2':
            case 'h3':
                blockText = `\n## ${$el.text().trim()} ##\n`;
                break;
            case 'ul':
            case 'ol':
                blockText = processList($el);
                break;
            case 'p':
                 // Process paragraphs, especially those with strong/b tags
                 const $strongs = $el.find('strong, b');
                 if ($strongs.length > 0) {
                     let p_text = $el.text().trim();
                     $strongs.each((_, strongEl) => {
                         const label = $(strongEl).text().trim();
                         if(label.length > 1 && label.length < 40){
                            p_text = p_text.replace(label, `\n${label}:`);
                         }
                     });
                     blockText = p_text;
                 } else {
                     blockText = $el.text().trim();
                 }
                break;
            default: // Primarily for divs
                // For divs, only consider them if they seem to contain direct, important text.
                // This is a heuristic to grab text not otherwise nested in p, table, etc.
                const directText = $el.contents().filter((_, node) => node.type === 'text').text().trim();
                if (directText.length > 10) {
                    blockText = directText;
                }
                break;
        }

        if (blockText && blockText.trim().length > 2) {
            blocks.push(blockText.trim());
        }
    });

    // 3. Join blocks and clean up whitespace
    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function processTable($table: cheerio.Cheerio<cheerio.Element>): string {
    const rows: string[] = [];
    $table.find('tr').each((_, tr) => {
        const cells: string[] = [];
        $(tr).find('th, td').each((_, cell) => {
            // Clean cell text and handle multi-line content within a cell
            const cellText = $(cell).text().replace(/\s\s+/g, ' ').trim();
            if (cellText) {
                cells.push(cellText);
            }
        });
        if (cells.length > 0) {
            // Simple key-value format for two-column tables, otherwise join with pipes
            if (cells.length === 2 && cells[0].length < 40) { // Heuristic for key-value pairs
                rows.push(`${cells[0]}: ${cells[1]}`);
            } else {
                rows.push(cells.join(' | '));
            }
        }
    });
    return `--- TABLE ---\n${rows.join('\n')}\n--- END TABLE ---`;
}

function processList($list: cheerio.Cheerio<cheerio.Element>): string {
    const items: string[] = [];
    $list.find('li').each((_, li) => {
        const itemText = $(li).text().trim();
        if (itemText) {
            items.push(`- ${itemText}`);
        }
    });
    return items.join('\n');
}

/**
 * Creates a simple plain text version of the HTML as a fallback.
 */
function createFallbackText(html: string): string {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('script, style, head').remove();
    return $('body').text().replace(/\s\s+/g, ' ').trim();
}

/**
 * Detect language based on common words in the structured text.
 */
function detectLanguage(text: string): PreProcessorResult['languageHint'] {
    const lowerText = text.toLowerCase();
    const indicators = {
        fr: ['réservation', 'confirmé', 'adultes', 'enfants', 'total', 'date', 'billet'],
        en: ['reservation', 'booking', 'confirmed', 'adults', 'children', 'total', 'date', 'ticket'],
        it: ['prenotazione', 'confermato', 'adulti', 'bambini', 'totale', 'data', 'biglietto'],
        es: ['reserva', 'confirmado', 'adultos', 'niños', 'total', 'fecha', 'boleto'],
        de: ['buchung', 'bestätigt', 'erwachsene', 'kinder', 'gesamt', 'datum', 'ticket']
    };
    const scores = Object.fromEntries(Object.keys(indicators).map(lang => [lang, 0]));

    for (const [lang, words] of Object.entries(indicators)) {
        scores[lang] = words.filter(word => lowerText.includes(word)).length;
    }
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'unknown';
    const detectedLang = Object.keys(scores).find(lang => scores[lang] === maxScore);
    return (detectedLang as PreProcessorResult['languageHint']) || 'unknown';
}

/**
 * Detect currency based on symbols and codes in the structured text.
 */
function detectCurrency(text: string): PreProcessorResult['currencyHint'] {
    if (text.includes('€') || /\bEUR\b/i.test(text)) return 'EUR';
    if (text.includes('د.م') || /\bMAD\b/i.test(text) || /\bDH\b/i.test(text)) return 'MAD';
    if (text.includes('$') || /\bUSD\b/i.test(text)) return 'USD';
    return 'unknown';
}

/**
 * Extract all numeric values from the structured text.
 */
function extractNumbers(text: string): number[] {
    const numberPattern = /\b\d{1,3}(?:[,\s']\d{3})*(?:[.,]\d{1,2})?\b/g;
    const matches = text.match(numberPattern) || [];
    return matches.map(match => {
        let normalized = match.replace(/[\s']/g, ''); // Remove spaces and apostrophes
        if (/,\d{2}$/.test(normalized) && !/\./.test(normalized)) {
            normalized = normalized.replace(',', '.');
        } else {
            normalized = normalized.replace(/,/g, '');
        }
        return parseFloat(normalized);
    }).filter(n => !isNaN(n));
}

/**
 * Main pre-processor function for the AI pipeline.
 * Takes raw HTML, builds a structured text representation, and performs analysis.
 */
export function preProcess(rawHtml: string): PreProcessorResult {
    const structuredText = htmlToStructuredText(rawHtml);
    const fallbackText = createFallbackText(rawHtml);
    
    // Run detection on the structured text as it's cleaner
    const analysisText = structuredText || fallbackText;

    const languageHint = detectLanguage(analysisText);
    const currencyHint = detectCurrency(analysisText);
    const detectedNumbers = extractNumbers(analysisText);

    return {
        rawHtml,
        structuredText,
        fallbackText,
        languageHint,
        currencyHint,
        detectedNumbers
    };
}
