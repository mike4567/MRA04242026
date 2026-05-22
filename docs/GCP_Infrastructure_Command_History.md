# GCP Infrastructure Command History Report
## Marine Response Application (MRA)
### Project: ggn-nmfs-wcrmmrapp-dev-1

**Prepared for:** NOAA Fisheries Google Admin Team  
**Prepared by:** Mike McCully (mike.mccully@noaa.gov)  
**Date:** May 20, 2026  
**Last Updated:** May 22, 2026

---

## Executive Summary

This document provides a comprehensive breakdown of all GCP commands executed during the deployment and configuration of the Marine Response Application to Cloud Run. The project underwent a migration from Firebase to native GCP services, followed by a complete region migration from us-central1/us-west1 to us-west2 on May 22, 2026.

---

## Section 1: Authentication & Project Configuration

| Command | Purpose |
|---------|---------|
| `gcloud auth login mike.mccully@noaa.gov` | Authenticate developer to GCP with NOAA credentials |
| `gcloud config set project ggn-nmfs-wcrmmrapp-dev-1` | Set the active GCP project for all subsequent commands |
| `gcloud auth list` | Verify authentication status and active account |
| `gcloud projects describe ggn-nmfs-wcrmmrapp-dev-1` | Retrieve project metadata and verify access |

---

## Section 2: API Enablement

| Command | Purpose |
|---------|---------|
| `gcloud services enable run.googleapis.com` | Enable Cloud Run API for container deployment |
| `gcloud services enable sqladmin.googleapis.com` | Enable Cloud SQL Admin API for database management |
| `gcloud services enable secretmanager.googleapis.com` | Enable Secret Manager API for secure credential storage |
| `gcloud services enable artifactregistry.googleapis.com` | Enable Artifact Registry for container image storage |
| `gcloud services enable cloudbuild.googleapis.com` | Enable Cloud Build API for container builds |
| `gcloud services enable iam.googleapis.com` | Enable IAM API for identity management |
| `gcloud services enable aiplatform.googleapis.com` | Enable Vertex AI API for AI/ML features |
| `gcloud services enable storage.googleapis.com` | Enable Cloud Storage API for media files |
| `gcloud services enable compute.googleapis.com` | Enable Compute Engine API for networking resources |
| `gcloud services enable servicenetworking.googleapis.com` | Enable Service Networking API for VPC peering |

---

## Section 3: Service Account Management

### 3.1 Create Application Service Account
```bash
gcloud iam service-accounts create mra-app-runner \
  --display-name="MRA Application Runner" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Create dedicated service account for Cloud Run runtime identity

### 3.2 Grant IAM Roles to Service Account
```bash
# Cloud SQL Client - allows database connections
gcloud projects add-iam-policy-binding ggn-nmfs-wcrmmrapp-dev-1 \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Secret Manager Accessor - allows reading secrets
gcloud projects add-iam-policy-binding ggn-nmfs-wcrmmrapp-dev-1 \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Storage Object Admin - allows media file operations
gcloud storage buckets add-iam-policy-binding gs://nmfs-mra-media \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Vertex AI User - allows AI/ML API calls
gcloud projects add-iam-policy-binding ggn-nmfs-wcrmmrapp-dev-1 \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Cloud Run Invoker - allows service invocation
gcloud run services add-iam-policy-binding nmfs-mra-app \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=us-west2
```

### 3.3 Create Builder Service Account (May 22, 2026)
```bash
gcloud iam service-accounts create mra-app-builder \
  --display-name="MRA Application Builder" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Dedicated service account for Cloud Build and deployment operations

### 3.4 Grant IAM Roles for Builder Service Account
```bash
# Allow builder to act as runner service account
gcloud iam service-accounts add-iam-policy-binding \
  mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --member="serviceAccount:mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 4: Cloud SQL Database Configuration

### 4.1 Create Cloud SQL Instance (Original - us-central1)
```bash
gcloud sql instances create nmfs-mra-db-instance \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-auto-increase \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Create PostgreSQL instance for application data

