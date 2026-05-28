terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ==============================================================================
# 1. ENABLE APIS
# ==============================================================================
# These APIs are required for Cloud Run, Cloud SQL, Secret Manager, and AI.
# Firestore API has been removed as part of the Firebase-to-GCP migration.
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# ==============================================================================
# 2. SECURITY IDENTITY (Application Runtime Service Account)
# ==============================================================================
# This service account is used by Cloud Run to access backing services.
# It should already exist from previous provisioning. Using data block to reference.
data "google_service_account" "app_sa" {
  account_id = "mra-app-runner"
}

# ==============================================================================
# 3. STORAGE - EXISTING BUCKET (nmfs-mra-media-west2)
# ==============================================================================
# The GCS bucket was migrated to us-west2 on May 22, 2026.
# Using data block to reference the existing bucket.
data "google_storage_bucket" "media_bucket" {
  name = "nmfs-mra-media-west2"
}

# ==============================================================================
# 4. DATABASE - EXISTING CLOUD SQL INSTANCE (nmfs-mra-db-west2)
# ==============================================================================
# The Cloud SQL instance was migrated to us-west2 on May 22, 2026.
# Using data blocks to reference the existing resources.
data "google_sql_database_instance" "postgres" {
  name = "nmfs-mra-db-west2"
}

# Note: google_sql_database and google_sql_user do not have data sources.
# We reference them by known names in the DATABASE_URL secret.

# ==============================================================================
# 5. SECRETS - DATABASE_URL
# ==============================================================================
# The DATABASE_URL secret for Cloud Run to connect to Cloud SQL.
# Using user_managed replication with us-west1 to comply with org policy.
resource "google_secret_manager_secret" "db_url" {
  secret_id = "DATABASE_URL"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_url_val" {
  secret      = google_secret_manager_secret.db_url.id
  secret_data = "postgres://app_user:${var.db_password}@localhost/nmfs-entanglement_db?host=/cloudsql/${data.google_sql_database_instance.postgres.connection_name}"
}

# ==============================================================================
# 6. SECRETS - AUTH_SECRET (NextAuth.js)
# ==============================================================================
# Required by NextAuth.js for session encryption.
# Using user_managed replication with us-west1 to comply with org policy.
resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "AUTH_SECRET"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "auth_secret_val" {
  secret      = google_secret_manager_secret.auth_secret.id
  secret_data = var.auth_secret
}

# ==============================================================================
# 7. IAM BINDINGS
# ==============================================================================
# NOTE: Project-level IAM bindings removed due to org policy restrictions.
# The following roles must be granted by your Google Admin to mra-app-runner SA:
#   - roles/cloudsql.client
#   - roles/aiplatform.user
#   - roles/secretmanager.secretAccessor
#
# Bucket-level IAM for storage access (this should work with SA Admin role)
resource "google_storage_bucket_iam_member" "storage_admin" {
  bucket = data.google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.google_service_account.app_sa.email}"
}

# ==============================================================================
# 8. CLOUD RUN SERVICE (nmfs-mra-app)
# ==============================================================================
# The Next.js application deployed to Cloud Run with NMFS naming convention.
# All Firebase environment variables have been removed.
resource "google_cloud_run_service" "app" {
  name     = "nmfs-mra-app"
  location = var.region

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }

  template {
    spec {
      service_account_name = data.google_service_account.app_sa.email
      timeout_seconds      = 300
      
      containers {
        image = var.container_image
        
        # --- Environment Variables ---
        # GCP Project and Storage
        env {
          name  = "GCS_BUCKET_NAME"
          value = data.google_storage_bucket.media_bucket.name
        }
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        
        # Database URL from Secret Manager
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_url.secret_id
              key  = "latest"
            }
          }
        }
        
        # NextAuth.js Secret from Secret Manager
        env {
          name = "AUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.auth_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        # NextAuth.js Configuration
        env {
          name  = "NEXTAUTH_URL"
          value = var.next_public_base_url
        }
        
        # Google Maps API Key
        env {
          name  = "GOOGLE_MAPS_API_KEY"
          value = var.google_maps_api_key
        }
        env {
          name  = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
          value = var.google_maps_api_key
        }
        
        # Google AI (Gemini) API Key
        env {
          name  = "GOOGLE_API_KEY"
          value = var.google_ai_api_key
        }
        
        # Twilio Configuration
        env {
          name  = "TWILIO_ACCOUNT_SID"
          value = var.twilio_account_sid
        }
        env {
          name  = "TWILIO_AUTH_TOKEN"
          value = var.twilio_auth_token
        }
        env {
          name  = "TWILIO_MESSAGING_SERVICE_SID"
          value = var.twilio_messaging_service_sid
        }
        
        # SendGrid Configuration
        env {
          name  = "SENDGRID_API_KEY"
          value = var.sendgrid_api_key
        }
        
        # Application Base URL
        env {
          name  = "NEXT_PUBLIC_BASE_URL"
          value = var.next_public_base_url
        }
      }
    }
    
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = data.google_sql_database_instance.postgres.connection_name
        "run.googleapis.com/client-name"        = "terraform"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.db_url_val,
    google_secret_manager_secret_version.auth_secret_val
  ]
}

# ==============================================================================
# 9. INTERNAL APPLICATION LOAD BALANCER (ADMIN-MANAGED)
# ==============================================================================
# The Internal Application Load Balancer was created by the Google Admin team
# via platform Terraform on May 27, 2026. DO NOT create these resources here.
#
# ADMIN-CREATED RESOURCES:
#   - Certificate: mra-fisheries-noaa-gov-05272026 (expires 2029-05-26)
#   - Backend Service: mra-backend → nmfs-mra-neg
#   - URL Map: mra-lb-url-map
#   - HTTPS Proxy: mra-lb-https-proxy
#   - Forwarding Rule: mra-lb-frontend (IP: 10.150.0.2)
#   - PSC Attachment: mra-psc-attachment (ACCEPT_MANUAL)
#
# The Serverless NEG (nmfs-mra-neg) was created earlier by the developer.
# It points to the Cloud Run service and is referenced by the admin's backend.
# ==============================================================================

# ==============================================================================
# NOTE: Public access blocked by org policy - use Internal ALB managed by admin
# ==============================================================================
# Access is provided through:
#   1. Internal Application Load Balancer (admin-managed, IP: 10.150.0.2)
#   2. Private Service Connect (mra-psc-attachment)
#   3. Jumpbox for curl/API testing

# ==============================================================================
# NOTE: Public storage access removed due to org policy constraints
# ==============================================================================
# The organization policy enforces "public access prevention" on storage buckets.
# Media files will need to be served through signed URLs or the application.

# ==============================================================================
# OUTPUTS
# ==============================================================================
output "cloud_run_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.app.status[0].url
}

output "cloud_sql_connection_name" {
  description = "The connection name for the Cloud SQL instance"
  value       = data.google_sql_database_instance.postgres.connection_name
}

output "gcs_bucket_name" {
  description = "The name of the GCS media bucket"
  value       = data.google_storage_bucket.media_bucket.name
}

# Internal LB is admin-managed - static values from admin deployment
output "internal_lb_ip" {
  description = "The internal IP address of the Load Balancer (admin-managed)"
  value       = "10.150.0.2"
}

output "ssl_certificate_name" {
  description = "The name of the DoD PKI SSL certificate (admin-managed)"
  value       = "mra-fisheries-noaa-gov-05272026"
}

output "psc_attachment_name" {
  description = "The Private Service Connect attachment (admin-managed)"
  value       = "mra-psc-attachment"
}
