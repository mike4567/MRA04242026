/**
 * NOAA CoastWatch ERDDAP Service
 * 
 * Provides functions to construct ERDDAP URLs and fetch environmental data
 * for Sea Surface Temperature (SST) at incident locations.
 * 
 * ERDDAP (Environmental Research Division Data Access Program) is NOAA's
 * scientific data server providing access to oceanographic datasets.
 * 
 * Dataset: jplMURSST41 - Multi-scale Ultra-high Resolution (MUR) SST Analysis
 * 
 * NIST SP 800-218 Compliance: PW.1.1 - Well-documented service module
 */

import { query } from '@/lib/db';
import type { ERDDAPRiskData } from '@/lib/types';

// ERDDAP configuration constants
const ERDDAP_BASE_URL = 'https://coastwatch.pfeg.noaa.gov/erddap';
const SST_DATASET_ID = 'jplMURSST41';
const SST_VARIABLE = 'analysed_sst';

// Timeout for ERDDAP requests (30 seconds - ERDDAP can be slow)
const ERDDAP_TIMEOUT_MS = 30000;

/**
 * Builds a WMS GetMap URL for a Sea Surface Temperature risk map.
 * The map is centered on the incident location with a configurable bounding box.
 * 
 * @param lat - Latitude of incident location
 * @param lng - Longitude of incident location
 * @param timestamp - Time of incident (ISO string or Date)
 * @param options - Optional configuration for map dimensions and extent
 * @returns WMS URL string for the SST map image
 */
export function buildERDDAPMapUrl(
    lat: number,
    lng: number,
    timestamp: Date | string,
    options?: {
        width?: number;
        height?: number;
        bboxDegrees?: number;  // Degrees from center to bbox edge
    }
): string {
    const width = options?.width ?? 400;
    const height = options?.height ?? 300;
    const bboxDegrees = options?.bboxDegrees ?? 2;  // 2 degrees = ~220km from center

    // Calculate bounding box around incident location
    const minLat = lat - bboxDegrees;
    const maxLat = lat + bboxDegrees;
    const minLon = lng - bboxDegrees;
    const maxLon = lng + bboxDegrees;

    // Format timestamp for ERDDAP (ISO 8601)
    const time = timestamp instanceof Date ? timestamp.toISOString() : timestamp;

    // Build WMS GetMap URL
    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        LAYERS: `${SST_DATASET_ID}:${SST_VARIABLE}`,
        STYLES: '',
        CRS: 'EPSG:4326',
        BBOX: `${minLat},${minLon},${maxLat},${maxLon}`,
        WIDTH: width.toString(),
        HEIGHT: height.toString(),
        FORMAT: 'image/png',
        TIME: time,
        COLORSCALERANGE: '5,25',  // SST range in Celsius (typical for West Coast)
        BELOWMINCOLOR: '0x000080',  // Dark blue for cold
        ABOVEMAXCOLOR: '0xFF0000',  // Red for warm
    });

    return `${ERDDAP_BASE_URL}/wms/${SST_DATASET_ID}/request?${params.toString()}`;
}

/**
 * Builds a URL for the SST color scale legend.
 * 
 * @returns URL for the legend image
 */
export function buildERDDAPLegendUrl(): string {
    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetLegendGraphic',
        LAYER: `${SST_DATASET_ID}:${SST_VARIABLE}`,
        FORMAT: 'image/png',
        WIDTH: '30',
        HEIGHT: '200',
        COLORSCALERANGE: '5,25',
    });

    return `${ERDDAP_BASE_URL}/wms/${SST_DATASET_ID}/request?${params.toString()}`;
}

/**
 * Fetches Sea Surface Temperature data from ERDDAP GridDAP endpoint.
 * Returns the actual SST value at the specified location and time.
 * 
 * @param lat - Latitude of incident location
 * @param lng - Longitude of incident location  
 * @param timestamp - Time of incident
 * @returns ERDDAPRiskData object or null if fetch fails
 */
