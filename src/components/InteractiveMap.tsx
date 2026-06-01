
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
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

// Draggable marker component with auto-pan support
function DraggableMarker({ 
    position, 
    onDragStart, 
    onDragEnd 
}: {
    position: { lat: number; lng: number };
    onDragStart: () => void;
    onDragEnd: (e: google.maps.MapMouseEvent) => void;
}) {
    const map = useMap();

    // Pan map to keep marker visible during drag
    const handleDrag = useCallback((e: google.maps.MapMouseEvent) => {
        if (!map || !e.latLng) return;
        
        const bounds = map.getBounds();
        if (!bounds) return;
        
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Calculate edge buffer (10% of visible area)
        const latBuffer = (ne.lat() - sw.lat()) * 0.1;
        const lngBuffer = (ne.lng() - sw.lng()) * 0.1;
        
        // Check if marker is near edge and pan if needed
        let panLat = 0;
        let panLng = 0;
        
        if (lat > ne.lat() - latBuffer) panLat = latBuffer;
        if (lat < sw.lat() + latBuffer) panLat = -latBuffer;
        if (lng > ne.lng() - lngBuffer) panLng = lngBuffer;
        if (lng < sw.lng() + lngBuffer) panLng = -lngBuffer;
        
        if (panLat !== 0 || panLng !== 0) {
            const center = map.getCenter();
            if (center) {
                map.panTo({
                    lat: center.lat() + panLat,
                    lng: center.lng() + panLng
                });
            }
        }
    }, [map]);

    return (
        <AdvancedMarker 
            position={position}
            draggable={true}
            onDragStart={onDragStart}
            onDrag={handleDrag}
            onDragEnd={onDragEnd}
            zIndex={1000}
        >
            <Pin
                background={'#EA4335'}
                glyphColor={'#FFFFFF'}
                borderColor={'#B31412'}
            />
        </AdvancedMarker>
    );
}

// Separate component to use useMap hook inside the Map context
function IncidentMarkers({ 
    recentIncidents, 
    selectedIncident, 
    setSelectedIncident,
    onRecentIncidentClick 
}: {
    recentIncidents: RecentIncident[];
    selectedIncident: RecentIncident | null;
    setSelectedIncident: (incident: RecentIncident | null) => void;
    onRecentIncidentClick: (incident: RecentIncident) => void;
}) {
    const map = useMap();

    // Pan map to show InfoWindow when marker is clicked
    const handleMarkerClick = useCallback((incident: RecentIncident) => {
        const incidentPosition = parseLocation(incident.location);
        if (incidentPosition && map) {
            // Pan the map so the marker is in the lower portion, leaving room for the InfoWindow above
            const offsetLat = incidentPosition.lat + 0.02; // Offset to show popup above
            map.panTo({ lat: offsetLat, lng: incidentPosition.lng });
        }
        setSelectedIncident(incident);
    }, [map, setSelectedIncident]);

    return (
        <>
            {recentIncidents.map((incident) => {
                const incidentPosition = parseLocation(incident.location);
                if (!incidentPosition) return null;
                const title = `${incident.animalType || 'Unknown Animal'} reported on ${new Date(incident.reportedAt).toLocaleString()}`;

                return (
                    <AdvancedMarker
                        key={incident.id}
                        position={incidentPosition}
                        title={title}
                        onClick={() => handleMarkerClick(incident)}
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
                    headerContent={<span className="font-semibold">{selectedIncident.animalType || 'Unknown Animal'}</span>}
                >
                    <div className="p-1 space-y-2 min-w-[180px]">
                        <p className="text-sm">
                            Reported: {new Date(selectedIncident.reportedAt).toLocaleString([], {
                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                        </p>
                        <Button size="sm" className="w-full" onClick={() => {
                            onRecentIncidentClick(selectedIncident);
                            setSelectedIncident(null);
                        }}>
                            Add Info / See Details
                        </Button>
                    </div>
                </InfoWindow>
            )}
        </>
    );
}


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
                defaultCenter={position}
                defaultZoom={12}
                gestureHandling="greedy"
                disableDefaultUI={false}
            >
                {/* Gray incident markers rendered FIRST (lower z-index) */}
                <IncidentMarkers 
                    recentIncidents={recentIncidents}
                    selectedIncident={selectedIncident}
                    setSelectedIncident={setSelectedIncident}
                    onRecentIncidentClick={onRecentIncidentClick}
                />

                {/* Red draggable marker rendered LAST (higher z-index, always on top) */}
                <DraggableMarker 
                    position={position}
                    onDragStart={handleDragStart}
                    onDragEnd={onMarkerDragEnd}
                />
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
