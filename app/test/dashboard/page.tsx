"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TestDashboard() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Query all users
    const users = useQuery(api.users.getAllUsers, { limit: 50 });

    // Query conversations for selected user
    const conversations = useQuery(
        api.conversations.getUserConversations,
        selectedUserId ? { userId: selectedUserId as any, limit: 10 } : "skip"
    );

    // Query messages for the first conversation (if exists)
    const messages = useQuery(
        api.messages.getConversationHistory,
        conversations && conversations.length > 0
            ? { conversationId: conversations[0]._id, limit: 20, offset: 0 }
            : "skip"
    );

    // Query recent webhook logs
    const webhookLogs = useQuery(api.webhookLogs.getRecentLogs, { limit: 10 });

    // Mutation to create a test user
    const createTestUser = useMutation(api.users.getOrCreateUser);

    const handleCreateTestUser = async () => {
        try {
            await createTestUser({
                whatsappId: `test_${Date.now()}`,
                profileName: "Test User",
                phoneNumber: "+1234567890"
            });
        } catch (error) {
            console.error("Failed to create test user:", error);
        }
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            WhatsApp Bot Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Monitor your WhatsApp bot activity and manage conversations
                        </p>
                    </div>
                    <Button onClick={handleCreateTestUser} className="group">
                        <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Test User
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-border/50 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Users
                            </CardTitle>
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {users ? users.length : "..."}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {users && users.length > 0 ? "Active users in system" : "No users yet"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Conversations
                            </CardTitle>
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {conversations ? conversations.length : selectedUserId ? "..." : "0"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {selectedUserId ? "For selected user" : "Select a user to view"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Recent Messages
                            </CardTitle>
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {messages ? messages.length : "0"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {messages && messages.length > 0 ? "In current conversation" : "No messages to show"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users Section */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                Users
                            </CardTitle>
                            <CardDescription>
                                All registered WhatsApp users
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                {users === undefined ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        <p>No users found</p>
                                        <p className="text-sm">Create a test user or send a message to your bot</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {users.map((user) => (
                                            <div
                                                key={user._id}
                                                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedUserId === user._id
                                                        ? "bg-primary/5 border-primary/50"
                                                        : "border-border/50 hover:border-border"
                                                    }`}
                                                onClick={() => setSelectedUserId(user._id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(user.profileName || "Unknown")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {user.profileName || "Unknown User"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {user.whatsappId}
                                                        </p>
                                                        {user.phoneNumber && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {user.phoneNumber}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(user._creationTime).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Conversations and Messages */}
                    <div className="space-y-6">
                        {/* Conversations Section */}
                        {selectedUserId && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Conversations
                                    </CardTitle>
                                    <CardDescription>
                                        Active conversations for selected user
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[180px]">
                                        {conversations === undefined ? (
                                            <div className="flex items-center justify-center h-20">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            </div>
                                        ) : conversations.length === 0 ? (
                                            <div className="text-center py-4 text-muted-foreground">
                                                <p className="text-sm">No conversations found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {conversations.map((conversation) => (
                                                    <div key={conversation._id} className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    Conversation {conversation._id.slice(-6)}
                                                                </p>
                                                                <Badge variant="secondary" className="text-xs mt-1">
                                                                    {conversation.status || "active"}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatTimestamp(conversation.lastMessageAt || conversation._creationTime)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        {/* Messages Section */}
                        {messages && messages.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        Recent Messages
                                    </CardTitle>
                                    <CardDescription>
                                        Latest messages from the conversation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px]">
                                        <div className="space-y-3">
                                            {messages.map((message) => (
                                                <div key={message._id} className="p-3 rounded-lg border border-border/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={message.direction === "incoming" ? "default" : "secondary"}
                                                                className="text-xs"
                                                            >
                                                                {message.direction === "incoming" ? "📥 In" : "📤 Out"}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {message.messageType}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatTimestamp(message.timestamp)}
                                                        </div>
                                                    </div>
                                                    {message.content && (
                                                        <p className="text-sm mb-1">{message.content}</p>
                                                    )}
                                                    {message.mediaType && (
                                                        <p className="text-xs text-muted-foreground">
                                                            📎 Media: {message.mediaType}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Webhook Logs Section */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Webhook Logs
                        </CardTitle>
                        <CardDescription>
                            Recent webhook activity and system logs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            {webhookLogs === undefined ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : webhookLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p>No webhook logs found</p>
                                    <p className="text-sm">Logs will appear here when webhooks are received</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {webhookLogs.map((log) => (
                                        <div
                                            key={log._id}
                                            className={`p-4 rounded-lg border-l-4 ${log.level === "ERROR"
                                                    ? "border-l-red-500 bg-red-500/5"
                                                    : log.level === "WARN"
                                                        ? "border-l-yellow-500 bg-yellow-500/5"
                                                        : "border-l-green-500 bg-green-500/5"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge
                                                            variant={
                                                                log.level === "ERROR" ? "destructive" :
                                                                    log.level === "WARN" ? "secondary" : "default"
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {log.level}
                                                        </Badge>
                                                        {log.source && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {log.source}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium mb-1">{log.message}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground ml-4">
                                                    {formatTimestamp(log.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}