/**
 * Static Map URL Generation Utility
 * 
 * Generates Google Maps Static API URLs for displaying incident locations
 * on both public and admin incident detail pages.
 * 
 * NIST SP 800-218 Compliance: Uses environment variables for API key security.
 */

export interface StaticMapOptions {
    // Map image width in pixels (default: 300)
    width?: number;
    // Map image height in pixels (default: 200)
    height?: number;
    // Zoom level 1-20 (default: 12)
    zoom?: number;
    // Map type: roadmap, satellite, terrain, hybrid (default: roadmap)
    mapType?: "roadmap" | "satellite" | "terrain" | "hybrid";
}

/**
 * Parse a coordinate string into lat/lng values.
 * Expects format: "lat, lng" (e.g., "34.008, -118.495")
 * 
 * @param location - Coordinate string in "lat, lng" format
 * @returns Object with lat/lng or null if invalid
 */
export function parseCoordinates(
    location: string | undefined | null
): { lat: number; lng: number } | null {
    if (!location || typeof location !== "string") {
        return null;
    }

    const parts = location.split(",").map((s) => s.trim());
    if (parts.length !== 2) {
        return null;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    // Validate coordinate ranges
    if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return null;
    }

    return { lat, lng };
}

/**
 * Generate a Google Maps Static API URL for displaying an incident location.
 * 
 * @param location - Coordinate string in "lat, lng" format
 * @param options - Optional configuration for map size, zoom, and type
 * @returns Static map URL string, or null if coordinates are invalid
 */
export function getStaticMapUrl(
    location: string | undefined | null,
    options?: StaticMapOptions
): string | null {
    const coords = parseCoordinates(location);
    if (!coords) {
        return null;
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.warn("Static map: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured");
        return null;
    }

    // Apply defaults
    const width = options?.width ?? 300;
    const height = options?.height ?? 200;
    const zoom = options?.zoom ?? 12;
    const mapType = options?.mapType ?? "roadmap";

    // Build the Static Maps API URL
    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const params = new URLSearchParams({
        center: `${coords.lat},${coords.lng}`,
        zoom: zoom.toString(),
        size: `${width}x${height}`,
        maptype: mapType,
        markers: `color:red|${coords.lat},${coords.lng}`,
        key: apiKey,
    });

    return `${baseUrl}?${params.toString()}`;
}
