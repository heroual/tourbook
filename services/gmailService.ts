// gmailService.ts

// Helper to interact with a subset of the Gmail REST API
// See: https://developers.google.com/gmail/api/v1/reference/users/messages

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// --- TYPE DEFINITIONS ---

export interface GmailMessageSummary {
  id: string;
  threadId: string;
}

// Represents a single part of a multipart email message
interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: { name: string; value: string }[];
  body: {
    size: number;
    data?: string; // Base64Url encoded
    attachmentId?: string;
  };
  parts?: GmailMessagePart[]; // For nested multipart messages
}

// Represents a full Gmail message resource
export interface GmailMessageFull {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: GmailMessagePart;
  sizeEstimate: number;
}


// --- API FUNCTIONS ---

export const searchEmails = async (accessToken: string, query: string): Promise<GmailMessageSummary[]> => {
  const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Intercept auth errors to provide a better UX
    if (response.status === 401 || response.status === 403) {
      throw new Error('Gmail authentication failed. Please re-authenticate.');
    }
    throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages || [];
};

export const getEmailDetails = async (accessToken: string, messageId: string): Promise<GmailMessageFull> => {
  // `format=full` is required to get the entire payload including all parts
  const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Gmail authentication failed. Please re-authenticate.');
    }
    throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Decodes a base64url encoded string.
 * @param encoded The base64url string.
 * @returns The decoded string.
 */
function decodeBase64Url(encoded: string): string {
  if (!encoded) return '';
  // Replace URL-safe characters with standard Base64 characters
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    // atob decodes a Base64 string.
    // decodeURIComponent and escape handle UTF-8 characters correctly.
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    console.error('Failed to decode base64url string:', e);
    // Fallback for strings that might not be correctly encoded
    try {
      return atob(base64);
    } catch (e2) {
      console.error('Final fallback decoding failed:', e2);
      return '';
    }
  }
}

/**
 * Recursively traverses the message parts to find the email body.
 * Prioritizes HTML content over plain text.
 * 
 * @param part The current message part to inspect.
 * @param bodies An object to store the found html and text bodies.
 */
function findEmailParts(part: GmailMessagePart, bodies: { html: string | null; text: string | null }): void {
  // If we've already found the HTML body, we can stop searching this branch.
  if (bodies.html) return;

  const mimeType = part.mimeType || '';

  // Handle nested parts (multipart/*)
  if (mimeType.startsWith('multipart/')) {
    // Recursively search in nested parts
    part.parts?.forEach(subPart => findEmailParts(subPart, bodies));
    return;
  }

  // Handle text/html
  if (mimeType === 'text/html') {
    if (part.body.data) {
      bodies.html = decodeBase64Url(part.body.data);
    }
    return;
  }

  // Handle text/plain
  if (mimeType === 'text/plain') {
    if (part.body.data) {
      // Only store text if we haven't found HTML yet
      if (!bodies.html) {
        bodies.text = decodeBase64Url(part.body.data);
      }
    }
    return;
  }
}

/**
 * Extracts the most relevant body content from a Gmail message.
 * It prioritizes text/html over text/plain and handles complex, nested
 * multipart messages (e.g., multipart/alternative, multipart/mixed).
 *
 * @param message The full Gmail message object.
 * @returns The HTML content if available, otherwise the plain text content, or an empty string.
 */
export const extractEmailBody = (message: GmailMessageFull): string => {
  const bodies = { html: null, text: null };

  // Start the recursive search from the main payload
  findEmailParts(message.payload, bodies);
  
  // If no body was found in parts, check the top-level body (for simple emails)
  if (!bodies.html && !bodies.text && message.payload.body.data) {
    if (message.payload.mimeType === 'text/html') {
        bodies.html = decodeBase64Url(message.payload.body.data);
    } else if (message.payload.mimeType === 'text/plain') {
        bodies.text = decodeBase64Url(message.payload.body.data);
    }
  }

  // Always return HTML if it exists, otherwise fall back to text.
  return bodies.html ?? bodies.text ?? '';
};

export const getEmailSubject = (message: GmailMessageFull): string => {
  const subjectHeader = message.payload.headers.find(h => h.name.toLowerCase() === 'subject');
  return subjectHeader ? subjectHeader.value : '(No Subject)';
};