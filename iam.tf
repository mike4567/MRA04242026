# Create a dedicated Service Account for the app
resource "google_service_account" "app_sa" {
  account_id   = "entanglement-app-sa"
  display_name = "Entanglement App Service Account"
}

# Grant access to Firestore
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# Grant access to Secret Manager
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# Grant access to Vertex AI (for Genkit)
resource "google_project_iam_member" "ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}