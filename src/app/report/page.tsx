import IncidentReportForm from "@/components/IncidentReportForm";
import { getSystemConfig } from "@/app/admin/configuration/actions";

// CRITICAL: This line forces Next.js to read the environment variables 
// at RUNTIME (on the server), not at BUILD TIME.
export const dynamic = 'force-dynamic';

export default async function ReportPage() {
  // Access the environment variable injected by Cloud Run
  // We use the NEXT_PUBLIC_ name because that is what we defined in Terraform
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!googleMapsApiKey) {
    console.error("Critical Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or empty.");
  }

  // Fetch the show_responder_info setting from system_config
  // This controls visibility of the Responder Network section on this page
  const showResponderInfo = await getSystemConfig("show_responder_info");

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <IncidentReportForm apiKey={googleMapsApiKey} showResponderInfo={showResponderInfo} />
    </div>
  );
}
