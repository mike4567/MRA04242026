/**
 * EnvironmentalRiskFactors Component
 * 
 * Displays NOAA CoastWatch ERDDAP environmental data for an incident.
 * Shows Sea Surface Temperature (SST) map and data captured at the time of report.
 * 
 * Features:
 * - Click-to-load pattern for SST map image (ERDDAP can be slow)
 * - Displays parsed SST value in Celsius and Fahrenheit
 * - Shows capture timestamp and data source
 * - Dynamic legend from ERDDAP
 * 
 * NIST SP 800-218 Compliance: PW.1.1 - Well-documented component
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Thermometer, Clock, ExternalLink, Loader2, MapIcon, AlertCircle } from "lucide-react";
import type { ERDDAPRiskData } from "@/lib/types";
import { format } from "date-fns";

/**
 * Static color scale component matching the KT_thermal palette used in ERDDAP maps.
 * This is more reliable than fetching the legend image from ERDDAP.
 */
function SSTColorScale() {
    return (
        <div 
            className="h-4 w-32 rounded-sm border border-border"
            style={{
                background: 'linear-gradient(to right, #000080, #0000ff, #00ffff, #00ff00, #ffff00, #ff8000, #ff0000)'
            }}
            title="SST Color Scale: 5°C (blue) to 25°C (red)"
        />
    );
}

/**
 * Extracts the date from the map URL TIME parameter.
 */
function extractMapDateFromUrl(mapUrl: string): string | null {
    try {
        const url = new URL(mapUrl);
        const timeParam = url.searchParams.get('TIME');
        if (timeParam) {
            // Parse ISO date and format nicely
            const date = new Date(timeParam);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'
            });
        }
    } catch {
        // Fall back to calculating 2 days ago if URL parsing fails
    }
    return null;
}

/**
 * Builds an ERDDAP data access page URL with pre-filled parameters matching the map.
 * This opens the ERDDAP griddap form with time/location pre-selected.
 */
function buildERDDAPDataAccessUrl(mapUrl: string, lat: number, lng: number): string {
    const ERDDAP_BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.graph';
    
    try {
        const url = new URL(mapUrl);
        const timeParam = url.searchParams.get('TIME') || '';
        const bbox = url.searchParams.get('BBOX')?.split(',') || [];
        
        // Calculate bounding box from map URL or use defaults
        let minLat = lat - 2;
        let maxLat = lat + 2;
        let minLon = lng - 2;
        let maxLon = lng + 2;
        
        if (bbox.length === 4) {
            minLat = parseFloat(bbox[0]);
            minLon = parseFloat(bbox[1]);
            maxLat = parseFloat(bbox[2]);
            maxLon = parseFloat(bbox[3]);
        }
        
        // Build ERDDAP graph page URL with constraints
        const params = new URLSearchParams({
            '.draw': 'surface',
            '.vars': 'longitude|latitude|analysed_sst',
            '.colorBar': '|||||',
            '.trim': '0',
            'time': timeParam.split('T')[0] || '',  // Just the date
            'latitude': `${minLat}|${maxLat}`,
            'longitude': `${minLon}|${maxLon}`,
        });
        
        return `${ERDDAP_BASE}?${params.toString()}`;
    } catch {
        // Fallback to basic griddap page
        return 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html';
    }
}

/**
 * Converts Celsius to Fahrenheit.
 */
function celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
}

interface EnvironmentalRiskFactorsProps {
    riskMapUrl: string | null | undefined;
    riskDataDetails: ERDDAPRiskData | null | undefined;
}

/**
 * Click-to-load map placeholder component.
 */
function MapPlaceholder({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading}
            className="w-full h-[300px] flex flex-col items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground hover:bg-muted/80 hover:border-primary/50 transition-colors cursor-pointer disabled:cursor-wait"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
                    <p className="text-sm font-medium">Loading SST Map...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                </>
            ) : (
                <>
                    <MapIcon className="h-10 w-10 mb-3 opacity-60" />
                    <p className="text-sm font-medium">Click to Load Risk Map</p>
                    <p className="text-xs text-muted-foreground mt-1">Sea Surface Temperature at time of report</p>
                </>
            )}
        </button>
    );
}

/**
 * SST data statistics display component.
 */
