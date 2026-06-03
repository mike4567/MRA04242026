"use client";

/**
 * GovBanner Component
 * 
 * Implements the official U.S. Government website banner as required by federal
 * web design standards. This banner identifies the site as an official government
 * website and provides users with information about .gov domains and HTTPS security.
 * 
 * The "Here's how you know" link reveals expandable content explaining:
 * 1. Official .gov websites belong to government organizations
 * 2. Secure .gov websites use HTTPS for safe connections
 * 
 * NIST SSDF Compliance: PW (Produce Well-Secured Software) - Implements federal
 * UI standards for government website identification and security awareness.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function GovBanner() {
    // State to track whether the expanded info panel is visible
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-[#f0f0f0] text-[#1b1b1b]">
            {/* Main banner row with flag, text, and toggle link */}
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-2 py-1 text-xs">
                    {/* US Flag Icon - inline SVG for federal compliance */}
                    <USFlagIcon className="h-3 w-auto flex-shrink-0" />
                    
                    <span className="font-normal">
                        An official website of the United States government
                    </span>
                    
                    {/* Toggle button for expanded information */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-[#005ea2] hover:text-[#1a4480] underline focus:outline-none focus:ring-2 focus:ring-[#005ea2] focus:ring-offset-1 rounded"
                        aria-expanded={isExpanded}
                        aria-controls="gov-banner-info"
                    >
                        Here&apos;s how you know
                        {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                    </button>
                </div>
            </div>

            {/* Expandable information panel */}
            {isExpanded && (
                <div 
                    id="gov-banner-info"
                    className="border-t border-[#dfe1e2] bg-[#f0f0f0]"
                >
                    <div className="container mx-auto px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Official .gov website info */}
                            <div className="flex gap-3">
                                {/* Globe/Dot Gov Icon */}
                                <DotGovIcon className="h-10 w-10 flex-shrink-0 text-[#005ea2]" />
                                <div>
                                    <p className="font-bold text-sm">
                                        Official websites use .gov
                                    </p>
                                    <p className="text-sm mt-1">
                                        A <strong>.gov</strong> website belongs to an official government organization in the United States.
                                    </p>
                                </div>
                            </div>

                            {/* HTTPS security info */}
                            <div className="flex gap-3">
                                {/* Lock/HTTPS Icon */}
                                <HttpsIcon className="h-10 w-10 flex-shrink-0 text-[#538200]" />
                                <div>
                                    <p className="font-bold text-sm">
                                        Secure .gov websites use HTTPS
                                    </p>
                                    <p className="text-sm mt-1">
                                        A <strong>lock</strong> (
                                        <LockInlineIcon className="inline h-3 w-3" />
                                        ) or <strong>https://</strong> means you&apos;ve safely connected to the .gov website. Share sensitive information only on official, secure websites.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * US Flag Icon Component
 * SVG representation of the United States flag for the government banner.
 */
function USFlagIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 18"
            aria-hidden="true"
            focusable="false"
            role="img"
        >
            {/* Stripes */}
            <rect fill="#bf0a30" width="24" height="18" />
            <rect fill="#fff" y="1.38" width="24" height="1.38" />
            <rect fill="#fff" y="4.15" width="24" height="1.38" />
            <rect fill="#fff" y="6.92" width="24" height="1.38" />
            <rect fill="#fff" y="9.69" width="24" height="1.38" />
            <rect fill="#fff" y="12.46" width="24" height="1.38" />
            <rect fill="#fff" y="15.23" width="24" height="1.38" />
            {/* Blue canton */}
            <rect fill="#002868" width="9.6" height="9.69" />
            {/* Stars (simplified representation) */}
            <g fill="#fff">
                <circle cx="1.2" cy="1.2" r="0.4" />
                <circle cx="2.4" cy="1.2" r="0.4" />
                <circle cx="3.6" cy="1.2" r="0.4" />
                <circle cx="4.8" cy="1.2" r="0.4" />
                <circle cx="6.0" cy="1.2" r="0.4" />
                <circle cx="7.2" cy="1.2" r="0.4" />
                <circle cx="1.8" cy="2.1" r="0.4" />
                <circle cx="3.0" cy="2.1" r="0.4" />
                <circle cx="4.2" cy="2.1" r="0.4" />
                <circle cx="5.4" cy="2.1" r="0.4" />
                <circle cx="6.6" cy="2.1" r="0.4" />
                <circle cx="1.2" cy="3.0" r="0.4" />
                <circle cx="2.4" cy="3.0" r="0.4" />
                <circle cx="3.6" cy="3.0" r="0.4" />
                <circle cx="4.8" cy="3.0" r="0.4" />
                <circle cx="6.0" cy="3.0" r="0.4" />
                <circle cx="7.2" cy="3.0" r="0.4" />
                <circle cx="1.8" cy="3.9" r="0.4" />
                <circle cx="3.0" cy="3.9" r="0.4" />
                <circle cx="4.2" cy="3.9" r="0.4" />
                <circle cx="5.4" cy="3.9" r="0.4" />
                <circle cx="6.6" cy="3.9" r="0.4" />
                <circle cx="1.2" cy="4.8" r="0.4" />
                <circle cx="2.4" cy="4.8" r="0.4" />
                <circle cx="3.6" cy="4.8" r="0.4" />
                <circle cx="4.8" cy="4.8" r="0.4" />
                <circle cx="6.0" cy="4.8" r="0.4" />
                <circle cx="7.2" cy="4.8" r="0.4" />
                <circle cx="1.8" cy="5.7" r="0.4" />
                <circle cx="3.0" cy="5.7" r="0.4" />
                <circle cx="4.2" cy="5.7" r="0.4" />
                <circle cx="5.4" cy="5.7" r="0.4" />
                <circle cx="6.6" cy="5.7" r="0.4" />
                <circle cx="1.2" cy="6.6" r="0.4" />
                <circle cx="2.4" cy="6.6" r="0.4" />
                <circle cx="3.6" cy="6.6" r="0.4" />
                <circle cx="4.8" cy="6.6" r="0.4" />
                <circle cx="6.0" cy="6.6" r="0.4" />
                <circle cx="7.2" cy="6.6" r="0.4" />
                <circle cx="1.8" cy="7.5" r="0.4" />
                <circle cx="3.0" cy="7.5" r="0.4" />
                <circle cx="4.2" cy="7.5" r="0.4" />
                <circle cx="5.4" cy="7.5" r="0.4" />
                <circle cx="6.6" cy="7.5" r="0.4" />
                <circle cx="1.2" cy="8.4" r="0.4" />
                <circle cx="2.4" cy="8.4" r="0.4" />
                <circle cx="3.6" cy="8.4" r="0.4" />
                <circle cx="4.8" cy="8.4" r="0.4" />
                <circle cx="6.0" cy="8.4" r="0.4" />
                <circle cx="7.2" cy="8.4" r="0.4" />
            </g>
        </svg>
    );
}

/**
 * Dot Gov Icon Component
 * Globe icon representing official .gov domain websites.
 */
function DotGovIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            aria-hidden="true"
            focusable="false"
            role="img"
        >
            <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="32" cy="32" rx="12" ry="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="32" x2="62" y2="32" stroke="currentColor" strokeWidth="2" />
            <line x1="32" y1="2" x2="32" y2="62" stroke="currentColor" strokeWidth="2" />
            <path d="M6 20 Q32 15 58 20" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M6 44 Q32 49 58 44" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

/**
 * HTTPS Icon Component
 * Lock icon representing secure HTTPS connections.
 */
function HttpsIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            aria-hidden="true"
            focusable="false"
            role="img"
        >
            {/* Lock body */}
            <rect x="12" y="28" width="40" height="32" rx="4" fill="currentColor" />
            {/* Lock shackle */}
            <path
                d="M20 28V20C20 13.4 25.4 8 32 8C38.6 8 44 13.4 44 20V28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
            {/* Keyhole */}
            <circle cx="32" cy="42" r="4" fill="#f0f0f0" />
            <rect x="30" y="42" width="4" height="8" fill="#f0f0f0" />
        </svg>
    );
}

/**
 * Lock Inline Icon Component
 * Small lock icon for inline text use.
 */
function LockInlineIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            role="img"
        >
            <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1zm2 5H6V4.5a2 2 0 1 1 4 0V6z" />
        </svg>
    );
}
