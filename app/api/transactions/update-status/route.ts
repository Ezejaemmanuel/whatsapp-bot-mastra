import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { TransactionStatus } from '@/convex/schemaUnions';
import { WhatsAppClientService } from '@/whatsapp/whatsapp-client-service';

export async function POST(request: NextRequest) {
    try {
        const { transactionId, status, message } = await request.json();

        if (!transactionId || !status) {
            return NextResponse.json({ error: 'Missing transactionId or status' }, { status: 400 });
        }

        // 1. Update the transaction status in Convex
        await fetchMutation(api.transactions.updateTransactionStatus, {
            transactionId: transactionId as Id<"transactions">,
            status: status as TransactionStatus,
        });

        // 2. Prepare and send notification if needed
        const isConfirmation = status === 'confirmed_and_money_sent_to_user';
        const isCancellation = status === 'cancelled';

        if (isConfirmation || isCancellation) {
            // Get transaction to find user's phone number
            const transaction = await fetchQuery(api.transactions.getTransaction, {
                transactionId: transactionId as Id<"transactions">
            });

            if (!transaction || !transaction.user || !transaction.user.phoneNumber) {
                // Log this error, but don't fail the whole request since status is updated.
                console.error("Could not send notification: User or phone number not found for transaction", transactionId);
                return NextResponse.json({ success: true, message: "Status updated, but notification could not be sent." });
            }

            const { user } = transaction;

            let notificationMessage = "";
            const transactionDetails = `\n\nTransaction ID: ${transaction._id.slice(-8)}\nAmount: ${transaction.amountFrom} ${transaction.currencyFrom}`;

            if (isConfirmation) {
                notificationMessage = message || `✅ Good news! Your transaction has been confirmed, and the funds have been sent to your account.${transactionDetails}`;
            } else if (isCancellation) {
                notificationMessage = message
                    ? `❌ Your transaction has been cancelled for the following reason: ${message}.${transactionDetails}`
                    : `❌ Your transaction has been cancelled. If you have any questions, please contact support.${transactionDetails}`;
            }

            const whatsAppClient = WhatsAppClientService.getInstance().getClient();
            await whatsAppClient.messages.sendText({ to: user.phoneNumber!, text: notificationMessage });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to update transaction status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update transaction status', details: errorMessage }, { status: 500 });
    }
} 