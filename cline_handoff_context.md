# Project Handoff Context: Marine Response Application

## 1. Project Overview
* **Application:** Next.js 16.2.1 application for marine mammal incident reporting and rescue coordination.
* **Current Goal:** Complete migration from a Firebase-centric architecture to a native Google Cloud Platform (GCP) architecture, dropping all Firebase services in favor of native GCP and Next.js libraries.
* **Target Environment:** `ggn-nmfs-wcrmmrapp-dev-1` (FedRAMP/NOAA compliance rules apply).

## 2. Infrastructure Details

### Old Environment (To be deprecated/removed)
* **GCP Project:** `fedramp-app-prod`
* **Hosting:** Firebase App Hosting
* **Database:** Firestore (to be deprecated) + Cloud SQL (`mra-db-instance-a9e0d26f`, `entanglement_db`)
* **Auth:** Firebase Authentication
* **Storage:** Firebase Storage (`mra-media`)

### New Environment (Target)
* **GCP Project:** `ggn-nmfs-wcrmmrapp-dev-1`
* **Hosting:** Google Cloud Run (`nmfs-mra-app`)
* **Database:** PostgreSQL on Cloud SQL (`nmfs-mra-db-instance`, `nmfs-entanglement_db`)
* **Storage:** Google Cloud Storage (`nmfs-mra-media`)
* **Auth:** NextAuth.js (Auth.js) using the PostgreSQL `users` table
* **Secrets:** Managed via GCP Secret Manager (`DATABASE_URL`, `AUTH_SECRET`)

### Local Development Environment
* **Local Project:** `ggn-nmfs-wcrmmrapp-dev-1`
* **Local Bucket:** `dev-nmfs-mra-media`
* **Local Database:** `dev_entanglement_db` (inside `nmfs-mra-db-instance`)
* *Note:* Uses `.env.local` to connect to the Cloud SQL Auth Proxy on `127.0.0.1:5432`.

## 3. Service Accounts & Permissions

### Application Runtime Service Account
* **Name:** `mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com`
* **Purpose:** The Cloud Run application MUST "run-as" this service account.
* **Confirmed Roles:** * Cloud SQL Client
    * Secret Manager Secret Accessor
    * Storage Object Admin
    * Vertex AI User

### Developer Account (`mike.mccully@noaa.gov`)
* **Confirmed Roles:**
    * Project IAM Admin
    * Cloud Run Admin
    * Cloud SQL Admin
    * Service Account User
    * Cloud SQL Client

## 4. Phased Refactoring Plan
The codebase is undergoing a strict, phased refactor. **DO NOT proceed to the next phase without user approval.**
* **[COMPLETED] Phase 1: Storage Refactor.** Replaced `firebase-admin` and `firebase` storage with `@google-cloud/storage`.
* **[COMPLETED] Phase 2: Auth Refactor.** Replaced Firebase Auth with `NextAuth.js` (Auth.js) backed by PostgreSQL.
* **[COMPLETED] Phase 3: Firebase Cleanup.** Removed all Firebase SDKs and replaced with NextAuth.js and @google-cloud/storage.
* **[COMPLETED] Phase 4: Infrastructure & Deployment.** App deployed to Cloud Run via Cloud Build.

## 5. Current Status & Completed Work

### Firebase to NextAuth.js Migration (May 22, 2026)
The Firebase SDK cleanup was completed with the following changes:
1. **Removed:** `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`
2. **Created:** `src/lib/auth.ts` - NextAuth.js configuration with PostgreSQL credentials provider
3. **Created:** `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
4. **Created:** `src/components/providers/SessionProvider.tsx` - Client-side session wrapper
5. **Refactored:**
   - `src/app/login/page.tsx` - Uses `signIn()` from next-auth/react
   - `src/app/admin/layout.tsx` - Uses `useSession()` for auth state
   - `src/context/IncidentContext.tsx` - Uses NextAuth session instead of Firebase
   - `src/ai/flows/create-incident-report.ts` - Uses `@google-cloud/storage` directly
   - `src/app/incidents/actions.ts` - Uses PostgreSQL via `@/lib/db`
6. **Updated Dockerfile:** Added vips dependencies for sharp image processing

### Build & Deploy Process
- Build uses Cloud Build with impersonation: `mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com`
- Deploy requires updating Cloud Run service with new image
- Service account for runtime: `mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com`

**Instruction for new Cline Session:** Read this document to understand the architecture. The app now uses NextAuth.js with PostgreSQL for authentication instead of Firebase.
