
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIncident } from '@/context/IncidentContext';
import type { Incident, IncidentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeft, User, Phone, Text, FileText, Image as ImageIcon, Video, MapPin, Calendar, MessageSquare, Loader2, Tag, CheckSquare, Building, Trash2, Pin, HeartPulse, Skull } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';


export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;
  const { incidents, updateIncident, loading: contextLoading } = useIncident();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [originalStatus, setOriginalStatus] = useState<IncidentStatus | null>(null);
  const [originalResponderNotes, setOriginalResponderNotes] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && incidents.length > 0) {
      const foundIncident = incidents.find((inc) => inc.id === id);
      if (foundIncident) {
        const deepCopy = JSON.parse(JSON.stringify(foundIncident));
        setIncident(deepCopy);
        setOriginalStatus(deepCopy.status);
        setOriginalResponderNotes(deepCopy.responderNotes || '');
      } else {
         // If incident not found (e.g., after deletion), redirect
        toast({ title: "Incident Not Found", description: "It may have been deleted.", variant: "destructive"});
        router.push('/admin');
      }
    }
  }, [id, incidents, router, toast]);

  const handleSaveChanges = async () => {
    if (!incident) return;
    setSaving(true);
    
    if (incident.status === 'Deleted') {
        try {
            await updateIncident(incident);
            toast({ title: "Deleted!", description: "The incident has been permanently removed."});
            router.push('/admin'); // Redirect after deletion
        } catch(e) {
            toast({ title: "Deletion Failed", description: "Could not delete the incident. Please try again.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
        return; // Stop further execution
    }

    const statusHasChanged = incident.status !== originalStatus;

    try {
      // Always update the incident in Firestore
      await updateIncident(incident);
      setOriginalStatus(incident.status);
      setOriginalResponderNotes(incident.responderNotes || '');
      toast({ title: "Saved!", description: "Incident details have been updated." });
    } catch(e) {
        toast({ title: "Save Failed", description: "Could not save changes. Please try again.", variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };

  const isSaveDisabled = () => {
    if (saving) return true;
    if (!incident) return true;
    // Check if anything has changed
    return (
        incident.status === originalStatus &&
        (incident.responderNotes || '') === originalResponderNotes
    );
  }

  if (contextLoading && !incident) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!incident) {
    return <div className="text-center py-10">Searching for incident...</div>;
  }

  const isDeleteSelected = incident.status === 'Deleted';

  return (
    <div className="space-y-6">
       <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Incident #{incident.id}</CardTitle>
                     <CardDescription className="flex flex-col gap-2 text-sm">
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(incident.reportedAt), 'PPP p')}</span>
                        <div className="flex items-start gap-1.5">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> 
                            <div>
                                <a href={`https://www.google.com/maps?q=${incident.location}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <p>{incident.location}</p>
                                </a>
                                {incident.additionalLocationInfo && (
                                    <p className="text-muted-foreground italic mt-1">"{incident.additionalLocationInfo}"</p>
                                )}
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(incident.animalType || (incident.conditions && incident.conditions.length > 0)) && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Submitted Details</h3>
                            <div className="flex flex-wrap items-center gap-4">
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
                                     <div className="flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Conditions</p>
                                            <div className="flex flex-wrap gap-1">
                                                {incident.conditions.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                             {incident.detailedDescription && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Reporter's Detailed Description</h4>
                                    <p className="text-muted-foreground bg-secondary/50 p-3 rounded-md border text-sm italic">"{incident.detailedDescription}"</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Submitted Media</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {incident.mediaUrls && incident.mediaUrls.length > 0 ? incident.mediaUrls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video group bg-secondary rounded-lg overflow-hidden">
                                {url.includes('video') ? (
                                    <>
                                        <video src={url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Video className="h-10 w-10 text-white" />
                                        </div>
                                    </>
                                ) : (
                                     <Image src={url} alt={`Incident media ${index + 1}`} layout="fill" className="object-cover" />
                                )}
                                </a>
                            )) : (
                                <p className="text-muted-foreground col-span-full">No media was submitted with this report.</p>
                            )}
                        </div>
                    </div>
                    {incident.summary && (
                        <div>
                             <h3 className="font-semibold text-lg mb-2">AI Summary</h3>
                             <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md border">{incident.summary}</p>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="responder-notes" className="font-semibold text-lg mb-2 block">Responder Notes</Label>
                        <Textarea 
                            id="responder-notes" 
                            value={incident.responderNotes || ''} 
                            onChange={(e) => setIncident(p => p ? {...p, responderNotes: e.target.value} : null)}
                            placeholder="Add internal notes, observations, actions taken..."
                            rows={6}
                        />
                         <p className="text-sm text-muted-foreground mt-2">These notes will be visible on the public incident page.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Manage Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label>Incident Status</Label>
                        <Select onValueChange={(status: IncidentStatus) => setIncident(p => p ? {...p, status} : null)} value={incident.status}>
                            <SelectTrigger>
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Reported">Reported</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Response Underway">Response Underway</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Deleted" className="text-destructive">Delete Incident</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     {isDeleteSelected ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className='w-full' variant="destructive" disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Confirm Deletion
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action is permanent and cannot be undone. This will permanently delete the incident and all of its associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setIncident(p => p ? {...p, status: originalStatus || 'Reported'} : null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSaveChanges} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     ) : (
                        <Button className='w-full' onClick={handleSaveChanges} disabled={isSaveDisabled()}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                     )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Assigned Responder</CardTitle>
                    <CardDescription>From regional stranding network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {incident.responderOrg ? (
                        <>
                        <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{incident.responderOrg}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <a href={`tel:${incident.responderPhone}`} className="font-medium text-primary hover:underline">{incident.responderPhone}</a>
                        </div>
                        </>
                    ) : (
                         <div className="flex items-center gap-3 text-muted-foreground italic">
                            <Building className="h-5 w-5" />
                            <span>No responder assigned.</span>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Reporter Information</CardTitle>
                    <CardDescription>Optional details provided by the reporter.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {incident.reporterName ? (
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{incident.reporterName}</span>
                        </div>
                    ) : (
                         <div className="flex items-center gap-3 text-muted-foreground italic">
                            <User className="h-5 w-5" />
                            <span>No name provided</span>
                        </div>
                    )}
                     {incident.reporterPhone ? (
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <a href={`tel:${incident.reporterPhone}`} className="font-medium hover:underline">{incident.reporterPhone}</a>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Text className="h-4 w-4" />
                                    <span>SMS Updates: {incident.canText ? "Allowed" : "Not Allowed"}</span>
                                 </div>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center gap-3 text-muted-foreground italic">
                            <Phone className="h-5 w-5" />
                            <span>No phone provided</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
