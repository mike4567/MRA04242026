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
] as const;

export type ConfigKey = (typeof VALID_CONFIG_KEYS)[number];

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

/**
 * Get all system configuration values.
 * Returns an object with all config keys and their boolean values.
 */
export async function getAllSystemConfigs(): Promise<Record<ConfigKey, boolean>> {
    const configs: Record<ConfigKey, boolean> = {
        ai_summary_enabled: true,
        email_notifications_enabled: true,
        sms_notifications_enabled: true,
    };

    try {
        const result = await query(
            "SELECT key, value FROM system_config WHERE key = ANY($1)",
            [VALID_CONFIG_KEYS]
        );

        for (const row of result.rows) {
            const key = row.key as ConfigKey;
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
