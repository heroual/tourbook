import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractionResult } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const reservationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    platform: { type: Type.STRING, description: "Name of the booking platform (e.g., Viator, GetYourGuide, Airbnb)" },
    reservation_id: { type: Type.STRING, description: "Unique reservation identifier/reference number" },
    customer_name: { type: Type.STRING, description: "Full name of the customer" },
    email: { type: Type.STRING, description: "Customer email address" },
    phone: { type: Type.STRING, description: "Customer phone number" },
    people_count: { type: Type.NUMBER, description: "Total number of people/participants" },
    activity_date: { type: Type.STRING, description: "Date of the activity in YYYY-MM-DD format" },
    activity_type: { type: Type.STRING, description: "Name or type of the activity/tour" },
    transport_included: { type: Type.BOOLEAN, description: "Whether transport is included" },
    pickup_address: { type: Type.STRING, description: "Pickup address if applicable" },
    total_amount: { type: Type.NUMBER, description: "Total price amount" },
    payment_status: { type: Type.STRING, description: "Payment status (Payé, Non payé, Partiellement payé)" },
    notes: { type: Type.STRING, description: "Any additional notes or special requests" },
  },
  required: ["platform", "reservation_id", "customer_name", "people_count", "activity_date", "activity_type", "total_amount", "payment_status"]
};

export const parseReservationEmail = async (emailContent: string): Promise<ExtractionResult | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an AI assistant for a travel agency. Extract reservation details from the following email text. 
      If a field is missing, return null or an empty string/0 as appropriate for the type. 
      Ensure dates are strictly YYYY-MM-DD. 
      For transport_included, return true if the email implies or states transport is included, otherwise false.
      
      Email Content:
      ${emailContent}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: reservationSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text) as ExtractionResult;
    return data;
  } catch (error) {
    console.error("Error parsing email with Gemini:", error);
    throw error;
  }
};