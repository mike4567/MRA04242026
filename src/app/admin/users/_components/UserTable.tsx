'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { UserData, toggleUserActive, deleteUser } from '../../actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Shield, User, Power, Trash2, KeyRound, Pencil } from 'lucide-react';
import { EditUserDialog } from './EditUserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';

interface UserTableProps {
    users: UserData[];
}

/**
 * UserTable Component
 * 
 * Displays users in a table with actions for each row:
 * - Edit user details
 * - Reset password
 * - Toggle active status
 * - Delete user permanently
 */
export function UserTable({ users }: UserTableProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Handle toggle active status
    const handleToggleActive = async (user: UserData) => {
        setIsLoading(true);
        try {
            const result = await toggleUserActive(user.id);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        setIsLoading(true);
        try {
            const result = await deleteUser(selectedUser.id);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setShowDeleteDialog(false);
            setSelectedUser(null);
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className={!user.active ? 'opacity-60' : ''}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.name || '—'}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                        {user.role === 'ADMIN' ? (
                                            <Shield className="h-3 w-3 mr-1" />
                                        ) : (
                                            <User className="h-3 w-3 mr-1" />
                                        )}
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.active ? 'default' : 'outline'}>
                                        {user.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.created_at 
                                        ? format(parseISO(user.created_at), 'MMM d, yyyy')
                                        : '—'
                                    }
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowEditDialog(true);
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowResetPasswordDialog(true);
                                                }}
                                            >
                                                <KeyRound className="mr-2 h-4 w-4" />
                                                Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleToggleActive(user)}
                                                disabled={isLoading}
                                            >
                                                <Power className="mr-2 h-4 w-4" />
                                                {user.active ? 'Deactivate' : 'Activate'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Permanently
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit User Dialog */}
            {selectedUser && (
                <EditUserDialog
                    user={selectedUser}
                    open={showEditDialog}
                    onOpenChange={(open) => {
                        setShowEditDialog(open);
                        if (!open) setSelectedUser(null);
                    }}
                />
            )}

            {/* Reset Password Dialog */}
            {selectedUser && (
                <ResetPasswordDialog
                    user={selectedUser}
                    open={showResetPasswordDialog}
                    onOpenChange={(open) => {
                        setShowResetPasswordDialog(open);
                        if (!open) setSelectedUser(null);
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The user{' '}
                            <span className="font-semibold">{selectedUser?.email}</span>{' '}
                            will be permanently deleted from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
