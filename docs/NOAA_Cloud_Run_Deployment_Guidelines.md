# NOAA Cloud Run Application Deployment Guidelines
## Google Cloud Platform within FISMA Boundaries

**Document Version:** 1.0  
**Last Updated:** May 20, 2026  
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

## 2. Application Architecture Types

### 2.1 Public-Facing Web Applications

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

### 2.2 Internal-Only Applications

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

## 3. Network Architecture Requirements

### 3.1 TIC Compliance (Critical)

**IMPORTANT:** All public-facing traffic MUST flow through NOAA's Trusted Internet Connection (TIC). Direct external access bypasses TIC and is NOT APPROVED.

| Pattern | Approval Status | Notes |
|---------|----------------|-------|
| External Load Balancer → Cloud Run | ❌ NOT APPROVED | Bypasses TIC completely |
| Internal ALB + Private Service Connect | ✅ APPROVED | TIC-compliant pattern |
| Cloud Run with `allUsers` IAM | ❌ BLOCKED | Org policy prevents this |
| Cloud Armor + External LB | ❌ NOT APPROVED | Still bypasses TIC |

### 3.2 Approved Architecture Components

#### 3.2.1 Internal Application Load Balancer
- **Type:** Regional Internal Application Load Balancer
- **Scheme:** `INTERNAL_MANAGED`
- **Deployment:** Admin team deploys via platform Terraform
- **Developer Responsibility:** Provide Serverless NEG pointing to Cloud Run

#### 3.2.2 Private Service Connect (PSC)
- **Purpose:** Exposes internal LB to the NMFS perimeter network
- **Deployment:** Network team creates after SCR approval
- **Requirements:** Forwarding rule and static internal IP

#### 3.2.3 Serverless Network Endpoint Group (NEG)
- **Purpose:** Points to Cloud Run service for load balancer routing
- **Developer Managed:** Yes
- **Preserved during migrations:** Yes (reused by internal LB)

### 3.3 Cloud Run Ingress Settings

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

## 4. IAM Roles & Service Accounts

### 4.1 Principle of Least Privilege

Every application MUST have a dedicated service account with only the permissions required for operation. Do NOT use default service accounts.

### 4.2 Application Runtime Service Account

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

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 20, 2026 | Mike McCully | Initial document based on MRA deployment experience |

---

**End of Document**
