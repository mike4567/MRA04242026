
import { NextResponse } from 'next/server';
import { getOrganizations } from '@/app/actions/db-actions';

export async function GET() {
    try {
        const organizations = await getOrganizations();
        return NextResponse.json(organizations);
    } catch (error) {
        console.error('Failed to fetch organizations:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Failed to fetch organizations' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
