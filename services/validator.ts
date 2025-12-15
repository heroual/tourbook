/**
 * Validation Engine
 * Step 3 of the extraction pipeline
 * 
 * Validates extracted data and flags incoherences
 */

import { Reservation } from '../types';

export interface ValidationResult {
    isValid: boolean;
    flags: ValidationFlag[];
    needsReview: boolean;
}

export type ValidationFlag =
    | 'missing_name'
    | 'missing_date'
    | 'invalid_date'
    | 'invalid_amount'
    | 'zero_pax'
    | 'payment_incoherence'
    | 'missing_platform'
    | 'missing_reservation_id';

/**
 * Validate reservation data
 */
export function validateReservation(reservation: Partial<Reservation>): ValidationResult {
    const flags: ValidationFlag[] = [];

    // Check required fields
    if (!reservation.customer_name || reservation.customer_name.trim() === '') {
        flags.push('missing_name');
    }

    if (!reservation.activity_date) {
        flags.push('missing_date');
    } else {
        // Validate date format
        const date = new Date(reservation.activity_date);
        if (isNaN(date.getTime())) {
            flags.push('invalid_date');
        }
    }

    if (!reservation.platform || reservation.platform === 'Unknown') {
        flags.push('missing_platform');
    }

    if (!reservation.reservation_id || reservation.reservation_id.trim() === '') {
        flags.push('missing_reservation_id');
    }

    // Validate numeric fields
    if (reservation.total_amount !== undefined && reservation.total_amount < 0) {
        flags.push('invalid_amount');
    }

    if (reservation.people_count !== undefined && reservation.people_count <= 0) {
        flags.push('zero_pax');
    }

    // Check for incoherences
    if (
        reservation.total_amount === 0 &&
        reservation.payment_status?.toLowerCase().includes('payé')
    ) {
        flags.push('payment_incoherence');
    }

    // Determine if manual review is needed
    const criticalFlags: ValidationFlag[] = [
        'missing_name',
        'missing_date',
        'invalid_date',
        'payment_incoherence',
        'missing_reservation_id'
    ];

    const needsReview = flags.some(flag => criticalFlags.includes(flag));

    return {
        isValid: flags.length === 0,
        flags,
        needsReview
    };
}

/**
 * Get human-readable flag descriptions
 */
export function getFlagDescription(flag: ValidationFlag, lang: 'fr' | 'en' = 'fr'): string {
    const descriptions: Record<ValidationFlag, { fr: string; en: string }> = {
        missing_name: { fr: 'Nom du client manquant', en: 'Customer name missing' },
        missing_date: { fr: 'Date manquante', en: 'Date missing' },
        invalid_date: { fr: 'Format de date invalide', en: 'Invalid date format' },
        invalid_amount: { fr: 'Montant invalide', en: 'Invalid amount' },
        zero_pax: { fr: 'Nombre de personnes invalide', en: 'Invalid passenger count' },
        payment_incoherence: { fr: 'Incohérence paiement', en: 'Payment incoherence' },
        missing_platform: { fr: 'Plateforme non identifiée', en: 'Platform not identified' },
        missing_reservation_id: { fr: 'Référence manquante', en: 'Reference missing' }
    };

    return descriptions[flag][lang];
}
