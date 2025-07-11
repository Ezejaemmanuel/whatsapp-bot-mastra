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

const AdminStatusSkeleton: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => (
    <div className={`p-4 h-full ${!isMobile ? 'flex items-center justify-center' : ''}`}>
        <Card className={`w-full ${!isMobile ? 'max-w-2xl' : ''}`}>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                </div>
                <div className="p-4 border rounded-lg space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
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
        return <AdminStatusSkeleton isMobile={isMobile} />;
    }

    const statusMessage = adminStatusData?.isInactive
        ? `Admin is currently offline. ${adminStatusData.reason === 'recurring_schedule' ? `Back at ${adminStatusData.settings?.recurringInactiveStart}.` : ''}`
        : "Admin is currently online.";

    return (
        <div className={`p-4 ${isMobile ? '' : 'h-full flex items-center justify-center bg-whatsapp-light-bg dark:bg-whatsapp-dark-bg'}`}>
            <Card className={`w-full ${!isMobile ? 'max-w-2xl' : ''}`}>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Admin Status Settings</CardTitle>
                    <CardDescription className="pt-2">
                        Manage when the admin is available to respond to messages.
                        The current status is: <span className={`font-semibold ${adminStatusData?.isInactive ? 'text-orange-500' : 'text-green-500'}`}>{adminStatusData?.isInactive ? 'Offline' : 'Online'}</span>.
                        {adminStatusData?.isInactive && (
                            <span className="text-xs">
                                {` (Reason: ${adminStatusData.reason === 'recurring_schedule'
                                    ? `Recurring Schedule - back at ${adminStatusData.settings?.recurringInactiveEnd}`
                                    : 'Manual Override'
                                    })`}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="manual-override" className="font-semibold text-base">
                                Manual Override (Force Offline)
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Immediately set admin status to offline until turned off.
                            </p>
                        </div>
                        <Switch
                            id="manual-override"
                            checked={isManualInactive}
                            onCheckedChange={setIsManualInactive}
                        />
                    </div>

                    <div className={`p-4 border rounded-lg transition-opacity ${isManualInactive ? 'opacity-50' : 'opacity-100'}`}>
                        <h3 className="font-semibold text-base">Recurring Inactive Schedule</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Set a daily schedule when the admin will be automatically offline.
                        </p>
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
                    <Button onClick={handleSave} className="ml-auto" disabled={adminStatusData === undefined}>
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}; 