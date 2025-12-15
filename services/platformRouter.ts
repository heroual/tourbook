/**
 * Platform Router
 * Step 1 of the extraction pipeline
 * 
 * Uses lightweight AI to identify the reservation platform
 */

export type Platform =
    | 'GetYourGuide'
    | 'Viator'
    | 'Civitatis'
    | 'Chems Ayour'
    | 'Airbnb'
    | 'Unknown';

/**
 * Identify platform using sender domain and content analysis
 */
export async function identifyPlatform(
    emailText: string,
    apiKey: string
): Promise<Platform> {
    const lowerText = emailText.toLowerCase();

    // Quick domain-based detection (most reliable)
    if (lowerText.includes('getyourguide') || lowerText.includes('gyg')) {
        return 'GetYourGuide';
    }
    if (lowerText.includes('viator')) {
        return 'Viator';
    }
    if (lowerText.includes('civitatis')) {
        return 'Civitatis';
    }
    if (lowerText.includes('chems ayour') || lowerText.includes('chemsayour')) {
        return 'Chems Ayour';
    }
    if (lowerText.includes('airbnb')) {
        return 'Airbnb';
    }

    // If no clear match, use AI for identification
    try {
        const prompt = `Identify the reservation platform from this email excerpt. 
Reply with ONLY ONE WORD from this list:
GetYourGuide, Viator, Civitatis, Airbnb, Unknown

Email excerpt:
${emailText.substring(0, 500)}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1 }
                })
            }
        );

        if (!response.ok) {
            return 'Unknown';
        }

        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        const validPlatforms: Platform[] = ['GetYourGuide', 'Viator', 'Civitatis', 'Airbnb'];
        if (validPlatforms.includes(text as Platform)) {
            return text as Platform;
        }
    } catch (error) {
        console.error('Platform identification error:', error);
    }

    return 'Unknown';
}
