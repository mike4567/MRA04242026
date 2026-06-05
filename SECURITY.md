# Security Policy for West Coast Marine Mammal Report & Rescue Application

## ⚠️ CRITICAL: This Repository Will Be Shared on GitHub

This repository and the MRA (Marine Response Application) contain **public endpoints** but must **NEVER** include actual credentials, secrets, or sensitive operational data.

---

## Compliance References

This security policy aligns with:
- **NIST SP 800-218** (Secure Software Development Framework - SSDF)
- **NAO 201-118** (NOAA IT Management)
- **NAO 212-13** (Environmental Data Management)
- **FedRAMP High** authorization requirements

---

## What is Safe to Share (Public Information)

The following information is **safe to commit** to the public GitHub repository:

### ✅ Public Information (Safe)
- Application source code (without embedded secrets)
- Public API endpoint documentation
- Cloud Run service URLs (public endpoints)
- GCP project IDs (these are public identifiers)
- Terraform configuration files (without sensitive variables)
- Schema definitions and migration scripts (without data)
- UI/UX components and styling
- Build configuration files (`Dockerfile`, `package.json`)

These elements are designed to be publicly accessible and do not grant access without valid credentials.

---

## What MUST Be Protected (Secrets)

The following information is **SENSITIVE** and must **NEVER** be committed to the repository:

### 🔒 Secrets (Never Commit)

#### Database & Infrastructure
- **Cloud SQL credentials** - Database usernames, passwords, and connection strings
- **Service account keys** - GCP service account JSON key files
- **Terraform state files** - `*.tfstate`, `*.tfstate.backup` (contain resource details)
- **Terraform variable files** - `*.tfvars` containing sensitive values

#### Authentication & API Keys
- **GCIP credentials** - Google Cloud Identity Platform configuration secrets
- **Firebase configuration secrets** - API keys and project secrets
- **Genkit/Gemini API keys** - AI service authentication keys
- **Any GCP API keys** - Maps, Cloud Storage, or other service keys

#### Session & Token Data
- **Access Tokens** - Bearer tokens that grant access to protected resources
- **Session secrets** - Next.js session encryption keys
- **Refresh Tokens** - Long-lived tokens for obtaining new access tokens
- **Session Cookies** - Authentication session identifiers

#### Certificates & Keys
- **Private Keys** - Cryptographic private keys (`.pem`, `.key`, `.p12`, `.pfx` files)
- **SSL/TLS Certificates** - Private certificate files (`.crt`, `.cer`, `.csr`)

#### Operational Data
- **PII (Personally Identifiable Information)** - User data, reporter information
- **VMS Data** - Vessel Monitoring System data (if applicable)
- **Real incident data** - Actual marine mammal stranding records

---

## How to Obtain Required Credentials

To run the MRA application locally, you will need credentials from the project administrator:

1. **Contact Project Administrator**: Request access to the development environment
2. **Request Credentials**: Ask for:
   - Cloud SQL database connection details
   - GCIP/Firebase configuration values
   - Service account key for local development (if applicable)
   - Genkit/Gemini API key for AI features
3. **Verify Configuration**: Ensure your local environment matches the expected setup documented in the README

---

## Best Practices for Local Development

### 1. Use Environment Variables
Always store secrets in environment variables, never in code:

```bash
# .env.local (This file is automatically ignored by .gitignore)
DATABASE_URL=your_connection_string_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
GENKIT_API_KEY=your_genkit_key_here
# Add other required variables...
```

### 2. Never Commit .env Files
The repository `.gitignore` prevents committing:
- `.env`
- `.env.local`
- `.env*.local`
- `*.tfstate` and `*.tfstate.backup`
- `*.tfvars`
- `*.pem`, `*.key`, `*.crt`, `*.cer`, `*.csr`, `*.p12`, `*.pfx`
- `/certs/` directory

### 3. Use .env.example for Templates
Create or maintain a `.env.example` file with **placeholder values only**:

