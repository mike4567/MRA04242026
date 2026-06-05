"use client";

/**
 * Coming Soon Component
 * Displays a full-screen "Coming Soon" page when the site is not yet live.
 * Features background image with semi-transparent overlay and admin access.
 * 
 * Content is loaded dynamically from icons/NOAA_Coming_Soon.md
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { NoticeModal } from "@/components/NoticeModal";
import type { StatusPageContent } from "@/app/actions/site-content";

interface ComingSoonProps {
    content: StatusPageContent;
}

export function ComingSoon({ content }: ComingSoonProps) {
    const [isNoticeOpen, setIsNoticeOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasAcknowledged = sessionStorage.getItem("noticeAcknowledged");
            if (hasAcknowledged !== "true") {
                setIsNoticeOpen(true);
            }
        }
    }, []);

    const handleAcknowledge = () => {
        sessionStorage.setItem("noticeAcknowledged", "true");
        setIsNoticeOpen(false);
    };

    return (
        <>
            <NoticeModal isOpen={isNoticeOpen} onAcknowledge={handleAcknowledge} />
            
            <div className="fixed inset-0 w-full h-full overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/icons/MRAResponderSm.png')",
                    }}
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-gray-800/75 backdrop-blur-sm rounded-lg p-8 md:p-12 text-center text-white shadow-2xl">
                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-wide">
                            <span className="border-b-4 border-white pb-2">
                                {content.title}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl font-semibold italic mb-6">
                            {content.subtitle}
                        </p>

                        {/* Description */}
                        <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed">
                            {content.description}
                        </p>

                        {/* Emergency Contact */}
                        <p className="text-base md:text-lg font-medium">
                            <span className="text-white">For </span>
                            <span className="font-bold">Immediate Marine Mammal Strandings or Emergencies</span>
                            <span className="text-white">, please contact the </span>
                            <span className="font-bold">West Coast Regional Stranding Network</span>
                            <span className="text-white"> at </span>
                            <span className="font-bold">1-866-767-6114</span>
                            <span className="text-white">.</span>
                        </p>
                    </div>
                </div>

                {/* Admin Access - Settings Gear Icon */}
                <div className="fixed bottom-4 right-4 z-50">
                    <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Link href="/login">
                            <Settings className="h-6 w-6" />
                            <span className="sr-only">Admin Login</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}
