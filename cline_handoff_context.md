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
* **[COMPLETED] Phase 3: Firebase Cleanup.** Removed all Firebase SDKs, `firestore.rules`, `storage.rules`, `apphosting.yaml`.
* **[IN PROGRESS] Phase 4: Infrastructure & Deployment (Terraform).** Deploying the refactored Next.js app to Cloud Run.

## 5. Current Status & Next Prompt Action
We previously attempted to use Cloud Build to deploy the application because the developer account was restricted. However, the Google Admin has just granted the developer account full administrative permissions (Project IAM Admin, Cloud Run Admin, Cloud SQL Admin, Service Account User). 

**The immediate next step is to execute the following user prompt:**

> *"Good news. My Google Admin just granted my personal user account elevated permissions, including Project IAM Admin, Cloud Run Admin, Cloud SQL Admin, and Service Account User.*
>
> *Because I now have these roles, we do not need to use Cloud Build to bypass local permission restrictions. We can revert to executing Terraform locally.*
>
> *Please proceed with Phase 4 with the following instructions:*
> *1. Discard the `cloudbuild-terraform.yaml` strategy.*
> *2. Ensure the Terraform code for the Cloud Run service explicitly uses the `service_account_name` argument pointing to our `mra-app-runner` service account.*
> *3. Run `terraform apply` locally using the plan we generated earlier (or generate a new plan and apply it) to deploy the Next.js application to Cloud Run.*
>
> *Let me know if you run into any local deployment errors!"*

**Instruction for new Cline Session:** Read this entire document to establish context. Then, acknowledge receipt of this context and begin executing the instructions listed in the "Current Status & Next Prompt Action" section.