### 4.2 Create Database
```bash
gcloud sql databases create nmfs-entanglement_db \
  --instance=nmfs-mra-db-instance \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 4.3 Create Database User
```bash
gcloud sql users create app_user \
  --instance=nmfs-mra-db-instance \
  --password=[REDACTED] \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 4.4 Configure Private IP Access (VPC Peering)
```bash
# Reserve IP range for VPC peering
gcloud compute addresses create sql-private-ip-block \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=20 \
  --network=mra-local-network \
  --project=ggn-nmfs-wcrmmrapp-dev-1

# Create VPC peering connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=sql-private-ip-block \
  --network=mra-local-network \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Enable private connectivity between Cloud Run and Cloud SQL

---

## Section 5: Cloud Storage Configuration

### 5.1 Create Media Bucket (Original)
```bash
gcloud storage buckets create gs://nmfs-mra-media \
  --location=us-west1 \
  --uniform-bucket-level-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Create storage bucket for incident photos and media files

---

## Section 6: Secret Manager Configuration

### 6.1 Create Secrets
```bash
# Create DATABASE_URL secret
gcloud secrets create DATABASE_URL \
  --replication-policy="user-managed" \
  --locations="us-west1" \
  --project=ggn-nmfs-wcrmmrapp-dev-1

# Create AUTH_SECRET secret
gcloud secrets create AUTH_SECRET \
  --replication-policy="user-managed" \
  --locations="us-west1" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 6.2 Add Secret Versions
```bash
# Add DATABASE_URL value
echo "postgres://app_user:[PASSWORD]@localhost/nmfs-entanglement_db?host=/cloudsql/ggn-nmfs-wcrmmrapp-dev-1:us-central1:nmfs-mra-db-instance" | \
  gcloud secrets versions add DATABASE_URL --data-file=-

# Add AUTH_SECRET value
echo "[RANDOM_SECRET]" | gcloud secrets versions add AUTH_SECRET --data-file=-
```

---

## Section 7: Container Build & Deployment

### 7.1 Build Container Image
```bash
gcloud builds submit \
  --tag "gcr.io/ggn-nmfs-wcrmmrapp-dev-1/entanglement-app" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Build Docker container from Dockerfile and push to Container Registry

### 7.2 Terraform Deployment
```bash
cd terraform
terraform init
terraform plan -var="container_image=gcr.io/ggn-nmfs-wcrmmrapp-dev-1/entanglement-app"
terraform apply -var="container_image=gcr.io/ggn-nmfs-wcrmmrapp-dev-1/entanglement-app"
```
**Purpose:** Deploy Cloud Run service with all environment variables and configurations

### 7.3 Direct Cloud Run Deployment (Alternative)
```bash
gcloud run deploy nmfs-mra-app \
  --image=gcr.io/ggn-nmfs-wcrmmrapp-dev-1/entanglement-app:latest \
  --service-account=mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --region=us-west1 \
  --add-cloudsql-instances=ggn-nmfs-wcrmmrapp-dev-1:us-central1:nmfs-mra-db-instance \
  --set-env-vars="GCS_BUCKET_NAME=nmfs-mra-media,GOOGLE_CLOUD_PROJECT=ggn-nmfs-wcrmmrapp-dev-1" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest" \
  --ingress=internal-and-cloud-load-balancing \
  --min-instances=1 \
  --max-instances=100 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 8: External Load Balancer Configuration (Later Removed)

### 8.1 Create Serverless NEG
```bash
gcloud compute network-endpoint-groups create nmfs-mra-neg \
  --region=us-west1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=nmfs-mra-app \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Create Network Endpoint Group pointing to Cloud Run service

### 8.2 Create Backend Service
```bash
gcloud compute backend-services create nmfs-mra-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --project=ggn-nmfs-wcrmmrapp-dev-1

gcloud compute backend-services add-backend nmfs-mra-backend \
  --global \
  --network-endpoint-group=nmfs-mra-neg \
  --network-endpoint-group-region=us-west1 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 8.3 Create URL Map
```bash
gcloud compute url-maps create nmfs-mra-url-map \
  --default-service=nmfs-mra-backend \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 8.4 Create HTTP Proxy
