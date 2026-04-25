'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { query } from '@/lib/db'; 
import { getStorage } from '@/lib/firebase-admin'; 
import { sendNewIncidentNotification } from '@/services/sms';
import { generateIncidentId } from '@/lib/utils';
import { getResponderInfo, type SpecificResponderInfo } from '@/app/actions';
import sharp from 'sharp';

// Input Schema
const CreateIncidentInputSchema = z.object({
  mediaDataUris: z.array(z.string()).optional(),
  location: z.string(),
  additionalLocationInfo: z.string().optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  canText: z.boolean().default(false),
  animalType: z.string().optional(),
  animalLifeStatus: z.enum(['alive', 'dead']),
  conditions: z.array(z.string()).optional(),
  detailedDescription: z.string().optional()
});
export type CreateIncidentInput = z.infer<typeof CreateIncidentInputSchema>;

const CreateIncidentOutputSchema = z.object({
  incidentId: z.string(),
  summary: z.string(),
  responderInfo: z.custom<SpecificResponderInfo>().nullable(),
  noResponderFound: z.boolean(),
});
export type CreateIncidentOutput = z.infer<typeof CreateIncidentOutputSchema>;

// Helper to validate and cast animalType
// Helper: Reverse Geocoding (Google Maps) - Keeps specific landmarks as a backup
async function getLandmarkFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!apiKey) return "Unknown Location";

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=point_of_interest|park|natural_feature|locality`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address; 
    }
    return "Remote Location";
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Location lookup failed";
  }
}

export async function createIncidentReport(input: CreateIncidentInput): Promise<CreateIncidentOutput> {
  return createIncidentReportFlow(input);
}

const createIncidentReportFlow = ai.defineFlow(
  {
    name: 'createIncidentReportFlow',
    inputSchema: CreateIncidentInputSchema,
    outputSchema: CreateIncidentOutputSchema,
  },
  async (input) => {
    // --- Step 1: Prepare Location ---
    const locationParts = input.location.split(',').map(s => s.trim());
    const lat = parseFloat(locationParts[0]);
    const lng = parseFloat(locationParts[1]);
    
    let landmarkName = "Unknown Coordinates";
    let responderInfo: SpecificResponderInfo | null = null;

    if (!isNaN(lat) && !isNaN(lng)) {
        responderInfo = await getResponderInfo(lat, lng, input.animalLifeStatus, input.animalType);
        landmarkName = await getLandmarkFromCoordinates(lat, lng);
    }

    // --- Step 2: Prepare AI Prompt with IMAGES ---
    // UPDATED PROMPT: Instructs AI to derive General Region from Coordinates
    const promptText = `
      Role: You are a professional Marine Stranding Coordinator and GIS Expert.
      
      Task: Analyze this incident report to produce a concise, 2-4 sentence executive summary.
      
      Data to Analyze:
      - **Coordinates:** ${input.location}
      - **Nearby Landmark Hint:** ${landmarkName}
      - **Reporter's Input:** ${input.animalType} (${input.animalLifeStatus})
      - **Conditions:** ${input.conditions?.join(', ') || 'None listed'}
      - **Notes:** ${input.detailedDescription || 'None'}
      
      Instructions:
      1. **Location Analysis (General Region):** - Use the Coordinates to identify the **General Coastal Region** (e.g., "North Puget Sound", "Southern California Bight", "Central Oregon Coast", "San Francisco Bay"). 
         - Combine this with the landmark hint if useful. 
         - Example: "Located in North Puget Sound near the Edmonds Ferry Terminal."
      
      2. **VISUAL VERIFICATION (CRITICAL):** - Look at the attached image(s).
         - Does the animal in the photo match the Reporter's Input ("${input.animalType}")?
         - **Visuals Override Text:** If the photo clearly shows a different species (e.g., Sea Lion vs Whale), state the species seen in the photo.
         - State clearly: "Visual evidence confirms a [Species from Photo]..."
      
      3. **Summary:** Combine the visual ID, condition, and the Regional Location into a professional summary.
    `;

    // We build a "Multimodal" message: Text + Images
    const promptParts: any[] = [{ text: promptText }];

    // If images exist, attach them as "Media Parts" so the AI can see them
    if (input.mediaDataUris && input.mediaDataUris.length > 0) {
      input.mediaDataUris.forEach((uri) => {
        promptParts.push({ media: { url: uri } });
      });
    }

    // Call the model directly
    // FIXED: Using 'googleai/gemini-2.5-flash-lite' as requested for best multi-modal results
    const aiResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: promptParts,
      config: { temperature: 0.4 } 
    });

    const summary = aiResponse.text || "AI Summary unavailable.";

    // --- Step 3: Sanitize, Validate, and Upload Media ---
    let uploadedMediaUrls: string[] = [];
    const incidentId = generateIncidentId(); 

    if (input.mediaDataUris && input.mediaDataUris.length > 0) {
      const { fileTypeFromBuffer } = await import('file-type');
      const bucket = getStorage().bucket();
      
      const uploadPromises = input.mediaDataUris.map(async (dataUri, index) => {
        const match = dataUri.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
          console.warn(`Skipping invalid data URI at index ${index}`);
          return null;
        }

        const [, mimeType, base64Data] = match;
        const originalBuffer = Buffer.from(base64Data, 'base64');
        
        let processedBuffer: Buffer;
        let finalMimeType: string;
        let finalFileExtension: string;

        try {
          if (mimeType.startsWith('image/')) {
            // Sanitize Image
            processedBuffer = await sharp(originalBuffer)
              .withMetadata(false) // Strip EXIF
              .webp({ quality: 85 }) // Convert to webp and compress
              .toBuffer();
            finalMimeType = 'image/webp';
            finalFileExtension = 'webp';

          } else if (mimeType.startsWith('video/')) {
            // Validate Video
            const fileType = await fileTypeFromBuffer(originalBuffer);
            const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
            
            if (!fileType || !allowedVideoTypes.includes(fileType.mime)) {
              throw new Error(`Invalid or unsupported video file type: ${fileType?.mime || 'unknown'}`);
            }
            
            processedBuffer = originalBuffer;
            finalMimeType = fileType.mime;
            finalFileExtension = fileType.ext;

          } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
          }

          const fileName = `incidents/${incidentId}/${incidentId}-${index}.${finalFileExtension}`;
          const file = bucket.file(fileName);

          await file.save(processedBuffer, {
            metadata: {
              contentType: finalMimeType,
              contentDisposition: 'inline', // Prevent browser from executing the file
            },
          });
          
          return `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        } catch (error) {
          console.error(`Failed to process file at index ${index}:`, error);
          // In a real app, you might want more robust error handling,
          // like notifying the user that a specific file failed.
          return null; 
        }
      });

      const results = await Promise.all(uploadPromises);
      uploadedMediaUrls = results.filter((url): url is string => url !== null);
    }

    // --- Step 4: Database Insert ---
    const insertQuery = `
      INSERT INTO incidents (
        id, location, additional_location_info, media_urls, status, 
        reporter_name, reporter_phone, can_text, responder_notes, 
        summary, animal_type, animal_life_status, conditions, 
        responder_org, responder_phone, detailed_description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING id;
    `;

    const values = [
      incidentId,
      input.location,
      input.additionalLocationInfo || null,
      uploadedMediaUrls, 
      'Reported',
      input.reporterName || null,
      input.reporterPhone || null,
      input.canText,
      '', 
      summary,
      input.animalType || null,
      input.animalLifeStatus,
      input.conditions || [],
      responderInfo?.org || null,
      responderInfo?.hotline || null,
      input.detailedDescription || null
    ];

    try {
      await query(insertQuery, values);
    } catch (error) {
      console.error("Database Insert Failed:", error);
      throw new Error("Failed to save incident to database.");
    }

    // --- Step 5: Notifications ---
    await sendNewIncidentNotification(
      incidentId, 
      input.location, 
      summary,
      {
        smsNumbers: responderInfo?.sms_numbers,
        email: responderInfo?.emails && responderInfo.emails.length > 0 ? responderInfo.emails[0] : null
      },
      input.reporterName,
      input.reporterPhone,
      uploadedMediaUrls
    );

    return {
      incidentId,
      summary,
      responderInfo,
      noResponderFound: !responderInfo?.org,
    };
  }
);