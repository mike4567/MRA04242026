#!/bin/bash
# =============================================================================
# DoD PKI Certificate Signing Request (CSR) Generator
# Domain: mra.fisheries.noaa.gov
# 
# NIST SP 800-218 Compliance: This script generates cryptographic materials
# for secure TLS communication in accordance with federal security standards.
# =============================================================================

set -e

# Configuration
DOMAIN="mra.fisheries.noaa.gov"
KEY_FILE="certs/mra_app.key"
CSR_FILE="certs/mra_app.csr"
KEY_SIZE=2048

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}DoD PKI CSR Generator${NC}"
echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Create certs directory if it doesn't exist
if [ ! -d "certs" ]; then
    echo -e "${GREEN}Creating certs/ directory...${NC}"
    mkdir -p certs
fi

# Step 1: Generate 2048-bit RSA Private Key
echo -e "${GREEN}Step 1: Generating ${KEY_SIZE}-bit RSA private key...${NC}"
openssl genrsa -out "${KEY_FILE}" ${KEY_SIZE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Private key generated: ${KEY_FILE}${NC}"
else
    echo -e "${RED}  ✗ Failed to generate private key${NC}"
    exit 1
fi

# Step 2: Generate CSR with clean PKCS#10 format (no MS extensions)
# Using a minimal subject with only CN to avoid DoD portal issues
echo -e "${GREEN}Step 2: Generating PKCS#10 CSR...${NC}"
openssl req -new \
    -key "${KEY_FILE}" \
    -out "${CSR_FILE}" \
    -subj "/CN=${DOMAIN}" \
    -sha256

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ CSR generated: ${CSR_FILE}${NC}"
else
    echo -e "${RED}  ✗ Failed to generate CSR${NC}"
    exit 1
fi

# Verify the CSR
echo ""
echo -e "${GREEN}Step 3: Verifying CSR...${NC}"
openssl req -in "${CSR_FILE}" -noout -verify
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ CSR verification passed${NC}"
fi

# Display CSR details
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}CSR Subject Details:${NC}"
echo -e "${YELLOW}========================================${NC}"
openssl req -in "${CSR_FILE}" -noout -subject

# Display the CSR content for DoD portal
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}CSR CONTENT FOR DoD PKI PORTAL${NC}"
echo -e "${YELLOW}Copy everything below (including BEGIN/END lines):${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
cat "${CSR_FILE}"
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Files Generated:${NC}"
echo -e "  Private Key: ${KEY_FILE}"
echo -e "  CSR File:    ${CSR_FILE}"
echo ""
echo -e "${RED}SECURITY REMINDER:${NC}"
echo -e "  • The private key (${KEY_FILE}) must NEVER be shared"
echo -e "  • Add 'certs/' to .gitignore immediately"
echo -e "  • Store the key securely after certificate issuance"
echo -e "${YELLOW}========================================${NC}"
