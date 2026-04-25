
"use client";

import { useIncident } from '@/context/IncidentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Calendar, MessageSquare, AlertCircle, Tag, CheckSquare, HeartPulse, Skull, FileText } from 'lucide-react';
import type { IncidentStatus, PublicIncident } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status }: { status: IncidentStatus }) => {
    const colorMap: Record<IncidentStatus, string> = {
        'Reported': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
        'Under Review': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
        'Response Underway': 'bg-blue-500/20 text-primary border-blue-500/30',
        'Resolved': 'bg-green-500/20 text-green-700 border-green-500/30',
        'Deleted': 'bg-red-500/20 text-red-700 border-red-500/30',
    }

    if (!status || !colorMap[status]) return null;
    return <Badge variant="outline" className={cn(colorMap[status])}>{status}</Badge>
}

const IncidentCard = ({ incident }: { incident: PublicIncident }) => (
  <Link href={`/incidents/${incident.id}`} className="block hover:bg-secondary/50 rounded-lg transition-colors p-1">
    <Card className="w-full bg-transparent border-transparent hover:border-border shadow-none hover:shadow-sm">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                <CardTitle className="text-xl flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-1" /> 
                    <span>
                        Incident in {incident.location}
                        {incident.additionalLocationInfo && (
                            <p className="text-sm font-normal text-muted-foreground italic mt-1">"{incident.additionalLocationInfo}"</p>
                        )}
                    </span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" /> Reported on {format(new Date(incident.reportedAt), 'PPP p')}
                </CardDescription>
                </div>
                <StatusBadge status={incident.status} />
            </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    {(incident.animalType || (incident.conditions && incident.conditions.length > 0)) && (
                        <div className="space-y-3">
                            {incident.animalType && (
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Animal Type</p>
                                        <p className="font-medium">{incident.animalType}</p>
                                    </div>
                                </div>
                            )}
                            {incident.animalLifeStatus && (
                                <div className="flex items-center gap-2">
                                    {incident.animalLifeStatus === 'alive' ? <HeartPulse className="h-4 w-4 text-muted-foreground" /> : <Skull className="h-4 w-4 text-muted-foreground" />}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Life Status</p>
                                        <p className="font-medium capitalize">{incident.animalLifeStatus}</p>
                                    </div>
                                </div>
                            )}
                            {incident.conditions && incident.conditions.length > 0 && (
                                <div className="flex items-start gap-2">
                                    <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Conditions</p>
                                        <div className="flex flex-wrap gap-1">
                                            {incident.conditions.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 space-y-4">
                    {incident.responderNotes ? (
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4 text-primary" /> Responder Notes</h4>
                            <p className="text-muted-foreground text-sm bg-secondary/50 p-3 rounded-md line-clamp-3">{incident.responderNotes}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic text-sm">No responder notes available yet.</p>
                    )}
                </div>
            </CardContent>
    </Card>
  </Link>
);

const LoadingSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
             <Card key={i}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-1">
                        <Skeleton className="w-full h-40 rounded-md" />
                     </div>
                     <div className="md:col-span-2 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20 w-full" />
                     </div>
                </CardContent>
            </Card>
        ))}
    </div>
)


export default function PublicIncidentsPage() {
  const { publicIncidents, loading } = useIncident();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Public Incident Reports</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A log of marine animal stranding and entanglement incidents reported along the West Coast.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
            <LoadingSkeleton />
        ) : publicIncidents.length > 0 ? (
            publicIncidents.map(incident => <IncidentCard key={incident.id} incident={incident} />)
        ) : (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Incidents Found</AlertTitle>
                <AlertDescription>
                   There are currently no public incidents to display. Check back later.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
