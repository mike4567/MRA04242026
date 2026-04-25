
import { NextResponse } from 'next/server';
import { Client } from "@googlemaps/google-maps-services-js";

export async function POST(request: Request) {
  const { address } = await request.json();
  
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  // Use the server-side environment variable
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Geocoding error: GOOGLE_MAPS_API_KEY is not set on the server.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const client = new Client({});
  
  try {
    const response = await client.geocode({
      params: {
        address: address,
        key: apiKey,
      },
    });

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return NextResponse.json({ location });
    } else {
      return NextResponse.json({ error: 'No results found for that address.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}
