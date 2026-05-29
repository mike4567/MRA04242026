# MRA Jumpbox Standard Operating Procedures (SOP)

## Overview

The **mra-jumpbox** is a Container-Optimized OS (COS) virtual machine that provides secure internal access to:
- Cloud Run service (`nmfs-mra-app`)
- Cloud SQL database (`nmfs-mra-db-west2`)

## Infrastructure Details

| Component | Value |
|-----------|-------|
| **VM Name** | `mra-jumpbox` |
| **Zone** | `us-west2-a` |
| **Machine Type** | `e2-micro` |
| **Internal IP** | `10.98.64.2` |
| **OS** | Container-Optimized OS (auto-updating) |
| **Network** | `mra-local-network` |
| **Subnet** | `jumpbox-subnet-west2` (10.98.64.0/24) |
| **External IP** | None (private only) |
| **Access Method** | IAP (Identity-Aware Proxy) tunneling |

## ⚠️ REQUIRED: Admin Action Needed

Before you can use IAP tunneling, your Google Admin must grant you the following role:

```
Role: IAP Tunnel Resource Accessor (roles/iap.tunnelResourceAccessor)
Member: user:mike.mccully@noaa.gov
Scope: Project (ggn-nmfs-wcrmmrapp-dev-1) or Instance (mra-jumpbox)
```

**Commands for Admin to run:**

```bash
# 1. Grant IAP Tunnel access (required for SSH to jumpbox)
gcloud projects add-iam-policy-binding ggn-nmfs-wcrmmrapp-dev-1 \
  --member="user:mike.mccully@noaa.gov" \
  --role="roles/iap.tunnelResourceAccessor"

# 2. Grant OS Login access (required for SSH into the VM)
gcloud projects add-iam-policy-binding ggn-nmfs-wcrmmrapp-dev-1 \
  --member="user:mike.mccully@noaa.gov" \
  --role="roles/compute.osLogin"
```

**Alternative: Grant via Google Cloud Console**
1. Go to IAM & Admin > IAM
2. Find `mike.mccully@noaa.gov`
3. Click Edit (pencil icon)
4. Add roles:
   - `IAP-secured Tunnel User` (roles/iap.tunnelResourceAccessor)
   - `Compute OS Login` (roles/compute.osLogin)
5. Save

---

## Procedures

### 1. Connect to Jumpbox via IAP SSH

**From Windows (PowerShell or Command Prompt):**
| Authenticate developer to GCP with NOAA credentials |
gcloud auth login mike.mccully@noaa.gov

| Set the active GCP project for all subsequent commands |
gcloud config set project ggn-nmfs-wcrmmrapp-dev-1

gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap

**First time only:** You'll be prompted to create SSH keys. Press `Y` to continue.

### 2. Test Cloud Run Service from Jumpbox

Once connected to the jumpbox, you can test the Cloud Run service. Since the service has `internal-and-cloud-load-balancing` ingress restriction, you need to authenticate using the VM's service account identity.

**Step 1: Get an Identity Token**
```bash
# Retrieve an identity token from the metadata server
TOKEN=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://nmfs-mra-app-ibkcsx465a-wl.a.run.app" -H "Metadata-Flavor: Google")
```

**Step 2: Test the Application with Authentication**
```bash
# Test the app home page (authenticated)
curl -H "Authorization: Bearer $TOKEN" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app

# Test the login page
curl -H "Authorization: Bearer $TOKEN" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/login

# Check health/connectivity (shows HTTP status)
curl -I -H "Authorization: Bearer $TOKEN" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/

# Pretty-print JSON API responses (if applicable)
curl -s -H "Authorization: Bearer $TOKEN" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/api/health | jq .
```

**Expected Output:** You should receive the full HTML content of the "West Coast Marine Incidents" application home page, indicating the service is running correctly.

**Quick Combined Command:**
```bash
# One-liner to test the app
curl -H "Authorization: Bearer $(curl -s 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://nmfs-mra-app-ibkcsx465a-wl.a.run.app' -H 'Metadata-Flavor: Google')" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app
```

### 3. Connect to Cloud SQL Database

The Cloud SQL database is accessible via private IP from the jumpbox.

**Option A: Using Cloud SQL Proxy (Recommended)**

```bash
# Start the Cloud SQL Auth Proxy in a Docker container
docker run -d --name sql-proxy \
  gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14.3 \
  --address=0.0.0.0 \
  --port=5432 \
  ggn-nmfs-wcrmmrapp-dev-1:us-west2:nmfs-mra-db-west2

# Connect using psql (in another docker container)
docker run -it --rm --network host postgres:15 \
  psql "postgresql://app_user:YOUR_PASSWORD@localhost:5432/nmfs-entanglement_db"
```

