'use server';

/**
 * @fileOverview Derives location details from GPS coordinates using an AI model.
 * - getLocationDetails - Handles the location detail lookup process.
 * - GetLocationDetailsInput - The input type for the function.
 * - GetLocationDetailsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GetLocationDetailsInputSchema = z.object({
    lat: z.number(),
    lng: z.number(),
});
export type GetLocationDetailsInput = z.infer<typeof GetLocationDetailsInputSchema>;

const GetLocationDetailsOutputSchema = z.object({
  city: z.string().describe('The name of the city.'),
  state: z.string().describe('The name of the state or province.'),
  description: z.string().describe('A brief, one-sentence description of the location.'),
});
export type GetLocationDetailsOutput = z.infer<typeof GetLocationDetailsOutputSchema>;


export async function getLocationDetails(input: GetLocationDetailsInput): Promise<GetLocationDetailsOutput> {
    return getLocationDetailsFlow(input);
}


const getLocationDetailsFlow = ai.defineFlow(
    {
        name: 'getLocationDetailsFlow',
        inputSchema: GetLocationDetailsInputSchema,
        outputSchema: GetLocationDetailsOutputSchema,
    },
    async ({lat, lng}) => {
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            prompt: `For the GPS coordinate ${lat}, ${lng}, respond ONLY with a valid JSON object in the exact format: {"city": "City Name", "state": "State/Province Name", "description": "A brief, one-sentence description of the location."}`,
            config: {
                responseMimeType: "application/json",
            }
        });
        if (!output) {
            throw new Error('Failed to get location details from AI.');
        }
        return output;
    }
);
