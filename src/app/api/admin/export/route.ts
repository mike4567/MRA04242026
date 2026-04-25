
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { format } from 'date-fns';

// A utility function to convert JSON array to a CSV string
function jsonToCsv(jsonData: any[]): string {
    if (!jsonData || jsonData.length === 0) {
        return "";
    }

    const keys = Object.keys(jsonData[0]);
    
    const csvHeader = keys.join(',') + '\n';

    const csvRows = jsonData.map(row => {
        return keys.map(key => {
            let value = row[key];
            
            // Handle null or undefined values
            if (value === null || value === undefined) {
                return '';
            }

            // Convert value to string
            let stringValue = String(value);

            // Escape quotes by doubling them
            stringValue = stringValue.replace(/"/g, '""');

            // If the value contains a comma, newline, or quote, enclose it in double quotes
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                stringValue = `"${stringValue}"`;
            }

            return stringValue;
        }).join(',');
    }).join('\n');

    return csvHeader + csvRows;
}


const QUERIES = {
    incidents: `
        SELECT 
            id, reported_at, status, animal_type, animal_life_status, location, additional_location_info, 
            reporter_name, reporter_phone, can_text, responder_org, responder_phone, summary, 
            detailed_description, responder_notes,
            array_to_string(media_urls, ' | ') AS media_urls_list,
            array_to_string(conditions, ' | ') AS conditions_list 
        FROM incidents ORDER BY reported_at DESC;
    `,
    responders: `
        SELECT 
            id, name, contact_name, hotline, address, website, response_area, response_type, created_at, updated_at,
            array_to_string(emails, ' | ') AS emails_list,
            array_to_string(sms_numbers, ' | ') AS sms_numbers_list 
        FROM responder_organizations ORDER BY name ASC;
    `
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type !== 'incidents' && type !== 'responders') {
        return new NextResponse('Invalid export type specified.', { status: 400 });
    }

    try {
        const { rows } = await query(QUERIES[type]);
        
        const csvData = jsonToCsv(rows);
        const date = format(new Date(), 'yyyy-MM-dd');
        const filename = `export-${type}-${date}.csv`;

        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);

        return new NextResponse(csvData, { status: 200, headers });

    } catch (error) {
        console.error(`Failed to export ${type}:`, error);
        return new NextResponse(`An error occurred while exporting data.`, { status: 500 });
    }
}
