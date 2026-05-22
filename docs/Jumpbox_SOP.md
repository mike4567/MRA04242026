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
gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap

**First time only:** You'll be prompted to create SSH keys. Press `Y` to continue.

### 2. Test Cloud Run Service from Jumpbox

Once connected to the jumpbox, test the Cloud Run service:

```bash
# Test the app home page
curl -s https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/ | head -20

# Test the login page
curl -s https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/login | head -20

# Check health/connectivity
curl -I https://nmfs-mra-app-ibkcsx465a-wl.a.run.app/
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

### 4. SSH Port Forwarding (Browse App from Local Machine)

To browse the Cloud Run app from your local machine's browser via the jumpbox:

**Terminal 1 - Start IAP Tunnel:**
```bash
gcloud compute ssh mra-jumpbox \
  --zone=us-west2-a \
  --project=ggn-nmfs-wcrmmrapp-dev-1 \
  --tunnel-through-iap \
  -- -L 8080:nmfs-mra-app-ibkcsx465a-wl.a.run.app:443
```

**Then open in browser:**
```
https://localhost:8080
```

*Note: You may get a certificate warning since you're accessing via localhost.*

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

---

*Document created: May 22, 2026*
*Last updated: May 22, 2026 (Migrated to us-west2)*
