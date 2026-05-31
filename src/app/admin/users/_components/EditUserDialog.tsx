'use client';

import { useState, useEffect } from 'react';
import { UserData, updateUser } from '../../actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EditUserDialogProps {
    user: UserData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * EditUserDialog Component
 * 
 * A dialog form for editing existing user details.
 * Does not allow password changes - use ResetPasswordDialog for that.
 */
export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: user.email,
        name: user.name || '',
        role: user.role,
    });

    // Update form when user prop changes
    useEffect(() => {
        setFormData({
            email: user.email,
            name: user.name || '',
            role: user.role,
        });
    }, [user]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateUser({
                id: user.id,
                email: formData.email,
                name: formData.name || undefined,
                role: formData.role,
            });
            
            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message || 'User updated successfully.',
                });
                onOpenChange(false);
            } else {
                toast({
                    title: 'Error',
                    description: result.message || 'Failed to update user.',
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details. To change the password, use the Reset Password option.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Display Name</Label>
                            <Input
                                id="edit-name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: 'USER' | 'ADMIN') => 
                                    setFormData(prev => ({ ...prev, role: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
