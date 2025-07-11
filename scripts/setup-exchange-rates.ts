import { fetchMutation } from "convex/nextjs";
import { api } from "../convex/_generated/api";

/**
 * Setup script to initialize exchange rates for KhalidWid Exchange Bot
 * Run this script to populate the database with sample exchange rates
 */

const sampleExchangeRates = [
    {
        currencyPair: "USD_NGN",
        minRate: 1450.00,      // Minimum rate for business (floor)
        maxRate: 1500.00,      // Maximum rate for customers (ceiling)
        currentMarketRate: 1475.00, // Current market reference rate
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
        metadata: {
            description: "Canadian Dollar to Nigerian Naira",
            lastUpdatedBy: "system",
            notes: "Canadian diaspora remittances"
        }
    }
];

async function setupExchangeRates() {
    console.log("🚀 Setting up exchange rates for KhalidWid Exchange Bot...");

    try {
        for (const rate of sampleExchangeRates) {
            console.log(`📊 Creating rate for ${rate.currencyPair}...`);

            const result = await fetchMutation(api.exchangeRates.upsertExchangeRate, {
                currencyPair: rate.currencyPair,
                minRate: rate.minRate,
                maxRate: rate.maxRate,
                currentMarketRate: rate.currentMarketRate,
                metadata: rate.metadata,
            });

            console.log(`✅ ${rate.currencyPair}: Min ₦${rate.minRate} - Max ₦${rate.maxRate} (Market: ₦${rate.currentMarketRate})`);
        }

        console.log("\n🎉 Exchange rates setup completed successfully!");
        console.log("\n📋 Summary:");
        console.log("- USD/NGN: ₦1,450 - ₦1,500 (Market: ₦1,475)");
        console.log("- GBP/NGN: ₦1,800 - ₦1,870 (Market: ₦1,835)");
        console.log("- EUR/NGN: ₦1,550 - ₦1,620 (Market: ₦1,585)");
        console.log("- CAD/NGN: ₦1,050 - ₦1,120 (Market: ₦1,085)");
        console.log("\n💡 The exchange bot can now negotiate within these rate boundaries!");

    } catch (error) {
        console.error("❌ Error setting up exchange rates:", error);
        process.exit(1);
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupExchangeRates();
}

export { setupExchangeRates, sampleExchangeRates }; 