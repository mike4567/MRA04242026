
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIncident } from '@/context/IncidentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Printer, Fingerprint, Phone, Building, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmationPage() {
  const router = useRouter();
  const { incidentIdForConfirmation, responderInfoForConfirmation, resetConfirmationData } = useIncident();

  useEffect(() => {
    // Redirect if there's no confirmation data
    if (!incidentIdForConfirmation) {
      router.replace('/');
    }
  }, [incidentIdForConfirmation, router]);

  const handleDone = () => {
    resetConfirmationData();
    router.push('/');
  }

  const handlePrint = () => {
    window.print();
  }

  if (!incidentIdForConfirmation) {
    return (
        <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold">No Confirmation Data</h1>
            <p className="text-muted-foreground">Redirecting you to the homepage.</p>
        </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg text-center print:shadow-none print:border-none">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4 print:hidden">
            <CheckCircle className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="text-3xl">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your report has been successfully submitted. Our response team will review the information shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-secondary/50 p-6 space-y-4">
            <h3 className="font-semibold text-lg text-left">Your Incident ID</h3>
            <div className="flex items-center justify-center bg-background p-4 rounded-md">
                <Fingerprint className="mr-4 h-8 w-8 text-primary" />
                <p className="text-2xl font-mono tracking-wider font-bold">{incidentIdForConfirmation}</p>
            </div>
            <p className="text-sm text-muted-foreground">Please keep this ID for your records.</p>
          </div>

          {responderInfoForConfirmation?.selectedOrg && (
            <div className="rounded-lg border p-6 space-y-4 text-left">
              <h3 className="font-semibold text-lg">Assigned Responder</h3>
              <p className="text-sm text-muted-foreground">
                Based on the location and status you provided, the following regional coordinator has been notified.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{responderInfoForConfirmation.selectedOrg}</p>
                  </div>
                </div>
                {responderInfoForConfirmation.selectedPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href={`tel:${responderInfoForConfirmation.selectedPhone}`} className="font-medium text-primary hover:underline">
                      {responderInfoForConfirmation.selectedPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4 print:hidden">
            <Button onClick={handlePrint} variant="outline" size="lg" className="w-full sm:w-auto">
                <Printer className="mr-2 h-5 w-5" />
                Print / Save PDF
            </Button>
            <Link href={`/incidents/${incidentIdForConfirmation}`} passHref>
              <Button size="lg" className="w-full sm:w-auto">
                <Eye className="mr-2 h-5 w-5" />
                View Incident
              </Button>
            </Link>
            <Button onClick={handleDone} size="lg" variant="secondary" className="w-full sm:w-auto">
                Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
