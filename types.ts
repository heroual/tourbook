export interface Reservation {
  id: string; // Internal ID
  platform: string;
  reservation_id: string; // Platform ID
  customer_name: string;
  email: string | null;
  phone: string | null;
  people_count: number;
  activity_date: string;
  activity_type: string;
  transport_included: boolean;
  pickup_address: string | null;
  total_amount: number;
  payment_status: 'Payé' | 'Non payé' | 'Partiellement payé' | string;
  notes: string | null;
  status: 'Nouveau' | 'Confirmé' | 'En cours' | 'Terminé';
  created_at: string;
  adults_count?: number;
  children_count?: number;
  menu_choice?: string;
  // Currency normalization
  amount_eur?: number;
  original_amount?: number;
  original_currency?: 'EUR' | 'MAD' | 'USD' | 'unknown';
  // Extraction metadata
  extraction_source?: 'ai' | 'regex';
  validation_flags?: string[];
  needs_review?: boolean;
}

export type ReservationStatus = Reservation['status'];

export interface ExtractionResult {
  platform: string;
  reservation_id: string;
  customer_name: string;
  email: string;
  phone: string;
  people_count: number;
  activity_date: string;
  activity_type: string;
  transport_included: boolean;
  pickup_address: string;
  total_amount: number;
  payment_status: string;
  notes: string;
  adults_count?: number;
  children_count?: number;
  menu_choice?: string;
  // Currency normalization
  amount_eur?: number;
  original_amount?: number;
  original_currency?: 'EUR' | 'MAD' | 'USD' | 'unknown';
}