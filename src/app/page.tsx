"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center -mt-8 -mb-8">
      <div className="w-full max-w-4xl text-center">
        <div className="py-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Help Protect Our Marine Wildlife
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your report can make a difference.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold">
              <Link href="/report">
                <AlertTriangle className="mr-3 h-6 w-6" />
                Report an Incident
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-8 mt-8 text-left max-w-3xl mx-auto shadow-md">
          <h2 className="text-xl font-bold text-foreground">Report a Stranded Marine Animal:</h2>
          <p className="mt-2 text-muted-foreground">
            See an injured, entangled, or stranded marine mammal? Your report instantly notifies a local rescue team.
          </p>

          <ol className="list-decimal list-inside mt-4 space-y-2 text-foreground pl-4">
            <li>Set Location</li>
            <li>Add Details & Photos</li>
            <li>Submit Report to Notify Responders</li>
          </ol>

          <h2 className="text-xl font-bold text-foreground mt-8">Or Call a Hotline:</h2>
          <ul className="list-disc list-inside mt-4 space-y-2 text-foreground pl-4">
            <li>USA: 1-866-767-6114</li>
            <li>Canada: 1-800-465-4336</li>
            <li>Mexico: +52 612-214-3750</li>
          </ul>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-30">
        <Button asChild variant="ghost" size="icon">
          <Link href="/login">
            <Settings className="h-6 w-6" />
            <span className="sr-only">Responder Login</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
