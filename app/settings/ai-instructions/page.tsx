"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

// Fetch the current AI instructions from the API
async function fetchInstructions() {
    const res = await fetch("/api/settings/ai-instructions");
    if (!res.ok) throw new Error("Failed to fetch instructions");
    const data = await res.json();
    return data.instructions;
}

// Update the AI instructions via the API
async function updateInstructions(newInstructions: string) {
    const res = await fetch("/api/settings/ai-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: newInstructions }),
    });
    if (!res.ok) throw new Error("Failed to update instructions");
    return await res.json();
}

export default function AiInstructionsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["ai-instructions"],
        queryFn: fetchInstructions,
    });
    const mutation = useMutation({
        mutationFn: updateInstructions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-instructions"] });
            toast.success("AI instructions updated successfully!");
            setHasChanges(false);
        },
        onError: () => {
            toast.error("Failed to update AI instructions.");
        },
    });

    const [editValue, setEditValue] = useState<string>("");
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (data) {
            setEditValue(data);
            setHasChanges(false);
        }
    }, [data]);

    useEffect(() => {
        setHasChanges(editValue !== data);
    }, [editValue, data]);

    const handleSave = () => {
        mutation.mutate(editValue);
    };

    const handleCancel = () => {
        setEditValue(data || "");
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading AI instructions...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Failed to load AI instructions.</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="border-b bg-card flex-shrink-0 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI System Instructions</h1>
                            <p className="text-sm text-muted-foreground">
                                Edit the system prompt that guides the WhatsApp bot's behavior
                            </p>
                        </div>
                    </div>
                    {hasChanges && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                disabled={mutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Editor */}
            <div className="flex-1 flex flex-col p-4">
                <Label htmlFor="ai-instructions" className="mb-2 text-sm font-medium">
                    System Instructions (Markdown Supported)
                </Label>
                <textarea
                    id="ai-instructions"
                    className="flex-1 w-full border rounded-lg p-4 font-mono text-sm bg-background text-foreground resize-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    spellCheck={false}
                    placeholder="Enter your AI system instructions here..."
                />
            </div>
        </div>
    );
} 