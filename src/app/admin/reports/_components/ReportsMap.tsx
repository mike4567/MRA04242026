
"use client";

import { useState, useMemo, useCallback, useEffect, FC } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { format, parseISO } from 'date-fns';
import type { IncidentReportData } from '../page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

type Incident = IncidentReportData;

// A custom map marker that displays a number
const NumberedPin: FC<{ number: number }> = ({ number }) => (
    <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 48 48" className="absolute w-full h-full">
            <path
                d="M24 0C12.954 0 4 8.954 4 20c0 15 20 28 20 28s20-13 20-28C44 8.954 35.046 0 24 0z"
                fill="#1A73E8"
                stroke="#fff"
                strokeWidth="2"
            />
        </svg>
        <span className="relative text-white font-bold text-sm z-10 pb-2">{number}</span>
    </div>
);


const PickerReport: FC<{ incidents: (Incident & { lat: number, lng: number })[] }> = ({ incidents }) => {
    useEffect(() => {
        const handleAfterPrint = () => {
            document.body.classList.remove('printing');
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
    };

    return (
        <div className="mt-6 p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Picker Report ({incidents.length} selected)</h3>
                <Button onClick={handlePrint} variant="outline" size="sm" className="print:hidden">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>
            <div className="space-y-4">
                {incidents.map((incident, index) => (
                    <div key={incident.id} className="p-3 border rounded-md bg-muted/50 break-inside-avoid">
                        <p className="font-bold text-md">
                            <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-primary text-primary-foreground">{index + 1}</span>
                            {incident.animal_type}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pl-9 text-sm">
                            <p><span className="font-semibold">Date:</span> {incident.reported_at ? format(parseISO(incident.reported_at), 'PPp') : 'N/A'}</p>
                            <p><span className="font-semibold">Responder:</span> {incident.responder_org || 'N/A'}</p>
                            <p><span className="font-semibold">Geolocation:</span> {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</p>
                            <p><span className="font-semibold">Incident ID:</span> <span className="font-mono text-xs">{incident.id}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default function ReportsMap({ incidents }: { incidents: Incident[] }) {
    const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
    const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null);

    const [cameraState, setCameraState] = useState({
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        heading: 0,
        tilt: 45,
    });

    const handleCheckboxChange = useCallback((incidentId: string, checked: boolean | 'indeterminate') => {
        setSelectedIncidentIds(prev => {
            if (checked) {
                return [...prev, incidentId];
            } else {
                return prev.filter(id => id !== incidentId);
            }
        });
    }, []);

    const mappableIncidents = useMemo(() => {
        return incidents.filter(i => 
            selectedIncidentIds.includes(i.id) && i.lat != null && i.lng != null
        ) as (Incident & { lat: number; lng: number })[];
    }, [incidents, selectedIncidentIds]);
    
    useEffect(() => {
        if (mappableIncidents.length > 0) {
            const avgLat = mappableIncidents.reduce((sum, i) => sum + i.lat, 0) / mappableIncidents.length;
            const avgLng = mappableIncidents.reduce((sum, i) => sum + i.lng, 0) / mappableIncidents.length;
            setCameraState(prev => ({ ...prev, center: { lat: avgLat, lng: avgLng }, zoom: 10 }));
        }
    }, [mappableIncidents]);

    const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => setCameraState(ev.detail), []);

    return (
        <>
            <style jsx global>{`
                @media print {
                    body.printing * {
                        visibility: hidden;
                    }
                    body.printing .printable-area,
                    body.printing .printable-area * {
                        visibility: visible;
                    }
                    body.printing .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
            <div className="printable-area">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[600px] lg:h-auto rounded-lg overflow-hidden border print:col-span-3 print:h-[50vh]">
                        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                            <Map mapId={'f9156f2512152b1'} {...cameraState} onCameraChanged={handleCameraChange} gestureHandling={'greedy'} mapTypeControl={false} zoomControl={true} streetViewControl={false} fullscreenControl={false}>
                                {mappableIncidents.map((incident, index) => (
                                    <AdvancedMarker key={`marker-${incident.id}`} position={{ lat: incident.lat, lng: incident.lng }} onPointerEnter={() => setHoveredIncident(incident)} onPointerLeave={() => setHoveredIncident(null)}>
                                       <NumberedPin number={index + 1} />
                                    </AdvancedMarker>
                                ))}
                                {hoveredIncident && (
                                    <InfoWindow position={{ lat: hoveredIncident.lat!, lng: hoveredIncident.lng! }} onCloseClick={() => setHoveredIncident(null)} pixelOffset={[0, -40]}>
                                        <div className="p-2 print:hidden">
                                            <p className="font-bold text-sm">{hoveredIncident.animal_type}</p>
                                            <p className="text-xs">{hoveredIncident.reported_at ? format(parseISO(hoveredIncident.reported_at), 'MMM d, yyyy') : 'N/A'}</p>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Map>
                        </APIProvider>
                    </div>
                    <div className="lg:col-span-1 print:hidden">
                        <Card className="h-full flex flex-col">
                            <CardHeader><CardTitle>Incident Picker ({selectedIncidentIds.length} / {incidents.length})</CardTitle></CardHeader>
                            <CardContent className="flex-grow overflow-hidden">
                                <ScrollArea className="h-[40rem] pr-4">
                                    <div className="space-y-2">
                                        {incidents.sort((a,b) => parseISO(b.reported_at).getTime() - parseISO(a.reported_at).getTime()).map(incident => (
                                            <div key={incident.id} className={cn("p-3 rounded-lg border transition-all flex items-center space-x-3", selectedIncidentIds.includes(incident.id) ? "bg-muted border-primary" : "hover:bg-muted/50")}>
                                                <Checkbox id={`checkbox-${incident.id}`} checked={selectedIncidentIds.includes(incident.id)} onCheckedChange={(checked) => handleCheckboxChange(incident.id, checked)} />
                                                <Label htmlFor={`checkbox-${incident.id}`} className="cursor-pointer w-full">
                                                    <p className="text-xs text-muted-foreground">{incident.reported_at ? format(parseISO(incident.reported_at), 'PPp') : 'Date not available'}</p>
                                                    <p className="font-semibold text-sm truncate pr-2">{incident.animal_type}</p>
                                                    {incident.lat != null && incident.lng != null && (<p className="text-xs text-muted-foreground font-mono">{incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</p>)}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {mappableIncidents.length > 0 && (
                    <div className="print:col-span-3">
                        <PickerReport incidents={mappableIncidents} />
                    </div>
                )}
            </div>
        </>
    );
}
