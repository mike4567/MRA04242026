# NOAA Cloud Run Application Deployment Guidelines
## Google Cloud Platform within FISMA Boundaries

**Document Version:** 2.0  
**Last Updated:** May 22, 2026  
**Author:** NOAA Fisheries IT  
**Classification:** Internal Use

---

## 1. Document Purpose

This guide establishes standard architecture patterns, security requirements, and deployment procedures for containerized web applications on Google Cloud Platform (GCP) within NOAA FISMA boundaries. These guidelines are derived from lessons learned deploying applications through the Google Government Network (GGN) environment.

### 1.1 Scope

This document applies to:
- Containerized web applications (Next.js, Node.js, Python, etc.)
- Public-facing applications requiring internet accessibility
- Internal applications requiring NOAA network access only
- Applications requiring database, storage, and AI/ML services

### 1.2 Compliance Requirements

All deployments must comply with:
- **FISMA** (Federal Information Security Management Act)
- **FedRAMP** (Federal Risk and Authorization Management Program)
- **TIC 3.0** (Trusted Internet Connection)
- **NIST SP 800-53** Security Controls
- **NAO 212-13** (Environmental Data Management)
- **NAO 201-118** (IT Management)

---

## 2. Regional Deployment Requirements (CRITICAL - Read First)

> ⚠️ **IMPORTANT:** This section was added May 22, 2026 based on lessons learned. Failing to follow these requirements will result in significant rework.

### 2.1 Approved Regions

All GCP resources for NOAA applications using Private Service Connect **MUST** be deployed in one of these regions:

| Region | Location | Recommended For |
|--------|----------|-----------------|
| **us-west2** | Los Angeles | West Coast applications (RECOMMENDED) |
| **us-east4** | Northern Virginia | East Coast applications |

> ❌ **NOT RECOMMENDED:** us-central1, us-west1 - These regions do NOT support the Private Service Connect architecture required for TIC compliance.

### 2.2 Why Region Matters

Private Service Connect (PSC), which is REQUIRED for TIC-compliant public access, has these constraints:

1. **All resources must be in the SAME region** - Cloud Run, Cloud SQL, Storage, Artifact Registry, and the Internal Load Balancer must all be deployed to the same region
2. **Shared VPC connectivity** - The platform team's Shared VPC has PSC endpoints only in us-west2 and us-east4
3. **Cross-region access is NOT supported** - You cannot have Cloud Run in us-west1 connecting to PSC in us-west2

### 2.3 Resource Colocation Checklist

Before deploying, ensure ALL of these resources will be in the SAME region:

- [ ] Cloud Run service
- [ ] Cloud SQL instance (with Private IP)
- [ ] GCS Storage bucket
- [ ] Artifact Registry (Docker images)
- [ ] VPC Subnet
- [ ] Serverless NEG
- [ ] Jumpbox VM (for testing/admin access)

### 2.4 Example: Correct Architecture (us-west2)

```
┌────────────────────────────────────────────────────────────┐
│                        us-west2                            │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   Cloud Run     │    │   Cloud SQL     │               │
│  │  nmfs-mra-app   │◄──►│ nmfs-mra-db-west2│              │
│  └────────┬────────┘    │  (10.98.17.3)   │               │
│           │             └─────────────────┘               │
│           │                                                │
│  ┌────────▼────────┐    ┌─────────────────┐               │
│  │  Serverless NEG │    │   GCS Bucket    │               │
│  │  nmfs-mra-neg   │    │ nmfs-mra-media  │               │
│  └────────┬────────┘    └─────────────────┘               │
│           │                                                │
│  ┌────────▼────────┐    ┌─────────────────┐               │
│  │  Internal ALB   │    │    Jumpbox      │               │
│  │ (Admin deployed)│    │  (us-west2-a)   │               │
│  └────────┬────────┘    └─────────────────┘               │
│           │                                                │
│  ┌────────▼────────┐                                       │
│  │ Private Service │                                       │
│  │    Connect      │                                       │
│  └────────┬────────┘                                       │
└───────────┼────────────────────────────────────────────────┘
            │
            ▼
    NMFS Perimeter / TIC
            │
            ▼
    Public Internet
```

