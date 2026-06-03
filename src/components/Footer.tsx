"use client";

/**
 * Footer.tsx - Official NOAA Fisheries Footer Component
 * 
 * PURPOSE: Provides a comprehensive, accessible footer matching the official
 * NOAA Fisheries design system. The footer serves as the primary navigation
 * anchor and legal compliance area for the application.
 * 
 * STRUCTURE:
 * - Section A: Newsletter signup + social media icons (light gray bg)
 * - Section B: Main navigation grid with 5 columns (NOAA blue bg)
 * - Section C: Bottom utility links and legal notices (NOAA blue bg)
 * 
 * COMPLIANCE: NAO 201-118 requires federal branding consistency.
 * All external links open in new tabs with proper security attributes.
 * 
 * NIST SSDF: PW.1.1 - Follows secure coding practices for external links
 */

import Image from "next/image";

// =============================================================================
// DATA CONSTANTS
// =============================================================================

/**
 * Social media platform links for NOAA Fisheries official accounts.
 * Each entry includes accessible name, destination URL, and icon path.
 * Icons are served from /public/icons/ for optimal static delivery.
 */
const socialLinks = [
    {
        name: "Facebook",
        href: "https://www.facebook.com/NOAAFisheries",
        icon: "/icons/Facebook.jpg",
    },
    {
        name: "Instagram",
        href: "https://www.instagram.com/noaafisheries/",
        icon: "/icons/Instagram.jpg",
    },
    {
        name: "YouTube",
        href: "https://www.youtube.com/usnoaafisheriesgov",
        icon: "/icons/Youtube.jpg",
    },
    {
        name: "X (Twitter)",
        href: "https://x.com/NOAAFisheries",
        icon: "/icons/x_twitter.jpg",
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/company/noaa-fisheries",
        icon: "/icons/Linkedin.jpg",
    },
    {
        name: "Bluesky",
        href: "https://bsky.app/profile/Fisheries.noaa.gov",
        icon: "/icons/Bluesky.jpg",
    },
];

/**
 * Main footer navigation organized by topical columns.
 * This structure mirrors the official NOAA Fisheries website footer.
 * Links are external and open the authoritative NOAA pages.
 */
const footerColumns = [
    {
        title: "NOAA FISHERIES",
        links: [
            { label: "About Us", href: "https://www.fisheries.noaa.gov/about" },
            { label: "Laws & Policies", href: "https://www.fisheries.noaa.gov/topic/laws-policies" },
            { label: "FishWatch", href: "https://www.fishwatch.gov/" },
            { label: "Site Index", href: "https://www.fisheries.noaa.gov/site-index" },
        ],
    },
    {
        title: "FOR FISHERMEN",
        links: [
            { label: "Rules & Regulations", href: "https://www.fisheries.noaa.gov/rules-and-regulations" },
            { label: "Permits & Forms", href: "https://www.fisheries.noaa.gov/permits-and-forms" },
            { label: "Commercial Fishing", href: "https://www.fisheries.noaa.gov/topic/commercial-fishing" },
            { label: "Recreational Fishing", href: "https://www.fisheries.noaa.gov/topic/resources-fishing/recreational-fishing" },
            { label: "Fishery Observers", href: "https://www.fisheries.noaa.gov/topic/fishery-observers" },
        ],
    },
    {
        title: "FOR RESEARCHERS",
        links: [
            { label: "Published Research", href: "https://www.fisheries.noaa.gov/resources/peer-reviewed-research" },
            { label: "Science & Data", href: "https://www.fisheries.noaa.gov/science-and-data" },
        ],
    },
    {
        title: "CONTACT US",
        links: [
            { label: "Contact Us", href: "https://www.fisheries.noaa.gov/contact-us" },
            { label: "Media Inquiries", href: "https://www.fisheries.noaa.gov/contact-directory/media-directory" },
            { label: "Report a Violation", href: "https://www.fisheries.noaa.gov/national/enforcement/report-violation" },
            { label: "Report a Stranded or Injured Marine Animal", href: "https://www.fisheries.noaa.gov/report" },
            { label: "NOAA Staff Directory", href: "https://nsd.rdc.noaa.gov/" },
        ],
    },
];

/**
 * Bottom utility links - Row 1: Legal and policy compliance links
 * Required by federal web standards for government websites.
 */
const utilityLinksRow1 = [
    { label: "Accessibility", href: "https://www.fisheries.noaa.gov/national/about-us/accessibility-statement" },
    { label: "EEO", href: "https://www.fisheries.noaa.gov/about/office-equal-employment-opportunity" },
    { label: "FOIA", href: "https://www.noaa.gov/foia" },
    { label: "Information Quality", href: "https://www.noaa.gov/information-quality" },
    { label: "Policies & Disclaimer", href: "https://www.fisheries.noaa.gov/website-policies-and-disclaimers" },
    { label: "Privacy Policy", href: "https://www.fisheries.noaa.gov/privacy-policy" },
    { label: "USA.gov", href: "https://www.usa.gov/" },
];

/**
 * Bottom utility links - Row 2: Agency ownership/parent organization links
 * Provides chain-of-command navigation to parent agencies.
 */
const utilityLinksRow2 = [
    { label: "Department of Commerce", href: "https://www.commerce.gov/" },
    { label: "National Oceanic and Atmospheric Administration", href: "https://www.noaa.gov/" },
    { label: "NOAA Fisheries", href: "https://www.fisheries.noaa.gov/" },
];

