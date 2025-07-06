"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppLayout } from '@/components/WhatsAppLayout';

export default function TestPage() {
    const [seedResult, setSeedResult] = useState<any>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const seedData = useMutation(api.seedData.seedData);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            const result = await seedData({});
            setSeedResult(result);
        } catch (error) {
            console.error('Failed to seed data:', error);
            setSeedResult({ error: error.message });
        } finally {
            setIsSeeding(false);
        }
    };

    if (showChat) {
        return <WhatsAppLayout />;
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Khaliwid Bot - WhatsApp Chat Test</h1>
                    <p className="text-gray-600">Test the WhatsApp chat interface with seed data</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Database Setup</CardTitle>
                        <CardDescription>
                            Seed the database with sample conversations and messages to test the chat interface
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            className="w-full"
                        >
                            {isSeeding ? 'Seeding Database...' : 'Seed Database with Sample Data'}
                        </Button>

                        {seedResult && (
                            <div className="p-4 bg-gray-100 rounded-lg">
                                <h3 className="font-semibold mb-2">Seed Result:</h3>
                                <pre className="text-sm overflow-auto">
                                    {JSON.stringify(seedResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>WhatsApp Chat Interface</CardTitle>
                        <CardDescription>
                            Launch the full WhatsApp chat interface
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setShowChat(true)}
                            className="w-full"
                            variant="outline"
                        >
                            Launch Chat Interface
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✅ Real-time chat interface with WhatsApp-like design</li>
                            <li>✅ Convex database integration for conversations and messages</li>
                            <li>✅ Zustand state management for UI state</li>
                            <li>✅ Mobile responsive design</li>
                            <li>✅ Bot name: "Khaliwid Bot"</li>
                            <li>✅ Support for admin and bot conversations</li>
                            <li>✅ Message sending and receiving</li>
                            <li>✅ Conversation list with last message preview</li>
                            <li>✅ Real-time message timestamps</li>
                            <li>✅ WhatsApp dark theme styling</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