---

## 3. Jumpbox VM & IAP Access (REQUIRED)

> ⚠️ **IMPORTANT:** Since Cloud Run services use `internal-and-cloud-load-balancing` ingress, you CANNOT directly access them from your local machine. A jumpbox VM with IAP tunneling is REQUIRED for testing and database administration.

### 3.1 Why You Need a Jumpbox

| Without Jumpbox | With Jumpbox |
|-----------------|--------------|
| ❌ Cannot test Cloud Run service | ✅ Can curl/test Cloud Run from inside VPC |
| ❌ Cannot connect to Cloud SQL | ✅ Can connect to database via private IP |
| ❌ Cannot verify internal connectivity | ✅ Can diagnose networking issues |
| ❌ Must wait for full PSC deployment | ✅ Can validate app before PSC is ready |

### 3.2 Jumpbox Architecture

```
Your Laptop ──IAP Tunnel──► Jumpbox VM ──VPC──► Cloud Run / Cloud SQL
   (SSH)                   (us-west2-a)        (Private IPs)
```

### 3.3 Jumpbox Requirements

| Requirement | Specification |
|-------------|---------------|
| **OS** | Container-Optimized OS (COS) - auto-updates |
| **Machine Type** | e2-micro (sufficient for testing) |
| **Zone** | Same region as Cloud Run (e.g., us-west2-a) |
| **Network** | Same VPC as Cloud Run |
| **External IP** | None (private only for security) |
| **Access Method** | IAP (Identity-Aware Proxy) tunneling only |
| **Shielded VM** | Required by org policy |

### 3.4 IAP Roles Required

Before you can SSH to the jumpbox, your Google Admin MUST grant you these roles:

| Role | Purpose |
|------|---------|
| `roles/iap.tunnelResourceAccessor` | Allow IAP tunnel connection |
| `roles/compute.osLogin` | Allow SSH login to VM |

**Commands for Admin:**
```bash
# Grant IAP Tunnel access
gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="user:[YOUR_EMAIL]@noaa.gov" \
  --role="roles/iap.tunnelResourceAccessor"

# Grant OS Login access
gcloud projects add-iam-policy-binding [PROJECT_ID] \
  --member="user:[YOUR_EMAIL]@noaa.gov" \
  --role="roles/compute.osLogin"
```

### 3.5 Create Jumpbox VM

**Step 1: Create Subnet (if not exists)**
```bash
gcloud compute networks subnets create jumpbox-subnet-[REGION] \
  --network=[VPC_NETWORK] \
  --region=[REGION] \
  --range=10.98.64.0/24 \
  --enable-private-ip-google-access \
  --project=[PROJECT_ID]
```

**Step 2: Create IAP Firewall Rule**
```bash
gcloud compute firewall-rules create allow-iap-ssh \
  --network=[VPC_NETWORK] \
  --allow=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --target-tags=iap-ssh \
  --description="Allow SSH via IAP tunnel" \
  --project=[PROJECT_ID]
```

**Step 3: Create Jumpbox VM**
```bash
gcloud compute instances create [APP]-jumpbox \
  --project=[PROJECT_ID] \
  --zone=[ZONE] \
  --machine-type=e2-micro \
  --subnet=projects/[PROJECT_ID]/regions/[REGION]/subnetworks/jumpbox-subnet-[REGION] \
  --no-address \
  --metadata=enable-oslogin=TRUE \
  --service-account=[APP]-runner@[PROJECT_ID].iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=iap-ssh \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=10GB \
  --shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring
```

### 3.6 Connect to Jumpbox

```bash
gcloud compute ssh [APP]-jumpbox \
  --zone=[ZONE] \
  --project=[PROJECT_ID] \
  --tunnel-through-iap
```

### 3.7 Test Cloud Run from Jumpbox

```bash
# Once connected to jumpbox:
curl -s https://[CLOUD_RUN_URL]/ | head -20
curl -I https://[CLOUD_RUN_URL]/
```

