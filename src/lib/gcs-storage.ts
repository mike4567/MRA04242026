/**
 * @file gcs-storage.ts
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose Google Cloud Storage utility module for media file operations.
 *          Replaces firebase-admin storage with native @google-cloud/storage SDK.
 * 
 * Environment Variables:
 * - GCS_BUCKET_NAME: The target bucket for media uploads (default: nmfs-mra-media)
 * - GOOGLE_CLOUD_PROJECT: The GCP project ID (optional, auto-detected in Cloud Run)
 */

import { Storage, Bucket } from "@google-cloud/storage";

// Singleton instance of the Storage client
let storageClient: Storage | null = null;

// Cached bucket reference
let cachedBucket: Bucket | null = null;

// Default bucket name for the NMFS Marine Response Application
const DEFAULT_BUCKET_NAME = "nmfs-mra-media";

/**
 * Initializes and returns the Google Cloud Storage client singleton.
 * Uses Application Default Credentials (ADC) for authentication.
 */
function getStorageClient(): Storage {
    if (!storageClient) {
        storageClient = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
        console.log("[GCS Storage] Client initialized successfully.");
    }
    return storageClient;
}

/**
 * Returns a reference to the configured GCS bucket for media storage.
 * Bucket name is read from GCS_BUCKET_NAME environment variable.
 */
export function getBucket(): Bucket {
    if (!cachedBucket) {
        const bucketName = process.env.GCS_BUCKET_NAME || DEFAULT_BUCKET_NAME;
        cachedBucket = getStorageClient().bucket(bucketName);
        console.log(`[GCS Storage] Bucket configured: ${bucketName}`);
    }
    return cachedBucket;
}

/**
 * Generates a public URL for a file stored in the GCS bucket.
 */
export function getPublicUrl(fileName: string): string {
    const bucketName = process.env.GCS_BUCKET_NAME || DEFAULT_BUCKET_NAME;
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
