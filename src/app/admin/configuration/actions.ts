"use server";

/**
 * Server actions for system configuration management.
 * These actions manage feature flags stored in the system_config table.
 * 
 * NIST SP 800-218 Compliance: All config changes are validated server-side.
 */

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Define valid configuration keys to prevent injection
const VALID_CONFIG_KEYS = [
    "ai_summary_enabled",
    "email_notifications_enabled",
    "sms_notifications_enabled",
    "show_responder_info",
    "site_status",
] as const;

export type ConfigKey = (typeof VALID_CONFIG_KEYS)[number];

// Site status type for launch toggle
export type SiteStatus = "live" | "coming_soon" | "maintenance";
const VALID_SITE_STATUSES: SiteStatus[] = ["live", "coming_soon", "maintenance"];

/**
 * Get a single system configuration value by key.
 * Returns true if the key doesn't exist (default enabled).
 */
export async function getSystemConfig(key: ConfigKey): Promise<boolean> {
    // Validate key to prevent SQL injection via key manipulation
    if (!VALID_CONFIG_KEYS.includes(key)) {
        console.error(`Invalid config key requested: ${key}`);
        return true; // Default to enabled for unknown keys
    }

    try {
        const result = await query(
            "SELECT value FROM system_config WHERE key = $1",
            [key]
        );

        if (result.rows.length === 0) {
            // Key doesn't exist, return default (true = enabled)
            return true;
        }

        // JSONB value is stored as 'true' or 'false' string, or boolean
        const value = result.rows[0].value;
        
        if (typeof value === "boolean") {
            return value;
        }
        
        if (typeof value === "string") {
            return value === "true";
        }

        // For JSONB, PostgreSQL returns the actual type
        return Boolean(value);
    } catch (error) {
        console.error(`Error fetching config for ${key}:`, error);
        return true; // Default to enabled on error
    }
}

// Type for boolean-only config keys (excludes site_status)
export type BooleanConfigKey = Exclude<ConfigKey, "site_status">;

/**
 * Get all system configuration values (boolean configs only).
 * Returns an object with all boolean config keys and their values.
 */
export async function getAllSystemConfigs(): Promise<Record<BooleanConfigKey, boolean>> {
    const configs: Record<BooleanConfigKey, boolean> = {
        ai_summary_enabled: true,
        email_notifications_enabled: true,
        sms_notifications_enabled: true,
        show_responder_info: true,
    };

    // Only query boolean config keys
    const booleanKeys = ["ai_summary_enabled", "email_notifications_enabled", "sms_notifications_enabled", "show_responder_info"];
    
    try {
        const result = await query(
            "SELECT key, value FROM system_config WHERE key = ANY($1)",
            [booleanKeys]
        );

        for (const row of result.rows) {
            const key = row.key as BooleanConfigKey;
            const value = row.value;

            if (typeof value === "boolean") {
                configs[key] = value;
            } else if (typeof value === "string") {
                configs[key] = value === "true";
            } else {
                configs[key] = Boolean(value);
            }
        }
    } catch (error) {
        console.error("Error fetching all configs:", error);
        // Return defaults on error
    }

    return configs;
}

/**
 * Get the current site status for launch toggle.
 * Returns 'coming_soon' as default if not set.
 */
export async function getSiteStatus(): Promise<SiteStatus> {
    try {
        const result = await query(
            "SELECT value FROM system_config WHERE key = $1",
            ["site_status"]
        );

        if (result.rows.length === 0) {
            // Key doesn't exist, return default
            return "coming_soon";
        }

        // JSONB stores strings with quotes, extract the actual value
        let value = result.rows[0].value;
        
        // Handle JSONB string values (may be stored as "\"coming_soon\"")
        if (typeof value === "string") {
            // Remove extra quotes if present
            value = value.replace(/^"|"$/g, "");
        }

        // Validate the status value
        if (VALID_SITE_STATUSES.includes(value as SiteStatus)) {
            return value as SiteStatus;
        }

        console.warn(`Invalid site_status value in database: ${value}, defaulting to coming_soon`);
        return "coming_soon";
    } catch (error) {
        console.error("Error fetching site_status:", error);
        return "coming_soon"; // Default on error
    }
}

/**
 * Set the site status for launch toggle.
 * Validates the status before saving.
 */
export async function setSiteStatus(
    status: SiteStatus
): Promise<{ success: boolean; error?: string }> {
    // Validate status value
    if (!VALID_SITE_STATUSES.includes(status)) {
        return { success: false, error: `Invalid site status: ${status}` };
    }

    try {
        await query(
            `INSERT INTO system_config (key, value) 
             VALUES ($1, $2::jsonb) 
             ON CONFLICT (key) DO UPDATE SET value = $2::jsonb`,
            ["site_status", JSON.stringify(status)]
        );

        // Revalidate relevant pages
        revalidatePath("/admin/configuration");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Error setting site_status:", error);
        return { success: false, error: "Failed to save site status" };
    }
}

/**
 * Set a system configuration value.
 * Uses UPSERT to create or update the value.
 */
export async function setSystemConfig(
    key: ConfigKey,
    value: boolean
): Promise<{ success: boolean; error?: string }> {
    // Validate key
    if (!VALID_CONFIG_KEYS.includes(key)) {
        return { success: false, error: `Invalid config key: ${key}` };
    }

    try {
        await query(
            `INSERT INTO system_config (key, value) 
             VALUES ($1, $2::jsonb) 
             ON CONFLICT (key) DO UPDATE SET value = $2::jsonb`,
            [key, JSON.stringify(value)]
        );

        // Revalidate the configuration page
        revalidatePath("/admin/configuration");

        return { success: true };
    } catch (error) {
        console.error(`Error setting config ${key}:`, error);
        return { success: false, error: "Failed to save configuration" };
    }
}

/**
 * Toggle a system configuration value (flip true/false).
 */
export async function toggleSystemConfig(
    key: ConfigKey
): Promise<{ success: boolean; newValue?: boolean; error?: string }> {
    const currentValue = await getSystemConfig(key);
    const newValue = !currentValue;

    const result = await setSystemConfig(key, newValue);

    if (result.success) {
        return { success: true, newValue };
    }

    return { success: false, error: result.error };
}
