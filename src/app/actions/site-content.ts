"use server";

/**
 * Server actions for reading site content from markdown files.
 * These actions provide dynamic content for Coming Soon and Maintenance pages.
 * 
 * NIST SP 800-218 Compliance: Content is read from controlled filesystem paths only.
 */

import { promises as fs } from "fs";
import path from "path";

/**
 * Content structure for status pages
 */
export interface StatusPageContent {
    title: string;
    subtitle: string;
    description: string;
    emergencyContact: string;
}

/**
 * Parse markdown content into structured data.
 * Expects format:
 * # Title
 * **Subtitle**
 * Description paragraph
 * **Emergency contact text**
 */
function parseMarkdownContent(markdown: string): StatusPageContent {
    const lines = markdown.trim().split("\n").filter((line) => line.trim());
    
    // Extract title from # heading
    const titleLine = lines.find((line) => line.startsWith("# "));
    const title = titleLine ? titleLine.replace("# ", "").trim() : "System Notice";
    
    // Extract subtitle (first bold line after title)
    const subtitleLine = lines.find((line) => 
        line.startsWith("**") && line.endsWith("**") && !line.includes("Immediate")
    );
    const subtitle = subtitleLine 
        ? subtitleLine.replace(/\*\*/g, "").trim() 
        : "NOAA Fisheries Marine Mammal Incident Reporting System";
    
    // Extract description (paragraph text without markdown formatting)
    const descriptionLines = lines.filter((line) => 
        !line.startsWith("#") && 
        !line.startsWith("**") &&
        line.trim().length > 0
    );
    const description = descriptionLines.join(" ").trim();
    
    // Extract emergency contact (last bold line containing "Immediate" or contact info)
    const emergencyLine = lines.find((line) => 
        line.includes("Immediate") || line.includes("1-866")
    );
    const emergencyContact = emergencyLine 
        ? emergencyLine.replace(/\*\*/g, "").trim()
        : "For Immediate Marine Mammal Strandings or Emergencies, please contact the West Coast Regional Stranding Network at 1-866-767-6114.";
    
    return {
        title,
        subtitle,
        description,
        emergencyContact,
    };
}

/**
 * Get content for the Coming Soon page.
 * Reads from icons/NOAA_Coming_Soon.md
 */
export async function getComingSoonContent(): Promise<StatusPageContent> {
    try {
        const filePath = path.join(process.cwd(), "icons", "NOAA_Coming_Soon.md");
        const content = await fs.readFile(filePath, "utf-8");
        return parseMarkdownContent(content);
    } catch (error) {
        console.error("Error reading Coming Soon content:", error);
        // Return fallback content
        return {
            title: "COMING SOON!",
            subtitle: "The Official NOAA Fisheries Marine Mammal Incident Reporting System.",
            description: "We are developing a new portal to make reporting strandings and injuries of sea lions, whales, seals, and other marine mammals faster and easier for the public and researchers. This critical tool will help us enhance response efforts and monitor marine wildlife health.",
            emergencyContact: "For Immediate Marine Mammal Strandings or Emergencies, please contact the West Coast Regional Stranding Network at 1-866-767-6114.",
        };
    }
}

/**
 * Get content for the Maintenance page.
 * Reads from icons/Maintenance.md
 */
export async function getMaintenanceContent(): Promise<StatusPageContent> {
    try {
        const filePath = path.join(process.cwd(), "icons", "Maintenance.md");
        const content = await fs.readFile(filePath, "utf-8");
        return parseMarkdownContent(content);
    } catch (error) {
        console.error("Error reading Maintenance content:", error);
        // Return fallback content
        return {
            title: "Maintenance!",
            subtitle: "The Official NOAA Fisheries Marine Mammal Incident Reporting System.",
            description: "We are currently performing scheduled maintenance to improve the Marine Response Application. We will be back online shortly.",
            emergencyContact: "For Immediate Marine Mammal Strandings or Emergencies, please contact the West Coast Regional Stranding Network at 1-866-767-6114.",
        };
    }
}
