resource "google_secret_manager_secret" "app_secrets" {
  for_each  = toset([
    "DATABASE_URL",
    "GOOGLE_MAPS_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_MESSAGING_SERVICE_SID",
    "RESPONDER_PHONE_NUMBER",
    "SENDGRID_API_KEY"
  ])
  secret_id = each.key
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}