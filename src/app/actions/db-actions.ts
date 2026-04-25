'use server';

import { query } from '@/lib/db';
import type { Incident, PublicIncident } from '@/lib/types';

// Helper to format Date objects from Postgres
const formatDate = (date: any) => new Date(date);

export async function getPublicIncidents(): Promise<PublicIncident[]> {
  // Select from the VIEW we will create (filters out private data automatically)
  const sql = `
    SELECT * FROM public_incidents_view 
    ORDER BY reported_at DESC
  `;
  
  try {
    const result = await query(sql);
    return result.rows.map(row => ({
      ...row,
      reportedAt: formatDate(row.reported_at),
      // Map snake_case SQL columns to camelCase TypeScript properties
      id: row.id,
      location: row.location,
      additionalLocationInfo: row.additional_location_info,
      mediaUrls: row.media_urls || [],
      status: row.status,
      animalType: row.animal_type,
      animalLifeStatus: row.animal_life_status,
      conditions: row.conditions || [],
      detailedDescription: row.detailed_description,
      responderNotes: row.responder_notes
    }));
  } catch (e) {
    console.error("Failed to fetch public incidents", e);
    return [];
  }
}

export async function getIncidentFromView(id: string): Promise<PublicIncident | null> {
  const sql = `SELECT * FROM public_incidents_view WHERE id = $1`;
  try {
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      ...row,
      reportedAt: formatDate(row.reported_at),
      id: row.id,
      location: row.location,
      additionalLocationInfo: row.additional_location_info,
      mediaUrls: row.media_urls || [],
      status: row.status,
      animalType: row.animal_type,
      animalLifeStatus: row.animal_life_status,
      conditions: row.conditions || [],
      detailedDescription: row.detailed_description,
      responderNotes: row.responder_notes
    };
  } catch (e) {
    console.error(`Failed to fetch incident ${id}`, e);
    return null;
  }
}

export async function getAdminIncidents(): Promise<Incident[]> {
  // Select EVERYTHING from the main table
  const sql = `SELECT * FROM incidents ORDER BY reported_at DESC`;
  
  try {
    const result = await query(sql);
    return result.rows.map(row => ({
      id: row.id,
      location: row.location,
      additionalLocationInfo: row.additional_location_info,
      mediaUrls: row.media_urls || [],
      status: row.status,
      reportedAt: formatDate(row.reported_at),
      reporterName: row.reporter_name,
      reporterPhone: row.reporter_phone,
      canText: row.can_text,
      responderNotes: row.responder_notes,
      summary: row.summary,
      animalType: row.animal_type,
      animalLifeStatus: row.animal_life_status,
      conditions: row.conditions || [],
      responderOrg: row.responder_org,
      responderPhone: row.responder_phone,
      detailedDescription: row.detailed_description
    }));
  } catch (e) {
    console.error("Failed to fetch admin incidents", e);
    return [];
  }
}

export async function updateIncidentDB(incident: Incident) {
  // Dynamic SQL Update
  const sql = `
    UPDATE incidents 
    SET 
      status = $1, 
      responder_notes = $2, 
      responder_org = $3, 
      responder_phone = $4,
      animal_type = $5
    WHERE id = $6
  `;
  
  // We only allow updating specific fields to keep it safe for now
  const values = [
    incident.status, 
    incident.responderNotes, 
    incident.responderOrg, 
    incident.responderPhone, 
    incident.animalType, 
    incident.id
  ];

  await query(sql, values);
  
  // If status is 'Deleted', actually remove it from the DB
  if (incident.status === 'Deleted') {
      await query('DELETE FROM incidents WHERE id = $1', [incident.id]);
  }
}

export interface OrganizationDetails {
    id: number;
    name?: string;
    emails?: string[];
    sms_numbers?: string[];
    hotline?: string;
    address?: string;
    contact_name?: string;
    website?: string;
    response_area?: string;
    response_type?: string;
}

/**
 * Fetches all responder organizations from the database.
 */
export async function getOrganizations() {
    try {
        const result = await query('SELECT * FROM responder_organizations ORDER BY name ASC');
        return result.rows as OrganizationDetails[];
    } catch (error) {
        console.error('Failed to fetch organizations:', error);
        return [];
    }
}