'use server';

import { query } from '@/lib/db';

export interface SpecificResponderInfo {
  org: string | null;
  emails: string[] | null;
  sms_numbers: string[] | null;
  hotline: string | null;
  ai_summary_enabled: boolean;
}

export interface RecentIncident {
  id: string;
  location: string;
  animalType?: string;
  reportedAt: Date;
}


export async function getRecentActiveIncidents(): Promise<RecentIncident[]> {
  try {
    const results = await query(`
      SELECT
        id,
        location,
        animal_type AS "animalType",
        reported_at AS "reportedAt"
      FROM incidents
      WHERE
        reported_at >= NOW() - INTERVAL '48 hours' AND
        status IN ('Reported', 'Under Review', 'Response Underway', 'OPEN', 'ACTIVE', 'NEW')
      ORDER BY reported_at DESC;
    `);
    return results.rows;
  } catch (error) {
    console.error('Error fetching recent active incidents:', error);
    // In case of an error, return an empty array to prevent the client from crashing.
    return [];
  }
}

import { sendDeceasedStatusNotification } from '@/services/sms';

export async function addInfoToIncident(
  incidentId: string, 
  additionalInformation: string,
  animalLifeStatus: 'alive' | 'dead' | null
): Promise<{ success: boolean; error?: string }> {
  if (!incidentId || (!additionalInformation.trim() && !animalLifeStatus)) {
    return { success: false, error: 'Incident ID and either additional information or a life status are required.' };
  }

  try {
    let updateQuery = 'UPDATE incidents SET ';
    const queryParams: (string | null)[] = [];
    let paramIndex = 1;

    if (additionalInformation.trim()) {
      updateQuery += `detailed_description = COALESCE(detailed_description, '') || $${paramIndex++}`;
      queryParams.push(`\n\n--- Appended Information ---\n${additionalInformation}`);
    }

    if (animalLifeStatus) {
      if (queryParams.length > 0) updateQuery += ', ';
      updateQuery += `animal_life_status = $${paramIndex++}`;
      queryParams.push(animalLifeStatus);
    }

    updateQuery += ` WHERE id = $${paramIndex}`;
    queryParams.push(incidentId);
    
    await query(updateQuery, queryParams);

    // If status was updated to 'dead', send notification
    if (animalLifeStatus === 'dead') {
      // Fetch incident details needed for notification
      const incidentResult = await query(
        'SELECT location, animal_type FROM incidents WHERE id = $1',
        [incidentId]
      );

      if (incidentResult.rows.length > 0) {
        const incident = incidentResult.rows[0];
        const location = incident.location;
        const animalType = incident.animal_type;
        
        // The location string is "lat,lng", so we parse it
        const locParts = location.split(',');
        const lat = parseFloat(locParts[0]);
        const lng = parseFloat(locParts[1]);

        if (!isNaN(lat) && !isNaN(lng)) {
          const responderInfo = await getResponderInfo(lat, lng, 'dead', animalType);
          if (responderInfo) {
            await sendDeceasedStatusNotification(incidentId, location, animalType, {
              smsNumbers: responderInfo.sms_numbers,
              email: responderInfo.emails ? responderInfo.emails[0] : null // Assuming one email for now
            });
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error(`Error adding info to incident ${incidentId}:`, error);
    return { success: false, error: 'Failed to add information to the incident.' };
  }
}

export async function getResponderInfo(
  latitude: number,
  longitude: number,
  status: 'alive' | 'dead',
  animalCategory?: string
): Promise<SpecificResponderInfo | null> {
  
  const isPinniped = animalCategory === 'Seal or Sea Lion';
  const isCetacean = ['Large Whale', 'Dolphin or Porpoise'].includes(animalCategory || '');
  const animalType = isPinniped ? 'Pinniped' : (isCetacean ? 'Cetacean' : null);

  const baseUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Live_Marine_Mammal_Stranding_Network_Live/FeatureServer/2/query';
  const params = new URLSearchParams({
    f: 'json',
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: '5000',
    units: 'esriSRUnit_Meter',
    outFields: 'LiveOrg,LivePhone,DeadOrg,DeadPhone,MMType_Live,LiveStranding2,LivePhone2,MMType_Live2,MMType_Dead,MMType_Dead2',
    returnGeometry: 'false',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('ArcGIS API request failed:', response.status);
      return null;
    }

    const data = await response.json();

    // 1. Get AI Summary Toggle from DB
    let aiSummaryEnabled = false;
    try {
      const configResult = await query(`SELECT value FROM system_config WHERE key = 'ai_summary_enabled'`);
      if (configResult.rows.length > 0) {
        // The value is stored as a JSON string 'true' or 'false', so we parse it.
        aiSummaryEnabled = configResult.rows[0].value === true || configResult.rows[0].value === 'true';
      }
    } catch (dbError) {
      console.error('Error fetching system_config:', dbError);
      // Decide on fallback behavior: false seems safer.
    }


    if (data.features && data.features.length > 0) {
      const attributes = data.features[0].attributes;

      // Clean potential organization fields
      const liveOrgClean = attributes.LiveOrg?.trim();
      const deadOrgClean = attributes.DeadOrg?.replace('Dead Strandings: ', '').trim();
      const liveOrg2Clean = attributes.LiveStranding2?.replace(/ - .*$/, '').trim();

      let determinedOrg: string | null = null;

      // 2. Existing Logic to determine Org Name
      if (status === 'alive') {
        if (attributes.MMType_Live?.includes(animalType)) {
          determinedOrg = liveOrgClean;
        } else if (attributes.MMType_Live2?.includes(animalType)) {
          determinedOrg = liveOrg2Clean;
        }
      } else { // status is 'dead'
        if (attributes.MMType_Dead?.includes(animalType)) {
          determinedOrg = deadOrgClean || liveOrgClean;
        } else if (attributes.MMType_Dead2?.includes(animalType)) {
          determinedOrg = liveOrg2Clean;
        }
      }

      // Fallback
      if (!determinedOrg) {
         determinedOrg = status === 'alive' ? liveOrgClean : (deadOrgClean || liveOrgClean);
      }
      
      // 3. NEW: Look up determinedOrg in our database
      if (determinedOrg) {
        try {
          const orgResult = await query(
            'SELECT name, emails, sms_numbers, hotline FROM responder_organizations WHERE name ILIKE $1',
            [determinedOrg]
          );

          if (orgResult.rows.length > 0) {
            const orgData = orgResult.rows[0];
            return {
              org: orgData.name,
              emails: orgData.emails,
              sms_numbers: orgData.sms_numbers,
              hotline: orgData.hotline,
              ai_summary_enabled: aiSummaryEnabled,
            };
          } else {
            // 4. Fallback if no match is found in DB
            console.warn(`No organization found in database for: "${determinedOrg}". Using default.`);
          }
        } catch (dbError) {
          console.error(`Database error while looking up organization "${determinedOrg}":`, dbError);
        }
      }
      
      // Default/Fallback Responder
      return {
        org: 'NOAA Fisheries Hotline',
        emails: null, // No email for the general hotline
        sms_numbers: null, // No SMS for the general hotline
        hotline: '1-866-755-6622',
        ai_summary_enabled: aiSummaryEnabled,
      };
      
    } else {
      console.log('No responder found for the given coordinates.');
      // Still return the default responder even if ArcGIS finds nothing
      return {
        org: 'NOAA Fisheries Hotline',
        emails: null,
        sms_numbers: null,
        hotline: '1-866-755-6622',
        ai_summary_enabled: aiSummaryEnabled,
      };
    }
  } catch (error) {
    console.error('An error occurred while fetching responder info:', error);
    // Fallback to default in case of a complete failure
    return {
      org: 'NOAA Fisheries Hotline',
      emails: null,
      sms_numbers: null,
      hotline: '1-866-755-6622',
      ai_summary_enabled: false, // Safer default
    };
  }
}