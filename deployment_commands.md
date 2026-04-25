# Deployment Commands

Here are the commands to rebuild and deploy your application.

**1. Set your Project ID**

First, get your Google Cloud Project ID and store it in a PowerShell variable. You'll use this in the next steps.

```powershell
# Get your project ID from gcloud config
$PROJECT_ID = gcloud config get-value project
```

**2. Build the container image**

Run this command from the root directory of your project. It builds a container image with your latest code and pushes it to Google Container Registry (GCR).

```powershell
gcloud builds submit --tag "gcr.io/$($PROJECT_ID)/entanglement-app" .
```

**3. Apply Terraform changes**

Navigate to your `terraform` directory and run `terraform apply`. You'll pass the name of the image you just built as a variable.

```powershell
cd terraform

# Initialize Terraform (if you haven't already)
terraform init

# Apply the infrastructure changes
terraform apply -var="container_image=gcr.io/$($PROJECT_ID)/entanglement-app"
```

**Note:** The `terraform apply` command will show you a plan of the changes and ask for your confirmation before applying them.