export async function fetchERDDAPData(
    lat: number,
    lng: number,
    timestamp: Date | string
): Promise<ERDDAPRiskData | null> {
    try {
        // Format timestamp - ERDDAP expects ISO format but we need to round to available times
        // MUR SST data is daily, so we use the date portion
        const time = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const isoTime = time.toISOString();

        // Build GridDAP JSON URL
        // ERDDAP GridDAP syntax: variable[(time)][(latitude)][(longitude)]
        // We use "last" for time to get most recent data if exact time not available
        const gridDapUrl = `${ERDDAP_BASE_URL}/griddap/${SST_DATASET_ID}.json?` +
            `${SST_VARIABLE}[(${isoTime}):1:(${isoTime})]` +
            `[(${lat}):1:(${lat})]` +
            `[(${lng}):1:(${lng})]`;

        console.log(`[ERDDAP] Fetching SST data from: ${gridDapUrl}`);

        // Fetch with timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ERDDAP_TIMEOUT_MS);

        const response = await fetch(gridDapUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[ERDDAP] HTTP error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        // Parse ERDDAP JSON response
        // Structure: { table: { columnNames: [...], columnTypes: [...], rows: [[...]] } }
        if (!data?.table?.rows?.[0]) {
            console.warn('[ERDDAP] No data rows in response');
            return null;
        }

        const columnNames = data.table.columnNames as string[];
        const row = data.table.rows[0];

        // Find SST column index
        const sstIndex = columnNames.indexOf(SST_VARIABLE);
        const sstValue = sstIndex >= 0 ? row[sstIndex] : null;

        // Find units from columnUnits if available
        const units = data.table.columnUnits?.[sstIndex] ?? 'degree_C';

        const result: ERDDAPRiskData = {
            datasetId: SST_DATASET_ID,
            capturedAt: new Date().toISOString(),
            latitude: lat,
            longitude: lng,
            sst: typeof sstValue === 'number' ? sstValue : undefined,
            sstUnit: units,
            source: 'NOAA CoastWatch ERDDAP',
            rawResponse: data,
        };

        console.log(`[ERDDAP] Successfully fetched SST: ${result.sst}${result.sstUnit}`);
        return result;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('[ERDDAP] Request timed out after', ERDDAP_TIMEOUT_MS, 'ms');
        } else {
            console.error('[ERDDAP] Fetch error:', error);
        }
        return null;
    }
}

/**
 * Captures environmental risk data and updates the incident record asynchronously.
 * This function is designed to be called in a "fire-and-forget" pattern after
 * the incident is saved, so it does not block the UI.
 * 
 * @param incidentId - The incident ID to update
 * @param lat - Latitude of incident location
 * @param lng - Longitude of incident location
 * @param timestamp - Time of incident
 */
export async function captureAndStoreEnvironmentalData(
    incidentId: string,
    lat: number,
    lng: number,
    timestamp: Date
): Promise<void> {
    try {
        console.log(`[ERDDAP] Starting environmental data capture for incident ${incidentId}`);

        // Build the map URL (this is instant - just string construction)
        const riskMapUrl = buildERDDAPMapUrl(lat, lng, timestamp);

        // Fetch the actual data (this is the slow part)
        const riskDataDetails = await fetchERDDAPData(lat, lng, timestamp);

        // Update the incident record with the risk data
        const updateQuery = `
            UPDATE incidents 
            SET 
                risk_map_url = $1,
                risk_data_details = $2
            WHERE id = $3
        `;

        await query(updateQuery, [
            riskMapUrl,
            riskDataDetails ? JSON.stringify(riskDataDetails) : null,
            incidentId,
        ]);

        console.log(`[ERDDAP] Successfully stored environmental data for incident ${incidentId}`);

    } catch (error) {
        // Log error but don't throw - this is a non-critical background operation
        console.error(`[ERDDAP] Failed to capture environmental data for incident ${incidentId}:`, error);
    }
}

/**
 * Converts Celsius to Fahrenheit.
 * 
 * @param celsius - Temperature in Celsius
 * @returns Temperature in Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
}
