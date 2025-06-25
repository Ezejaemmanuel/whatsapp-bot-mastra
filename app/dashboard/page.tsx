"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function Dashboard() {
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

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold mb-6">WhatsApp Bot Dashboard</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {users ? users.length : "Loading..."}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Active Conversations</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {conversations ? conversations.length : selectedUserId ? "Loading..." : "Select User"}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Messages</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {messages ? messages.length : "Select User"}
                    </p>
                </div>
            </div>

            {/* Users Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Users</h2>
                    <button
                        onClick={handleCreateTestUser}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Create Test User
                    </button>
                </div>

                {users === undefined ? (
                    <p>Loading users...</p>
                ) : users.length === 0 ? (
                    <p>No users found. Create a test user or send a message to your WhatsApp bot.</p>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedUserId === user._id ? "bg-blue-50 border-blue-300" : ""
                                    }`}
                                onClick={() => setSelectedUserId(user._id)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{user.profileName || "Unknown"}</p>
                                        <p className="text-sm text-gray-600">WhatsApp ID: {user.whatsappId}</p>
                                        {user.phoneNumber && (
                                            <p className="text-sm text-gray-600">Phone: {user.phoneNumber}</p>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(user._creationTime).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversations Section */}
            {selectedUserId && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Conversations</h2>
                    {conversations === undefined ? (
                        <p>Loading conversations...</p>
                    ) : conversations.length === 0 ? (
                        <p>No conversations found for this user.</p>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map((conversation) => (
                                <div key={conversation._id} className="p-3 border rounded">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Conversation {conversation._id}</p>
                                            <p className="text-sm text-gray-600">Status: {conversation.status || "active"}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {conversation.lastMessageAt
                                                ? new Date(conversation.lastMessageAt).toLocaleString()
                                                : new Date(conversation._creationTime).toLocaleString()
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Messages Section */}
            {messages && messages.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.map((message) => (
                            <div key={message._id} className="p-3 border rounded">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 text-xs rounded ${message.direction === "incoming"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                                }`}>
                                                {message.direction}
                                            </span>
                                            <span className="text-sm text-gray-600">{message.messageType}</span>
                                        </div>
                                        {message.content && (
                                            <p className="text-sm">{message.content}</p>
                                        )}
                                        {message.mediaType && (
                                            <p className="text-sm text-gray-600">Media: {message.mediaType}</p>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(message.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Webhook Logs Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Webhook Logs</h2>
                {webhookLogs === undefined ? (
                    <p>Loading logs...</p>
                ) : webhookLogs.length === 0 ? (
                    <p>No webhook logs found.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {webhookLogs.map((log) => (
                            <div key={log._id} className={`p-2 border-l-4 ${log.level === "ERROR" ? "border-red-500 bg-red-50" :
                                    log.level === "WARN" ? "border-yellow-500 bg-yellow-50" :
                                        "border-green-500 bg-green-50"
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium">{log.message}</p>
                                        {log.source && (
                                            <p className="text-xs text-gray-600">Source: {log.source}</p>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 