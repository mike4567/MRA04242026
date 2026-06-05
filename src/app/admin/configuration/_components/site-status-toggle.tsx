"use client";

/**
 * Site Status Toggle Component
 * Provides a segmented control for managing the public site status (Live, Coming Soon, Maintenance).
 * 
 * NIST SP 800-218 Compliance: Status changes are validated server-side before saving.
 */

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { setSiteStatus, type SiteStatus } from "../actions";
import { Globe, Clock, Wrench, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteStatusToggleProps {
    initialStatus: SiteStatus;
}

// Define the status options with their display properties
const STATUS_OPTIONS: {
    value: SiteStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description: string;
}[] = [
    {
        value: "live",
        label: "Live",
        icon: <Globe className="h-4 w-4" />,
        color: "text-green-600",
        bgColor: "bg-green-100 border-green-500",
        description: "Site is publicly accessible",
    },
    {
        value: "coming_soon",
        label: "Coming Soon",
        icon: <Clock className="h-4 w-4" />,
        color: "text-amber-600",
        bgColor: "bg-amber-100 border-amber-500",
        description: "Displays coming soon page",
    },
    {
        value: "maintenance",
        label: "Maintenance",
        icon: <Wrench className="h-4 w-4" />,
        color: "text-red-600",
        bgColor: "bg-red-100 border-red-500",
        description: "Displays maintenance page",
    },
];

export function SiteStatusToggle({ initialStatus }: SiteStatusToggleProps) {
    const [status, setStatus] = useState<SiteStatus>(initialStatus);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleStatusChange = (newStatus: SiteStatus) => {
        // Don't update if already selected or pending
        if (newStatus === status || isPending) {
            return;
        }

        // Optimistically update UI
        const previousStatus = status;
        setStatus(newStatus);

        startTransition(async () => {
            const result = await setSiteStatus(newStatus);

            if (!result.success) {
                // Revert on error
                setStatus(previousStatus);
                toast({
                    title: "Error",
                    description: result.error || "Failed to update site status",
                    variant: "destructive",
                });
            } else {
                const option = STATUS_OPTIONS.find((o) => o.value === newStatus);
                toast({
                    title: "Site Status Updated",
                    description: `Site is now set to "${option?.label || newStatus}".`,
                });
            }
        });
    };

    const currentOption = STATUS_OPTIONS.find((o) => o.value === status);

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <h3 className="text-base font-medium">Public Site Status</h3>
                    <p className="text-sm text-muted-foreground">
                        Control the public-facing state of the application
                    </p>
                </div>
                {isPending && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Segmented Toggle Control */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                {STATUS_OPTIONS.map((option) => {
                    const isSelected = status === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleStatusChange(option.value)}
                            disabled={isPending}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                                isSelected
                                    ? cn("bg-background shadow-sm border-2", option.bgColor, option.color)
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                                isPending && "cursor-not-allowed opacity-60"
                            )}
                            aria-pressed={isSelected}
                            aria-label={`Set site status to ${option.label}`}
                        >
                            {option.icon}
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Current Status Description */}
            {currentOption && (
                <div className={cn("mt-3 text-sm", currentOption.color)}>
                    <span className="font-medium">Current:</span> {currentOption.description}
                </div>
            )}
        </div>
    );
}
