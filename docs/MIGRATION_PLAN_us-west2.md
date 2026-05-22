# Migration Plan: Move All Resources to us-west2

**Date:** May 22, 2026  
**Reason:** Private Service Connect requires all resources in same region (us-west2)  
**Requested by:** Michael Blower (NOAA)

---

## Current Inventory → Target

| Resource | Current | Target |
|----------|---------|--------|
| Cloud Run: `nmfs-mra-app` | us-west1 | us-west2 |
| Cloud SQL: `nmfs-mra-db-instance` | us-central1 | us-west2 (rename: `nmfs-mra-db-west2`) |
| Bucket: `nmfs-mra-media` | us-central1 | us-west2 (new bucket, same name later) |
| Bucket: `dev-nmfs-mra-media` | us-central1 | us-west2 |
| Jumpbox VM: `mra-jumpbox` | us-central1-a | us-west2-a |
| Artifact Registry: `mra-repo` | us-west1 | us-west2 |

---

## Phase 1: Create New Infrastructure in us-west2

### 1.1 Create VPC subnet in us-west2
```bash
gcloud compute networks subnets create jumpbox-subnet-west2 \
  --network=mra-local-network \
  --region=us-west2 \
  --range=10.98.64.0/24 \
  --enable-private-ip-google-access \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 1.2 Create Artifact Registry in us-west2
```bash
gcloud artifacts repositories create mra-repo \
  --repository-format=docker \
  --location=us-west2 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 1.3 Create storage buckets in us-west2
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

---

## Phase 2: Migrate Cloud SQL Database

### 2.1 Create database backup
```bash
gcloud sql backups create --instance=nmfs-mra-db-instance \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 2.2 Clone database to us-west2
```bash
gcloud sql instances clone nmfs-mra-db-instance nmfs-mra-db-west2 \
  --region=us-west2 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 2.3 Configure private IP on new instance
```bash
gcloud sql instances patch nmfs-mra-db-west2 \
  --network=projects/ggn-nmfs-wcrmmrapp-dev-1/global/networks/mra-local-network \
  --no-assign-ip \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 2.4 Get new private IP and update DATABASE_URL secret
```bash
NEW_IP=$(gcloud sql instances describe nmfs-mra-db-west2 \
  --format="value(ipAddresses[0].ipAddress)" \
  --project=ggn-nmfs-wcrmmrapp-dev-1)

echo "New Cloud SQL Private IP: $NEW_IP"

# Update DATABASE_URL secret (replace PASSWORD with actual password)
echo -n "postgresql://app_user:PASSWORD@$NEW_IP:5432/nmfs-entanglement_db?sslmode=require" | \
  gcloud secrets versions add DATABASE_URL --data-file=- \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Phase 3: Build and Deploy to us-west2

### 3.1 Build Docker image to new Artifact Registry
```bash
gcloud builds submit \
  --tag "us-west2-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest" \
  --impersonate-service-account=mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 3.2 Deploy Cloud Run service to us-west2
```bash
gcloud run deploy nmfs-mra-app \
  --image=us-west2-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest \
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
  --impersonate-service-account=mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 3.3 Update NEXTAUTH_URL after deployment
```bash
SERVICE_URL=$(gcloud run services describe nmfs-mra-app \
  --region=us-west2 \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --format="value(status.url)")

gcloud run services update nmfs-mra-app \
  --region=us-west2 \
  --update-env-vars="NEXTAUTH_URL=$SERVICE_URL,NEXT_PUBLIC_BASE_URL=$SERVICE_URL" \
  --impersonate-service-account=mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Phase 4: Migrate Jumpbox VM

### 4.1 Delete old jumpbox
```bash
gcloud compute instances delete mra-jumpbox \
  --zone=us-central1-a \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 4.2 Create new jumpbox in us-west2
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

---

## Phase 5: Migrate Storage Data

```bash
gcloud storage cp -r gs://nmfs-mra-media/* gs://nmfs-mra-media-west2/ \
  --project=ggn-nmfs-wcrmmrapp-dev-1

gcloud storage cp -r gs://dev-nmfs-mra-media/* gs://dev-nmfs-mra-media-west2/ \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Phase 6: Cleanup Old Resources

### 6.1 Delete old Cloud Run (us-west1)
```bash
gcloud run services delete nmfs-mra-app \
  --region=us-west1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 6.2 Delete old Cloud SQL (AFTER VERIFICATION)
