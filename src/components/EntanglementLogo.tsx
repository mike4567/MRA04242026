import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * NOAA Fisheries Logo Component
 * 
 * Displays the official NOAA Fisheries logo from the PNG image file.
 * The image includes the NOAA emblem with seagull/wave motif and
 * the "NOAA FISHERIES" text branding.
 * 
 * This component implements the official NOAA Fisheries visual identity
 * as required for federal government websites under DOC branding guidelines.
 * 
 * NIST SSDF Compliance: PW (Produce Well-Secured Software) - Implements
 * official federal agency branding for proper site identification.
 */
export function EntanglementLogo({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center", className)} {...props}>
            {/* Official NOAA Fisheries logo image */}
            <Image
                src="/NOAAFisheriesLogo.png"
                alt="NOAA Fisheries Logo"
                width={200}
                height={56}
                priority
                className="h-14 w-auto"
            />
        </div>
    );
}
