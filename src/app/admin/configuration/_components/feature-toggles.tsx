"use client";

/**
 * Feature Toggles Component
 * Provides toggle switches for system-wide feature flags.
 * Auto-saves changes to the database.
 */

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setSystemConfig, type BooleanConfigKey } from "../actions";
import { Bot, Mail, MessageSquare, Loader2, Building2 } from "lucide-react";

interface FeatureToggleProps {
    configKey: BooleanConfigKey;
    label: string;
    description: string;
    icon: React.ReactNode;
    initialValue: boolean;
}

function FeatureToggle({
    configKey,
    label,
    description,
    icon,
    initialValue,
}: FeatureToggleProps) {
    const [enabled, setEnabled] = useState(initialValue);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (newValue: boolean) => {
        // Optimistically update UI
        setEnabled(newValue);

        startTransition(async () => {
            const result = await setSystemConfig(configKey, newValue);

            if (!result.success) {
                // Revert on error
                setEnabled(!newValue);
                toast({
                    title: "Error",
                    description: result.error || "Failed to update setting",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: newValue ? "Enabled" : "Disabled",
                    description: `${label} has been ${newValue ? "enabled" : "disabled"}.`,
                });
            }
        });
    };

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-4">
                <div className="rounded-md bg-muted p-2">
                    {icon}
                </div>
                <div className="space-y-1">
                    <Label htmlFor={configKey} className="text-base font-medium">
                        {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                    id={configKey}
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={isPending}
                />
            </div>
        </div>
    );
}

interface FeatureTogglesProps {
    initialConfigs: Record<BooleanConfigKey, boolean>;
}

export function FeatureToggles({ initialConfigs }: FeatureTogglesProps) {
    return (
        <div className="space-y-4">
            <FeatureToggle
                configKey="ai_summary_enabled"
                label="AI Summary (Gemini)"
                description="Generate AI-powered incident summaries using Google Gemini when reports are submitted. When disabled, the AI Summary field will display 'Feature Disabled'."
                icon={<Bot className="h-5 w-5" />}
                initialValue={initialConfigs.ai_summary_enabled}
            />

            <FeatureToggle
                configKey="email_notifications_enabled"
                label="Email Notifications"
                description="Send email alerts to responder organizations when incidents are created or updated."
                icon={<Mail className="h-5 w-5" />}
                initialValue={initialConfigs.email_notifications_enabled}
            />

            <FeatureToggle
                configKey="sms_notifications_enabled"
                label="SMS Notifications"
                description="Send SMS text alerts to responder organizations when incidents are created or updated."
                icon={<MessageSquare className="h-5 w-5" />}
                initialValue={initialConfigs.sms_notifications_enabled}
            />

            <FeatureToggle
                configKey="show_responder_info"
                label="Show Responder Info on Report Form"
                description="Display the assigned responder organization's contact information on the /report page before submission. The confirmation page always shows limited responder info regardless of this setting."
                icon={<Building2 className="h-5 w-5" />}
                initialValue={initialConfigs.show_responder_info}
            />
        </div>
    );
}
