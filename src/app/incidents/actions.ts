'use server';

/**
 * @file actions.ts
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose Server actions for public incident data retrieval using PostgreSQL.
 *          Replaces Firestore implementation.
 */

import { query } from '@/lib/db';
import type { PublicIncident } from '@/lib/types';

/**
 * Fetches a single public incident by ID from the PostgreSQL database.
 * Uses the public_incidents_view to ensure only sanitized data is returned.
 * 
 * @param id - The incident ID to fetch
 * @returns The public incident data or null if not found
 */
export async function getPublicIncidentById(id: string): Promise<PublicIncident | null> {
    const sql = `SELECT * FROM public_incidents_view WHERE id = $1`;
    
    try {
        const result = await query(sql, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        
        // Map snake_case SQL columns to camelCase TypeScript properties
        return {
            id: row.id,
            location: row.location,
            additionalLocationInfo: row.additional_location_info,
            mediaUrls: row.media_urls || [],
            status: row.status,
            reportedAt: new Date(row.reported_at),
            animalType: row.animal_type,
            animalLifeStatus: row.animal_life_status,
            conditions: row.conditions || [],
            detailedDescription: row.detailed_description,
            responderNotes: row.responder_notes
        };
    } catch (error) {
        console.error(`Failed to fetch public incident ${id}:`, error);
        return null;
    }
}
