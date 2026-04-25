-- This script updates the responder_organizations table with the latest data.
-- It inserts a new organization if the name does not exist.
-- If the name already exists, it updates the information for that organization.

INSERT INTO responder_organizations (name, address, hotline, contact_name, website, sms_numbers, emails, response_area, response_type)
VALUES
    ('Northcoast Marine Mammal Center', '424 Howe Drive Crescent City CA 95531', '707-951-4722', NULL, 'http://www.northcoastmmc.org', NULL, NULL, 'Del Norte and Humboldt Counties, California', NULL),
    ('California Polytechnic University - Humboldt', '1 Harpst Street Arcata CA 95521', '707-826-3650 or 707-498-6200', NULL, 'http://gsp.humboldt.edu/Projects/MMSP/Site1/MMERP.html', NULL, NULL, 'Del Norte, Humboldt, and Northern Mendocino Counties, California', NULL),
    ('The Marine Mammal Center - Northern Range Operations', '2000 Bunker Road Marin Headlands Sausalito CA 94965-2619', '415-289-7350', NULL, 'http://www.marinemammalcenter.org', NULL, NULL, 'Mendocino, Sonoma, Napa, Marin, Solano, Contra Costa, Alameda, Santa Clara, San Francisco, and San Mateo Counties, California', NULL),
    ('California Academy of Sciences', '55 Music Concourse Drive Golden Gate Park San Francisco CA 94118', '415-379-5381', NULL, 'http://www.calacademy.org', NULL, NULL, 'Southern Mendocino, Sonoma, Napa, Marin, Solano, Yolo, Sutter, Contra Costa, San Joaquin, San Francisco, Alameda, San Mateo, and Santa Clara Counties, California', NULL),
    ('Long Marine Laboratory', '130 McAllister Way Santa Cruz CA 95060', '831-212-1272', NULL, 'http://lmlstrandingnetwork.ucsc.edu/', NULL, NULL, 'Santa Cruz County, California', NULL),
    ('The Marine Mammal Center - Monterey Bay Operations', '11125 Commercial Parkway Castroville CA 95012', '415-289-7350', NULL, 'http://www.marinemammalcenter.org', NULL, NULL, 'Monterey and Santa Cruz Counties, California', NULL),
    ('Moss Landing Marine Laboratories', '8272 Moss Landing Road Moss Landing CA 95039', '831-771-4422', NULL, 'http://birdmam.mlml.calstate.edu/stranding-network/', NULL, NULL, 'Monterey County, California', NULL),
    ('The Marine Mammal Center - San Luis Obispo Operations', '1385 Main Street Morro Bay CA 93442', '415-289-7350', NULL, 'http://www.marinemammalcenter.org', NULL, NULL, 'San Luis Obispo County, California', NULL),
    ('Channel Islands Cetacean Research Unit', '1425 W. Valerio St. Santa Barbara CA 93101', '805-500-6220', NULL, 'http://cicru.org', NULL, NULL, 'Santa Barbara, and Ventura Counties, California', NULL),
    ('Channel Islands Marine & Wildlife Institute', 'P.O. Box 4250 Santa Barbara CA 93140', '805-567-1505', NULL, 'http://www.cimwi.org', NULL, NULL, 'Santa Barbara and Ventura Counties, California', NULL),
    ('California Wildlife Center', 'P.O. Box 2022 Malibu CA 90265', '310-924-7256', NULL, 'http://www.cawildlife.org', NULL, NULL, 'Malibu City Limits and Topanga Beach, California', NULL),
    ('Ocean Animal Response and Research Alliance', 'Not Listed', '949-395-4679', NULL, 'http://www.oarra.org', NULL, NULL, 'Los Angeles County, California', NULL),
    ('Marine Mammal Care Center of Los Angeles', '3601 South Gaffey Street #8 San Pedro CA 90731', '1-800-39-WHALE (800-399-4253)', NULL, 'http://www.marinemammalcare.org', NULL, NULL, 'Los Angeles County, California', NULL),
    ('Pacific Marine Mammal Center', '20612 Laguna Canyon Road Laguna Beach CA 92651', '949-494-3050', NULL, 'http://www.pacificmmc.org', NULL, NULL, 'Orange County, California', NULL),
    ('SeaWorld of California', '500 SeaWorld Drive San Diego CA 92109', '1-800-541-SEAL (7325)', NULL, 'http://www.seaworld.org', NULL, NULL, 'San Diego County, California', NULL),
    ('Southwest Fisheries Science Center', '8901 La Jolla Shores Dr. La Jolla CA 92037', '858-546-7162', NULL, 'http://swfsc.noaa.gov', NULL, NULL, 'San Diego County, California', NULL),
    ('Portland State University', '630 SW Mill Street Portland OR 97201', '503-738-6211', NULL, 'Not Listed', NULL, NULL, 'Northern Oregon (Clatsop and Tillamook) and Southern Washington (Pacific) coast, including Columbia and Willamette Rivers', NULL),
    ('Oregon State University, Hatfield Marine Science Center', '2030 SE Marine Science Drive Newport OR 97365', '541-270-6830', NULL, 'http://mmi.oregonstate.edu/ommsn', NULL, NULL, 'Tillamook, Lincoln, Lane, Douglas, Coos, and Curry Counties, Oregon', NULL),
    ('Oregon Department of Fish and Wildlife', '4034 Fairview Industrial Drive SE Salem OR 97302', 'Not Listed', NULL, 'https://www.dfw.state.or.us/MRP/mammals/index.asp', NULL, NULL, 'Statewide Oregon support', NULL),
    ('Whatcom Humane Society Wildlife Services', '2172 Division Street Bellingham WA 98226', '360-966-8845', NULL, 'https://whatcomhumane.org/wildlife/', NULL, NULL, 'Whatcom County, Washington', NULL),
    ('San Juan County Marine Mammal Stranding Network (The Whale Museum)', '62 1st Street North Friday Harbor WA 98250', '1-800-562-8832', NULL, 'https://whalemuseum.org/pages/marine-mammal-stranding-network', NULL, NULL, 'San Juan Islands, Washington', NULL),
    ('Central Puget Sound Marine Mammal Stranding Network', '485 Labella Vista Way Freeland WA 98249', '866-672-2638', NULL, 'http://www.orcanetwork.org', NULL, NULL, 'Whidbey and Camano Islands, Skagit Co. and North Snohomish Co., Washington', NULL),
    ('Port Townsend Marine Science Center', '532 Battery Way Port Townsend WA 98368', '360-385-5582 x103', NULL, 'http://www.ptmsc.org/', NULL, NULL, 'Eastern Jefferson County and part of eastern Clallam County', NULL),
    ('Sno-King Marine Mammal Response', '7323 25th Ave NW Seattle WA 98117', '206-695-2277', NULL, 'Not Listed', NULL, NULL, 'Seattle to Kayak Point', NULL),
    ('Seal Sitters Marine Mammal Stranding Network', '4701 SW Admiral Way #167 Seattle WA 98116', '206-905-7325', NULL, 'http://www.sealsitters.org/', NULL, NULL, 'West Seattle', NULL),
    ('SR3 SeaLife Response, Rehab, and Research', '22650 Dock Ave S Des Moines WA 98198', '206-947-4253', NULL, 'www.SR3.org', NULL, NULL, 'Des Moines site, all Pacific NW', NULL),
    ('Washington Department of Fish and Wildlife', '7801 E. Phillips Road S.W. Lakewood WA 98498', '253-208-2427', NULL, 'http://wdfw.wa.gov/', NULL, NULL, 'Pierce Co., Kitsap Co., Olympic National Park, and N. Pacific County for pinnipeds', NULL),
    ('MaST-Highline Community College', 'P.O. Box 98000 MS 29-3 Des Moines WA 98198', '206-724-2687', NULL, 'https://mast.highline.edu/', NULL, NULL, 'Brace Point to Brown''s Point in King and Pierce County, Washington', NULL),
    ('World Vets', 'Not Listed', '253-777-1775', NULL, 'https://worldvets.org/marine-mammal-response2/', NULL, NULL, 'Vashon and Maury Islands and other areas in Washington', NULL),
    ('Cascadia Research Collective', '218 1/2 W. 4th Ave. Olympia WA 98501', '360-791-9555', NULL, 'http://www.cascadiaresearch.org/', NULL, NULL, 'Thurston Co., western Hood Canal to Brinnon, and outer coast for cetaceans', NULL),
    ('Feiro Marine Life Center', '315 N Lincoln Street Port Angeles WA 98362', '360-775-5182', NULL, 'Not Listed', NULL, NULL, 'East of Port Angeles to Makah Reservation Line', NULL),
    ('Makah Fisheries', '150 Resort Drive Neah Bay WA 98357', '360-640-0569', NULL, 'http://www.makah.com/', NULL, NULL, 'Makah Territory (Neah Bay, WA)', NULL)
ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    emails = EXCLUDED.emails,
    hotline = EXCLUDED.hotline,
    contact_name = EXCLUDED.contact_name,
    website = EXCLUDED.website,
    sms_numbers = EXCLUDED.sms_numbers,
    response_area = EXCLUDED.response_area,
    response_type = EXCLUDED.response_type,
    updated_at = NOW();
