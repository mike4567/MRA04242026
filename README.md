# West Coast Marine Mammal Report & Rescue

![Status](https://img.shields.io/badge/status-stable-green)
![Tech](https://img.shields.io/badge/stack-Next.js_|_PostgreSQL_|_GCP-blue)
![Compliance](https://img.shields.io/badge/compliance-FedRAMP_High_Ready-orange)

## ⚠️ SECURITY WARNING: Do Not Commit Secrets

**This repository is shared on GitHub.** Never commit:
- Database credentials or connection strings
- API keys (Google Maps, Twilio, Genkit/Gemini)
- Service account JSON key files
- Access tokens, session secrets, or refresh tokens
- `.env.local` or any files containing real credentials
- Screenshots showing real tokens, PII, or incident data

See **[SECURITY.md](SECURITY.md)** for complete security guidelines.

---

## TL;DR

FedRAMP-compliant Next.js application for reporting, tracking, and responding to marine mammal stranding incidents along the US West Coast. Features AI-powered incident triage, geospatial responder routing, and a secure dashboard for NOAA/Responder personnel.

**This application bridges the public and NOAA Fisheries to protect marine mammals.**

---

## Overview

The **West Coast Marine Mammal Report & Rescue Application (MRA)** is a production-ready web application designed to modernize the incident reporting workflow for marine animal entanglements and strandings.

### Purpose

This application:
- Enables public reporting of distressed marine animals (whales, dolphins, seals, sea turtles)
- Uses AI and geolocation logic to instantly notify the correct authorized response team
- Provides secure dashboards for NOAA and authorized responders
- Maintains FedRAMP compliance through GCP enterprise-grade services

### Problem Statement

The traditional phone-based hotline system creates information bottlenecks where critical details (photos, precise location, animal condition) are lost in verbal translation. This application augments the live-attendant hotline with an AI-enhanced web submission, enabling direct capture of critical event attributes and rich media.

**Result**: ✅ Faster response times, improved situational awareness, and better outcomes for marine mammals.

---

## 🚀 Features

### Public Reporting Portal
- User-friendly, single-page wizard for submitting reports
- Interactive Google Map with geolocation and manual address entry
- Species identification (Cetacean vs. Pinniped), life status, and condition capture
- Photo/video upload to Google Cloud Storage
- Multi-lingual accessibility (planned)

### AI-Powered Triage
- **Genkit (Gemini 2.0 Flash/Pro)** analyzes uploaded media and descriptions
- Generates concise incident summaries for responders
- Reduces response latency with immediate, actionable intelligence

### Dynamic Responder Routing
- Queries **ArcGIS API** (Marine Mammal Stranding Network layer) using incident coordinates
- Applies complex logic based on location, status (Live vs. Dead), and type (Pinniped vs. Cetacean)
- **Twilio SMS** alerts sent immediately to assigned responders

### Administrative Dashboard
- **Google Authentication** (GCIP) secured access
- Real-time incident list with status workflow management
- Responder routing configuration (geo-fencing)
- Private vs. public data separation for reporter privacy

### Public Dashboard
- Open-access interface for community members
- Historical and real-time log of reported incidents
- Status transparency (Response Underway, Resolved)
- Sanitized data view protecting sensitive information

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend/Backend** | [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS |
| **UI Components** | Shadcn UI |
| **Database** | Google Cloud SQL (PostgreSQL 15) |
| **Authentication** | Google Cloud Identity Platform (GCIP) |
| **AI/ML** | Firebase Genkit + Google Gemini |
| **Compute** | Google Cloud Run (containerized, serverless) |
| **Storage** | Google Cloud Storage (media uploads) |
| **Infrastructure** | Terraform (Infrastructure as Code) |
| **SMS Notifications** | Twilio |
| **Mapping** | Google Maps Platform (geocoding, interactive maps) |
| **Geospatial** | ArcGIS/Esri (stranding network jurisdictions) |
| **Secrets Management** | Google Secret Manager |

---

## 📁 Repository Structure

```
MRA04242026/
├── README.md                    # This file
├── SECURITY.md                  # Security guidelines (READ THIS!)
├── CONTRIBUTING.md              # Contribution guidelines
├── package.json                 # Node.js dependencies
├── Dockerfile                   # Container configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── schema.sql                   # Database schema
├── migration*.sql               # Database migrations
├── public/                      # Static assets
│   └── icons/                   # Application icons
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── incidents/           # Incident management pages
│   │   ├── login/               # Authentication pages
│   │   ├── report/              # Public reporting pages
│   │   └── confirmation/        # Submission confirmation
│   ├── components/              # Reusable React components
│   ├── context/                 # React context providers
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and configuration
│   ├── services/                # External service integrations
│   └── types/                   # TypeScript type definitions
├── terraform/                   # Infrastructure as Code
│   ├── main.tf                  # Main Terraform configuration
│   └── variables.tf             # Terraform variables
└── icons/                       # Additional icons and assets
```

---

## ⚙️ Environment Configuration

When setting up local development, you'll need these environment variables:

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Project Admin | Cloud SQL connection string |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Project Admin | Firebase/GCIP configuration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Project Admin | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project Admin | GCP project identifier |
| `GENKIT_API_KEY` | Project Admin | Gemini AI service key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Project Admin | Google Maps Platform key |
| `TWILIO_ACCOUNT_SID` | Project Admin | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Project Admin | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | Project Admin | SMS sender number |
| `NEXTAUTH_SECRET` | Generate locally | Session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your setup | Application base URL |

### Environment File Template

Create a `.env.local` file (never commit this):

```bash
# .env.local (This file is automatically ignored by .gitignore)
DATABASE_URL=YOUR_CONNECTION_STRING_HERE
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_HERE
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID_HERE
GENKIT_API_KEY=YOUR_GENKIT_API_KEY_HERE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_MAPS_API_KEY_HERE
TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN_HERE
TWILIO_PHONE_NUMBER=YOUR_TWILIO_NUMBER_HERE
NEXTAUTH_SECRET=GENERATE_WITH_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud SDK (optional, for deployment)
- Cloud SQL Proxy (for database connectivity)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mike4567/MRA04242026.git
   cd MRA04242026
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Create a `.env.local` file in the root directory
   - Contact the project administrator for required credentials
   - See [Environment Configuration](#️-environment-configuration) section above

4. **Start Cloud SQL Proxy** (if connecting to Cloud SQL):
   ```bash
   ./cloud-sql-proxy.exe --port 5432 PROJECT_ID:REGION:INSTANCE_NAME
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

---

## ☁️ Deployment

Deployment is managed via **Google Cloud Build** and **Terraform**.

### Infrastructure
- Located in the `/terraform` directory
- Uses Terraform for Infrastructure as Code (IaC)
- Provisions Cloud Run, Cloud SQL, IAM roles, and Secrets

### Manual Deployment

```bash
# Build and push container image
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/app-repo/nextjs-app:v[VERSION] .

# Apply Terraform configuration
cd terraform
terraform init
terraform plan
terraform apply -var="container_image=us-central1-docker.pkg.dev/PROJECT_ID/app-repo/nextjs-app:v[VERSION]"
```

---

## 🔒 Security Best Practices

### Before Contributing

🔒 **Never commit secrets** - Use environment variables for all sensitive data  
📖 **Read SECURITY.md** - Understand what is safe to share  
✅ **Use placeholders** - All code examples must use obvious placeholder values  
🔍 **Review before committing** - Double-check for sensitive files  
🚫 **No real data** - Never commit screenshots or dumps with real tokens or PII

### Security Checklist (Required for all commits)

- [ ] No hardcoded credentials in source code
- [ ] No `.env.local` or similar files in the commit
- [ ] All example code uses placeholder values (`YOUR_API_KEY_HERE`)
- [ ] No real tokens in test files or documentation
- [ ] No screenshots containing real tokens or PII
- [ ] No actual marine mammal incident data or reporter information
- [ ] Terraform files contain no sensitive variable values
- [ ] Ran `git status` to verify only intended files are staged

**When in doubt, don't commit it.** Consult [SECURITY.md](SECURITY.md) or your security team.

---

## 🔧 Troubleshooting

### Database Connection Fails

1. Verify Cloud SQL Proxy is running
2. Check `DATABASE_URL` format and credentials
3. Confirm Cloud SQL instance is accessible
4. Verify service account has appropriate permissions

### Authentication Issues

- Double-check Firebase/GCIP configuration values
- Ensure no extra spaces or characters in environment variables
- Verify credentials are for the correct GCP project
- Clear browser cookies and try again

### AI Features Not Working

- Verify `GENKIT_API_KEY` is set correctly
- Check Gemini API quota and billing status
- Review application logs for API error messages

### SMS Notifications Not Sending

- Verify Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)
- Check Twilio phone number is valid and SMS-enabled
- Review Twilio console for message logs and errors

### Map Not Loading

- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check Google Cloud Console for API restrictions
- Ensure Maps JavaScript API is enabled for your project

---

## 📚 Resources

### Internal
- **Project Administrator**: Contact for credentials and configuration
- **NOAA Security Team**: Contact for security concerns
- **CONTRIBUTING.md**: Guidelines for contributing to this project

### External Documentation
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Firebase Genkit Documentation](https://firebase.google.com/docs/genkit)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Google Maps Platform Documentation](https://developers.google.com/maps)

---

## 📋 Compliance

This application is designed to meet federal compliance requirements:

| Framework | Status |
|-----------|--------|
| **FedRAMP High** | ✅ Ready |
| **NIST SP 800-218** (SSDF) | ✅ Aligned |
| **NAO 201-118** (IT Management) | ✅ Compliant |
| **NAO 212-13** (Environmental Data) | ✅ Compliant |

---

## 📄 License

This project is intended for NOAA internal use and authorized partner organizations.

---

## 📞 Contact

**Repository Maintainer**: MRA Development Team  
**Project Administrator**: Contact for credentials and access  
**Last Updated**: June 5, 2026  
**Status**: Production - Stable

---

## ⚡ Important Reminders

🔒 **Security First** - Never commit real credentials  
📖 **Read the Docs** - Check SECURITY.md before contributing  
🌊 **Mission Critical** - This app helps protect marine mammals  
🚫 **No PII** - Never commit reporter or incident PII  
💬 **Ask Questions** - Contact the project administrator when in doubt
