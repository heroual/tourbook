import { Reservation } from './types';

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    platform: 'Viator',
    reservation_id: 'VIA-98212',
    customer_name: 'Jean Dupont',
    email: 'jean.dup@example.com',
    phone: '+33 6 12 34 56 78',
    people_count: 2,
    activity_date: '2023-11-15',
    activity_type: 'Sunset Desert Safari',
    transport_included: true,
    pickup_address: 'Hotel Atlas, Marrakech',
    total_amount: 150.00,
    payment_status: 'Payé',
    notes: 'Vegetarian meal requested',
    status: 'Confirmé',
    created_at: '2023-11-01T10:00:00Z'
  },
  {
    id: '2',
    platform: 'GetYourGuide',
    reservation_id: 'GYG-4451',
    customer_name: 'Sarah Smith',
    email: 's.smith@ukmail.co.uk',
    phone: '+44 7700 900077',
    people_count: 4,
    activity_date: '2023-11-16',
    activity_type: 'Atlas Mountains Day Trip',
    transport_included: true,
    pickup_address: 'Riad Jasmine',
    total_amount: 320.50,
    payment_status: 'Payé',
    notes: null,
    status: 'Nouveau',
    created_at: '2023-11-10T14:30:00Z'
  },
  {
    id: '3',
    platform: 'Airbnb Experiences',
    reservation_id: 'ABNB-X992',
    customer_name: 'Carlos Mendez',
    email: 'carlos.m@example.es',
    phone: null,
    people_count: 1,
    activity_date: '2023-11-18',
    activity_type: 'Medina Food Tour',
    transport_included: false,
    pickup_address: null,
    total_amount: 45.00,
    payment_status: 'Payé',
    notes: 'Allergic to nuts',
    status: 'Terminé',
    created_at: '2023-10-25T09:15:00Z'
  },
  {
    id: '4',
    platform: 'Booking',
    reservation_id: 'BKG-7721',
    customer_name: 'Amina Al-Fayed',
    email: 'amina.al@test.com',
    phone: '+971 50 123 4567',
    people_count: 3,
    activity_date: '2023-11-20',
    activity_type: 'Private City Tour',
    transport_included: true,
    pickup_address: 'Sofitel Marrakech',
    total_amount: 200.00,
    payment_status: 'Non payé',
    notes: 'Pay on arrival',
    status: 'En cours',
    created_at: '2023-11-12T11:20:00Z'
  }
];

export const SAMPLE_EMAILS = [
  {
    subject: "Reservation Confirmed - Viator #VIA-99999",
    body: `
      CONFIRMATION DE RÉSERVATION
      Plateforme: Viator
      Référence: VIA-99999
      
      Client: Marie Curie
      Email: m.curie@science.org
      Téléphone: +33 6 00 00 00 00
      
      Activité: Visite guidée du Jardin Majorelle
      Date: 2023-12-01
      Participants: 2 Adultes
      
      Transport inclus: Non
      Point de rencontre: Entrée principale
      
      Prix Total: 40.00 EUR
      Statut: Payé en totalité
      
      Notes: Besoin d'un guide francophone.
    `
  },
  {
    subject: "New Booking from GetYourGuide - GYG-12345",
    body: `
      Hello Partner,
      You have a new booking!
      
      Booking Reference: GYG-12345
      Activity: Camel Ride in Palmeraie
      Date: 2023-12-05
      
      Customer Details:
      Name: John Doe
      Email: john.doe@email.com
      Phone: +1 555 0199
      
      Party Size: 5 people
      Pickup: Hotel Mamounia, Marrakech
      Transport: Yes (Included)
      
      Total Paid: 150.00 USD
      Payment Status: Paid
    `
  }
];