### 3.8 Connect to Cloud SQL from Jumpbox

```bash
# Using Docker (COS has Docker pre-installed)
docker run -it --rm postgres:15 \
  psql "postgresql://[USER]:[PASSWORD]@[PRIVATE_IP]:5432/[DATABASE]"
```

### 3.9 Cost Management

Stop the jumpbox when not in use to save costs:

```bash
# Stop (saves ~$3-5/month)
gcloud compute instances stop [APP]-jumpbox --zone=[ZONE] --project=[PROJECT_ID]

# Start when needed
gcloud compute instances start [APP]-jumpbox --zone=[ZONE] --project=[PROJECT_ID]
```

---

## 4. Application Architecture Types

### 4.1 Public-Facing Web Applications

**Description:** Applications accessible from the public internet for external users (e.g., incident reporting, data portals, public APIs).

**Access Pattern:**
```
Public Internet → NMFS TIC/Perimeter → Shared VPC → Private Service Connect → Internal ALB → Cloud Run
```

**Key Requirements:**
- Internal Application Load Balancer (NOT external)
- Private Service Connect endpoint
- Connection to NMFS Shared VPC
- TIC-compliant ingress routing
- SCR/CCB approval required

### 4.2 Internal-Only Applications

**Description:** Applications accessible only from within NOAA networks (e.g., admin dashboards, internal tools).

**Access Pattern:**
```
NOAA VPN/Network → Internal ALB → Cloud Run
```

**Key Requirements:**
- Internal Application Load Balancer
- VPC connectivity (no Private Service Connect needed)
- Cloud Run ingress set to `internal`

---

## 5. Network Architecture Requirements

### 5.1 TIC Compliance (Critical)

**IMPORTANT:** All public-facing traffic MUST flow through NOAA's Trusted Internet Connection (TIC). Direct external access bypasses TIC and is NOT APPROVED.

| Pattern | Approval Status | Notes |
|---------|----------------|-------|
| External Load Balancer → Cloud Run | ❌ NOT APPROVED | Bypasses TIC completely |
| Internal ALB + Private Service Connect | ✅ APPROVED | TIC-compliant pattern |
| Cloud Run with `allUsers` IAM | ❌ BLOCKED | Org policy prevents this |
| Cloud Armor + External LB | ❌ NOT APPROVED | Still bypasses TIC |

### 5.2 Approved Architecture Components

#### 5.2.1 Internal Application Load Balancer
- **Type:** Regional Internal Application Load Balancer
- **Scheme:** `INTERNAL_MANAGED`
- **Deployment:** Admin team deploys via platform Terraform
- **Developer Responsibility:** Provide Serverless NEG pointing to Cloud Run

#### 5.2.2 Private Service Connect (PSC)
- **Purpose:** Exposes internal LB to the NMFS perimeter network
- **Deployment:** Network team creates after SCR approval
- **Requirements:** Forwarding rule and static internal IP

#### 5.2.3 Serverless Network Endpoint Group (NEG)
- **Purpose:** Points to Cloud Run service for load balancer routing
- **Developer Managed:** Yes
- **Preserved during migrations:** Yes (reused by internal LB)

### 5.3 Cloud Run Ingress Settings

| Setting | Use Case |
|---------|----------|
| `internal-and-cloud-load-balancing` | Standard - allows internal VPC + LB traffic |
| `internal` | Most restrictive - VPC traffic only |
| `all` | ❌ NOT RECOMMENDED - bypasses network controls |

**Terraform Configuration:**
```hcl
resource "google_cloud_run_service" "app" {
  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }
}
```

---

## 6. IAM Roles & Service Accounts

### 6.1 Principle of Least Privilege

Every application MUST have a dedicated service account with only the permissions required for operation. Do NOT use default service accounts.

### 6.2 Application Runtime Service Account

**Naming Convention:** `[app-name]-runner@[project-id].iam.gserviceaccount.com`

**Required Roles:**

