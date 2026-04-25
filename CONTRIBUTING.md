# Contributing to Marine Response App

We follow a structured workflow to ensure stability and security. Please follow these guidelines when contributing code.

## Workflow

1.  **Never push directly to `main`.**
    * The `main` branch is our production-ready code.
    * Always create a "Feature Branch" for your work.

2.  **Branch Naming Convention:**
    * `feature/new-login-page`
    * `bugfix/fix-upload-error`
    * `infrastructure/update-terraform`

3.  **Commit Messages:**
    * Be descriptive.
    * *Bad:* "Fixed it."
    * *Good:* "Fixed Identity Platform login error by updating API keys."

## Deployment Process

1.  Test your changes locally (`npm run dev`).
2.  Commit your changes to your feature branch.
3.  Merge your branch into `main`.
4.  Create a **Release** (e.g., v1.1) in GitHub to mark the stable version.
5.  Deploy via Terraform/Cloud Build.