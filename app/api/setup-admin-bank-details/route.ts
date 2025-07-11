import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

/**
 * Setup Admin Bank Details API
 * 
 * GET /api/setup-admin-bank-details
 * 
 * This endpoint initializes or updates the admin bank details database with 
 * the default account information for receiving customer payments.
 */

interface AdminBankDetailsConfig {
    accountNumber: string;
    accountName: string;
    bankName: string;
    isMain: boolean;
    description?: string;
    metadata?: {
        setupDate: string;
        setupSource: string;
        notes?: string;
    };
}

// Default admin bank details configuration
const DEFAULT_ADMIN_BANK_DETAILS: AdminBankDetailsConfig = {
    accountNumber: "9138853790",
    accountName: "Ezeja Emmanuel Chibuike",
    bankName: "Opay",
    isMain: true,
    description: "Primary account for receiving customer payments",
    metadata: {
        setupDate: new Date().toISOString(),
        setupSource: "API Setup",
        notes: "Default KhalidWid Exchange admin account"
    }
};

export async function GET(request: NextRequest) {
    try {
        console.log('🏦 Admin Bank Details Setup Started', {
            timestamp: new Date().toISOString(),
            mode: 'UPSERT_DEFAULT_ACCOUNT'
        });

        // Upsert the default admin bank details
        const result = await fetchMutation(api.adminBankDetails.upsertAdminBankDetails, {
            accountNumber: DEFAULT_ADMIN_BANK_DETAILS.accountNumber,
            accountName: DEFAULT_ADMIN_BANK_DETAILS.accountName,
            bankName: DEFAULT_ADMIN_BANK_DETAILS.bankName,
            isMain: DEFAULT_ADMIN_BANK_DETAILS.isMain,
            description: DEFAULT_ADMIN_BANK_DETAILS.description,
            metadata: DEFAULT_ADMIN_BANK_DETAILS.metadata,
        });

        console.log('✅ Admin Bank Details Setup Completed', {
            timestamp: new Date().toISOString(),
            bankDetailsId: result,
            accountNumber: DEFAULT_ADMIN_BANK_DETAILS.accountNumber,
            accountName: DEFAULT_ADMIN_BANK_DETAILS.accountName,
            bankName: DEFAULT_ADMIN_BANK_DETAILS.bankName,
            success: true
        });

        // Verify the setup by fetching the current default account
        const currentDefault = await fetchQuery(api.adminBankDetails.getMainAdminBankDetails, {});

        return NextResponse.json({
            success: true,
            message: 'Admin bank details setup completed successfully',
            data: {
                setupResult: {
                    bankDetailsId: result,
                    accountNumber: DEFAULT_ADMIN_BANK_DETAILS.accountNumber,
                    accountName: DEFAULT_ADMIN_BANK_DETAILS.accountName,
                    bankName: DEFAULT_ADMIN_BANK_DETAILS.bankName,
                    isMain: DEFAULT_ADMIN_BANK_DETAILS.isMain,
                    description: DEFAULT_ADMIN_BANK_DETAILS.description,
                    action: 'upserted'
                },
                currentDefault: currentDefault,
                timestamp: new Date().toISOString()
            }
        }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        console.error('❌ Admin Bank Details Setup Failed', {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            accountDetails: DEFAULT_ADMIN_BANK_DETAILS
        });

        return NextResponse.json({
            success: false,
            message: 'Failed to setup admin bank details',
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * POST /api/setup-admin-bank-details
 * 
 * Allows updating admin bank details with custom values
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('🏦 Custom Admin Bank Details Setup Started', {
            timestamp: new Date().toISOString(),
            requestBody: body
        });

        // Validate required fields
        const { accountNumber, accountName, bankName } = body;

        if (!accountNumber || !accountName || !bankName) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: accountNumber, accountName, bankName',
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        // Setup custom admin bank details
        const result = await fetchMutation(api.adminBankDetails.upsertAdminBankDetails, {
            accountNumber,
            accountName,
            bankName,
            isMain: body.isMain ?? true,
            description: body.description || `Admin account for ${bankName}`,
            metadata: {
                setupDate: new Date().toISOString(),
                setupSource: "API Custom Setup",
                notes: body.notes || "Custom admin bank details setup",
                ...body.metadata
            },
        });

        console.log('✅ Custom Admin Bank Details Setup Completed', {
            timestamp: new Date().toISOString(),
            bankDetailsId: result,
            accountNumber,
            accountName,
            bankName,
            success: true
        });

        // Verify the setup
        const currentDefault = await fetchQuery(api.adminBankDetails.getMainAdminBankDetails, {});

        return NextResponse.json({
            success: true,
            message: 'Custom admin bank details setup completed successfully',
            data: {
                setupResult: {
                    bankDetailsId: result,
                    accountNumber,
                    accountName,
                    bankName,
                    isMain: body.isMain ?? true,
                    description: body.description || `Admin account for ${bankName}`,
                    action: 'upserted'
                },
                currentDefault: currentDefault,
                timestamp: new Date().toISOString()
            }
        }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        console.error('❌ Custom Admin Bank Details Setup Failed', {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json({
            success: false,
            message: 'Failed to setup custom admin bank details',
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 