| Role | Purpose | Scope |
|------|---------|-------|
| `roles/cloudsql.client` | Connect to Cloud SQL | Project |
| `roles/secretmanager.secretAccessor` | Read secrets | Project or Secret |
| `roles/storage.objectAdmin` | Read/write media files | Bucket |
| `roles/aiplatform.user` | Call Vertex AI APIs | Project (if using AI) |

**Creation Command:**
```bash
gcloud iam service-accounts create [app-name]-runner \
  --display-name="[App Name] Application Runner" \
  --project=[PROJECT_ID]
```

### 4.3 Developer Account Roles

Developers need these roles for deployment:

| Role | Purpose |
|------|---------|
| `roles/run.admin` | Deploy and manage Cloud Run services |
| `roles/cloudsql.admin` | Manage Cloud SQL instances |
| `roles/iam.serviceAccountUser` | Run services as the app SA |
| `roles/secretmanager.admin` | Create and manage secrets |
| `roles/storage.admin` | Create and manage buckets |
| `roles/compute.admin` | Manage compute resources (NEGs) |
| `roles/servicenetworking.networksAdmin` | Configure VPC peering |

**Note:** Some roles require admin approval due to org policies. Work with your Google Admin to obtain necessary permissions.

### 4.4 Service Account Impersonation

When your developer account lacks certain permissions, you can use **service account impersonation** to build and deploy with elevated privileges. This is the approved pattern when direct permissions are restricted.

**Impersonation Command:**
```bash
gcloud builds submit \
  --tag "gcr.io/[PROJECT_ID]/[APP_NAME]" \
  --impersonate-service-account=[SERVICE_ACCOUNT]@[PROJECT_ID].iam.gserviceaccount.com \
  --project=[PROJECT_ID]
```

**Requirements for Impersonation:**
1. Your user account must have `roles/iam.serviceAccountTokenCreator` on the target SA
2. The target SA must have the permissions needed for the operation
3. Cloud Build SA must be able to act as the target SA

**Example from MRA Deployment:**
```bash
gcloud builds submit \
  --tag "gcr.io/ggn-nmfs-wcrmmrapp-dev-1/entanglement-app" \
  --impersonate-service-account=mra-app-runner@ggn-nmfs-wcrmmrapp-dev-1.iam.gserviceaccount.com \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### 4.5 Blocked IAM Configurations

The following are blocked by NOAA org policies:

| Configuration | Status | Alternative |
|--------------|--------|-------------|
| `allUsers` on Cloud Run | ❌ BLOCKED | Use Internal LB + PSC |
| `allAuthenticatedUsers` | ❌ BLOCKED | Use specific user/SA principals |
| Public bucket access | ❌ BLOCKED | Use signed URLs or application proxy |

---

## 5. Database Configuration (Cloud SQL)

### 5.1 Instance Requirements

- **Engine:** PostgreSQL 15 (recommended) or MySQL 8
- **Tier:** Start with `db-f1-micro` for dev, scale for production
- **Region:** Deploy in same region as Cloud Run
- **High Availability:** Enable for production workloads

### 5.2 Private IP Configuration (Required)

Cloud SQL MUST use private IP connectivity via VPC Peering.

**Step 1: Reserve IP Range**
```bash
gcloud compute addresses create sql-private-ip-block \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=20 \
  --network=[VPC_NETWORK] \
  --project=[PROJECT_ID]
```

**Step 2: Create VPC Peering**
```bash
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=sql-private-ip-block \
  --network=[VPC_NETWORK] \
  --project=[PROJECT_ID]
```

### 5.3 Cloud Run Connection

Use Cloud SQL Proxy via Unix socket:

**Cloud Run Annotation:**
```hcl
metadata {
  annotations = {
    "run.googleapis.com/cloudsql-instances" = "[PROJECT]:[REGION]:[INSTANCE]"
  }
}
```

**DATABASE_URL Format:**
```
postgres://[USER]:[PASSWORD]@localhost/[DATABASE]?host=/cloudsql/[PROJECT]:[REGION]:[INSTANCE]
```

---

## 6. Storage Configuration (Cloud Storage)

### 6.1 Bucket Requirements

- **Uniform Bucket-Level Access:** Required (org policy)
- **Public Access Prevention:** Enforced (org policy)
- **Location:** Same region as application

**Creation Command:**
```bash
gcloud storage buckets create gs://[BUCKET_NAME] \
  --location=[REGION] \
  --uniform-bucket-level-access \
  --public-access-prevention \
  --project=[PROJECT_ID]
