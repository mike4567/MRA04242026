"use client";

import { useState, useRef, ChangeEvent, useMemo, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createIncidentReport, type CreateIncidentOutput } from '@/ai/flows/create-incident-report';
import { getRecentActiveIncidents, addInfoToIncident, type RecentIncident } from '@/app/actions';
import { useIncident } from '@/context/IncidentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Image as ImageIcon, MapPin, Phone, User, X, PlusCircle, Search } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { APIProvider } from '@vis.gl/react-google-maps';
import { InteractiveMap } from './InteractiveMap';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';


interface MediaFile {
  file: File;
  previewUrl: string;
}

function isVideo(fileType: string): boolean {
  return fileType.startsWith('video');
}

const animalTypes = ["Large Whale", "Dolphin or Porpoise", "Seal or Sea Lion", "Sea Turtle", "Other/Unknown"];
const animalConditions = ["Entangled (in net, line, or gear)", "Stranded (on beach or rocks)", "Injured or Bleeding", "Unusual Behavior"];

interface IncidentReportFormProps {
  apiKey: string;
}

export default function IncidentReportForm({ apiKey }: IncidentReportFormProps) {
  const router = useRouter();
  const { setIncidentDataForConfirmation } = useIncident();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [location, setLocation] = useState<string>("");
  const [additionalLocationInfo, setAdditionalLocationInfo] = useState<string>("");
  
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterPhone, setReporterPhone] = useState<string>("");
  const [canText, setCanText] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const [selectedAnimalType, setSelectedAnimalType] = useState<string | null>(null);
  const [animalLifeStatus, setAnimalLifeStatus] = useState<'alive' | 'dead' | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [detailedDescription, setDetailedDescription] = useState<string>("");

  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);
  const [showNoResponderDialog, setShowNoResponderDialog] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<CreateIncidentOutput | null>(null);

  // State for duplicate prevention
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<RecentIncident | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'append'>('new');
  const [showExistingIncidentDialog, setShowExistingIncidentDialog] = useState(false);

  useEffect(() => {
    // Fetch recent incidents when the component mounts
    const fetchRecentIncidents = async () => {
      const incidents = await getRecentActiveIncidents();
      setRecentIncidents(incidents);
    };
    fetchRecentIncidents();
  }, []);
  
  const position = useMemo(() => {
    if (!location) return null;
    const parts = location.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  }, [location]);

  useEffect(() => {
    if (position) {
      setMapCenter(position);
    }
  }, [position]);

  const handleRecentIncidentClick = (incident: RecentIncident) => {
    setSelectedIncident(incident);
    setShowExistingIncidentDialog(true);
  };
  
  const handleAppendToExisting = () => {
    setFormMode('append');
    setShowExistingIncidentDialog(false);
    toast({
      title: "Append Mode Activated",
      description: "The form is now set to add information to the existing incident. Fill out the relevant details and submit.",
    });
  };

  const handleReportNew = () => {
    setFormMode('new');
    setSelectedIncident(null);
    setShowExistingIncidentDialog(false);
  }

  const handleLocationInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      geocodeAddress();
    }
  };


  const geocodeAddress = async () => {
    const isCoordinate = /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,},\s*-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,}/.test(location.trim());
    if (!location || isCoordinate) {
        toast({ title: "Invalid Address", description: "Please enter a valid street address to find on the map.", variant: "destructive" });
        return;
    }
    
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: location }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to geocode address.');
      }

      const { lat, lng } = data.location;
      setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setMapCenter({ lat, lng });
      toast({ title: "Location Found", description: "The address has been located on the map." });

    } catch (e: any) {
        console.error("Geocoding failed:", e);
        toast({ title: "Geocoding Error", description: `Could not geocode address: ${e.message}`, variant: "destructive" });
    }
  };


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newMediaFiles = Array.from(files).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setMediaFiles(prevFiles => [...prevFiles, ...newMediaFiles]);
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast({ title: "Location Captured", description: "Your current location has been set." });
      }, (error) => {
        toast({ title: "Location Error", description: "Could not get location. Please enter it manually.", variant: "destructive" });
      });
    } else {
      toast({ title: "Location Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
    }
  };
  
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
  };

  const handleConditionChange = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const proceedToConfirmation = () => {
    if (lastSubmissionResult) {
      setIncidentDataForConfirmation(lastSubmissionResult.incidentId, lastSubmissionResult.responderInfo);
      router.push("/confirmation");
    }
  };

  const handleSubmitReport = async () => {
     if (formMode === 'new') {
      if (!location) {
        toast({ title: "Missing Location", description: "Please provide the incident location.", variant: "destructive" });
        return;
      }
      if (!selectedAnimalType) {
        toast({ title: "Missing Animal Type", description: "Please select an animal type.", variant: "destructive" });
        return;
      }
      if (!animalLifeStatus) {
        toast({ title: "Missing Animal Status", description: "Please specify if the animal is alive or dead.", variant: "destructive" });
        return;
      }
    }

    if (formMode === 'append' && !detailedDescription.trim() && !animalLifeStatus) {
      toast({ title: "Missing Information", description: "Please provide information to add (e.g., in the 'Detailed Description') or update the animal's life status.", variant: "destructive" });
      return;
    }


    setLoading(true);

    try {
      if (formMode === 'append' && selectedIncident) {
        const result = await addInfoToIncident(selectedIncident.id, detailedDescription, animalLifeStatus);
        if (result.success) {
          toast({ title: "Information Added", description: "Your information has been successfully added to the existing incident report." });
          // Reset form or redirect
          router.push(`/incidents/${selectedIncident.id}`);
        } else {
          throw new Error(result.error || "Failed to add info.");
        }
      } else {
        const mediaDataUris = await Promise.all(mediaFiles.map(mf => fileToDataUri(mf.file)));

        const incidentInput = {
          mediaDataUris: mediaDataUris.length > 0 ? mediaDataUris : undefined,
          location: location,
          additionalLocationInfo: additionalLocationInfo || undefined,
          reporterName: reporterName || undefined,
          reporterPhone: reporterPhone || undefined,
          canText: canText,
          animalType: selectedAnimalType,
          animalLifeStatus: animalLifeStatus,
          conditions: selectedConditions.length > 0 ? selectedConditions : undefined,
          detailedDescription: detailedDescription || undefined,
        };
        
        const result = await createIncidentReport(incidentInput);
        setLastSubmissionResult(result);

        if (result.noResponderFound) {
          setShowNoResponderDialog(true);
        } else {
          setIncidentDataForConfirmation(result.incidentId, result.responderInfo);
          router.push("/confirmation");
        }
      }
    } catch (error: any) {
      console.error("Incident report failed:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitButtonText = useMemo(() => {
    if (loading) return 'Submitting...';
    if (formMode === 'append') return 'Add Information to Existing Report';
    return 'Submit New Report';
  }, [loading, formMode]);

  return (
    <>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Report a Marine Animal Incident</CardTitle>
          <CardDescription className="text-muted-foreground px-4">
            If you see a stranded or entangled marine animal, use this form to send a report directly to the NOAA Fisheries West Coast Region. Please provide your location, a photo or video of the incident, and optional contact information so our response teams can follow up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <APIProvider apiKey={apiKey}>
            <div className="space-y-4">
                <Label htmlFor="location" className="text-lg font-semibold">1. Incident Location</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                        id="location" 
                        placeholder="e.g., Santa Monica Pier or 34.008, -118.495" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleLocationInputKeyDown}
                    />
                    <Button variant="secondary" onClick={geocodeAddress}>
                        <Search className="mr-2 h-4 w-4"/> Find Address
                    </Button>
                    <Button variant="outline" onClick={handleGetLocation}>
                        <MapPin className="mr-2 h-4 w-4"/> Get Current
                    </Button>
                </div>
                <div className="h-48 w-full bg-secondary rounded-md flex items-center justify-center text-muted-foreground overflow-hidden">
                  {mapCenter ? (
                    <InteractiveMap 
                      position={mapCenter} 
                      onMarkerDragEnd={handleMarkerDragEnd}
                      recentIncidents={recentIncidents}
                      onRecentIncidentClick={handleRecentIncidentClick}
                    />
                  ) : (
                    <span>[Enter location to see map]</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional-location-info">Additional Location Details (Optional)</Label>
                  <Textarea
                    id="additional-location-info"
                    placeholder="e.g., Description of exact location relative to a fixed object, beach access point, etc."
                    value={additionalLocationInfo}
                    onChange={(e) => setAdditionalLocationInfo(e.target.value)}
                  />
                </div>
            </div>
          </APIProvider>

          <div className="space-y-6">
              <Label className="text-lg font-semibold">2. Animal Details</Label>
              
              <div className="space-y-2">
                  <p className="font-medium">What type of animal is it?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {animalTypes.map(type => (
                          <Button
                              key={type}
                              variant={selectedAnimalType === type ? 'default' : 'outline'}
                              onClick={() => setSelectedAnimalType(type)}
                              className="justify-start text-left h-auto py-2"
                              disabled={formMode === 'append'}
                          >
                              {type}
                          </Button>
                      ))}
                  </div>
              </div>

               <div className="space-y-3">
                  <p className="font-medium">Is the animal alive or dead?</p>
                  <RadioGroup 
                    onValueChange={(value: 'alive' | 'dead') => setAnimalLifeStatus(value)} 
                    value={animalLifeStatus || undefined}
                    className="flex items-center gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="alive" id="alive" />
                      <Label htmlFor="alive">Alive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dead" id="dead" />
                      <Label htmlFor="dead">Dead</Label>
                    </div>
                  </RadioGroup>
              </div>

              <div className="space-y-2">
                  <p className="font-medium">What is the animal's condition? (check all that apply)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {animalConditions.map(condition => (
                          <div key={condition} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`condition-${condition}`}
                                  checked={selectedConditions.includes(condition)} 
                                  onCheckedChange={() => handleConditionChange(condition)}
                                  disabled={formMode === 'append'}
                              />
                              <label
                                  htmlFor={`condition-${condition}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                  {condition}
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="detailed-description">Detailed Description {formMode === 'append' ? '(Information to Add)' : '(Optional)'}</Label>
                  <Textarea
                    id="detailed-description"
                    placeholder={formMode === 'append' 
                      ? "Provide the new information you want to add to the existing report here."
                      : "Please provide any additional information about the animal's size, condition, behavior, or surrounding environment."
                    }
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    rows={4}
                  />
                </div>
          </div>

          <div className="space-y-4">
              <Label className="text-lg font-semibold">3. Upload Photo or Video (Optional)</Label>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="guidelines">
                  <AccordionTrigger>Photo & Video Guidelines</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm text-muted-foreground space-y-2">
                      <p>From a safe distance, please capture:</p>
                      <h4 className="font-semibold text-foreground">For Photos:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>The whole animal to show its size and condition.</li>
                        <li>Close-ups of the injury or any visible entanglement (nets, lines, debris).</li>
                        <li>The surrounding area (beach, rocks, water) to help us understand the environment.</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">For Videos:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Show the animal's behavior, breathing, and any movement.</li>
                      </ul>
                      <h4 className="font-semibold text-foreground">Important:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Please keep videos under 30 seconds.</li>
                        <li>You can upload multiple photos and videos if needed.</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media, index) => (
                      <div key={index} className="relative group aspect-square">
                          {isVideo(media.file.type) ? (
                              <video src={media.previewUrl} className="w-full h-full object-cover rounded-md bg-secondary" />
                          ) : (
                              <Image src={media.previewUrl} alt={`Incident media ${index + 1}`} fill className="object-cover rounded-md" />
                          )}
                          <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveMedia(index)}
                          >
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ))}
                  <div className="flex items-center justify-center w-full aspect-square">
                      <button type="button" onClick={handleTriggerFileInput} className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors">
                          <div className="flex flex-col items-center justify-center text-center p-2">
                              <PlusCircle className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Add photo/video</p>
                          </div>
                      </button>
                  </div>
              </div>
              
              <Input id="photo-input" type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} ref={fileInputRef} />

          </div>

          <div className="space-y-6">
            <Label className="text-lg font-semibold">4. Your Contact Information (Optional)</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground"/>
                  <Input 
                      placeholder="Full Name" 
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground"/>
                  <Input 
                      placeholder="Phone Number" 
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                  />
              </div>
              <div className="space-y-3 pl-7">
                  <Label>Is it okay to contact you via phone or SMS regarding this incident report?</Label>
                  <RadioGroup 
                    onValueChange={(value: 'yes' | 'no') => setCanText(value === 'yes')} 
                    value={canText ? 'yes' : 'no'}
                    className="flex items-center gap-6"
                    disabled={!reporterPhone}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="contact-yes" />
                      <Label htmlFor="contact-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="contact-no" />
                      <Label htmlFor="contact-no">No</Label>
                    </div>
                  </RadioGroup>
              </div>
            </div>
          </div>
          
          <div>
            <Button
              onClick={handleSubmitReport}
              disabled={loading || (formMode === 'new' && (!location || !selectedAnimalType || !animalLifeStatus))}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-lg"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
                Your report is immediately sent to the appropriate NOAA-authorized response team based on location and the animal's condition.
            </p>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={showNoResponderDialog} onOpenChange={setShowNoResponderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Location Outside Primary Response Area</AlertDialogTitle>
            <AlertDialogDescription>
              Thank you. This location appears to be outside of the established stranding network zones. Your report will still be recorded and reviewed, but a direct response may not be possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={proceedToConfirmation}>
            Continue
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExistingIncidentDialog} onOpenChange={setShowExistingIncidentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Incident Nearby</AlertDialogTitle>
            <AlertDialogDescription>
              An incident involving a{' '}
              <span className="font-semibold">{selectedIncident?.animalType || 'animal'}</span>
              {' '}was already reported here recently. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel onClick={handleReportNew}>Report New Incident Anyway</AlertDialogCancel>
            <AlertDialogAction onClick={handleAppendToExisting}>Add Info to Existing Report</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}