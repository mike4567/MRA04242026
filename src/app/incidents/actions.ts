// /src/app/incidents/actions.ts
// Public incident data fetch using PostgreSQL (replaces Firestore)
'use server';

import { query } from '@/lib/db';
import type { PublicIncident } from '@/lib/types';

export async function getPublicIncidentById(id: string): Promise<PublicIncident | null> {
    try {
        const result = await query(
            `SELECT 
                id,
                location,
                status,
                animal_type AS "animalType",
                reported_at AS "reportedAt",
                responder_org AS "responderOrg"
            FROM incidents 
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as PublicIncident;
    } catch (error) {
        console.error(`Failed to fetch public incident ${id}:`, error);
        return null;
    }
}
