-- ============================================================================
-- Migration: Environmental Risk Data Integration
-- Date: 2026-06-12
-- Author: MRA Development Team
-- Purpose: Add fields to capture NOAA CoastWatch ERDDAP environmental data
--          at the time of incident report (Sea Surface Temperature, risk maps)
-- ============================================================================

-- Add environmental risk data fields to incidents table
-- These fields capture NOAA CoastWatch ERDDAP data for scientific analysis

ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS risk_map_url TEXT;

ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS risk_data_details JSONB;

-- Add descriptive comments for documentation
COMMENT ON COLUMN incidents.risk_map_url IS 'NOAA CoastWatch ERDDAP WMS URL for SST risk map snapshot at time of report';
COMMENT ON COLUMN incidents.risk_data_details IS 'Raw JSON payload from ERDDAP GridDAP containing SST values and metadata';

-- Verify the columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incidents' 
        AND column_name = 'risk_map_url'
    ) THEN
        RAISE NOTICE 'SUCCESS: risk_map_url column added to incidents table';
    ELSE
        RAISE WARNING 'FAILED: risk_map_url column was not added';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incidents' 
        AND column_name = 'risk_data_details'
    ) THEN
        RAISE NOTICE 'SUCCESS: risk_data_details column added to incidents table';
    ELSE
        RAISE WARNING 'FAILED: risk_data_details column was not added';
    END IF;
END $$;