```

### 6.2 Accessing Media Files

Since public bucket access is blocked, use one of these patterns:

| Pattern | Use Case |
|---------|----------|
| Signed URLs | Temporary access to specific objects |
| Application Proxy | Route all file access through your app |
| Authenticated API | Require user authentication for downloads |

---

## 7. Secrets Management

### 7.1 Secret Manager Configuration

All sensitive data MUST be stored in Secret Manager, NOT in environment variables or code.

**Required Secrets:**
- `DATABASE_URL` - Database connection string
- `AUTH_SECRET` - Application authentication secret
- API keys for external services

### 7.2 Regional Replication

Use user-managed replication in the application region:

```bash
gcloud secrets create [SECRET_NAME] \
  --replication-policy="user-managed" \
  --locations="[REGION]" \
  --project=[PROJECT_ID]
```

### 7.3 Accessing Secrets in Cloud Run

**Terraform Configuration:**
```hcl
env {
  name = "DATABASE_URL"
  value_from {
    secret_key_ref {
      name = "DATABASE_URL"
      key  = "latest"
    }
  }
}
```

---

## 8. Security Requirements

### 8.1 Organization Policy Constraints

These org policies are enforced and cannot be overridden:

| Policy | Effect |
|--------|--------|
| `constraints/run.allowedIngress` | Forces `internal-and-cloud-load-balancing` |
| `constraints/iam.allowedPolicyMemberDomains` | Blocks `allUsers`, `allAuthenticatedUsers` |
| `constraints/storage.publicAccessPrevention` | Blocks public bucket access |
| `constraints/compute.requireShieldedVm` | Requires Shielded VMs |

### 8.2 SSL/TLS Certificates

- **Provider:** Request from ra@noaa.gov
- **Domain:** Must be approved NOAA domain (e.g., `*.fisheries.noaa.gov`)
- **Responsibility:** Developer requests and maintains certificate
- **Installation:** Applied to Internal Application Load Balancer

### 8.3 Authentication Patterns

| Pattern | Recommended For |
|---------|----------------|
| NextAuth.js / Auth.js | Web applications with user login |
| IAP (Identity-Aware Proxy) | Internal tools requiring Google auth |
| API Keys | Service-to-service communication |
| OAuth 2.0 | External API integrations |

---

## 9. SCR/CCB Approval Process

### 9.1 When SCR is Required

Security Change Requests (SCR) are required for:
- Private Service Connect endpoints
- New network configurations
- Changes to shared VPC
- Public-facing application deployments
- New external integrations

### 9.2 CCB Review Timeline

- **Submission:** Via JIRA Service Desk
- **Review:** Weekly Change Control Board (CCB) meeting
- **Approval Time:** Typically 1-2 weeks

### 9.3 What to Include in SCR

1. Application name and purpose
2. Architecture diagram
3. Network requirements (IPs, ports, protocols)
4. Security controls implemented
5. Data classification
6. Rollback plan

---

## 10. Deployment Workflow

### 10.1 Pre-Deployment Checklist

- [ ] Dedicated service account created
- [ ] IAM roles granted (may require admin)
- [ ] Cloud SQL instance created with private IP
- [ ] VPC peering configured
- [ ] GCS bucket created
- [ ] Secrets stored in Secret Manager
- [ ] Dockerfile tested locally
- [ ] Serverless NEG created
- [ ] SSL certificate requested from ra@noaa.gov
- [ ] SCR submitted for network configuration

### 10.2 Container Build Commands

**Standard Build (with direct permissions):**
```bash
gcloud builds submit \
  --tag "gcr.io/[PROJECT_ID]/[APP_NAME]" \
  --project=[PROJECT_ID]
