import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Interface for email parameters
 */
export interface EmailParams {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  text: string;
  html: string;
}

/**
 * Response from the email service
 */
export interface EmailResponse {
  success: boolean;
  previewUrl?: string;
  error?: string;
}

/**
 * Core email sending function that calls the Netlify serverless function
 */
export async function sendEmail(params: EmailParams): Promise<EmailResponse> {
  try {
    const to = params.to ? (Array.isArray(params.to) ? params.to.join(',') : params.to) : undefined;
    const bcc = params.bcc ? (Array.isArray(params.bcc) ? params.bcc.join(',') : params.bcc) : undefined;

    const response = await fetch('/.netlify/functions/sendEmail', {
      method: 'POST',
      body: JSON.stringify({
        to,
        bcc,
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        previewUrl: data.previewUrl,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to send email',
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch all user emails from Firestore
 */
export async function getAllUserEmails(): Promise<string[]> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const emails: string[] = [];

  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    if (userData.email) {
      emails.push(userData.email);
    }
  });

  return emails;
}

/**
 * Fetch emails for specific user IDs from Firestore.
 * Uses batched queries for efficiency (Firestore 'in' queries support max 30 items).
 * Only fetches the specific users needed rather than all users.
 */
export async function getEmailsForUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const emails: string[] = [];
  const usersRef = collection(db, 'users');

  // Firestore 'in' queries support max 30 items, so batch if needed
  const batchSize = 30;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const usersQuery = query(usersRef, where(documentId(), 'in', batch));
    const snapshot = await getDocs(usersQuery);

    snapshot.docs.forEach(doc => {
      const email = doc.data().email;
      if (email) {
        emails.push(email);
      }
    });
  }

  return emails;
}
