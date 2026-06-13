/**
 * IncidentLocationMap Component
 * 
 * Displays an interactive Google Map showing an incident's location.
 * Used on both public (/incidents/[id]) and admin (/admin/incidents/[id]) pages.
 * 
 * Features:
 * - Click-to-load: Shows "Click to Load Map" placeholder initially
 * - Grey pin marker indicating incident location
 * - Non-draggable marker - location cannot be changed after incident is logged
 * - Fullscreen modal view for detailed map exploration
 * - Uses Google Maps JavaScript API (same as reporting page)
 * 
 * NIST SP 800-218 Compliance: PW.1.1 - Well-documented component with clear interface.
 */

"use client";

import { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { parseCoordinates } from "@/lib/static-map";
import { MapPin, MousePointerClick, Maximize2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IncidentLocationMapProps {
    // Coordinate string in "lat, lng" format (e.g., "34.008, -118.495")
    location: string | undefined | null;
    // Optional custom class names for the container
    className?: string;
    // Optional custom width (default: 350 - increased 25%)
    width?: number;
    // Optional custom height (default: 250 - increased 25%)
    height?: number;
}

/**
 * Placeholder component shown before map is loaded.
 * Displays "Click to Load Map" with a clickable overlay.
 */
function MapPlaceholder({
    width,
    height,
    onClick,
    className,
}: {
    width: number;
    height: number;
    onClick: () => void;
    className: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground hover:bg-muted/80 hover:border-primary/50 transition-colors cursor-pointer ${className}`}
            style={{ width, height }}
        >
            <MousePointerClick className="h-8 w-8 mb-2 opacity-60" />
            <p className="text-sm font-medium">Click to Load Map</p>
        </button>
    );
}

/**
 * Error/unavailable placeholder component.
 */
function UnavailablePlaceholder({
    width,
    height,
    message,
    className,
}: {
    width: number;
    height: number;
    message: string;
    className: string;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground ${className}`}
            style={{ width, height }}
        >
            <MapPin className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs text-center px-2">{message}</p>
        </div>
    );
}

/**
 * The actual map component once loaded.
 * Shows the incident location with a grey, non-draggable pin.
 * Includes expand button to open fullscreen modal.
 */
function LoadedMap({
    lat,
    lng,
    width,
    height,
    apiKey,
    onExpandClick,
}: {
    lat: number;
    lng: number;
    width: number;
    height: number;
    apiKey: string;
    onExpandClick: () => void;
}) {
    return (
        <div 
            className="rounded-lg border shadow-sm overflow-hidden relative group"
            style={{ width, height }}
        >
            <APIProvider apiKey={apiKey}>
                <Map
                    mapId="incident-location-map"
                    defaultCenter={{ lat, lng }}
                    defaultZoom={12}
                    gestureHandling="cooperative"
                    disableDefaultUI={true}
                    zoomControl={true}
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={false}
                    style={{ width: "100%", height: "100%" }}
                >
                    {/* Grey pin marker - non-draggable to prevent location changes */}
                    <AdvancedMarker
                        position={{ lat, lng }}
                        draggable={false}
                        title="Incident Location"
                    >
                        <Pin
                            background="#6B7280"
                            borderColor="#4B5563"
                            glyphColor="#FFFFFF"
                        />
                    </AdvancedMarker>
                </Map>
            </APIProvider>
            {/* Expand button overlay */}
            <button
                type="button"
                onClick={onExpandClick}
                className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-md shadow-md border border-gray-200 transition-all opacity-70 group-hover:opacity-100 hover:scale-105"
                title="Expand to fullscreen"
            >
                <Maximize2 className="h-4 w-4 text-gray-700" />
            </button>
        </div>
    );
}

/**
 * Fullscreen map component rendered in a modal dialog.
 */
function FullscreenMapModal({
    lat,
    lng,
    apiKey,
    isOpen,
    onClose,
    locationString,
}: {
    lat: number;
    lng: number;
    apiKey: string;
    isOpen: boolean;
    onClose: () => void;
    locationString: string;
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Incident Location: {locationString}
                        </DialogTitle>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </DialogHeader>
                <div className="w-full h-full pt-16">
                    <APIProvider apiKey={apiKey}>
                        <Map
                            mapId="incident-location-map-fullscreen"
                            defaultCenter={{ lat, lng }}
                            defaultZoom={13}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                            zoomControl={true}
                            mapTypeControl={true}
                            streetViewControl={true}
                            fullscreenControl={false}
                            style={{ width: "100%", height: "100%" }}
                        >
                            {/* Grey pin marker - non-draggable */}
                            <AdvancedMarker
                                position={{ lat, lng }}
                                draggable={false}
                                title="Incident Location"
                            >
                                <Pin
                                    background="#6B7280"
                                    borderColor="#4B5563"
                                    glyphColor="#FFFFFF"
                                    scale={1.2}
                                />
                            </AdvancedMarker>
                        </Map>
                    </APIProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Main component that manages the click-to-load behavior and fullscreen modal.
 * Shows placeholder until clicked, then loads the interactive map.
 */
export function IncidentLocationMap({
    location,
    className = "",
    width = 350,
    height = 250,
}: IncidentLocationMapProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Parse coordinates from location string
    const coords = parseCoordinates(location);

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Fallback: Show placeholder when coordinates are invalid
    if (!coords) {
        return (
            <UnavailablePlaceholder
                width={width}
                height={height}
                message="Location Data Unavailable"
                className={className}
            />
        );
    }

    // Fallback: Show placeholder when API key is missing
    if (!apiKey) {
        return (
            <UnavailablePlaceholder
                width={width}
                height={height}
                message="Map configuration error"
                className={className}
            />
        );
    }

    // Show click-to-load placeholder until user clicks
    if (!isMapLoaded) {
        return (
            <MapPlaceholder
                width={width}
                height={height}
                onClick={() => setIsMapLoaded(true)}
                className={className}
            />
        );
    }

    // Render the loaded interactive map with fullscreen capability
    return (
        <>
            <LoadedMap
                lat={coords.lat}
                lng={coords.lng}
                width={width}
                height={height}
                apiKey={apiKey}
                onExpandClick={() => setIsFullscreen(true)}
            />
            <FullscreenMapModal
                lat={coords.lat}
                lng={coords.lng}
                apiKey={apiKey}
                isOpen={isFullscreen}
                onClose={() => setIsFullscreen(false)}
                locationString={location || "Unknown"}
            />
        </>
    );
}

/**
 * Re-export for backward compatibility with existing imports.
 * Components using StaticLocationMap will now get the interactive version.
 */
export { IncidentLocationMap as StaticLocationMap };
