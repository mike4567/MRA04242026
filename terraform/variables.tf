# ==============================================================================
# TERRAFORM VARIABLES - Marine Response Application
# ==============================================================================
# NMFS GCP Migration - Firebase dependencies removed
# ==============================================================================

# ------------------------------------------------------------------------------
# GCP Project Configuration
# ------------------------------------------------------------------------------
variable "project_id" {
  description = "The GCP project ID for the NMFS Marine Response Application"
  type        = string
}

variable "region" {
  description = "The GCP region for resource deployment"
  type        = string
  default     = "us-west1"
}

# ------------------------------------------------------------------------------
# Container Configuration
# ------------------------------------------------------------------------------
variable "container_image" {
  description = "The full container image path in Artifact Registry"
  type        = string
}

# ------------------------------------------------------------------------------
# Database Configuration
# ------------------------------------------------------------------------------
variable "db_password" {
  description = "Password for the app_user database user (from previous provisioning)"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# Authentication (NextAuth.js)
# ------------------------------------------------------------------------------
variable "auth_secret" {
  description = "Secret key for NextAuth.js session encryption"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# API Keys - Google Services
# ------------------------------------------------------------------------------
variable "google_maps_api_key" {
  description = "Google Maps API key for location services"
  type        = string
  sensitive   = true
}

variable "google_ai_api_key" {
  description = "Google AI (Gemini) API key for AI features"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# API Keys - Twilio (SMS Notifications)
# ------------------------------------------------------------------------------
variable "twilio_account_sid" {
  description = "Twilio Account SID for SMS services"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token for SMS services"
  type        = string
  sensitive   = true
}

variable "twilio_messaging_service_sid" {
  description = "Twilio Messaging Service SID"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# API Keys - SendGrid (Email Notifications)
# ------------------------------------------------------------------------------
variable "sendgrid_api_key" {
  description = "SendGrid API key for email services"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# Application Configuration
# ------------------------------------------------------------------------------
variable "next_public_base_url" {
  description = "The public base URL for the application (Cloud Run URL)"
  type        = string
}