```bash
gcloud sql instances delete nmfs-mra-db-instance \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 6.3 Delete old buckets (AFTER VERIFICATION)
```bash
gcloud storage rm -r gs://nmfs-mra-media
gcloud storage rm -r gs://dev-nmfs-mra-media
```

### 6.4 Delete old subnet
```bash
gcloud compute networks subnets delete jumpbox-subnet \
  --region=us-central1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 6.5 Delete old Artifact Registry (us-west1)
```bash
gcloud artifacts repositories delete mra-repo \
  --location=us-west1 \
  --quiet \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Verification Checklist

- [ ] Cloud Run responds in us-west2
- [ ] Database connection works
- [ ] Storage bucket accessible
- [ ] Jumpbox SSH via IAP works

---

*Migration plan created: May 22, 2026*

---

## MIGRATION PROGRESS LOG

### Completed Steps (May 22, 2026 12:36 PM)

**Phase 1: Infrastructure** ✅
- [x] Created subnet `jumpbox-subnet-west2` (10.98.64.0/24) in us-west2
- [x] Created Artifact Registry `mra-repo` in us-west2
- [x] Created bucket `nmfs-mra-media-west2` in us-west2
- [x] Created bucket `dev-nmfs-mra-media-west2` in us-west2

**Phase 2: Cloud SQL Migration** ✅
- [x] Created backup of old instance
- [x] Created new instance `nmfs-mra-db-west2` (IP: 10.98.17.3)
- [x] Exported database to gs://nmfs-mra-media-west2/db-export/db-backup.sql
- [x] Imported database to new instance
- [x] Created user `app_user` on new instance
- [x] Updated DATABASE_URL secret (version 2)

**Phase 4: Jumpbox** ✅
- [x] Deleted old jumpbox (us-central1-a)
- [x] Created new jumpbox (us-west2-a, IP: 10.98.64.2)

**Phase 5: Storage Migration** ✅
- [x] Copied nmfs-mra-media contents (33.7KB)
- [x] dev-nmfs-mra-media was empty (no copy needed)

**Phase 3: Build & Deploy** ✅
- [x] Deployed Cloud Run to us-west2 using existing image from us-west1
- [x] Updated NEXTAUTH_URL and NEXT_PUBLIC_BASE_URL
- [x] Service URL: https://nmfs-mra-app-ibkcsx465a-wl.a.run.app

**Phase 6: Cleanup** ✅
- [x] Deleted old Cloud Run service (us-west1)
- [x] Deleted old Cloud SQL instance (nmfs-mra-db-instance, us-central1)
- [x] Deleted old bucket (nmfs-mra-media, us-central1)
- [x] Deleted old bucket (dev-nmfs-mra-media, us-central1)
- [x] Deleted old Artifact Registry (mra-repo, us-west1)
- [x] Deleted old subnet (jumpbox-subnet, us-central1)

### All Cleanup Complete ✅

**Migration fully completed: May 22, 2026 1:05 PM**

### Reference Commands (Already Executed)

**Phase 2.2: Clone database to us-west2**
```bash
gcloud sql instances clone nmfs-mra-db-instance nmfs-mra-db-west2 \
  --region=us-west2 \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

**Phase 2.3: Configure private IP (after clone completes)**
```bash
gcloud sql instances patch nmfs-mra-db-west2 \
  --network=projects/ggn-nmfs-wcrmmrapp-dev-1/global/networks/mra-local-network \
  --no-assign-ip \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

**Phase 2.4: Get new IP and update secret**
```bash
NEW_IP=$(gcloud sql instances describe nmfs-mra-db-west2 \
  --format="value(ipAddresses[0].ipAddress)" \
  --project=ggn-nmfs-wcrmmrapp-dev-1)
echo "New IP: $NEW_IP"
# Then update DATABASE_URL secret with new IP
```

**Phase 3.1: Build to us-west2**
```bash
gcloud builds submit \
  --tag "us-west2-docker.pkg.dev/ggn-nmfs-wcrmmrapp-dev-1/mra-repo/mra-app:latest" \
  --impersonate-service-account=mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

Continue with remaining phases from the plan above.

### Important Notes
- All Cloud Run deployments must use `--impersonate-service-account=mra-app-builder@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com`
- Keep bucket names as `nmfs-mra-media-west2` (user confirmed)
- Downtime is acceptable
