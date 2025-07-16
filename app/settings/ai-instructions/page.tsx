"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownText } from "@/components/MarkdownText";
import { toast } from "sonner";

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
        },
        onError: () => {
            toast.error("Failed to update AI instructions.");
        },
    });

    const [editValue, setEditValue] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);

    React.useEffect(() => {
        if (data && !isEditing) setEditValue(data);
    }, [data, isEditing]);

    if (isLoading) {
        return <div className="p-8 text-center">Loading AI instructions...</div>;
    }
    if (isError) {
        return <div className="p-8 text-center text-red-500">Failed to load AI instructions.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Edit AI System Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="mb-2 block">Current Instructions (Markdown Preview):</Label>
                        <div className="border rounded p-4 bg-muted max-h-64 overflow-auto">
                            <MarkdownText>{data}</MarkdownText>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="ai-instructions" className="mb-2 block">Edit Instructions (Markdown Supported):</Label>
                        <textarea
                            id="ai-instructions"
                            className="w-full min-h-[180px] border rounded p-2 font-mono"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditValue(data);
                            setIsEditing(false);
                        }}
                        disabled={!isEditing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            mutation.mutate(editValue);
                            setIsEditing(false);
                        }}
                        disabled={mutation.isPending || editValue === data}
                    >
                        {mutation.isPending ? "Saving..." : "Save"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 