terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
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
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "aiplatform.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# ==============================================================================
# 2. SECURITY IDENTITY (The "Janitor")
# ==============================================================================
resource "google_service_account" "app_sa" {
  account_id   = "mra-app-runner"
  display_name = "Marine Response App Runtime Identity"
  description  = "Identity used strictly by Cloud Run to access backing services."
  depends_on   = [google_project_service.apis]
}

# ==============================================================================
# 3. STORAGE (SAFE MODE: PRESERVING "mra-media")
# ==============================================================================
resource "google_storage_bucket" "media_bucket" {
  name          = "mra-media" # CRITICAL: Matches your existing bucket
  location      = var.region
  force_destroy = false 

  uniform_bucket_level_access = true
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# ==============================================================================
# 4. DATABASE (SAFE MODE: PRESERVING EXISTING NAMES)
# ==============================================================================
resource "random_id" "db_suffix" {
  byte_length = 4
}

resource "google_sql_database_instance" "postgres" {
  name             = "mra-db-instance-a9e0d26f" # Hardcoded to match your output
  database_version = "POSTGRES_15"
  region           = var.region
  deletion_protection = false 

  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled = true 
    }
    
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "database" {
  name     = "entanglement_db"
  instance = google_sql_database_instance.postgres.name
}

resource "random_password" "db_password" {
  length  = 16
  special = false
}

resource "google_sql_user" "db_user" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

resource "google_secret_manager_secret" "db_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_url_val" {
  secret = google_secret_manager_secret.db_url.id
  secret_data = "postgres://app_user:${random_password.db_password.result}@localhost/entanglement_db?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
}

# ==============================================================================
# 5. IAM BINDINGS (Least Privilege)
# ==============================================================================

resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_storage_bucket_iam_member" "storage_admin" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# ==============================================================================
# 6. CLOUD RUN (SAFE MODE: PRESERVING "entanglement-app")
# ==============================================================================
resource "google_cloud_run_service" "app" {
  name     = "entanglement-app" # CRITICAL: Matches your existing service
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.app_sa.email
      timeout_seconds      = 300
      
      containers {
        image = var.container_image
        
        # --- Environment Variables ---
        env {
            name = "GCS_BUCKET_NAME"
            value = google_storage_bucket.media_bucket.name
        }
        env {
            name = "GOOGLE_CLOUD_PROJECT"
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
        
        # Secrets injected from variables
        env {
            name = "GOOGLE_MAPS_API_KEY"
            value = var.google_maps_api_key
        }
        env {
            name = "GOOGLE_API_KEY"
            value = var.google_ai_api_key
        }
        env {
            name = "TWILIO_ACCOUNT_SID"
            value = var.twilio_account_sid
        }
        env {
            name = "TWILIO_AUTH_TOKEN"
            value = var.twilio_auth_token
        }
        env {
            name = "TWILIO_MESSAGING_SERVICE_SID"
            value = var.twilio_messaging_service_sid
        }
        env {
             name = "NEXT_PUBLIC_BASE_URL"
             value = var.next_public_base_url
        }
        env {
             name = "NEXT_PUBLIC_FIREBASE_API_KEY"
             value = var.firebase_api_key
        }
        env {
            name = "FIREBASE_ADMIN_PRIVATE_KEY"
            value = var.firebase_admin_private_key
        }
		env {
            name = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
            value = var.google_maps_api_key
        }
		env {
            name = "SENDGRID_API_KEY"
            value = var.sendgrid_api_key
        }
      }
    }
    
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
        "run.googleapis.com/client-name"        = "terraform"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.apis, google_sql_database_instance.postgres]
}
# ==============================================================================
# 7. PUBLIC ACCESS (Unlock the Front Door)
# ==============================================================================
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}
# ==============================================================================
# 8. PUBLIC STORAGE ACCESS (Allow Images to Load)
# ==============================================================================
resource "google_storage_bucket_iam_member" "public_read_access" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}