**Option B: Direct Connection via Private IP**

```bash
# Cloud SQL Private IP: 10.98.17.3
docker run -it --rm postgres:15 \
  psql "postgresql://app_user:YOUR_PASSWORD@10.98.17.3:5432/nmfs-entanglement_db"
```

**Useful psql Commands:**
```sql
-- List all tables
\dt

-- Describe a table
\d incidents

-- Query recent incidents
SELECT id, species, created_at FROM incidents ORDER BY created_at DESC LIMIT 10;

-- Check users
SELECT id, email, role FROM users;

-- Exit
\q
```

### 4. Browse Application in Web Browser

There are several methods to access the web application with a full browser experience.

---

#### Option A: Cloud Run Proxy (Recommended - Easiest)

The Cloud Run proxy authenticates using your local gcloud credentials. Run this from your **local Windows machine** (not the jumpbox):

**Step 1: Start the Proxy**
```powershell
gcloud run services proxy nmfs-mra-app --region=us-west2 --project=ggn-nmfs-wcrmmrapp-dev-1 --port=9999
```

**Step 2: Open Browser**
```
http://127.0.0.1:9999
```

The proxy will authenticate using your `mike.mccully@noaa.gov` credentials (which must have `roles/run.invoker` on the service).

**To stop the proxy:** Press `Ctrl+C` in the terminal.

---

#### Option B: SSH Tunnel with IAP + SOCKS Proxy

This method creates a SOCKS proxy through the jumpbox, allowing full browser access.

**Step 1: Start SOCKS Proxy (from local machine)**

*Windows PowerShell:*
```powershell
gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap --ssh-flag="-D" --ssh-flag="1080" --ssh-flag="-N"
```

*Linux/Mac/Git Bash:*
```bash
gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap -- -D 1080 -N
```

**Step 2: Configure Browser to Use SOCKS Proxy**

*Firefox:*
1. Settings → Network Settings → Settings
2. Select "Manual proxy configuration"
3. SOCKS Host: `127.0.0.1`, Port: `1080`
4. Select "SOCKS v5"
5. Check "Proxy DNS when using SOCKS v5"
6. Click OK

*Chrome (Windows):*
```powershell
# Start Chrome with SOCKS proxy
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --proxy-server="socks5://127.0.0.1:1080" --user-data-dir="C:\temp\chrome-proxy"
```

**Step 3: Navigate to the App**

With the SOCKS proxy configured, you still need authentication. Use the direct URL:
```
https://nmfs-mra-app-ibkcsx465a-wl.a.run.app
```

*Note: This method routes traffic through the jumpbox but you may still need IAM authentication for Cloud Run.*

---

#### Option C: SSH Port Forwarding (Legacy Method)

To browse the Cloud Run app from your local machine's browser via direct port forwarding:

**Terminal 1 - Start IAP Tunnel:**

*Windows PowerShell:*
```powershell
gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap --ssh-flag="-L" --ssh-flag="8080:nmfs-mra-app-ibkcsx465a-wl.a.run.app:443"
```

*Linux/Mac/Git Bash:*
```bash
gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap -- -L 8080:nmfs-mra-app-ibkcsx465a-wl.a.run.app:443
```

**Then open in browser:**
```
https://localhost:8080
```

*Note: You may get a certificate warning since you're accessing via localhost. This method may have authentication issues with Cloud Run's IAM requirements.*

---

#### Recommended Testing Workflow

1. **For Quick Testing:** Use **Option A (Cloud Run Proxy)** - simplest setup
2. **For Full Internal Network Access:** Use **Option B (SOCKS Proxy)** - most comprehensive
3. **For Curl/API Testing:** SSH to jumpbox and use identity token method (Section 2)

---

## Cost Management

### Start the Jumpbox (when needed)
```bash
gcloud compute instances start mra-jumpbox \
  --zone=us-west2-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

### Stop the Jumpbox (when done)
```bash
gcloud compute instances stop mra-jumpbox \
  --zone=us-west2-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

**Cost Note:** An e2-micro VM costs approximately $3-5/month when running 24/7. Stop it when not in use to save costs.

### Check Jumpbox Status
```bash
gcloud compute instances describe mra-jumpbox \
  --zone=us-west2-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --format="value(status)"
```

---

