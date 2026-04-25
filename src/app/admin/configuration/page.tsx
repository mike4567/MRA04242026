
import { getOrganizations } from '@/app/actions/db-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationsDataTable } from './_components/organizations-data-table';
import { SystemSettingsForm } from './_components/system-settings-form';

export const revalidate = 0; // Don't cache this page

export default async function AdminConfigurationPage() {
    const organizations = await getOrganizations();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Responder Configuration</CardTitle>
                    <CardDescription>
                        Manage responder organizations, contact details, and response settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OrganizationsDataTable initialData={organizations} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                        Manage system-wide settings and configurations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SystemSettingsForm />
                </CardContent>
            </Card>
        </div>
    );
}