```

**Build with Service Account Impersonation (when permissions restricted):**
```bash
gcloud builds submit \
  --tag "gcr.io/[PROJECT_ID]/[APP_NAME]" \
  --impersonate-service-account=[SA_NAME]@[PROJECT_ID].iam.gserviceaccount.com \
  --project=[PROJECT_ID]
```

### 10.3 Deploy via Terraform

```bash
cd terraform
terraform init
terraform plan -var="container_image=gcr.io/[PROJECT_ID]/[APP_NAME]"
terraform apply -var="container_image=gcr.io/[PROJECT_ID]/[APP_NAME]"
```

### 10.4 Post-Deployment

1. **Verify Cloud Run service is healthy**
2. **Notify admin team** - They deploy Internal LB via platform Terraform
3. **Wait for SCR approval** - Network team creates PSC endpoint
4. **Test end-to-end connectivity** - Through TIC path
5. **DNS configuration** - Point domain to PSC endpoint

---

## 11. Common Issues & Solutions

### 11.1 Issue: 403 Forbidden from Cloud Run

**Cause:** `allUsers` IAM binding is blocked by org policy

**Solution:** 
- Use Internal LB + Private Service Connect
- Cannot grant public access directly to Cloud Run

### 11.2 Issue: External Load Balancer Returns 403/404

**Cause:** External LBs bypass TIC and are not approved

**Solution:**
- Delete external LB resources
- Request Internal LB deployment from admin team
- Submit SCR for Private Service Connect

### 11.3 Issue: Cloud Build Permission Denied

**Cause:** Developer account lacks required permissions

**Solution:**
Use service account impersonation:
```bash
gcloud builds submit \
  --impersonate-service-account=[SA]@[PROJECT].iam.gserviceaccount.com \
  --tag "gcr.io/[PROJECT]/[APP]"
```

### 11.4 Issue: Cannot Create VPC Peering

**Cause:** Missing `servicenetworking.networksAdmin` role

**Solution:**
- Request role from Google Admin
- Or have admin create peering connection

### 11.5 Issue: Secret Access Denied

**Cause:** Service account missing `secretmanager.secretAccessor` role

**Solution:**
```bash
gcloud secrets add-iam-policy-binding [SECRET_NAME] \
  --member="serviceAccount:[SA_EMAIL]" \
  --role="roles/secretmanager.secretAccessor"
```

### 11.6 Issue: Cloud SQL Connection Timeout

**Cause:** VPC peering not configured or Cloud SQL Proxy misconfigured

**Solution:**
- Verify `sql-private-ip-block` exists
- Verify VPC peering is established
- Check Cloud Run annotation includes correct instance connection name

---

## 12. Resource Naming Conventions

| Resource Type | Naming Pattern | Example |
|--------------|----------------|---------|
| Project | `ggn-nmfs-[app]-[env]-[n]` | `ggn-nmfs-wcrmmrapp-dev-1` |
| Cloud Run | `nmfs-[app]-app` | `nmfs-mra-app` |
| Cloud SQL | `nmfs-[app]-db-instance` | `nmfs-mra-db-instance` |
| GCS Bucket | `nmfs-[app]-media` | `nmfs-mra-media` |
| Service Account | `[app]-runner` | `mra-app-runner` |
| Serverless NEG | `nmfs-[app]-neg` | `nmfs-mra-neg` |
| Secrets | `UPPERCASE_WITH_UNDERSCORES` | `DATABASE_URL` |

---

## 13. Contact Information

| Role | Contact | Purpose |
|------|---------|---------|
| Google Admin | Platform Team | IAM permissions, project setup |
| Network Team | Via JIRA Service Desk | Private Service Connect, shared VPC |
| Security Team | Via SCR Process | Security reviews, approvals |
| RA (Registration Authority) | ra@noaa.gov | SSL certificates |
| Google Office Hours | Every Monday 4PM ET | General GCP questions |

**JIRA Service Desk:** https://apps-st.fisheries.noaa.gov/jira/servicedesk/customer/portal/14

---

## Appendix A: Terraform Module Template

See `terraform/main.tf` in this repository for a complete working example of:
- Cloud Run service configuration
- Secret Manager integration
- Cloud SQL connection
- Service account attachment
- Environment variable configuration

---

## Appendix B: Key Commands Reference

### Authentication
```bash
gcloud auth login [USER]@noaa.gov
gcloud config set project [PROJECT_ID]
```

### Service Account Impersonation
```bash
# Build with impersonation
gcloud builds submit --impersonate-service-account=[SA]@[PROJECT].iam.gserviceaccount.com