function SSTDataDisplay({ data }: { data: ERDDAPRiskData }) {
    const hasSSTValue = data.sst !== undefined && data.sst !== null;
    const fahrenheit = hasSSTValue ? celsiusToFahrenheit(data.sst!) : null;

    return (
        <div className="space-y-4">
            {/* Temperature Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-sm">Sea Surface Temperature</span>
                </div>
                {hasSSTValue ? (
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {data.sst!.toFixed(1)}°C
                        </span>
                        <span className="text-lg text-muted-foreground">
                            ({fahrenheit!.toFixed(1)}°F)
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Temperature data unavailable</span>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Captured: {format(new Date(data.capturedAt), 'PPp')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Waves className="h-4 w-4" />
                    <span>Location: {data.latitude.toFixed(4)}°, {data.longitude.toFixed(4)}°</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {data.source}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {data.datasetId}
                    </Badge>
                </div>
            </div>
        </div>
    );
}

/**
 * Main component for displaying environmental risk factors.
 */
export function EnvironmentalRiskFactors({ riskMapUrl, riskDataDetails }: EnvironmentalRiskFactorsProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [mapError, setMapError] = useState(false);

    // Don't render if no data available
    if (!riskMapUrl && !riskDataDetails) {
        return null;
    }

    const handleLoadMap = () => {
        setIsMapLoading(true);
        setIsMapLoaded(true);
    };

    const handleMapLoad = () => {
        setIsMapLoading(false);
    };

    const handleMapError = () => {
        setIsMapLoading(false);
        setMapError(true);
    };

    return (
        <Card className="mt-6">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Environmental Risk Factors at Time of Report</CardTitle>
                </div>
                <CardDescription>
                    Sea Surface Temperature (SST) data from NOAA CoastWatch ERDDAP
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: SST Map */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">SST Risk Map</h4>
                        {riskMapUrl ? (
                            <>
                                {!isMapLoaded ? (
                                    <MapPlaceholder onClick={handleLoadMap} isLoading={isMapLoading} />
                                ) : mapError ? (
                                    <div className="w-full h-[300px] flex flex-col items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                                        <p className="text-sm">Failed to load map</p>
                                        <p className="text-xs mt-1">ERDDAP service may be unavailable</p>
                                    </div>
                                ) : (
                                    <a
                                        href={riskDataDetails 
                                            ? buildERDDAPDataAccessUrl(riskMapUrl, riskDataDetails.latitude, riskDataDetails.longitude)
                                            : 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html'
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block relative group cursor-pointer"
                                        title="Click to explore this data on ERDDAP"
                                    >
                                        {isMapLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                        )}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={riskMapUrl}
                                            alt="Sea Surface Temperature map at incident location"
                                            className="w-full h-[300px] object-contain rounded-lg border shadow-sm bg-slate-100 dark:bg-slate-900 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                            onLoad={handleMapLoad}
                                            onError={handleMapError}
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium">
                                                <ExternalLink className="h-4 w-4" />
                                                Open in ERDDAP
                                            </div>
                                        </div>
                                    </a>
                                )}

                                {/* Map date and Legend */}
                                {isMapLoaded && !mapError && (
                                    <div className="space-y-2 pt-2">
                                        {/* Map data date */}
                                        {riskMapUrl && extractMapDateFromUrl(riskMapUrl) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>Map data from: {extractMapDateFromUrl(riskMapUrl)}</span>
                                            </div>
                                        )}
                                        {/* Color scale legend */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Temperature Scale:</span>
                                            <SSTColorScale />
                                            <span className="text-xs text-muted-foreground">5°C — 25°C</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-[200px] flex flex-col items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground">
                                <MapIcon className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No map URL available</p>
                            </div>
                        )}
                    </div>

                    {/* Right: SST Data */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Environmental Data</h4>
                        {riskDataDetails ? (
                            <SSTDataDisplay data={riskDataDetails} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] bg-muted/50 border border-dashed rounded-lg text-muted-foreground">
                                <Thermometer className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No environmental data captured</p>
                                <p className="text-xs mt-1">Data may still be loading</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Source Link */}
                <div className="mt-4 pt-4 border-t">
                    <a
                        href="https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Data Source: NOAA CoastWatch ERDDAP - MUR SST Analysis
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