```bash
gcloud compute target-http-proxies create nmfs-mra-http-proxy \
  --url-map=nmfs-mra-url-map \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 8.5 Reserve External IP
```bash
gcloud compute addresses create nmfs-mra-lb-ip \
  --global \
  --ip-version=IPV4 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Result:** Reserved IP `8.232.37.3`

### 8.6 Create Forwarding Rule
```bash
gcloud compute forwarding-rules create nmfs-mra-http-rule \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --target-http-proxy=nmfs-mra-http-proxy \
  --address=nmfs-mra-lb-ip \
  --ports=80 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 9: Cloud Armor Security Policy (Later Removed)

### 9.1 Create Security Policy
```bash
gcloud compute security-policies create nmfs-mra-dev-policy \
  --description="Whitelist for MRA development access - blocks all except NOAA VPN" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 9.2 Add Allow Rules
```bash
gcloud compute security-policies rules create 1000 \
  --security-policy=nmfs-mra-dev-policy \
  --action=allow \
  --src-ip-ranges="161.55.0.0/16,155.206.248.0/24,10.27.33.0/24" \
  --description="Allow NOAA VPN and internal IP ranges" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Purpose:** Whitelist NOAA network ranges during development

### 9.3 Set Default Deny Rule
```bash
gcloud compute security-policies rules update 2147483647 \
  --security-policy=nmfs-mra-dev-policy \
  --action=deny-403 \
  --description="Deny all other traffic" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 9.4 Apply Policy to Backend
```bash
gcloud compute backend-services update nmfs-mra-backend \
  --security-policy=nmfs-mra-dev-policy \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 10: External Load Balancer Cleanup (May 20, 2026)

**Reason:** Admin requested migration to Internal Application Load Balancer with Private Service Connect for TIC compliance.

### 10.1 Delete Forwarding Rule
```bash
gcloud compute forwarding-rules delete nmfs-mra-http-rule \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

### 10.2 Delete HTTP Proxy
```bash
gcloud compute target-http-proxies delete nmfs-mra-http-proxy \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

### 10.3 Delete URL Map
```bash
gcloud compute url-maps delete nmfs-mra-url-map \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

### 10.4 Delete Backend Service
```bash
gcloud compute backend-services delete nmfs-mra-backend \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

### 10.5 Release External IP
```bash
gcloud compute addresses delete nmfs-mra-lb-ip \
  --global \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

### 10.6 Delete Cloud Armor Policy
```bash
gcloud compute security-policies delete nmfs-mra-dev-policy \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --quiet
```

---

## Section 11: Jumpbox VM Configuration (May 22, 2026)

### 11.1 Create Jumpbox Subnet
```bash
gcloud compute networks subnets create jumpbox-subnet \
  --network=mra-local-network \
  --region=us-central1 \
  --range=10.98.32.0/24 \
  --enable-private-ip-google-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 11.2 Create IAP SSH Firewall Rule
```bash
gcloud compute firewall-rules create allow-iap-ssh \
  --network=mra-local-network \
  --allow=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --target-tags=iap-ssh \
  --description="Allow SSH via IAP tunnel" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 11.3 Create Jumpbox VM (Original - us-central1-a)
```bash
gcloud compute instances create mra-jumpbox \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --subnet=projects/ggn-nmfs-wcrmmrapp-dev-1/regions/us-central1/subnetworks/jumpbox-subnet \
  --no-address \
  --metadata=enable-oslogin=TRUE \
  --service-account=mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=iap-ssh \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=10GB \
  --shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring
```

### 11.4 Connect to Jumpbox via IAP
```bash
gcloud compute ssh mra-jumpbox \
  --zone=us-central1-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --tunnel-through-iap
```

---

## Section 12: us-west2 Region Migration (May 22, 2026)

**Reason:** Private Service Connect requires all resources in the same region (us-west2).

### 12.1 Create New Subnet in us-west2
```bash
gcloud compute networks subnets create jumpbox-subnet-west2 \
  --network=mra-local-network \
  --region=us-west2 \
  --range=10.98.64.0/24 \
  --enable-private-ip-google-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.2 Create Artifact Registry in us-west2
```bash
gcloud artifacts repositories create mra-repo \
  --repository-format=docker \
  --location=us-west2 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.3 Create Storage Buckets in us-west2