// =============================================================================
// COMPONENT DEFINITION
// =============================================================================

interface FooterProps {
    /** Optional CSS class names to apply to the footer element */
    className?: string;
}

/**
 * Footer - Main NOAA Fisheries footer component
 * 
 * Renders a responsive, accessible footer with three main sections:
 * 1. Newsletter/Social bar for audience engagement
 * 2. Main navigation grid for quick access to key resources
 * 3. Utility links for legal compliance and parent organization navigation
 * 
 * @param className - Optional additional CSS classes (e.g., "print:hidden")
 */
export function Footer({ className = "" }: FooterProps) {
    return (
        <footer
            className={`w-full ${className}`}
            role="contentinfo"
            aria-label="NOAA Fisheries footer"
        >
            {/* ================================================================
                SECTION A: Newsletter Signup & Social Media Bar
                Light gray background, horizontal layout with flex
            ================================================================ */}
            <div className="bg-gray-100 border-t border-gray-200">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Newsletter signup link with envelope icon */}
                    <a
                        href="https://public.govdelivery.com/accounts/USNOAAFISHERIES/subscriber/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-[#0071bc] hover:text-[#205493] transition-colors group"
                        aria-label="Sign up for NOAA Fisheries newsletters"
                    >
                        {/* Circular envelope icon container */}
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0071bc] group-hover:bg-[#205493] transition-colors">
                            <Image
                                src="/icons/mail.jpg"
                                alt=""
                                width={24}
                                height={24}
                                className="rounded-full"
                                aria-hidden="true"
                            />
                        </span>
                        <span className="font-medium">Sign up for our newsletters</span>
                    </a>

                    {/* Social media icon row */}
                    <div
                        className="flex items-center gap-3"
                        role="navigation"
                        aria-label="NOAA Fisheries social media links"
                    >
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#0071bc] focus:ring-offset-2 rounded"
                                aria-label={`Follow NOAA Fisheries on ${social.name}`}
                            >
                                <Image
                                    src={social.icon}
                                    alt={social.name}
                                    width={32}
                                    height={32}
                                    className="rounded"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================================================================
                SECTION B: Main Navigation Grid
                NOAA Blue background, 5-column responsive grid
            ================================================================ */}
            <div className="bg-[#003882]">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* Render navigation columns with chevron-prefixed links */}
                        {footerColumns.map((column) => (
                            <div key={column.title}>
                                <h3 className="text-white font-bold text-sm mb-4 tracking-wide">
                                    {column.title}
                                </h3>
                                <ul className="space-y-2">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-white/90 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#003882] rounded"
                                            >
                                                {/* Chevron icon prefix for visual hierarchy */}
                                                <Image
                                                    src="/icons/ChevronRight.jpg"
                                                    alt=""
                                                    width={12}
                                                    height={12}
                                                    className="flex-shrink-0"
                                                    aria-hidden="true"
                                                />
                                                <span>{link.label}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Column 5: Send Feedback button (call-to-action) */}
                        <div className="flex items-start">
                            <a
                                href="https://forms.gle/CJzfD4XjZ28A23iV8"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-white text-[#003882] font-semibold px-6 py-3 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#003882]"
                                aria-label="Send feedback to NOAA Fisheries"
                            >
                                Send Feedback
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================================
                SECTION C: Bottom Utility & Legal Links
                Same NOAA Blue with top border separator
            ================================================================ */}
            <div className="bg-[#003882] border-t border-white/30">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                        {/* Left side: NOAA logo (links to noaa.gov) and tagline */}
                        <div className="flex items-center gap-4">
                            <a
                                href="https://www.noaa.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Visit NOAA website"
                            >
                                <Image
                                    src="/NOAAFisheriesLogo.png"
                                    alt="NOAA Fisheries Logo"
                                    width={80}
                                    height={80}
                                    className="flex-shrink-0"
                                />
                            </a>
                            <p className="text-white italic text-sm">
                                Science. Service. Stewardship.
                            </p>
                        </div>

                        {/* Right side: Utility link rows with pipe separators */}
                        <div className="flex flex-col items-center md:items-end gap-2">
                            {/* Row 1: Parent organization links */}
                            <nav
                                className="flex flex-wrap items-center justify-center md:justify-end gap-x-1 gap-y-1"
                                aria-label="NOAA parent organization links"
                            >
                                {utilityLinksRow1.map((link, index) => (
                                    <span key={link.label} className="flex items-center">
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/90 hover:text-white text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-white rounded"
                                        >
                                            {link.label}
                                        </a>
                                        {/* Pipe separator between links (not after last) */}
                                        {index < utilityLinksRow1.length - 1 && (
                                            <span className="text-white/50 mx-2" aria-hidden="true">|</span>
                                        )}
                                    </span>
                                ))}
                            </nav>

                            {/* Row 2: Legal compliance links */}
                            <nav
                                className="flex flex-wrap items-center justify-center md:justify-end gap-x-1 gap-y-1"
                                aria-label="Legal and policy links"
                            >
                                {utilityLinksRow2.map((link, index) => (
                                    <span key={link.label} className="flex items-center">
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/90 hover:text-white text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-white rounded"
                                        >
                                            {link.label}
                                        </a>
                                        {index < utilityLinksRow2.length - 1 && (
                                            <span className="text-white/50 mx-2" aria-hidden="true">|</span>
                                        )}
                                    </span>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
