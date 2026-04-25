-- This script alters the 'incidents' table to change the 'id' column from UUID to VARCHAR.
-- This is necessary to accommodate the new human-readable incident ID format (e.g., 20260226-8492).

ALTER TABLE incidents
ALTER COLUMN id TYPE VARCHAR(50);
