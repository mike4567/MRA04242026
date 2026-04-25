export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
import { query } from '@/lib/db';
import ReportsMap from './_components/ReportsMap';

// Define the shape of the data we expect for the reports page
export type IncidentReportData = {
  id: string;
  location: string;
  lat?: number;
  lng?: number;
  reported_at: string;
  animal_type: string;
  status: string;
  responder_org: string | null;
};

function parseLocation(locationStr: string | null): { lat: number; lng: number } | null {
    if (!locationStr) return null;

    // Try to match POINT(lon lat)
    const pointMatch = locationStr.match(/^POINT\(([-\d\.]+) ([-\d\.]+)\)$/);
    if (pointMatch) {
        const lng = parseFloat(pointMatch[1]);
        const lat = parseFloat(pointMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // Try to match lat, lon (with or without space)
    const latLonMatch = locationStr.match(/^([-\d\.]+) *, *([-\d\.]+)$/);
    if (latLonMatch) {
        const lat = parseFloat(latLonMatch[1]);
        const lng = parseFloat(latLonMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    return null;
}

async function getIncidents(): Promise<IncidentReportData[]> {
    const { rows } = await query(`
        SELECT 
            id, 
            location,
            reported_at, 
            animal_type, 
            status,
            responder_org
        FROM incidents
        ORDER BY reported_at DESC;
    `);

    return rows.map(row => {
        const coords = parseLocation(row.location);
        return {
            ...row,
            reported_at: row.reported_at?.toISOString(),
            lat: coords?.lat,
            lng: coords?.lng,
        };
    });
}


export default async function ReportsPage() {
  const incidents = await getIncidents();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tighter">Incident Reports Dashboard</CardTitle>
            <CardDescription>Visualize incident clusters and export system data.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </Link>
            <Button asChild variant="outline">
                <Link href="/api/admin/export?type=incidents">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Incidents
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/api/admin/export?type=responders">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Responders
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <ReportsMap incidents={incidents} />
            ) : (
                <div className="flex flex-col items-center justify-center h-[600px] bg-muted rounded-lg">
                    <p className="text-lg font-medium text-muted-foreground">Google Maps API Key is not configured.</p>
                    <p className="text-sm text-muted-foreground">Please set the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
