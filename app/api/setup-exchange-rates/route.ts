import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

/**
 * Setup Exchange Rates API
 * 
 * GET /api/setup-exchange-rates
 * 
 * This endpoint initializes the exchange rates database with default currency pairs
 * and their associated rate boundaries for the KhalidWid Exchange Bot.
 */

interface ExchangeRateConfig {
    fromCurrencyName: string;
    fromCurrencyCode: string;
    toCurrencyName: string;
    toCurrencyCode: string;
    minRate: number;
    maxRate: number;
    currentMarketRate: number;
    metadata?: {
        description: string;
        lastMarketCheck?: string;
        rateSource?: string;
    };
}

// Default exchange rate configurations
const DEFAULT_EXCHANGE_RATES: ExchangeRateConfig[] = [
    {
        fromCurrencyName: "US Dollar",
        fromCurrencyCode: "USD",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 1650.00,
        maxRate: 1700.00,
        currentMarketRate: 1675.00,
        metadata: {
            description: "US Dollar to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    },
    {
        fromCurrencyName: "British Pound",
        fromCurrencyCode: "GBP",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 2050.00,
        maxRate: 2120.00,
        currentMarketRate: 2085.00,
        metadata: {
            description: "British Pound to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    },
    {
        fromCurrencyName: "Euro",
        fromCurrencyCode: "EUR",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 1750.00,
        maxRate: 1820.00,
        currentMarketRate: 1785.00,
        metadata: {
            description: "Euro to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    },
    {
        fromCurrencyName: "Canadian Dollar",
        fromCurrencyCode: "CAD",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 1200.00,
        maxRate: 1250.00,
        currentMarketRate: 1225.00,
        metadata: {
            description: "Canadian Dollar to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    },
    {
        fromCurrencyName: "Australian Dollar",
        fromCurrencyCode: "AUD",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 1100.00,
        maxRate: 1150.00,
        currentMarketRate: 1125.00,
        metadata: {
            description: "Australian Dollar to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    },
    {
        fromCurrencyName: "Swiss Franc",
        fromCurrencyCode: "CHF",
        toCurrencyName: "Nigerian Naira",
        toCurrencyCode: "NGN",
        minRate: 1850.00,
        maxRate: 1920.00,
        currentMarketRate: 1885.00,
        metadata: {
            description: "Swiss Franc to Nigerian Naira",
            lastMarketCheck: new Date().toISOString(),
            rateSource: "Manual Setup"
        }
    }
];





export async function GET(request: NextRequest) {
    try {
        console.log('🏦 Exchange Rates Setup Started - Always Reset Mode', {
            timestamp: new Date().toISOString(),
            totalRatesToSetup: DEFAULT_EXCHANGE_RATES.length,
            mode: 'FORCE_RESET'
        });

        const setupResults = [];
        const errors = [];

        // Process each exchange rate configuration - always upsert/update
        for (const rateConfig of DEFAULT_EXCHANGE_RATES) {
            const currencyPair = `${rateConfig.fromCurrencyCode}_${rateConfig.toCurrencyCode}`;
            try {
                console.log(`💱 Setting up ${currencyPair}`, {
                    minRate: rateConfig.minRate,
                    maxRate: rateConfig.maxRate,
                    currentMarketRate: rateConfig.currentMarketRate,
                    description: rateConfig.metadata?.description
                });

                const result = await fetchMutation(api.exchangeRates.upsertExchangeRate, {
                    fromCurrencyName: rateConfig.fromCurrencyName,
                    fromCurrencyCode: rateConfig.fromCurrencyCode,
                    toCurrencyName: rateConfig.toCurrencyName,
                    toCurrencyCode: rateConfig.toCurrencyCode,
                    minRate: rateConfig.minRate,
                    maxRate: rateConfig.maxRate,
                    currentMarketRate: rateConfig.currentMarketRate,
                    metadata: rateConfig.metadata
                });

                setupResults.push({
                    currencyPair: currencyPair,
                    success: true,
                    action: 'updated',
                    rates: {
                        min: rateConfig.minRate,
                        max: rateConfig.maxRate,
                        market: rateConfig.currentMarketRate
                    }
                });

                console.log(`✅ ${currencyPair} setup completed`, {
                    currencyPair: currencyPair,
                    resultId: result,
                    success: true
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const currencyPair = `${rateConfig.fromCurrencyCode}_${rateConfig.toCurrencyCode}`;

                console.error(`❌ Failed to setup ${currencyPair}`, {
                    currencyPair: currencyPair,
                    error: errorMessage,
                    rateConfig
                });

                errors.push({
                    currencyPair: currencyPair,
                    error: errorMessage,
                    success: false
                });

                setupResults.push({
                    currencyPair: currencyPair,
                    success: false,
                    error: errorMessage
                });
            }
        }

        // Calculate success metrics
        const successCount = setupResults.filter(r => r.success).length;
        const failureCount = errors.length;
        const successRate = (successCount / DEFAULT_EXCHANGE_RATES.length) * 100;

        console.log('🎉 Exchange Rates Setup Completed', {
            timestamp: new Date().toISOString(),
            totalRates: DEFAULT_EXCHANGE_RATES.length,
            successCount,
            failureCount,
            successRate: `${successRate.toFixed(1)}%`,
            setupResults: setupResults.map((r: any) => ({
                pair: r.currencyPair,
                success: r.success,
                action: r.action || 'failed'
            }))
        });

        // Verify setup by fetching all rates
        let verification = null;
        try {
            const allRates = await fetchQuery(api.exchangeRates.getAllExchangeRates);
            verification = {
                totalActiveRates: allRates?.length || 0,
                activePairs: allRates?.map((r: any) => r.currencyPair) || []
            };
        } catch (verificationError) {
            console.warn('⚠️ Could not verify setup', {
                error: verificationError instanceof Error ? verificationError.message : 'Unknown error'
            });
        }

        const response = {
            success: successCount > 0,
            message: successCount === DEFAULT_EXCHANGE_RATES.length
                ? 'All exchange rates setup successfully'
                : `${successCount} of ${DEFAULT_EXCHANGE_RATES.length} rates setup successfully`,
            timestamp: new Date().toISOString(),
            mode: 'ALWAYS_RESET',
            statistics: {
                totalRates: DEFAULT_EXCHANGE_RATES.length,
                successCount,
                failureCount,
                successRate: `${successRate.toFixed(1)}%`
            },
            setupResults,
            verification,
            errors: errors.length > 0 ? errors : undefined,
            availableEndpoints: {
                getCurrentRates: '/api/exchange-rates/current',
                validateRate: '/api/exchange-rates/validate',
                setupRates: '/api/setup-exchange-rates'
            }
        };

        // Return appropriate status code
        const statusCode = successCount === DEFAULT_EXCHANGE_RATES.length ? 200 :
            successCount > 0 ? 207 : // Partial success
                500; // Complete failure

        return NextResponse.json(response, { status: statusCode });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error('💥 Exchange Rates Setup Failed', {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            stack: errorStack,
            operation: 'setup_exchange_rates'
        });

        return NextResponse.json({
            success: false,
            message: 'Failed to setup exchange rates',
            error: errorMessage,
            timestamp: new Date().toISOString(),
            suggestion: 'Check server logs for detailed error information'
        }, { status: 500 });
    }
}
