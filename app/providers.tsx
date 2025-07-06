"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Set up TanStack Query with Convex integration
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryKeyHashFn: convexQueryClient.hashFn(),
            queryFn: convexQueryClient.queryFn(),
        },
    },
});
convexQueryClient.connect(queryClient);

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ConvexProvider client={convex}>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    {children}
                    <Sonner />
                </TooltipProvider>
            </QueryClientProvider>
        </ConvexProvider>
    );
} 