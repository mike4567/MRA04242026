CREATE OR REPLACE VIEW public_incidents_view AS
SELECT
    id,
    location,
    additional_location_info,
    media_urls,
    status,
    reported_at,
    responder_notes,
    animal_type,
    animal_life_status,
    conditions,
    detailed_description
FROM
    incidents
WHERE
    status <> 'Deleted';
