# Marine Response Application - Deployment Guide

## Overview

This document provides instructions for deploying the Marine Response Application to Google Cloud Platform (GCP). The application has been refactored to remove Firebase dependencies and now uses:

- **Google Cloud Storage** - Media file storage
- **Cloud SQL (PostgreSQL)** - Database
- **NextAuth.js** - Authentication
- **Cloud Run** - Application hosting

## Prerequisites

1. **GCP Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Terraform** installed (v1.0+)
4. **Docker** installed (for local builds)

## Environment Variables

### Required Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Secret Manager (auto-generated) |
| `AUTH_SECRET` | NextAuth.js JWT signing key | Secret Manager (auto-generated) |
| `GCS_BUCKET_NAME` | GCS bucket for media storage | Terraform |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | Terraform |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform API key | terraform.tfvars |
| `GOOGLE_MAPS_SERVER_KEY` | Server-side Maps API key | terraform.tfvars |
| `GOOGLE_API_KEY` | Google AI (Gemini) API key | terraform.tfvars |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | terraform.tfvars |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | terraform.tfvars |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID | terraform.tfvars |
| `SENDGRID_API_KEY` | SendGrid API key for email | terraform.tfvars |
| `NEXT_PUBLIC_BASE_URL` | Public URL of the application | terraform.tfvars |
| `NEXTAUTH_URL` | NextAuth.js callback URL | terraform.tfvars |

### Local Development (.env.local)

Create a `.env.local` file in the project root:

```bash
# Database (use Cloud SQL Proxy for local dev)
DATABASE_URL=postgres://app_user:PASSWORD@localhost:5432/entanglement_db

# Authentication
AUTH_SECRET=your-local-dev-secret-32-chars-min

# Google Cloud
GCS_BUCKET_NAME=nmfs-mra-media
GOOGLE_CLOUD_PROJECT=ggn-nmfs-wcrmmrapp-dev-1

# API Keys
GOOGLE_MAPS_API_KEY=your-maps-api-key
GOOGLE_MAPS_SERVER_KEY=your-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key
GOOGLE_API_KEY=your-gemini-api-key

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:9002
NEXTAUTH_URL=http://localhost:9002
```

## Deployment Steps

### 1. Initial GCP Setup

```bash
# Set project
gcloud config set project ggn-nmfs-wcrmmrapp-dev-1

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  aiplatform.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create mra-repo \
  --repository-format=docker \
  --location=us-west1 \
  --description="Marine Response App Docker images"
```

### 2. Configure Terraform

```bash
cd terraform

# Copy example tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
# IMPORTANT: Update API keys and project-specific values

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure
terraform apply
```

### 3. Database Setup

After Terraform creates the Cloud SQL instance:

```bash
# Connect to database using Cloud SQL Proxy
./cloud-sql-proxy ggn-nmfs-wcrmmrapp-dev-1:us-west1:mra-db-instance-XXXX

# In another terminal, run migrations
psql -h localhost -U app_user -d entanglement_db -f schema.sql
psql -h localhost -U app_user -d entanglement_db -f create_view.sql
psql -h localhost -U app_user -d entanglement_db -f migration_auth.sql
```

### 4. Create Initial Admin User

```bash
# Generate password hash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"

# Insert user into database
psql -h localhost -U app_user -d entanglement_db -c "
INSERT INTO users (id, email, password_hash, role) 
VALUES ('admin-001', 'admin@noaa.gov', '\$2a\$10\$YOUR_HASH_HERE', 'ADMIN');
"
```

### 5. Build and Deploy

#### Option A: Using Cloud Build (Recommended)

```bash
# Submit build
gcloud builds submit --config=cloudbuild.yaml

# Or trigger from git push (if Cloud Build trigger is configured)
git push origin main
```

#### Option B: Manual Build and Deploy

```bash
# Build image
docker build -t us-west1-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest .

# Push to Artifact Registry
docker push us-west1-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest

# Deploy to Cloud Run
gcloud run deploy mra-app \
  --image us-west1-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated
```

### 6. Post-Deployment

1. **Update `next_public_base_url`** in terraform.tfvars with the Cloud Run URL
2. **Re-run Terraform** to update the environment variable
3. **Test the application** at the Cloud Run URL

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                     │
│                    (ggn-nmfs-wcrmmrapp-dev-1)                   │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Cloud Run   │───▶│  Cloud SQL   │    │     GCS      │      │
│  │   (mra-app)  │    │ (PostgreSQL) │    │ (nmfs-mra-   │      │
│  │              │    │              │    │    media)    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                       ▲               │
│         │            ┌──────────────┐           │               │
│         └───────────▶│   Secret     │───────────┘               │
│                      │   Manager    │                           │
│                      └──────────────┘                           │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Vertex AI  │    │   Artifact   │    │    IAM       │      │
│  │   (Gemini)   │    │   Registry   │    │  (Service    │      │
│  │              │    │              │    │   Account)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Twilio    │    │   SendGrid   │    │   ArcGIS     │      │
│  │    (SMS)     │    │   (Email)    │    │   (Spatial)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Verify Cloud SQL Proxy is running
   - Check DATABASE_URL format
   - Ensure Cloud Run service account has `roles/cloudsql.client`

2. **Authentication not working**
   - Verify AUTH_SECRET is set in Secret Manager
   - Check NEXTAUTH_URL matches the deployment URL
   - Ensure users table has `password_hash` column

3. **Media uploads fail**
   - Verify GCS bucket exists and is accessible
   - Check service account has `roles/storage.objectAdmin`
   - Verify CORS configuration on bucket

4. **AI summaries not generating**
   - Verify GOOGLE_API_KEY is valid
   - Check service account has `roles/aiplatform.user`
   - Review Cloud Run logs for Genkit errors

## Security Considerations

- All secrets are stored in Secret Manager
- Service account follows least-privilege principle
- Database passwords are auto-generated
- AUTH_SECRET is auto-generated and stored securely
- No Firebase credentials required
