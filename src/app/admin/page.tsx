
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useIncident } from '@/context/IncidentContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Eye, Search, ArrowUpDown, ClockIcon, AlertTriangle, PlayCircle, Image as ImageIcon, MapPin, CheckSquare, Loader2, Building, PawPrint, ChevronLeft, ChevronRight, CalendarIcon, X, Cog, FileText } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Incident, IncidentStatus } from '@/lib/types';
import { useDebounce } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendIncidentStatusUpdateSms } from '@/services/sms';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';


type SortKey = keyof Incident | 'location' | 'reportedAt' | 'status' | 'responderOrg' | 'animalType';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
);

const StatusBadge = ({ status }: { status: IncidentStatus }) => {
    const colorMap: Record<IncidentStatus, string> = {
        'Reported': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
        'Under Review': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
        'Response Underway': 'bg-blue-500/20 text-primary border-blue-500/30',
        'Resolved': 'bg-green-500/20 text-green-700 border-green-500/30',
        'Deleted': 'bg-red-500/20 text-red-700 border-red-500/30',
    }

    return <Badge variant="outline" className={cn(colorMap[status])}>{status}</Badge>
}

export default function AdminDashboard() {
  const { incidents, updateIncident } = useIncident();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'reportedAt', direction: 'descending'});

  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<IncidentStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [responderFilter, setResponderFilter] = useState('');
  const [debouncedResponderFilter] = useDebounce(responderFilter, 300);
  const [animalTypeFilter, setAnimalTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);

  const dashboardStats = useMemo(() => {
    return {
        totalIncidents: incidents.length,
        reported: incidents.filter(i => i.status === 'Reported').length,
        underReview: incidents.filter(i => i.status === 'Under Review').length,
        responseUnderway: incidents.filter(i => i.status === 'Response Underway').length,
    };
  }, [incidents]);

  const uniqueResponders = useMemo(() => Array.from(new Set(incidents.map(i => i.responderOrg).filter(Boolean))), [incidents]);
  const uniqueAnimalTypes = useMemo(() => Array.from(new Set(incidents.map(i => i.animalType).filter(Boolean))), [incidents]);


  const filteredAndSortedIncidents = useMemo(() => {
    const filtered = incidents.filter(incident => {
        // Search term filter (global search)
        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
        if (lowerCaseSearch && !(
              incident.id.toLowerCase().includes(lowerCaseSearch) ||
              incident.location.toLowerCase().includes(lowerCaseSearch) ||
              (incident.animalType && incident.animalType.toLowerCase().includes(lowerCaseSearch)) ||
              incident.status.toLowerCase().includes(lowerCaseSearch) ||
              (incident.responderOrg && incident.responderOrg.toLowerCase().includes(lowerCaseSearch)) ||
              format(new Date(incident.reportedAt), 'MMM d, yyyy').toLowerCase().includes(lowerCaseSearch)
          )) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && incident.status !== statusFilter) {
            return false;
        }

        // Responder filter
        if (debouncedResponderFilter && !(incident.responderOrg && incident.responderOrg.toLowerCase().includes(debouncedResponderFilter.toLowerCase()))) {
            return false;
        }

        // Animal Type filter
        if (animalTypeFilter !== 'all' && incident.animalType !== animalTypeFilter) {
            return false;
        }

        // Date range filter
        if (dateFilter?.from && dateFilter?.to) {
            if (!isWithinInterval(new Date(incident.reportedAt), { start: dateFilter.from, end: dateFilter.to })) {
                return false;
            }
        }
        
        return true;
    });

    let sorted = [...filtered];
    if (sortConfig !== null) {
        sorted.sort((a, b) => {
            let aValue: any = a[sortConfig.key];
            let bValue: any = b[sortConfig.key];

            if (sortConfig.key === 'reportedAt') {
                aValue = new Date(a.reportedAt).getTime();
                bValue = new Date(b.reportedAt).getTime();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }

    return sorted;
  }, [incidents, debouncedSearchTerm, sortConfig, statusFilter, debouncedResponderFilter, animalTypeFilter, dateFilter]);

  const paginatedIncidents = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return filteredAndSortedIncidents.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedIncidents, pageIndex, pageSize]);

  const pageCount = Math.ceil(filteredAndSortedIncidents.length / pageSize);

  useEffect(() => {
    // Reset to first page if filters or sorting change
    setPageIndex(0);
  }, [debouncedSearchTerm, sortConfig, pageSize, statusFilter, debouncedResponderFilter, animalTypeFilter, dateFilter]);

  useEffect(() => {
    // Clear selection if filtered incidents change
    setSelectedIncidentIds([]);
  }, [debouncedSearchTerm, statusFilter, debouncedResponderFilter, animalTypeFilter, dateFilter]);


  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };
  
  const SortableHeader = ({ sortKey, children, className }: { sortKey: SortKey, children: React.ReactNode, className?: string}) => (
      <TableHead className={className}>
        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); requestSort(sortKey); }}>
          {children}
          {getSortIcon(sortKey)}
        </Button>
      </TableHead>
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIncidentIds(paginatedIncidents.map(i => i.id));
    } else {
      setSelectedIncidentIds([]);
    }
  }

  const handleSelectOne = (incidentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncidentIds(prev => [...prev, incidentId]);
    } else {
      setSelectedIncidentIds(prev => prev.filter(id => id !== incidentId));
    }
  }
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setResponderFilter('');
    setAnimalTypeFilter('all');
    setDateFilter(undefined);
  }

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIncidentIds.length === 0) {
        toast({ title: "Update Failed", description: "No status or incidents selected.", variant: "destructive" });
        return;
    }
    
    setIsUpdating(true);
    let successCount = 0;
    let smsSentCount = 0;
    let smsFailedCount = 0;

    const incidentsToUpdate = incidents.filter(inc => selectedIncidentIds.includes(inc.id));

    for (const incident of incidentsToUpdate) {
        if (incident.status === bulkStatus) continue; // Skip if status is already the same

        const updatedIncident = { ...incident, status: bulkStatus };
        try {
            await updateIncident(updatedIncident);
            successCount++;

            // Dont send SMS for deletions
            if (bulkStatus !== 'Deleted' && updatedIncident.canText && updatedIncident.reporterPhone) {
                const smsResult = await sendIncidentStatusUpdateSms({
                    phone: updatedIncident.reporterPhone,
                    incidentId: updatedIncident.id,
                    newStatus: bulkStatus,
                });
                if (smsResult.success) smsSentCount++;
                else smsFailedCount++;
            }
        } catch (error) {
            console.error(`Failed to update incident ${incident.id}:`, error);
        }
    }
    
    setIsUpdating(false);

    let toastDescription = `${successCount} incident(s) updated to "${bulkStatus}".`;
    if (bulkStatus === 'Deleted') {
        toastDescription = `${successCount} incident(s) permanently deleted.`;
    } else if (smsSentCount > 0 || smsFailedCount > 0) {
        toastDescription += ` SMS: ${smsSentCount} sent, ${smsFailedCount} failed.`
    }

    toast({
        title: bulkStatus === 'Deleted' ? "Bulk Deletion Complete" : "Bulk Update Complete",
        description: toastDescription
    });

    setSelectedIncidentIds([]);
    setBulkStatus(null);
  }

  const numSelected = selectedIncidentIds.length;
  const numOnPage = paginatedIncidents.length;

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Incidents" value={dashboardStats.totalIncidents} icon={AlertTriangle} />
            <StatCard title="Newly Reported" value={dashboardStats.reported} icon={ClockIcon} />
            <StatCard title="Under Review" value={dashboardStats.underReview} icon={Search} />
            <StatCard title="Response Underway" value={dashboardStats.responseUnderway} icon={Eye} />
        </div>
        <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Incident Dashboard</CardTitle>
                <CardDescription>A list of all reported marine animal incidents.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/admin/reports">
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Reports
                    </Button>
                </Link>
                <Link href="/admin/configuration">
                    <Button variant="outline">
                        <Cog className="mr-2 h-4 w-4" />
                        Configuration
                    </Button>
                </Link>
            </div>
        </CardHeader>
        <CardContent>
             <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
                <div className="relative w-full md:w-auto md:flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search incidents..."
                        className="pl-9 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateFilter && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter?.from ? (
                            dateFilter.to ? (
                                <>
                                {format(dateFilter.from, "LLL dd, y")} -{" "}
                                {format(dateFilter.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateFilter.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Filter by date</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateFilter?.from}
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Reported">Reported</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Response Underway">Response Underway</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                     <Input 
                        placeholder="Filter by responder..."
                        className="w-full"
                        value={responderFilter}
                        onChange={(e) => setResponderFilter(e.target.value)}
                    />
                    <Select value={animalTypeFilter} onValueChange={(v: any) => setAnimalTypeFilter(v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by animal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Animal Types</SelectItem>
                            {uniqueAnimalTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>

            {numSelected > 0 && (
                <div className="bg-secondary p-4 rounded-lg border mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        <p className="font-medium">{numSelected} incident{numSelected > 1 ? 's' : ''} selected</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select onValueChange={(status: IncidentStatus) => setBulkStatus(status)}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-background">
                                <SelectValue placeholder="Set status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Reported">Reported</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Response Underway">Response Underway</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Deleted" className="text-destructive">Delete Selected</SelectItem>
                            </SelectContent>
                        </Select>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button disabled={!bulkStatus || isUpdating} variant={bulkStatus === 'Deleted' ? 'destructive' : 'default'}>
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Apply Status
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {bulkStatus === 'Deleted' 
                                        ? `This will permanently delete ${numSelected} incident${numSelected > 1 ? 's' : ''}. This action cannot be undone.`
                                        : `This will update the status of ${numSelected} incident${numSelected > 1 ? 's' : ''} to "${bulkStatus}". This may also send SMS notifications to reporters who have opted in. This action cannot be undone.`
                                    }
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkUpdate} className={bulkStatus === 'Deleted' ? "bg-destructive hover:bg-destructive/90" : ""}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead padding="checkbox">
                            <Checkbox
                                checked={numSelected === numOnPage && numOnPage > 0}
                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                aria-label="Select all"
                                disabled={numOnPage === 0}
                            />
                        </TableHead>
                        <SortableHeader sortKey="reportedAt">Date Reported</SortableHeader>
                        <SortableHeader sortKey="status">Status</SortableHeader>
                        <SortableHeader sortKey="location">Location</SortableHeader>
                        <SortableHeader sortKey="responderOrg">Assigned Responder</SortableHeader>
                        <TableHead>Media</TableHead>
                        <SortableHeader sortKey="animalType">Animal Type</SortableHeader>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedIncidents.length > 0 ? paginatedIncidents.map((incident) => (
                    <TableRow 
                        key={incident.id} 
                        data-state={selectedIncidentIds.includes(incident.id) ? "selected" : ""}
                        onClick={() => router.push(`/admin/incidents/${incident.id}`)}
                        className="cursor-pointer"
                    >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={selectedIncidentIds.includes(incident.id)}
                                onCheckedChange={(checked) => handleSelectOne(incident.id, Boolean(checked))}
                                aria-label={`Select incident ${incident.id.substring(0,7)}`}
                            />
                        </TableCell>
                        <TableCell>
                            <div>{format(new Date(incident.reportedAt), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(incident.reportedAt), 'p')}</div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={incident.status} />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{incident.location}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {incident.responderOrg ? (
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground"/>
                                    <span className="font-medium">{incident.responderOrg}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic">Not assigned</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {incident.mediaUrls.map(url => (
                                    url.includes('video') 
                                    ? <PlayCircle key={url} className="h-5 w-5 text-muted-foreground" /> 
                                    : <ImageIcon key={url} className="h-5 w-5 text-muted-foreground" />
                                ))}
                            </div>
                        </TableCell>
                        <TableCell>
                            {incident.animalType ? (
                                <div className="flex items-center gap-2">
                                    <PawPrint className="h-4 w-4 text-muted-foreground"/>
                                    <span className="font-medium truncate max-w-xs">{incident.animalType}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic">N/A</span>
                            )}
                        </TableCell>
                    </TableRow>
                    )) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                        No incidents found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between space-x-2 pt-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                                {size}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">
                        Page {pageIndex + 1} of {pageCount}
                    </div>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(p => p - 1)}
                    disabled={pageIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(p => p + 1)}
                    disabled={pageIndex >= pageCount - 1}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
