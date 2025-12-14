import { parseReservationEmail } from './services/geminiService';

// Mock environment variable for testing
process.env.API_KEY = "YOUR_API_KEY_HERE"; // We will read this from .env.local if possible

async function test() {
    console.log("Testing Gemini API...");

    const sampleEmail = `
  Subject: Booking Confirmation
  Reference: GYG12345678
  Client: John Doe
  Date: 2025-02-04
  Activity: Desert Safari
  Price: 1200 DH
  Pickup: Hotel Agadir
  `;

    try {
        const result = await parseReservationEmail(sampleEmail);
        console.log("Result:", result);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

// We can't easily run TS directly without setup, so I'll create a JS version for the test