# Run commands as service account
gcloud auth print-access-token --impersonate-service-account=[SA]@[PROJECT].iam.gserviceaccount.com
```

### Serverless NEG
```bash
# Create
gcloud compute network-endpoint-groups create [NEG_NAME] \
  --region=[REGION] \
  --network-endpoint-type=serverless \
  --cloud-run-service=[SERVICE_NAME]

# Describe
gcloud compute network-endpoint-groups describe [NEG_NAME] --region=[REGION]
```

### Cloud Run Proxy (Local Testing)
```bash
gcloud run services proxy [SERVICE_NAME] --region=[REGION]
```

---

## Appendix C: DoD PKI Certificate Requirements (Added May 26, 2026)

### C.1 Certificate Generation Process

For applications requiring DoD-signed SSL certificates:

1. **Generate Private Key & CSR locally:**
   ```bash
   mkdir -p certs
   openssl genrsa -out certs/app.key 2048
   openssl req -new -key certs/app.key -out certs/app.csr \
     -subj "/CN=your-app.fisheries.noaa.gov" -sha256
   ```

2. **Submit CSR to DoD PKI Portal** (via NOAA IT security team)

3. **Save signed certificate** to `certs/app.cer` (PEM format)

4. **Add to .gitignore** - NEVER commit private keys:
   ```
   certs/
   *.key
   *.csr
   *.cer
   ```

### C.2 Terraform Self-Managed Certificate

```hcl
resource "google_compute_ssl_certificate" "dod_cert" {
  name        = "app-dod-ssl-cert"
  private_key = file("${path.module}/../certs/app.key")
  certificate = file("${path.module}/../certs/app.cer")
  
  lifecycle {
    create_before_destroy = true
  }
}
```

### C.3 Internal ALB with DoD Certificate

```hcl
# Serverless NEG for Cloud Run
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  name                  = "app-serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run { service = google_cloud_run_service.app.name }
}

# Backend Service
resource "google_compute_backend_service" "backend" {
  name                  = "app-backend-service"
  protocol              = "HTTPS"
  load_balancing_scheme = "INTERNAL_MANAGED"
  backend { group = google_compute_region_network_endpoint_group.serverless_neg.id }
}

# URL Map
resource "google_compute_region_url_map" "url_map" {
  name            = "app-url-map"
  region          = var.region
  default_service = google_compute_backend_service.backend.id
}

# Target HTTPS Proxy with DoD Certificate
resource "google_compute_region_target_https_proxy" "https_proxy" {
  name             = "app-https-proxy"
  region           = var.region
  url_map          = google_compute_region_url_map.url_map.id
  ssl_certificates = [google_compute_ssl_certificate.dod_cert.id]
}

# Internal Forwarding Rule
resource "google_compute_forwarding_rule" "forwarding_rule" {
  name                  = "app-internal-https-rule"
  region                = var.region
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_region_target_https_proxy.https_proxy.id
  network               = "your-vpc-network"
  subnetwork            = "your-subnet"
}
```

---

## Appendix D: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 20, 2026 | Mike McCully | Initial document based on MRA deployment experience |
| 2.0 | May 22, 2026 | Mike McCully | Added Section 2 (Regional Requirements), Section 3 (Jumpbox/IAP); Critical guidance for us-west2/us-east4 deployment |
| 2.1 | May 26, 2026 | Mike McCully | Added Appendix C: DoD PKI Certificate Requirements and Internal ALB Terraform patterns |

---

**End of Document**
