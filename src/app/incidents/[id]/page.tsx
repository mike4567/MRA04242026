// /src/app/incidents/[id]/page.tsx

import { getIncidentFromView } from '@/app/actions/db-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { MapPin, Calendar, MessageSquare, AlertCircle, Tag, CheckSquare, HeartPulse, Skull, FileText, Video } from 'lucide-react';
import Image from 'next/image';
import type { IncidentStatus } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Status Badge Component (reused for consistency)
const StatusBadge = ({ status }: { status: IncidentStatus }) => {
    const colorMap: Record<IncidentStatus, string> = {
        'Reported': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
        'Under Review': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
        'Response Underway': 'bg-blue-500/20 text-primary border-blue-500/30',
        'Resolved': 'bg-green-500/20 text-green-700 border-green-500/30',
        'Deleted': 'bg-red-500/20 text-red-700 border-red-500/30'
    };
    if (!status || !colorMap[status]) return null;
    return <Badge variant="outline" className={cn(colorMap[status])}>{status}</Badge>;
};

export default async function PublicIncidentDetailPage({ params }: { params: { id: string } }) {
  const incident = await getIncidentFromView(params.id);

  if (!incident || incident.status === 'Deleted') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Incident Not Found</AlertTitle>
          <AlertDescription>
            The incident you are looking for does not exist or may have been removed.
          </AlertDescription>
        </Alert>
         <Link href="/incidents" className="mt-4 inline-block text-primary hover:underline">
            ← Back to All Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <Link href="/incidents" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← Back to All Incidents
      </Link>
      <Card>
        <CardHeader>
            <CardDescription>Incident ID: {incident.id}</CardDescription>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <CardTitle className="text-2xl flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                    <span>
                        <a href={`https://www.google.com/maps?q=${incident.location}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Incident in {incident.location}
                        </a>
                        {incident.additionalLocationInfo && (
                            <p className="text-sm font-normal text-muted-foreground italic mt-1">"{incident.additionalLocationInfo}"</p>
                        )}
                    </span>
                </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2 ml-9 sm:ml-0">
                <Calendar className="h-4 w-4" /> Reported on {format(new Date(incident.reportedAt), 'PPP p')}
              </CardDescription>
            </div>
            <div className="sm:pl-4 self-start sm:self-center">
                <StatusBadge status={incident.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column for Details */}
            <div className="md:col-span-1 space-y-4">
               <h3 className="font-semibold text-lg border-b pb-2">Submitted Details</h3>
               <div className="space-y-3">
                  {incident.animalType && (
                      <div className="flex items-center gap-3"><Tag className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Animal Type</p><p className="font-medium">{incident.animalType}</p></div></div>
                  )}
                  {incident.animalLifeStatus && (
                      <div className="flex items-center gap-3">{incident.animalLifeStatus === 'alive' ? <HeartPulse className="h-5 w-5 text-muted-foreground" /> : <Skull className="h-5 w-5 text-muted-foreground" />}<div><p className="text-sm text-muted-foreground">Life Status</p><p className="font-medium capitalize">{incident.animalLifeStatus}</p></div></div>
                  )}
                  {incident.conditions && incident.conditions.length > 0 && (
                      <div className="flex items-start gap-3"><CheckSquare className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-sm text-muted-foreground">Conditions</p><div className="flex flex-wrap gap-1 mt-1">{incident.conditions.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}</div></div></div>
                  )}
                  {incident.detailedDescription && (
                      <div className="flex items-start gap-3"><FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-sm text-muted-foreground">Reporter's Description</p><p className="text-sm font-medium italic">"{incident.detailedDescription}"</p></div></div>
                  )}
               </div>
            </div>

            {/* Right Column for Media and Notes */}
            <div className="md:col-span-2 space-y-6">
                <div>
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Submitted Media</h3>
                    <p className="text-muted-foreground italic">
                        {incident.mediaUrls && incident.mediaUrls.length > 0
                            ? "Media submitted"
                            : "No media submitted"}
                    </p>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Responder Notes</h3>
                    {incident.responderNotes ? (
                        <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{incident.responderNotes}</p>
                    ) : (
                        <p className="text-muted-foreground italic">No responder notes available yet.</p>
                    )}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
