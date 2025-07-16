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
import Link from 'next/link';

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
    const toggleManualStatus = useMutation(api.adminStatus.toggleManualStatus);

    const [isManualInactive, setIsManualInactive] = useState(false);
    const [startTime, setStartTime] = useState('22:00');
    const [endTime, setEndTime] = useState('08:00');
    const [hasScheduleChanges, setHasScheduleChanges] = useState(false);
    const [originalStartTime, setOriginalStartTime] = useState('22:00');
    const [originalEndTime, setOriginalEndTime] = useState('08:00');

    useEffect(() => {
        if (adminStatusData?.settings) {
            const { settings } = adminStatusData;
            setIsManualInactive(settings.isManuallyInactive ?? false);
            setStartTime(settings.recurringInactiveStart || '22:00');
            setEndTime(settings.recurringInactiveEnd || '08:00');
            setOriginalStartTime(settings.recurringInactiveStart || '22:00');
            setOriginalEndTime(settings.recurringInactiveEnd || '08:00');
            setHasScheduleChanges(false);
        }
    }, [adminStatusData]);

    // Check if schedule has changed
    useEffect(() => {
        const hasChanged = startTime !== originalStartTime || endTime !== originalEndTime;
        setHasScheduleChanges(hasChanged);
    }, [startTime, endTime, originalStartTime, originalEndTime]);

    const handleManualToggle = async (checked: boolean) => {
        try {
            await toggleManualStatus({ isManuallyInactive: checked });
            setIsManualInactive(checked);
            toast.success(checked ? 'Admin set to offline' : 'Admin set to online');
        } catch (error) {
            toast.error('Failed to update admin status.');
            console.error(error);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            await setAdminStatus({
                recurringInactiveStart: startTime,
                recurringInactiveEnd: endTime,
            });
            setOriginalStartTime(startTime);
            setOriginalEndTime(endTime);
            setHasScheduleChanges(false);
            toast.success('Schedule updated successfully!');
        } catch (error) {
            toast.error('Failed to update schedule.');
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
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full max-w-4xl">
                {/* AI Instructions Button - Side Panel */}
                <div className="lg:w-64 flex-shrink-0">
                    <Card className="p-6 text-center">
                        <div className="mb-4">
                            <svg className="w-12 h-12 mx-auto text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">AI Instructions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Customize the system prompt that guides the WhatsApp bot's behavior and responses.
                        </p>
                        <Link href="/settings/ai-instructions">
                            <Button
                                variant="default"
                                className="w-full font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                            >
                                Edit Instructions
                            </Button>
                        </Link>
                    </Card>
                </div>

                {/* Main Admin Status Card */}
                <Card className={`flex-1 ${!isMobile ? 'max-w-2xl' : ''}`}>
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
                                onCheckedChange={handleManualToggle}
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
                    {hasScheduleChanges && (
                        <CardFooter>
                            <Button onClick={handleSaveSchedule} className="ml-auto">
                                Set Schedule
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}; 