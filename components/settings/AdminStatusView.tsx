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

export const AdminStatusView: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
    const adminStatus = useQuery(api.adminStatus.getAdminStatus, {});
    const setAdminStatus = useMutation(api.adminStatus.setAdminStatus);

    const [isManualInactive, setIsManualInactive] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [timezone, setTimezone] = useState('');

    useEffect(() => {
        const status = adminStatus;
        if (status) {
            // @ts-ignore
            setIsManualInactive(status.isManuallyInactive || false);
            // @ts-ignore
            setStartTime(status.recurringInactiveStart || '22:00');
            // @ts-ignore
            setEndTime(status.recurringInactiveEnd || '08:00');
            // @ts-ignore
            setTimezone(status.timezone || 'Africa/Nairobi');
        }
    }, [adminStatus]);

    const handleSave = async () => {
        try {
            await setAdminStatus({
                isManuallyInactive: isManualInactive,
                recurringInactiveStart: startTime,
                recurringInactiveEnd: endTime,
                timezone: timezone,
            });
            toast.success('Admin status updated successfully!');
        } catch (error) {
            toast.error('Failed to update admin status.');
            console.error(error);
        }
    };

    const statusMessage = adminStatus?.isInactive
        ? `Admin is currently offline. ${adminStatus.reason === 'recurring_schedule' ? `Back at ${adminStatus.activeTime}.` : ''}`
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
                        <div className="grid grid-cols-2 gap-4">
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

                    <div className="space-y-1">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                            id="timezone"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            disabled={isManualInactive}
                        />
                        <p className="text-xs text-muted-foreground">
                            e.g., Africa/Nairobi, America/New_York
                        </p>
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