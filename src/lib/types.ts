
export type IncidentStatus = 'Reported' | 'Under Review' | 'Response Underway' | 'Resolved' | 'Deleted';

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