```bash
gcloud storage buckets create gs://nmfs-mra-media-west2 \
  --location=us-west2 \
  --uniform-bucket-level-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1

gcloud storage buckets create gs://dev-nmfs-mra-media-west2 \
  --location=us-west2 \
  --uniform-bucket-level-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.4 Grant Storage Permissions for New Buckets
```bash
gcloud storage buckets add-iam-policy-binding gs://nmfs-mra-media-west2 \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud storage buckets add-iam-policy-binding gs://dev-nmfs-mra-media-west2 \
  --member="serviceAccount:mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 12.5 Create Cloud SQL Backup
```bash
gcloud sql backups create --instance=nmfs-mra-db-instance \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.6 Create New Cloud SQL Instance in us-west2
```bash
gcloud sql instances create nmfs-mra-db-west2 \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-west2 \
  --network=projects/ggn-nmfs-wcrmmrapp-dev-1/global/networks/mra-local-network \
  --no-assign-ip \
  --storage-auto-increase \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Result:** New instance created with Private IP `10.98.17.3`

### 12.7 Export Database from Old Instance
```bash
gcloud sql export sql nmfs-mra-db-instance \
  gs://nmfs-mra-media-west2/db-export/db-backup.sql \
  --database=nmfs-entanglement_db \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.8 Import Database to New Instance
```bash
gcloud sql import sql nmfs-mra-db-west2 \
  gs://nmfs-mra-media-west2/db-export/db-backup.sql \
  --database=nmfs-entanglement_db \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.9 Create Database User on New Instance
```bash
gcloud sql users create app_user \
  --instance=nmfs-mra-db-west2 \
  --password=[REDACTED] \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.10 Update DATABASE_URL Secret
```bash
echo -n "postgresql://app_user:[PASSWORD]@10.98.17.3:5432/nmfs-entanglement_db?sslmode=require" | \
  gcloud secrets versions add DATABASE_URL --data-file=- \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.11 Migrate Storage Data
```bash
gcloud storage cp -r gs://nmfs-mra-media/* gs://nmfs-mra-media-west2/ \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.12 Delete Old Jumpbox
```bash
gcloud compute instances delete mra-jumpbox \
  --zone=us-central1-a \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.13 Create New Jumpbox in us-west2
```bash
gcloud compute instances create mra-jumpbox \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --zone=us-west2-a \
  --machine-type=e2-micro \
  --subnet=projects/ggn-nmfs-wcrmmrapp-dev-1/regions/us-west2/subnetworks/jumpbox-subnet-west2 \
  --no-address \
  --metadata=enable-oslogin=TRUE \
  --service-account=mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=iap-ssh \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=10GB \
  --shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring
```
**Result:** New jumpbox at IP `10.98.64.2`

### 12.14 Deploy Cloud Run to us-west2
```bash
gcloud run deploy nmfs-mra-app \
  --image=us-west1-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest \
  --region=us-west2 \
  --service-account=mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --add-cloudsql-instances=ggn-nmfs-wcrmmrapp-dev-1:us-west2:nmfs-mra-db-west2 \
  --set-env-vars="GCS_BUCKET_NAME=nmfs-mra-media-west2" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=ggn-nmfs-wcrmmrapp-dev-1" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --set-secrets="AUTH_SECRET=AUTH_SECRET:latest" \
  --ingress=internal-and-cloud-load-balancing \
  --min-instances=1 \
  --max-instances=100 \
  --memory=512Mi \
  --cpu=1 \
  --no-allow-unauthenticated \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```
**Result:** Service URL `https://nmfs-mra-app-ibkcsx465a-wl.a.run.app`