```bash
# .env.example (Safe to commit)
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
GENKIT_API_KEY=YOUR_GENKIT_API_KEY_HERE
NEXTAUTH_SECRET=GENERATE_WITH_openssl_rand_base64_32
```

### 4. Rotate Secrets if Accidentally Exposed
If you accidentally commit secrets to the repository:

1. **Immediately rotate the exposed credentials** through the GCP Console
2. **Remove the secrets from Git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Notify the NOAA security team** and project administrator
4. **Update your local `.env.local` with new credentials**
5. **Document the incident** per NAO security incident procedures

### 5. Code Review Checklist
Before committing code, verify:
- [ ] No hardcoded credentials in source code
- [ ] No `.env.local` or similar files in the commit
- [ ] All example code uses placeholder values (e.g., `YOUR_API_KEY_HERE`)
- [ ] No real tokens in test files or documentation
- [ ] No screenshots containing real tokens or PII
- [ ] No actual marine mammal incident data or reporter information
- [ ] Terraform files contain no sensitive variable values

---

## Testing Guidelines

### Data Requirements
- **Use synthetic/mock data only** for all testing scenarios
- **Never use production data** in development or test environments
- **Seed values**: All random number generators must use explicit seed values for reproducibility

### Token Handling During Testing

#### ✅ DO:
- Display tokens on localhost only for debugging
- Use tokens in memory only
- Clear tokens from clipboard after use
- Use incognito/private browsing for sensitive testing

#### ❌ DON'T:
- Save tokens to files
- Share screenshots of real tokens
- Commit token dumps to the repository
- Share tokens in chat/email without encryption

---

## Documentation Guidelines

When writing documentation that will be shared publicly:

### Code Examples
Use clear placeholders in all code examples:

```javascript
// ✅ GOOD - Uses obvious placeholders
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; // "YOUR_API_KEY_HERE"
const dbUrl = process.env.DATABASE_URL; // "YOUR_CONNECTION_STRING_HERE"

// ❌ BAD - Real or realistic-looking values
const apiKey = "AIzaSyB1234567890abcdef"; // Looks like real API key
const dbUrl = "postgresql://admin:secret@10.0.0.1:5432/mra"; // Looks real
```

### Screenshots
If including screenshots in documentation:
- Blur or redact any tokens, keys, or credentials displayed
- Use synthetic/test data where possible
- Focus on UI/UX elements, not actual credential values
- Never include PII from real incident reports

---

## Repository Maintenance

### Regular Security Audits
Periodically review the repository for:
- Accidentally committed secrets (use tools like `git-secrets`, `trufflehog`, or `gitleaks`)
- Stale `.env.example` files that need updating
- Documentation that inadvertently reveals sensitive patterns
- Outdated dependencies with known vulnerabilities (`npm audit`)

### Pull Request Reviews
All PRs must be reviewed for:
- Credential exposure
- Proper use of environment variables
- Updated `.env.example` if new variables are added
- PII/sensitive data exposure
- Compliance with NIST SP 800-218 secure coding practices

---

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

If you discover a security issue (e.g., exposed API keys, SQL injection risk, or PII leakage):

1. **Report immediately** to the project administrator via secure channel
2. **Do not disclose publicly** until the issue is resolved
3. **Provide details** including:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if known)

---

## Questions or Concerns?

If you have questions about what is safe to share or how to handle credentials:

1. **Project Administrator**: Contact the lead developer or project manager
2. **NOAA Security Team**: Contact your information security officer
3. **When in Doubt**: Treat information as sensitive and don't commit it

---

**Remember**: Public repositories are visible to the entire internet. Treat every commit as if it will be reviewed by external parties and audited for federal compliance.

---

**Last Updated**: June 5, 2026  
**Maintained By**: MRA Development Team  
**Compliance Framework**: NIST SP 800-218, NAO 201-118, FedRAMP High
