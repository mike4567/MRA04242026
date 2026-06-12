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
 * - Uses Google Maps JavaScript API (same as reporting page)
 * 
 * NIST SP 800-218 Compliance: PW.1.1 - Well-documented component with clear interface.
 */

"use client";

import { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { parseCoordinates } from "@/lib/static-map";
import { MapPin, MousePointerClick } from "lucide-react";

interface IncidentLocationMapProps {
    // Coordinate string in "lat, lng" format (e.g., "34.008, -118.495")
    location: string | undefined | null;
    // Optional custom class names for the container
    className?: string;
    // Optional custom width (default: 300)
    width?: number;
    // Optional custom height (default: 200)
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
 */
function LoadedMap({
    lat,
    lng,
    width,
    height,
    apiKey,
}: {
    lat: number;
    lng: number;
    width: number;
    height: number;
    apiKey: string;
}) {
    return (
        <div 
            className="rounded-lg border shadow-sm overflow-hidden"
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
        </div>
    );
}

/**
 * Main component that manages the click-to-load behavior.
 * Shows placeholder until clicked, then loads the interactive map.
 */
export function IncidentLocationMap({
    location,
    className = "",
    width = 300,
    height = 200,
}: IncidentLocationMapProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false);

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

    // Render the loaded interactive map
    return (
        <LoadedMap
            lat={coords.lat}
            lng={coords.lng}
            width={width}
            height={height}
            apiKey={apiKey}
        />
    );
}

/**
 * Re-export for backward compatibility with existing imports.
 * Components using StaticLocationMap will now get the interactive version.
 */
export { IncidentLocationMap as StaticLocationMap };