### 12.15 Update NEXTAUTH_URL Environment Variable
```bash
gcloud run services update nmfs-mra-app \
  --region=us-west2 \
  --update-env-vars="NEXTAUTH_URL=https://nmfs-mra-app-ibkcsx465a-wl.a.run.app,NEXT_PUBLIC_BASE_URL=https://nmfs-mra-app-ibkcsx465a-wl.a.run.app" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 12.16 Delete Old Cloud Run Service (us-west1)
```bash
gcloud run services delete nmfs-mra-app \
  --region=us-west1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 13: Current Resource State (May 22, 2026)

### Active Resources (us-west2)
| Resource | Type | Location | Status |
|----------|------|----------|--------|
| `nmfs-mra-app` | Cloud Run Service | us-west2 | ✅ Running |
| `nmfs-mra-db-west2` | Cloud SQL Instance | us-west2 | ✅ Running (IP: 10.98.17.3) |
| `nmfs-mra-media-west2` | GCS Bucket | us-west2 | ✅ Active |
| `dev-nmfs-mra-media-west2` | GCS Bucket | us-west2 | ✅ Active |
| `mra-jumpbox` | Compute VM | us-west2-a | ✅ Running (IP: 10.98.64.2) |
| `mra-repo` | Artifact Registry | us-west2 | ✅ Active |
| `jumpbox-subnet-west2` | VPC Subnet | us-west2 | ✅ Active (10.98.64.0/24) |
| `mra-app-runner` | Service Account | Global | ✅ Active |
| `mra-app-builder` | Service Account | Global | ✅ Active |
| `DATABASE_URL` | Secret | Global | ✅ Active (version 2) |
| `AUTH_SECRET` | Secret | Global | ✅ Active |

### Deleted Resources (Cleanup Completed May 22, 2026 1:05 PM)
| Resource | Type | Deleted Date |
|----------|------|--------------|
| `nmfs-mra-app` (us-west1) | Cloud Run Service | May 22, 2026 |
| `mra-jumpbox` (us-central1-a) | Compute VM | May 22, 2026 |
| `nmfs-mra-db-instance` | Cloud SQL Instance | May 22, 2026 |
| `nmfs-mra-media` | GCS Bucket | May 22, 2026 |
| `dev-nmfs-mra-media` | GCS Bucket | May 22, 2026 |
| `mra-repo` (us-west1) | Artifact Registry | May 22, 2026 |
| `jumpbox-subnet` (us-central1) | VPC Subnet | May 22, 2026 |
| `nmfs-mra-http-rule` | Forwarding Rule | May 20, 2026 |
| `nmfs-mra-http-proxy` | HTTP Proxy | May 20, 2026 |
| `nmfs-mra-url-map` | URL Map | May 20, 2026 |
| `nmfs-mra-backend` | Backend Service | May 20, 2026 |
| `nmfs-mra-lb-ip` | External IP | May 20, 2026 |
| `nmfs-mra-dev-policy` | Cloud Armor Policy | May 20, 2026 |

---

## Section 14: Pending Cleanup Commands

**Run these commands after verifying the application works correctly in us-west2:**

### 14.1 Delete Old Cloud SQL Instance
```bash
gcloud sql instances delete nmfs-mra-db-instance \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 14.2 Delete Old Storage Buckets
```bash
gcloud storage rm -r gs://nmfs-mra-media
gcloud storage rm -r gs://dev-nmfs-mra-media
```

### 14.3 Delete Old Artifact Registry
```bash
gcloud artifacts repositories delete mra-repo \
  --location=us-west1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 14.4 Delete Old Subnet
```bash
gcloud compute networks subnets delete jumpbox-subnet \
  --region=us-central1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Section 15: Pending Actions

1. **Admin to deploy Internal Application Load Balancer** via platform Terraform
2. **SCR approval** at CCB for Private Service Connect
3. **SSL certificate request** to ra@noaa.gov for `mra-west.fisheries.noaa.gov`
4. **Cloud Run ingress update** to `internal` after internal LB deployment
5. **Cleanup old resources** after verification (see Section 14)

---

**Document Version:** 2.0  
**Last Updated:** May 22, 2026  
**Change Log:**
- v1.0 (May 20, 2026): Initial document
- v2.0 (May 22, 2026): Added us-west2 migration commands, jumpbox configuration, builder service account
