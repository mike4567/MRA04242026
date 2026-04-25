
"use client";

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { syncOrganizations, updateOrganizationDetails, deleteOrganization, OrganizationDetails } from '@/app/admin/actions';
import { Loader2, RefreshCw, Pencil } from 'lucide-react';

interface OrganizationsDataTableProps {
    initialData: OrganizationDetails[];
}

export function OrganizationsDataTable({ initialData }: OrganizationsDataTableProps) {
    const [organizations, setOrganizations] = useState<OrganizationDetails[]>(initialData);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<OrganizationDetails | null>(null);
    const { toast } = useToast();
    const [columnVisibility, setColumnVisibility] = useState({
        emails: true,
        sms_numbers: true,
        hotline: false,
        address: true,
        website: false,
        response_area: false,
        response_type: false,
    });

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncOrganizations();
        if (result.success) {
            toast({
                title: "Sync Successful",
                description: result.message,
            });
            // Refresh data after sync
            const updatedOrgs = await fetch('/api/admin/organizations').then(res => res.json());
            setOrganizations(updatedOrgs);
        } else {
            toast({
                title: "Sync Failed",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsSyncing(false);
    };

    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedOrg) return;

        setIsUpdating(true);
        const formData = new FormData(event.currentTarget);
        
        const formDetails = {
            name: formData.get('name') as string,
            emails: (formData.get('emails') as string).split(',').map(s => s.trim()).filter(Boolean),
            sms_numbers: (formData.get('sms_numbers') as string).split(',').map(s => s.trim()).filter(Boolean),
            hotline: formData.get('hotline') as string,
            address: formData.get('address') as string,
            contact_name: formData.get('contact_name') as string,
            website: formData.get('website') as string,
            response_area: formData.get('response_area') as string,
        };

        const result = await updateOrganizationDetails({ id: selectedOrg.id, ...formDetails });
        
        if (result.success) {
            toast({
                title: "Update Successful",
                description: `Organization "${formDetails.name}" updated.`,
            });
            // Update the state locally
            setOrganizations(prevOrgs => 
                prevOrgs.map(org => org.id === selectedOrg.id ? { ...org, ...formDetails } : org)
            );
            setSelectedOrg(null); // This will close the dialog via the 'open' prop
        } else {
            toast({
                title: "Update Failed",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsUpdating(false);
    }

    const handleDelete = async () => {
        if (!selectedOrg) return;

        setIsDeleting(true);
        const result = await deleteOrganization(selectedOrg.id);

        if (result.success) {
            toast({
                title: "Delete Successful",
                description: `Organization "${selectedOrg.name}" has been deleted.`,
            });
            setOrganizations(prevOrgs => prevOrgs.filter(org => org.id !== selectedOrg.id));
            setSelectedOrg(null);
        } else {
            toast({
                title: "Delete Failed",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsDeleting(false);
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="mr-4">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {Object.keys(columnVisibility).map((key) => (
                            <DropdownMenuCheckboxItem
                                key={key}
                                className="capitalize"
                                checked={columnVisibility[key as keyof typeof columnVisibility]}
                                onCheckedChange={(value) =>
                                    setColumnVisibility((prev) => ({ ...prev, [key]: !!value }))
                                }
                            >
                                {key.replace('_', ' ')}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync with ArcGIS
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            {columnVisibility.emails && <TableHead>Emails</TableHead>}
                            {columnVisibility.sms_numbers && <TableHead>SMS Numbers</TableHead>}
                            {columnVisibility.hotline && <TableHead>Hotline</TableHead>}
                            {columnVisibility.address && <TableHead>Address</TableHead>}
                            {columnVisibility.website && <TableHead>Website</TableHead>}
                            {columnVisibility.response_area && <TableHead>Response Area</TableHead>}
                            {columnVisibility.response_type && <TableHead>Response Type</TableHead>}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.map((org) => (
                            <TableRow key={org.id}>
                                <TableCell className="font-medium">{org.name}</TableCell>
                                {columnVisibility.emails && <TableCell>{org.emails?.join(', ')}</TableCell>}
                                {columnVisibility.sms_numbers && <TableCell>{org.sms_numbers?.join(', ')}</TableCell>}
                                {columnVisibility.hotline && <TableCell>{org.hotline}</TableCell>}
                                {columnVisibility.address && <TableCell>{org.address}</TableCell>}
                                {columnVisibility.website && <TableCell>{org.website}</TableCell>}
                                {columnVisibility.response_area && <TableCell>{org.response_area}</TableCell>}
                                {columnVisibility.response_type && <TableCell>{org.response_type}</TableCell>}
                                <TableCell className="text-right">
                                    <Dialog open={selectedOrg?.id === org.id} onOpenChange={(isOpen) => !isOpen && setSelectedOrg(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrg(org)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[625px]">
                                             <form onSubmit={handleUpdate}>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Organization</DialogTitle>
                                                    <DialogDescription>
                                                        Update the details for &quot;{selectedOrg?.name}&quot;. Click save when you&apos;re done.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="name" className="text-right">Name</Label>
                                                        <Input id="name" name="name" defaultValue={selectedOrg?.name} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="emails" className="text-right">Emails</Label>
                                                        <Input id="emails" name="emails" defaultValue={selectedOrg?.emails?.join(', ')} className="col-span-3" placeholder="comma, separated" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="sms_numbers" className="text-right">SMS Numbers</Label>
                                                        <Input id="sms_numbers" name="sms_numbers" defaultValue={selectedOrg?.sms_numbers?.join(', ')} className="col-span-3" placeholder="comma, separated" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="hotline" className="text-right">Hotline</Label>
                                                        <Input id="hotline" name="hotline" defaultValue={selectedOrg?.hotline} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="address" className="text-right">Address</Label>
                                                        <Input id="address" name="address" defaultValue={selectedOrg?.address} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="contact_name" className="text-right">Contact Name</Label>
                                                        <Input id="contact_name" name="contact_name" defaultValue={selectedOrg?.contact_name} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="website" className="text-right">Website</Label>
                                                        <Input id="website" name="website" defaultValue={selectedOrg?.website} className="col-span-3" />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="response_area" className="text-right">Response Area</Label>
                                                        <Textarea id="response_area" name="response_area" defaultValue={selectedOrg?.response_area ?? ''} className="col-span-3" rows={5} />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="response_type" className="text-right">Response Type</Label>
                                                        <Textarea id="response_type" name="response_type" defaultValue={selectedOrg?.response_type ?? ''} className="col-span-3" disabled rows={5} />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button type="button" variant="destructive" className="mr-auto">Delete</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the
                                                                    organization &quot;{selectedOrg?.name}&quot;.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <DialogClose asChild>
                                                        <Button type="button" variant="secondary">Cancel</Button>
                                                    </DialogClose>
                                                    <Button type="submit" disabled={isUpdating}>
                                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Save changes
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {organizations.length === 0 && (
                 <div className="text-center p-8 text-muted-foreground">
                    No organizations found. Try syncing with ArcGIS.
                 </div>
            )}
        </div>
    );
}
