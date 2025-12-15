/**
 * Currency Normalizer
 * Converts various currencies to EUR and stores both original and normalized values
 */

export interface CurrencyConversion {
    amount_eur: number;
    original_amount: number;
    original_currency: 'EUR' | 'MAD' | 'USD' | 'unknown';
}

// Conversion rates (as of implementation)
const CONVERSION_RATES = {
    MAD_TO_EUR: 1 / 10.9,
    USD_TO_EUR: 0.92
};

/**
 * Normalize currency to EUR
 */
export function normalizeCurrency(
    amount: number,
    currency: 'EUR' | 'MAD' | 'USD' | 'unknown'
): CurrencyConversion {
    let amount_eur: number;

    switch (currency) {
        case 'EUR':
            amount_eur = amount;
            break;
        case 'MAD':
            amount_eur = amount * CONVERSION_RATES.MAD_TO_EUR;
            break;
        case 'USD':
            amount_eur = amount * CONVERSION_RATES.USD_TO_EUR;
            break;
        default:
            // If unknown, assume EUR
            amount_eur = amount;
    }

    // Round to 2 decimal places
    amount_eur = Math.round(amount_eur * 100) / 100;

    return {
        amount_eur,
        original_amount: amount,
        original_currency: currency
    };
}
