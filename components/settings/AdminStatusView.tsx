"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const AdminStatusSkeleton: React.FC = () => (
    <div className="p-4 h-full">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-32 ml-auto" />
            </CardFooter>
        </Card>
    </div>
);


export const AdminStatusView: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
    const adminStatusData = useQuery(api.adminStatus.getAdminStatus, {});
    const setAdminStatus = useMutation(api.adminStatus.setAdminStatus);

    const [isManualInactive, setIsManualInactive] = useState(false);
    const [startTime, setStartTime] = useState('22:00');
    const [endTime, setEndTime] = useState('08:00');

    useEffect(() => {
        if (adminStatusData?.settings) {
            const { settings } = adminStatusData;
            setIsManualInactive(settings.isManuallyInactive ?? false);
            setStartTime(settings.recurringInactiveStart || '22:00');
            setEndTime(settings.recurringInactiveEnd || '08:00');
        }
    }, [adminStatusData]);

    const handleSave = async () => {
        try {
            await setAdminStatus({
                isManuallyInactive: isManualInactive,
                recurringInactiveStart: startTime,
                recurringInactiveEnd: endTime,
            });
            toast.success('Admin status updated successfully!');
        } catch (error) {
            toast.error('Failed to update admin status.');
            console.error(error);
        }
    };

    if (adminStatusData === undefined) {
        return <AdminStatusSkeleton />;
    }

    const statusMessage = adminStatusData?.isInactive
        ? `Admin is currently offline. ${adminStatusData.reason === 'recurring_schedule' ? `Back at ${adminStatusData.settings?.recurringInactiveStart}.` : ''}`
        : "Admin is currently online.";

    return (
        <div className={`p-4 ${isMobile ? '' : 'h-full'}`}>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Status</CardTitle>
                    <CardDescription>
                        {statusMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="manual-override" className="font-semibold">
                            Manual Override (Offline)
                        </Label>
                        <Switch
                            id="manual-override"
                            checked={isManualInactive}
                            onCheckedChange={setIsManualInactive}
                        />
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Recurring Inactive Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    disabled={isManualInactive}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="end-time">End Time</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    disabled={isManualInactive}
                                />
                            </div>
                        </div>
                    </div>

                  
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} className="ml-auto">
                        Save Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}; 