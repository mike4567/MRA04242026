# Security Policy

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

If you discover a security issue (e.g., exposed API keys, SQL injection risk, or PII leakage), please report it immediately to the project administrator via email or secure channel.

## Sensitive Information

* **Never commit** `.env` files, `terraform.tfstate`, or private keys.
* If a secret is accidentally committed, rotate the credential immediately in the Google Cloud Console and purge the git history.