## Maintenance

### COS Auto-Updates

Container-Optimized OS **automatically updates itself**. No manual patching required!

The VM will automatically:
- Download security patches
- Apply OS updates during maintenance windows
- Reboot if necessary (typically during low-traffic periods)

### Check OS Version
```bash
# From inside the jumpbox
cat /etc/os-release
```

### View System Logs
```bash
# From inside the jumpbox
sudo journalctl -u docker --since "1 hour ago"
```

### Restart the VM (if needed)
```bash
gcloud compute instances reset mra-jumpbox \
  --zone=us-west2-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Troubleshooting

### "not authorized" Error (4033)
**Cause:** Missing IAP Tunnel Resource Accessor role
**Solution:** Have your admin grant the role (see Admin Action Required section above)

### "Connection refused" when connecting to Cloud SQL
**Cause:** VM not on the same network as Cloud SQL private IP
**Solution:** Verify the jumpbox is on `mra-local-network` and can reach `10.98.17.3`

### SSH Keys Not Found
**Cause:** First-time SSH setup
**Solution:** Let gcloud create the keys automatically when prompted

### "Remote side unexpectedly closed network connection"
**Cause:** IAP permission issue or firewall blocking
**Solution:** 
1. Verify `allow-iap-ssh` firewall rule exists
2. Verify you have `roles/iap.tunnelResourceAccessor`

### Check Firewall Rules
```bash
gcloud compute firewall-rules list \
  --filter="network:mra-local-network" \
  --project=ggn-nmfs-wcrmmrapp-dev-1
```

---

## Security Notes

1. **No External IP:** The jumpbox has no public IP, reducing attack surface
2. **IAP Only:** All access is authenticated through Google's Identity-Aware Proxy
3. **Least Privilege:** The VM runs with the `mra-app-runner` service account
4. **Shielded VM:** Secure boot, vTPM, and integrity monitoring enabled
5. **Auto-Updates:** COS automatically applies security patches

---

## Quick Reference

| Task | Command |
|------|---------|
| Connect to jumpbox | `gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap` |
| Start jumpbox | `gcloud compute instances start mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1` |
| Stop jumpbox | `gcloud compute instances stop mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1` |
| Check status | `gcloud compute instances describe mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --format="value(status)"` |
| **Browse app (local)** | `gcloud run services proxy nmfs-mra-app --region=us-west2 --project=ggn-nmfs-wcrmmrapp-dev-1 --port=9999` then open `http://127.0.0.1:9999` |
| **Test via jumpbox** | `TOKEN=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://nmfs-mra-app-ibkcsx465a-wl.a.run.app" -H "Metadata-Flavor: Google") && curl -H "Authorization: Bearer $TOKEN" https://nmfs-mra-app-ibkcsx465a-wl.a.run.app` |
| **Local DB via IAP tunnel** | `gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap --ssh-flag="-L" --ssh-flag="5432:10.98.17.3:5432" --ssh-flag="-N"` |

---

## Local Development with Private Cloud SQL

Since the Cloud SQL instance (`nmfs-mra-db-west2`) only has a private IP (`10.98.17.3`) and no public IP, the standard Cloud SQL Auth Proxy will NOT work from your local machine. Instead, use an IAP SSH tunnel through the jumpbox.

### Setup Steps

1. **Start the IAP Tunnel** (in a separate terminal - keep it running):
   ```powershell
   gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap --ssh-flag="-L" --ssh-flag="5432:10.98.17.3:5432" --ssh-flag="-N"
   ```
   
2. **Verify the tunnel is listening**:
   ```powershell
   netstat -an | findstr ":5432"
   # Should show: TCP 127.0.0.1:5432 ... LISTENING
   ```

3. **Test the database connection**:
   ```powershell
   node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://app_user:YOUR_PASSWORD@127.0.0.1:5432/nmfs-entanglement_db' }); pool.query('SELECT current_database()').then(r => { console.log('Connected to:', r.rows[0].current_database); pool.end(); }).catch(e => { console.error('ERROR:', e.message); pool.end(); });"
   ```

4. **Start Next.js development server**:
   ```powershell
   npm run dev
   ```

### Important Notes
- The IAP tunnel must remain open in a separate terminal while developing
- Your `.env.local` should use `127.0.0.1:5432` as the database host
- Do NOT use the Cloud SQL Auth Proxy for this database (it requires VPC network access)

---

*Document created: May 22, 2026*
*Last updated: May 29, 2026 (Added local development via IAP tunnel section)*
