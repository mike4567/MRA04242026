resource "google_cloud_run_v2_service" "default" {
  name                = "entanglement-app"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = true

  template {
    service_account = google_service_account.app_sa.email

    # --- NEW: Define the Database Volume ---
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        # This references the DB created in main.tf
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = var.container_image
      
      # --- NEW: Mount the Database Volume ---
      # This creates the folder /cloudsql inside the container
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      # Resources
      resources {
        limits = {
          cpu    = "1000m"
          memory = "1024Mi"
        }
      }

      # Environment Variables (Non-sensitive)
      env {
        name  = "NEXT_PUBLIC_BASE_URL"
        value = "https://entanglement-app-jfynik2bsa-uc.a.run.app"
      }
      
      env {
        name  = "NEXT_PUBLIC_BUCKET_NAME"
        value = "mra-media"
      }

      # 1. Frontend Key
      env {
        name = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_MAPS_API_KEY"
            version = "latest"
          }
        }
      }

      # 2. Backend Key
      env {
        name = "GOOGLE_MAPS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_MAPS_SERVER_KEY"
            version = "latest"
          }
        }
      }

      # 3. AI Key
      env {
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_API_KEY"
            version = "latest"
          }
        }
      }

      # Secrets
      dynamic "env" {
        for_each = toset([
          "TWILIO_ACCOUNT_SID",
          "TWILIO_AUTH_TOKEN",
          "TWILIO_MESSAGING_SERVICE_SID",
          "RESPONDER_PHONE_NUMBER",
          "DATABASE_URL"
        ])
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.key
              version = "latest"
            }
          }
        }
      }
    }
  }
  depends_on = [google_project_service.apis, google_sql_database_instance.postgres]
}

resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_storage_bucket_iam_member" "app_bucket_access" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_storage_bucket" "media_bucket" {
  name          = "mra-media"
  location      = var.region
  storage_class = "STANDARD"
  public_access_prevention    = "inherited"
  uniform_bucket_level_access = true
  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "HEAD", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "public_read_access" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
# --- NEW: Allow Cloud Run to Connect to Cloud SQL ---
resource "google_project_iam_member" "sql_client_role" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}