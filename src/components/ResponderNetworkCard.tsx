"use client";

/**
 * ResponderNetworkCard - Reusable component for displaying responder contact information.
 * 
 * Used in the incident report form (Section 5: Responder Identification) and the
 * confirmation page to show the assigned responder's contact details.
 * 
 * NIST SSDF Compliance: PW.1.1 - Produces well-documented software with clear interfaces.
 */

import type { SpecificResponderInfo } from "@/app/actions";
import { Building, Phone, Globe, MapPin, MessageSquare, Mail, Loader2 } from "lucide-react";

interface ResponderNetworkCardProps {
    // The responder information to display, or null if no responder found
    responder: SpecificResponderInfo | null;
    // Whether the card is in a loading state
    isLoading?: boolean;
    // Whether to show the section title header (defaults to true)
    showTitle?: boolean;
    // Custom class names for the container
    className?: string;
}

/**
 * Displays a responder organization's contact information in a mobile-friendly card layout.
 * Handles loading, error, and success states for responder lookup results.
 */
export function ResponderNetworkCard({
    responder,
    isLoading = false,
    showTitle = true,
    className = "",
}: ResponderNetworkCardProps) {
    // Loading state - show spinner while fetching responder data
    if (isLoading) {
        return (
            <div className={`space-y-4 ${className}`}>
                {showTitle && (
                    <h3 className="text-lg font-semibold">5. Responder Identification</h3>
                )}
                <div className="rounded-lg border bg-secondary/50 p-6">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Locating assigned responder...</span>
                    </div>
                </div>
            </div>
        );
    }

    // No responder found or error state - show fallback message
    if (!responder) {
        return (
            <div className={`space-y-4 ${className}`}>
                {showTitle && (
                    <h3 className="text-lg font-semibold">5. Responder Identification</h3>
                )}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                    <p className="text-amber-800">
                        No specific responder found for this region. Your report will be routed to the NOAA national hotline.
                    </p>
                </div>
            </div>
        );
    }

    // Success state - display responder contact information
    return (
        <div className={`space-y-4 ${className}`}>
            {showTitle && (
                <h3 className="text-lg font-semibold">5. Responder Identification</h3>
            )}
            <div className="rounded-lg border bg-secondary/50 p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Based on the location and animal status provided, this report will be routed to:
                </p>

                {/* Organization Name */}
                {responder.org && (
                    <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-lg">{responder.org}</p>
                        </div>
                    </div>
                )}

                {/* Hotline Phone */}
                {responder.hotline && (
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <a
                            href={`tel:${responder.hotline.replace(/[^\d+]/g, "")}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {responder.hotline}
                        </a>
                    </div>
                )}

                {/* Website */}
                {responder.website && (
                    <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                        <a
                            href={responder.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                        >
                            {responder.website}
                        </a>
                    </div>
                )}

                {/* Physical Address */}
                {responder.address && (
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{responder.address}</p>
                    </div>
                )}

                {/* SMS Numbers */}
                {responder.sms_numbers && responder.sms_numbers.length > 0 && (
                    <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">SMS Numbers:</p>
                            <p className="text-sm text-muted-foreground">
                                {responder.sms_numbers.join(", ")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Email Addresses */}
                {responder.emails && responder.emails.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Email:</p>
                            <div className="flex flex-col gap-1">
                                {responder.emails.map((email, index) => (
                                    <a
                                        key={index}
                                        href={`mailto:${email}`}
                                        className="text-sm text-primary hover:underline break-all"
                                    >
                                        {email}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
