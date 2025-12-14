// Helper to interact with Gmail REST API

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
}

export interface GmailMessageFull {
  id: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body: { data?: string };
    parts?: { mimeType: string; body: { data?: string } }[];
  };
}

export const searchEmails = async (accessToken: string, query: string): Promise<GmailMessageSummary[]> => {
  const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages || [];
};

export const getEmailDetails = async (accessToken: string, messageId: string): Promise<GmailMessageFull> => {
  const url = `${GMAIL_API_BASE}/messages/${messageId}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.statusText}`);
  }

  return response.json();
};

export const extractEmailBody = (message: GmailMessageFull): string => {
  let encodedBody = '';

  // Try to find the plain text part first
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      encodedBody = textPart.body.data;
    } else {
      // Fallback to HTML part or the first part
      const htmlPart = message.payload.parts.find(p => p.mimeType === 'text/html');
      encodedBody = htmlPart?.body?.data || message.payload.parts[0]?.body?.data || '';
    }
  } else if (message.payload.body.data) {
    encodedBody = message.payload.body.data;
  }

  if (!encodedBody) return message.snippet || '';

  // Decode Base64Url
  const decoded = atob(encodedBody.replace(/-/g, '+').replace(/_/g, '/'));
  
  // Basic UTF-8 fix if needed (though atob usually handles simple ASCII, specialized decoding might be needed for complex charsets)
  try {
    return decodeURIComponent(escape(decoded));
  } catch (e) {
    return decoded;
  }
};

export const getEmailSubject = (message: GmailMessageFull): string => {
  const subjectHeader = message.payload.headers.find(h => h.name.toLowerCase() === 'subject');
  return subjectHeader ? subjectHeader.value : '(No Subject)';
};