/**
 * Homepage Server Component
 * Routes users to appropriate content based on site status (live, coming_soon, maintenance).
 * Implements tester bypass via cookie for authorized testing access.
 * 
 * NIST SP 800-218 Compliance: Tester cookie is httpOnly and secure in production.
 */

import { cookies } from "next/headers";
import { getSiteStatus } from "@/app/admin/configuration/actions";
import { getComingSoonContent, getMaintenanceContent } from "@/app/actions/site-content";
import { HomeContent } from "@/components/HomeContent";
import { ComingSoon } from "@/components/ComingSoon";
import { Maintenance } from "@/components/Maintenance";

interface HomePageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
    // Await searchParams (Next.js 15+ async params)
    const params = await searchParams;
    
    // Get cookie store
    const cookieStore = await cookies();
    
    // Check for tester parameter and set cookie if present
    if (params?.tester === "true") {
        // Set the tester bypass cookie
        cookieStore.set("mra_tester", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });
    }
    
    // Check if user has tester bypass cookie
    const testerCookie = cookieStore.get("mra_tester");
    const hasTesterBypass = testerCookie?.value === "true";
    
    // If tester bypass is active, always show live content
    if (hasTesterBypass) {
        return <HomeContent />;
    }
    
    // Fetch site status from database
    const siteStatus = await getSiteStatus();
    
    // Route based on site status
    switch (siteStatus) {
        case "live":
            return <HomeContent />;
        
        case "coming_soon":
            const comingSoonContent = await getComingSoonContent();
            return <ComingSoon content={comingSoonContent} />;
        
        case "maintenance":
            const maintenanceContent = await getMaintenanceContent();
            return <Maintenance content={maintenanceContent} />;
        
        default:
            // Fallback to coming soon for unknown states
            const fallbackContent = await getComingSoonContent();
            return <ComingSoon content={fallbackContent} />;
    }
}
