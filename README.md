# West Coast Marine Mammal Report & Rescue

![Status](https://img.shields.io/badge/status-stable-green)
![Tech](https://img.shields.io/badge/stack-Next.js_|_PostgreSQL_|_GCP-blue)
![Compliance](https://img.shields.io/badge/compliance-FedRAMP_High_Ready-orange)

A FedRAMP-compliant web application designed to streamline the reporting, tracking, and response to marine mammal stranding incidents. This application utilizes a robust PostgreSQL architecture hosted on Google Cloud Platform.

## 🚀 Features

* **Public Reporting Portal:** robust form with geolocation and media upload capabilities for public bystanders.
* **Responder Dashboard:** Secure, role-based access for authorized NOAA/Responder personnel.
* **AI Integration:** Google Genkit (Gemini) integration for automated incident summarization and responder matching.
* **Secure Infrastructure:** Fully containerized (Cloud Run) and managed via Terraform for compliance and reproducibility.
* **Data Integrity:** PostgreSQL database with automated backups and strict schema enforcement.

## 🛠️ Tech Stack

* **Frontend/Backend:** [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS
* **Database:** Google Cloud SQL (PostgreSQL 15)
* **Authentication:** Google Cloud Identity Platform (GCIP)
* **Infrastructure:** Terraform
* **AI/ML:** Firebase Genkit + Google Gemini

## 💻 Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/mike4567/Marine-Response-Repo.git](https://github.com/mike4567/Marine-Response-Repo.git)
    cd Marine-Response-Repo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory. *Note: Ask the project administrator for the required API keys and database credentials.*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## ☁️ Deployment

Deployment is managed via **Google Cloud Build** and **Terraform**.

* **Infrastructure:** Located in the `/terraform` directory.
* **Build Config:** Defined in `cloudbuild.yaml` (or via gcloud CLI commands).

To deploy a new version manually:
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/fedramp-app-prod/app-repo/nextjs-app:v[VERSION] .
cd terraform
terraform apply -var="container_image=..."
