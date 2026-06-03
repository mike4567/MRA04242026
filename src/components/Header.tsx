/**
 * Header Component
 * 
 * Main site header for the NOAA Fisheries Marine Mammal Report & Rescue Application.
 * Implements the official NOAA Fisheries header design including:
 * 
 * 1. Government Banner - "Official website of the United States government" with
 *    expandable "Here's how you know" section explaining .gov and HTTPS security
 * 2. NOAA Fisheries Logo - Official emblem and branding
 * 3. Site Navigation - Links to view incidents and report new incidents
 * 
 * NIST SSDF Compliance: PW (Produce Well-Secured Software) - Implements federal
 * web design standards for government site identification and navigation.
 */

import Link from "next/link";
import { EntanglementLogo } from "./EntanglementLogo";
import { GovBanner } from "./GovBanner";
import { Button } from "./ui/button";
import { List, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * External URL for the official NOAA Fisheries website.
 * Logo clicks navigate users to this federal agency homepage.
 */
const NOAA_FISHERIES_URL = "https://fisheries.noaa.gov";

export function Header({ className }: { className?: string }) {
    return (
        <header className={cn("border-b bg-card", className)}>
            {/* Government Banner - Required for federal websites */}
            <GovBanner />
            
            {/* Main header content with logo and navigation */}
            <div className="container mx-auto flex h-20 items-center justify-between px-4">
                {/* NOAA Fisheries Logo - Links to official NOAA Fisheries website */}
                <a 
                    href={NOAA_FISHERIES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                    <EntanglementLogo />
                </a>
                
                {/* Primary Navigation */}
                <nav className="flex items-center gap-2">
                    <Button asChild variant="ghost">
                        <Link href="/incidents">
                            <List className="mr-2 h-4 w-4" />
                            View Incidents
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/report">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Report an Incident
                        </Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
