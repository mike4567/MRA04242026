
"use client";

import { useState, useEffect } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';
import { Move } from 'lucide-react';
import type { RecentIncident } from '@/app/actions';
import { Button } from './ui/button';

interface InteractiveMapProps {
    position: { lat: number; lng: number; };
    onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
    recentIncidents?: RecentIncident[];
    onRecentIncidentClick?: (incident: RecentIncident) => void;
}

const parseLocation = (location: string): { lat: number; lng: number } | null => {
    const parts = location.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
};


export function InteractiveMap({ 
    position, 
    onMarkerDragEnd,
    recentIncidents = [],
    onRecentIncidentClick = () => {} 
}: InteractiveMapProps) {
    const [showDragPopup, setShowDragPopup] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<RecentIncident | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => setShowDragPopup(true), 500);
      const hideTimer = setTimeout(() => setShowDragPopup(false), 5000);

      return () => {
          clearTimeout(timer);
          clearTimeout(hideTimer);
      };
    }, [position]);
    
    const handleDragStart = () => {
        setShowDragPopup(false);
    }
    
    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <Map
                mapId={'bf51a910020fa25a'}
                center={position}
                defaultZoom={12}
                gestureHandling="greedy"
                disableDefaultUI={false}
            >
                <AdvancedMarker 
                    position={position}
                    gmpDraggable={true}
                    onDragStart={handleDragStart}
                    onDragEnd={onMarkerDragEnd}
                />

                {recentIncidents.map((incident) => {
                    const incidentPosition = parseLocation(incident.location);
                    if (!incidentPosition) return null;
                    const title = `${incident.animalType || 'Unknown Animal'} reported on ${new Date(incident.reportedAt).toLocaleString()}`;

                    return (
                        <AdvancedMarker
                            key={incident.id}
                            position={incidentPosition}
                            title={title}
                            onClick={() => setSelectedIncident(incident)}
                        >
                            <Pin
                                background={'#9ca3af'}
                                glyphColor={'#6b7280'}
                                borderColor={'#6b7280'}
                            />
                        </AdvancedMarker>
                    );
                })}

                {selectedIncident && (
                    <InfoWindow
                        position={parseLocation(selectedIncident.location)}
                        onCloseClick={() => setSelectedIncident(null)}
                    >
                        <div className="p-2 space-y-2">
                            <p className="font-bold">{selectedIncident.animalType || 'Unknown Animal'}</p>
                            <p>
                                Reported: {new Date(selectedIncident.reportedAt).toLocaleString([], {
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                })}
                            </p>
                            <Button size="sm" onClick={() => {
                                onRecentIncidentClick(selectedIncident);
                                setSelectedIncident(null);
                            }}>
                                Add Info / See Details
                            </Button>
                        </div>
                    </InfoWindow>
                )}
            </Map>
            <div className={cn(
                "absolute top-2 left-1/2 -translate-x-1/2 z-10 p-2 bg-background/80 backdrop-blur-sm text-foreground rounded-lg shadow-lg text-xs flex items-center gap-2 transition-all duration-300",
                showDragPopup ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            )}>
                <Move className="h-4 w-4 text-primary" />
                <span>Drag pin to the exact incident location</span>
            </div>
        </div>
    );
}
