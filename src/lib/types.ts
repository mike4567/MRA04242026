
export type IncidentStatus = 'Reported' | 'Under Review' | 'Response Underway' | 'Resolved' | 'Deleted';

/**
 * NOAA CoastWatch ERDDAP environmental risk data captured at time of incident report.
 * Contains Sea Surface Temperature (SST) and related oceanographic data.
 */
export interface ERDDAPRiskData {
  datasetId: string;           // e.g., "jplMURSST41"
  capturedAt: string;          // ISO timestamp when data was captured
  latitude: number;            // Incident latitude
  longitude: number;           // Incident longitude
  sst?: number;                // Sea Surface Temperature in Celsius
  sstUnit?: string;            // Temperature unit (typically "degree_C")
  anomaly?: number;            // SST anomaly value if available
  source: string;              // e.g., "NOAA CoastWatch ERDDAP"
  rawResponse?: Record<string, unknown>;  // Full ERDDAP JSON response for scientific analysis
}

export interface Incident {
  id: string;
  location: string; // Could be address or lat/lon string
  additionalLocationInfo?: string;
  mediaUrls: string[]; // URL to the photo/video in Firebase Storage
  status: IncidentStatus;
  reportedAt: Date;
  reporterName?: string;
  reporterPhone?: string;
  canText: boolean;
  responderNotes?: string;
  summary?: string;
  animalType?: string;
  animalLifeStatus?: 'alive' | 'dead';
  conditions?: string[];
  responderOrg?: string | null;
  responderPhone?: string | null;
  detailedDescription?: string;
  // Environmental Risk Data (NOAA CoastWatch ERDDAP)
  riskMapUrl?: string | null;           // WMS URL for SST risk map snapshot
  riskDataDetails?: ERDDAPRiskData | null;  // Parsed environmental data
}

export interface PublicIncident {
  id: string;
  location: string;
  additionalLocationInfo?: string;
  mediaUrls: string[];
  status: IncidentStatus;
  reportedAt: Date;
  responderNotes?: string;
  animalType?: string;
  animalLifeStatus?: 'alive' | 'dead';
  conditions?: string[];
  detailedDescription?: string;
}

export interface ResponderOrganization {
  id: string;
  name: string;
  contact_name: string;
  hotline: string;
  address: string;
  website: string;
  response_area: string;
  response_type: string;
  created_at: Date;
  updated_at: Date;
  emails_list: string;
  sms_numbers_list: string;
}
