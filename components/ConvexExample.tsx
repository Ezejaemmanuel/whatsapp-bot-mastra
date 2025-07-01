"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function ConvexExample() {
    const [isCreating, setIsCreating] = useState(false);

    // Query to get all users
    const users = useQuery(api.users.getAllUsers, { limit: 10 });



    // Mutation to create a test user
    const createTestUser = useMutation(api.users.getOrCreateUser);

    // Mutation to log an event


    const handleCreateUser = async () => {
        setIsCreating(true);
        try {
            await createTestUser({
                whatsappId: `demo_${Date.now()}`,
                profileName: "Demo User",
                phoneNumber: "+1234567890"
            });
        } catch (error) {
            console.error("Failed to create user:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Convex Integration Example</h3>

            {/* Users Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Users ({users?.length || 0})</h4>
                    <button
                        onClick={handleCreateUser}
                        disabled={isCreating}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isCreating ? "Creating..." : "Create Demo User"}
                    </button>
                </div>

                {users === undefined ? (
                    <p className="text-gray-500">Loading users...</p>
                ) : users.length === 0 ? (
                    <p className="text-gray-500">No users found</p>
                ) : (
                    <div className="space-y-1">
                        {users.slice(0, 3).map((user) => (
                            <div key={user._id} className="text-sm p-2 bg-gray-50 rounded">
                                <span className="font-medium">{user.profileName || "Unknown"}</span>
                                <span className="text-gray-600 ml-2">({user.whatsappId})</span>
                            </div>
                        ))}
                        {users.length > 3 && (
                            <p className="text-sm text-gray-500">... and {users.length - 3} more</p>
                        )}
                    </div>
                )}
            </div>


        </div>
    );
}

// Example of a simple query hook
export function useUserCount() {
    const users = useQuery(api.users.getAllUsers, { limit: 1000 });
    return users?.length || 0;
}

// Example of a simple mutation hook
export function useCreateTestUser() {
    const createUser = useMutation(api.users.getOrCreateUser);

    return async (name: string) => {
        return await createUser({
            whatsappId: `test_${Date.now()}`,
            profileName: name,
            phoneNumber: "+1234567890"
        });
    };
} 