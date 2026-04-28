# ==============================================================================
# TERRAFORM VARIABLES - Marine Response Application
# ==============================================================================
# Author: NMFS West Coast Region
# Date: 2026-04-27
# Purpose: Variable definitions for GCP infrastructure deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# PROJECT CONFIGURATION
# ------------------------------------------------------------------------------
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region for resource deployment"
  type        = string
  default     = "us-central1"
}

# ------------------------------------------------------------------------------
# RESOURCE NAMING
# ------------------------------------------------------------------------------
variable "gcs_bucket_name" {
  description = "Name of the GCS bucket for media storage"
  type        = string
  default     = "nmfs-mra-media"
}

variable "db_instance_name" {
  description = "Name of the Cloud SQL instance (leave empty for auto-generated)"
  type        = string
  default     = ""
}

variable "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "mra-app"
}

variable "container_image" {
  description = "Container image URL for Cloud Run deployment"
  type        = string
}

# ------------------------------------------------------------------------------
# API KEYS - Google Services
# ------------------------------------------------------------------------------
variable "google_maps_api_key" {
  description = "Google Maps Platform API Key"
  type        = string
  sensitive   = true
}

variable "google_ai_api_key" {
  description = "Google AI (Gemini) API Key"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# API KEYS - Twilio (SMS Notifications)
# ------------------------------------------------------------------------------
variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_messaging_service_sid" {
  description = "Twilio Messaging Service SID"
  type        = string
  sensitive   = true
}

# ------------------------------------------------------------------------------
# API KEYS - Email (SendGrid)
# ------------------------------------------------------------------------------
variable "sendgrid_api_key" {
  description = "SendGrid API Key for email notifications"
  type        = string
  sensitive   = true
  default     = ""
}

# ------------------------------------------------------------------------------
# APPLICATION CONFIGURATION
# ------------------------------------------------------------------------------
variable "next_public_base_url" {
  description = "Public base URL of the application (e.g., https://mra-app-xxxxx.run.app)"
  type        = string
}
