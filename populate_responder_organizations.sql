-- This script populates the responder_organizations table with the initial data.
-- It will not overwrite existing organizations with the same name.

INSERT INTO responder_organizations (name, address, contact_name, website, response_area, response_type, created_at, updated_at) VALUES
('Channel Islands Marine and Wildlife Institute', 'P.O. Box 4250 Santa Barbara CA 93140', NULL, 'http://www.cimwi.org', NULL, 'Live and Dead Pinniped Response and Rehab; Live  Cetacean and Sea Turtle Response and Short-term Holding.  Santa Barbara and Ventura Counties and Channel Islands', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Channel Islands Cetacean Research Unit', '1425 W. Valerio St. Santa Barbara CA 93101', NULL, 'http://cicru.org', NULL, 'Dead Cetacean Response.
San Luis Obispo through Ventura Counties and Channel Islands.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Marine Mammal Care Center of Los Angeles', '3601 South Gaffey Street #8 San Pedro CA 90731', NULL, 'http://www.marinemammalcare.org', NULL, 'Live Pinniped Response and Rehab; Live Cetacean and Sea Turtle Stabilization and Short-Term Holding; Los Angelas County', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Ocean Animal Response and Research Alliance', 'Not Listed', NULL, 'http://www.oarra.org', NULL, 'Dead Cetacean, Sea Turtle, Pinniped Response.
Los Angeles County', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Northcoast Marine Mammal Center', '424 Howe Drive Crescent City CA 95531', NULL, 'http://www.northcoastmmc.org', NULL, 'Live Pinniped Response and Rehab;  Live Cetacean and Sea Turtle  Response and Transport.
Del Norte and Humboldt Counties.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Humboldt State University', '1 Harpst Street Arcata CA 95521', NULL, 'http://gsp.humboldt.edu/Projects/MMSP/Site1/MMERP.html', NULL, 'Dead Pinniped, Cetacean, and Sea Turtle Response.  Del Norte, Humboldt and Northern Mendocino Counties.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Pacific Marine Mammal Center', '20612 Laguna Canyon Road Laguna Beach CA 92651', NULL, 'http://www.pacificmmc.org', NULL, 'Live Pinniped Response and Rehab; Live Cetacean and Sea Turtle Stabilization and Short-Term Holding; Dead Pinniped, Cetacean, and Sea Turtle Response.
Orange County.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Sea World of California', '500 SeaWorld Drive San Diego CA 92109', NULL, 'http://www.seaworld.org', NULL, 'Live Piniped, Cetacean and Sea Turtle Response and Rehab. San Diego County', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('NMFS Southwest Fisheries Science Center', '8901 La Jolla Shores Dr. La Jolla CA 92037', NULL, 'http://swfsc.noaa.gov', NULL, 'Dead Cetacean, Sea Turtle, Pinniped Response. San Diego County', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('The Marine Mammal Center', '3601 South Gaffey Street #8 San Pedro CA 90731', NULL, 'http://www.marinemammalcenter.org', NULL, 'Live Pinniped, Cetacean, and Sea Turtle Response and Rehab.  Mendocino through San Luis Obispo Counties,
including San Francisco Bay and Delta areas.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('California Academy of Sciences', '55 Music Concourse Drive Golden Gate Park San Francisco CA 94118', NULL, 'http://www.calacademy.org', NULL, 'Dead Pinniped, Cetacean, and Sea Turtle Response.  Southern Mendocino to San Mateo Counties,  including San Francisco Bay and Delta areas.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Long Marine Laboratory', '130 McAllister Way Santa Cruz CA 95060', NULL, 'http://lmlstrandingnetwork.ucsc.edu/', NULL, 'Dead Pinniped, Cetacean, and Sea Turtle  Response; Live Cetacean Response and Rehab.  Santa Cruz County.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Moss Landing Marine Laboratories', '8272 Moss Landing Road Moss Landing CA 95039', NULL, 'http://birdmam.mlml.calstate.edu/stranding-network/', NULL, 'Dead Pinniped, Cetacean, and Sea Turtle Response.  Monterey County', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('California Wildlife Center', 'P.O. Box 2022 Malibu CA 90265', NULL, 'http://www.cawildlife.org', NULL, 'Live Seal and Sea Lion Response and Rehab; Dead Seal, Sea Lion, Whale, Dolphin, Porpoise, and Sea Turtle Response. Malibu City Limits and Topanga Beach.', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Cascadia Research Collective', '218 1/2 W. 4th Ave. Olympia WA 98501', NULL, 'http://www.cascadiaresearch.org', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Central Puget Sound Marine Mammal Stranding Network', '485 Labella Vista Way Freeland WA 98249', NULL, 'http://www.orcanetwork.org', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Feiro Marine Life Center', '315 N Lincoln Street Port Angeles WA 98362', NULL, 'Not Listed', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Makah Fisheries', '150 Resort Drive Neah Bay WA 98357', NULL, 'http://www.makah.com', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('MaST Center Stranding Team', 'P.O. Box 98000 MS 29-3 Des Moines WA 98198', NULL, 'https://mast.highline.edu', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Port Townsend Marine Science Center', '532 Battery Way Port Townsend WA 98368', NULL, 'http://www.ptmsc.org/', NULL, 'For live animals after 5:00 pm call Center Valley Animal Rescue: 
360-765-0598', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('San Juan County Marine Mammal Stranding Network', '62 1st Street North Friday Harbor WA 98250', NULL, 'https://whalemuseum.org/pages/marine-mammal-stranding-network', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Seal Sitters Marine Mammal Stranding Network', '4701 SW Admiral Way #167 Seattle WA 98116', NULL, 'http://www.sealsitters.org', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Sno-King Marine Mammal Response', '7323 25th Ave NW Seattle WA 98117', NULL, 'Not Listed', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Whatcom County Marine Mammal Stranding Network', '2172 Division Street Bellingham WA 98226', NULL, 'https://whatcomhumane.org/wildlife/', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('World Vets', 'Not Listed', NULL, 'https://worldvets.org/marine-mammal-response2/', NULL, '24 hour or less care for small pinnipeds in Washington State', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('OSU Marine Mammal Institute', '2030 SE Marine Science Drive Newport OR 97365', NULL, 'http://mmi.oregonstate.edu/ommsn', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('WDFW Marine Mammal Investigations', '7801 E. Phillips Road S.W. Lakewood WA 98498', NULL, 'http://wdfw.wa.gov/', NULL, 'Pinnipeds', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Cascadia Research Collective - Whales, Dolphins, & Porpoises', '218 1/2 W. 4th Ave. Olympia WA 98501', NULL, 'http://www.cascadiaresearch.org/', NULL, 'Cetaceans', '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Portland State University / Seaside Aquarium', '630 SW Mill Street Portland OR 97201', NULL, 'Not Listed', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z'),
('Olympic National Park', NULL, NULL, 'Not Listed', NULL, NULL, '2026-02-19T20:35:28.260507Z', '2026-02-19T22:22:41.977512Z')
ON CONFLICT (name) DO NOTHING;
