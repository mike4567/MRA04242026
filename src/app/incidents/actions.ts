// /src/app/incidents/actions.ts
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { PublicIncident } from '@/lib/types';

// Helper to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
    if (data && typeof data.toMillis === 'function') {
        return new Date(data.toMillis());
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            newObj[key] = convertTimestamps(data[key]);
        }
        return newObj;
    }
    return data;
};

export async function getPublicIncidentById(id: string): Promise<PublicIncident | null> {
  try {
    const db = getDb();
    const incidentDoc = await db.collection('public_incidents').doc(id).get();

    if (!incidentDoc.exists) {
      return null;
    }
    
    const data = incidentDoc.data();
    // Ensure the reportedAt field is a Date object for consistent usage
    const convertedData = convertTimestamps(data);

    return { id: incidentDoc.id, ...convertedData } as PublicIncident;
  } catch (error) {
    console.error(`Failed to fetch public incident ${id}:`, error);
    return null;
  }
}
