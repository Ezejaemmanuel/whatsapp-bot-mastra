import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

/**
 * API endpoint to initialize exchange rates for KhalidWid Exchange Bot
 * GET /api/setup-exchange-rates - Sets up sample exchange rates in the database
 */

const sampleExchangeRates = [
    {
        currencyPair: "USD_NGN",
        minRate: 1450.00,      // Minimum rate for business (floor)
        maxRate: 1500.00,      // Maximum rate for customers (ceiling)
        currentMarketRate: 1475.00, // Current market reference rate
        isActive: true,
        metadata: {
            description: "US Dollar to Nigerian Naira",
            lastUpdatedBy: "system",
            notes: "Primary currency pair for KhalidWid Exchange"
        }
    },
    {
        currencyPair: "GBP_NGN",
        minRate: 1800.00,
        maxRate: 1870.00,
        currentMarketRate: 1835.00,
        isActive: true,
        metadata: {
            description: "British Pound to Nigerian Naira",
            lastUpdatedBy: "system",
            notes: "Popular currency pair for UK remittances"
        }
    },
    {
        currencyPair: "EUR_NGN",
        minRate: 1550.00,
        maxRate: 1620.00,
        currentMarketRate: 1585.00,
        isActive: true,
        metadata: {
            description: "Euro to Nigerian Naira",
            lastUpdatedBy: "system",
            notes: "European currency exchange"
        }
    },
    {
        currencyPair: "CAD_NGN",
        minRate: 1050.00,
        maxRate: 1120.00,
        currentMarketRate: 1085.00,
        isActive: true,
        metadata: {
            description: "Canadian Dollar to Nigerian Naira",
            lastUpdatedBy: "system",
            notes: "Canadian diaspora remittances"
        }
    }
];

/**
 * GET handler for setting up exchange rates
 * Creates or updates exchange rates in the database when accessed
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log("🚀 Setting up exchange rates for KhalidWid Exchange Bot...");

    try {
        const results: Array<{
            currencyPair: string;
            status: 'success' | 'error';
            message: string;
        }> = [];

        // Process each exchange rate
        for (const rate of sampleExchangeRates) {
            console.log(`📊 Creating rate for ${rate.currencyPair}...`);

            try {
                const result = await fetchMutation(api.exchangeRates.upsertExchangeRate, {
                    currencyPair: rate.currencyPair,
                    minRate: rate.minRate,
                    maxRate: rate.maxRate,
                    currentMarketRate: rate.currentMarketRate,
                    isActive: rate.isActive,
                    metadata: rate.metadata,
                });

                console.log(`✅ ${rate.currencyPair}: Min ₦${rate.minRate} - Max ₦${rate.maxRate} (Market: ₦${rate.currentMarketRate})`);

                results.push({
                    currencyPair: rate.currencyPair,
                    status: 'success',
                    message: `Min ₦${rate.minRate} - Max ₦${rate.maxRate} (Market: ₦${rate.currentMarketRate})`
                });
            } catch (rateError) {
                const errorMessage = rateError instanceof Error ? rateError.message : 'Unknown error';
                console.error(`❌ Error setting up ${rate.currencyPair}:`, errorMessage);

                results.push({
                    currencyPair: rate.currencyPair,
                    status: 'error',
                    message: errorMessage
                });
            }
        }

        // Check if all rates were processed successfully
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log("\n🎉 Exchange rates setup completed!");
        console.log(`✅ Successfully processed: ${successCount}`);
        console.log(`❌ Errors encountered: ${errorCount}`);

        if (errorCount > 0) {
            return NextResponse.json({
                success: false,
                message: `Partially completed: ${successCount} successful, ${errorCount} failed`,
                results,
                summary: {
                    totalProcessed: results.length,
                    successful: successCount,
                    failed: errorCount
                }
            }, { status: 207 }); // 207 Multi-Status for partial success
        }

        return NextResponse.json({
            success: true,
            message: "Exchange rates setup completed successfully!",
            results,
            summary: {
                totalProcessed: results.length,
                successful: successCount,
                failed: errorCount,
                rates: [
                    "USD/NGN: ₦1,450 - ₦1,500 (Market: ₦1,475)",
                    "GBP/NGN: ₦1,800 - ₦1,870 (Market: ₦1,835)",
                    "EUR/NGN: ₦1,550 - ₦1,620 (Market: ₦1,585)",
                    "CAD/NGN: ₦1,050 - ₦1,120 (Market: ₦1,085)"
                ]
            },
            note: "The exchange bot can now negotiate within these rate boundaries!"
        }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error("❌ Error setting up exchange rates:", errorMessage);

        return NextResponse.json({
            success: false,
            message: "Failed to setup exchange rates",
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export { sampleExchangeRates }; 