import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function GET() {
    // Check if we're in production and add a safety check
    const isProduction = process.env.NODE_ENV === 'production';

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.error("NEXT_PUBLIC_CONVEX_URL is not configured");
        return new NextResponse("Database configuration error", { status: 500 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    try {
        console.log("Starting database seeding process...");
        const result = await convex.action(api.seed.seedDatabase, {});

        if (result.skipped) {
            console.log("Seeding skipped - database already contains data");
            return new NextResponse(
                JSON.stringify({
                    success: true,
                    message: result.message,
                    skipped: true
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`Seeding completed successfully. Created ${result.usersCreated} users.`);
        return new NextResponse(
            JSON.stringify({
                success: true,
                message: result.message,
                usersCreated: result.usersCreated,
                skipped: false
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error("Failed to seed database:", error);

        // Provide more detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return new NextResponse(
            JSON.stringify({
                success: false,
                message: "Failed to seed database",
                error: errorMessage,
                timestamp: new Date().toISOString()
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 