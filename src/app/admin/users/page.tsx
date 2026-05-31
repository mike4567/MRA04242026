export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import { getUsers, UserData } from '../actions';
import { UserTable } from './_components/UserTable';
import { AddUserDialog } from './_components/AddUserDialog';

/**
 * User Management Page
 * 
 * Displays a table of all users with options to:
 * - Add new users
 * - Edit existing users
 * - Reset passwords
 * - Activate/deactivate users
 * - Delete users permanently
 * 
 * Only accessible by ADMIN users.
 */
export default async function UsersPage() {
    // Fetch all users from the database
    const result = await getUsers();
    const users: UserData[] = result.success && result.users ? result.users : [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            User Management
                        </CardTitle>
                        <CardDescription>
                            Manage user accounts, roles, and access permissions.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <AddUserDialog />
                    </div>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-lg">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No users found</p>
                            <p className="text-sm text-muted-foreground">
                                Add your first user to get started.
                            </p>
                        </div>
                    ) : (
                        <UserTable users={users} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
