'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all unique organization names from the ArcGIS service and
 * inserts them into the responder_organizations table.
 * 
 * NOTE: This function pulls `hotline`, `response_type`, `address`, and `website` from the ArcGIS service.
 * The field `response_area` requested for import is not
 * available in the ArcGIS data source and will not be updated by this function.
 * - `hotline` is mapped from `LivePhone`, `DeadPhone`, or `LivePhone2`.
 * - `response_type` is mapped from `MMType_Live`, `MMType_Dead`, or `MMType_Live2`.
 */
export async function syncOrganizations() {
  const baseUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Live_Marine_Mammal_Stranding_Network_Live/FeatureServer/2/query';
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1', // Get all features
    outFields: 'LiveOrg,DeadOrg,LiveStranding2,LivePhone,DeadPhone,LivePhone2,MMType_Live,MMType_Dead,MMType_Live2,Address,Website',
    returnGeometry: 'false',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ArcGIS API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features) {
      return { success: false, message: 'No features found in ArcGIS response.' };
    }

    const orgs = new Map<string, Partial<OrganizationDetails>>();

    data.features.forEach((feature: any) => {
      const attrs = feature.attributes;
      
      const processOrg = (name: string, phone?: string, type?: string, address?: string, website?: string) => {
        if (!name) return;
        if (!orgs.has(name)) orgs.set(name, { name });
        const orgData = orgs.get(name)!;
        if (phone && !orgData.hotline) orgData.hotline = phone.trim();
        if (type && !orgData.response_type) orgData.response_type = type.trim();
        if (address && !orgData.address) orgData.address = address.trim();
        if (website && !orgData.website) orgData.website = website.trim();
      };

      processOrg(attrs.LiveOrg?.trim(), attrs.LivePhone, attrs.MMType_Live, attrs.Address, attrs.Website);
      processOrg(attrs.DeadOrg?.replace('Dead Strandings: ', '').trim(), attrs.DeadPhone, attrs.MMType_Dead, attrs.Address, attrs.Website);
      processOrg(attrs.LiveStranding2?.replace(/ - .*$/, '').trim(), attrs.LivePhone2, attrs.MMType_Live2, attrs.Address, attrs.Website);
    });

    if (orgs.size === 0) {
      return { success: true, message: 'No organization names to import.' };
    }
    
    const orgValues = Array.from(orgs.values());
    const values: (string | null)[] = [];
    const valueStrings: string[] = [];
    let i = 1;

    for (const org of orgValues) {
        if (!org.name) continue;
        valueStrings.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
        values.push(org.name);
        values.push(org.hotline || null);
        values.push(org.response_type || null);
        values.push(org.address || null);
        values.push(org.website || null);
    }

    if (valueStrings.length === 0) {
        return { success: true, message: 'No valid organization data to import.' };
    }

    const insertQuery = `
      INSERT INTO responder_organizations (name, hotline, response_type, address, website)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (name) DO UPDATE SET
        hotline = COALESCE(responder_organizations.hotline, EXCLUDED.hotline),
        response_type = COALESCE(responder_organizations.response_type, EXCLUDED.response_type),
        address = COALESCE(responder_organizations.address, EXCLUDED.address),
        website = COALESCE(responder_organizations.website, EXCLUDED.website)
      RETURNING id;
    `;

    const result = await query(insertQuery, values);
    
    revalidatePath('/admin');
    
    return { 
      success: true, 
      message: `Sync complete. Found ${orgs.size} unique organizations. ${result.rowCount ?? 0} organizations were updated or inserted.` 
    };

  } catch (error) {
    console.error('Failed to sync organizations:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
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
 * Updates details for a specific responder organization.
 */
export async function updateOrganizationDetails(details: OrganizationDetails) {
  const { id, ...fields } = details;

  if (!id) {
    return { success: false, message: 'Organization ID is required.' };
  }
  
  const fieldEntries = Object.entries(fields).filter(([, value]) => value !== undefined);
  
  if (fieldEntries.length === 0) {
    return { success: false, message: 'No fields to update.' };
  }

  const setClause = fieldEntries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = fieldEntries.map(([, value]) => value);

  const updateQuery = `
    UPDATE responder_organizations
    SET ${setClause}
    WHERE id = $1;
  `;

  try {
    await query(updateQuery, [id, ...values]);
    revalidatePath('/admin');
    return { success: true, message: `Organization ${id} updated successfully.` };
  } catch (error) {
    console.error(`Failed to update organization ${id}:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

/**
 * Deletes an organization from the database.
 */
export async function deleteOrganization(id: number) {
  if (!id) {
    return { success: false, message: 'Organization ID is required.' };
  }

  const deleteQuery = 'DELETE FROM responder_organizations WHERE id = $1;';

  try {
    await query(deleteQuery, [id]);
    revalidatePath('/admin');
    return { success: true, message: `Organization ${id} deleted successfully.` };
  } catch (error) {
    console.error(`Failed to delete organization ${id}:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
