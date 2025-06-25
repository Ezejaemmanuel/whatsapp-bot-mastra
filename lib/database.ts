import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../convex/_generated/api";

// Export functions for database operations
export const database = {
    query: fetchQuery,
    mutation: fetchMutation,
    api,
};

// Helper function to check if Convex URL is configured
export function checkConvexConfig() {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }
} 