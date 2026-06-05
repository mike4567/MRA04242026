
import { getOrganizations } from '@/app/actions/db-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OrganizationsDataTable } from './_components/organizations-data-table';
import { FeatureToggles } from './_components/feature-toggles';
import { SiteStatusToggle } from './_components/site-status-toggle';
import { getAllSystemConfigs, getSiteStatus } from './actions';
import { ChevronDown } from 'lucide-react';

export const revalidate = 0; // Don't cache this page

export default async function AdminConfigurationPage() {
    // Fetch data in parallel for better performance
    const [organizations, systemConfigs, siteStatus] = await Promise.all([
        getOrganizations(),
        getAllSystemConfigs(),
        getSiteStatus(),
    ]);

    return (
        <div className="space-y-6">
            {/* Site Status Card - Launch Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle>Site Launch Control</CardTitle>
                    <CardDescription>
                        Control the public-facing state of the application. Changes take effect immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SiteStatusToggle initialStatus={siteStatus} />
                </CardContent>
            </Card>

            {/* Feature Toggles Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Feature Toggles</CardTitle>
                    <CardDescription>
                        Enable or disable system-wide features. Changes take effect immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FeatureToggles initialConfigs={systemConfigs} />
                </CardContent>
            </Card>

            {/* Responder Configuration - Collapsible */}
            <Collapsible defaultOpen={false}>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Responder Configuration</CardTitle>
                                    <CardDescription>
                                        Manage responder organizations, contact details, and response settings.
                                    </CardDescription>
                                </div>
                                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                            <OrganizationsDataTable initialData={organizations} />
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
