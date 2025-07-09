import React from 'react';
import Image from 'next/image';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight } from 'lucide-react';

interface TransactionDetailViewProps {
    transactionId: Id<"transactions">;
    isMobile: boolean;
    onBack?: () => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'verified':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'paid':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'failed':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'cancelled':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'image_sent_waiting_for_confirmation':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
    transactionId,
    isMobile,
    onBack,
}) => {
    const transaction = useQuery(
        api.transactions.getTransaction,
        { transactionId }
    );
    const updateTransactionStatus = useMutation(api.transactions.updateTransactionStatus);

    const handleUpdateTransactionStatus = async (
        status: Doc<"transactions">["status"]
    ) => {
        if (!transaction) return;
        try {
            await updateTransactionStatus({ transactionId: transaction._id, status });
        } catch (error) {
            console.error("Failed to update transaction status", error);
        }
    };

    if (!transaction) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading transaction...</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="h-full flex flex-col bg-whatsapp-chat-bg">
                <div className="flex items-center gap-3 bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0">
                    {onBack && (
                        <button onClick={onBack} className="text-whatsapp-text-secondary">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <h2 className="text-lg font-medium text-whatsapp-text-primary">Transaction Details</h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="bg-whatsapp-panel-bg rounded-lg p-4 space-y-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-whatsapp-text-muted">Status</p>
                            <Select
                                value={transaction.status}
                                onValueChange={(newStatus) =>
                                    handleUpdateTransactionStatus(newStatus as Doc<"transactions">["status"])
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "pending", "paid", "verified", "completed", "failed",
                                        "cancelled", "image_sent_waiting_for_confirmation",
                                    ].map((status) => (
                                        <SelectItem key={status} value={status}>
                                            <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2"}>
                                                {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                                            </Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">From</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.amountFrom} {transaction.currencyFrom}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">To</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.amountTo} {transaction.currencyTo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Rate</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.negotiatedRate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Date</span>
                            <span className="font-medium text-whatsapp-text-primary">{new Date(transaction.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-whatsapp-panel-bg rounded-lg p-4 space-y-4 text-sm mt-4">
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Phone Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Bank Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.accountNumber || 'N/A'}</span>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-whatsapp-chat-bg">
            <div className="p-6 border-b border-whatsapp-divider bg-whatsapp-panel-bg">
                <h2 className="text-xl font-medium text-whatsapp-text-primary">Transaction Details</h2>
                <p className="text-whatsapp-text-secondary text-sm">ID: {transaction._id}</p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted">Status</p>
                        <Select
                            value={transaction.status}
                            onValueChange={(newStatus) =>
                                handleUpdateTransactionStatus(newStatus as Doc<"transactions">["status"])
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    "pending", "paid", "verified", "completed", "failed",
                                    "cancelled", "image_sent_waiting_for_confirmation",
                                ].map((status) => (
                                    <SelectItem key={status} value={status}>
                                        <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2"}>
                                            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                                        </Badge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted">User</p>
                        <p className="text-whatsapp-text-primary font-medium flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={(transaction as any).user?.avatar || '/assets/avatar-male-2.jpg'} />
                                <AvatarFallback>{(transaction as any).user?.profileName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            {(transaction as any).user?.profileName || 'Unknown'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted">Date</p>
                        <p className="text-whatsapp-text-primary font-medium">{new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted">Last Update</p>
                        <p className="text-whatsapp-text-primary font-medium">{new Date(transaction.updatedAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-whatsapp-text-muted text-sm">User Details</p>
                    <div className="bg-whatsapp-panel-bg p-4 rounded-lg space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Phone Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Bank Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{(transaction as any).user?.accountNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-whatsapp-text-muted text-sm">Transaction</p>
                    <div className="bg-whatsapp-panel-bg p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg text-red-500">{transaction.amountFrom.toLocaleString()} {transaction.currencyFrom}</span>
                            <ArrowUpRight className="w-5 h-5 text-whatsapp-text-muted mx-2" />
                            <span className="font-semibold text-lg text-green-500">{transaction.amountTo.toLocaleString()} {transaction.currencyTo}</span>
                        </div>
                        <p className="text-xs text-whatsapp-text-muted text-center">Rate: 1 {transaction.currencyFrom} = {transaction.negotiatedRate} {transaction.currencyTo}</p>
                    </div>
                </div>

                {transaction.paymentReference && (
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted text-sm">Payment Reference</p>
                        <p className="text-whatsapp-text-primary font-mono bg-whatsapp-panel-bg p-2 rounded-md text-xs">{transaction.paymentReference}</p>
                    </div>
                )}
                {(transaction as any).conversation?.lastMessageSummary && (
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted text-sm">Related Conversation</p>
                        <div className="bg-whatsapp-panel-bg p-3 rounded-lg">
                            <p className="text-whatsapp-text-primary text-sm italic">&ldquo;{(transaction as any).conversation.lastMessageSummary}&rdquo;</p>
                            <p className="text-xs text-whatsapp-text-muted mt-2 text-right"> - Last message from {(transaction as any).conversation.userName}</p>
                        </div>
                    </div>
                )}

                {transaction.receiptImageUrl && (
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted text-sm">Receipt</p>
                        <div className="bg-whatsapp-panel-bg p-2 rounded-lg border border-whatsapp-divider">
                            <Image
                                src={transaction.receiptImageUrl}
                                alt="Transaction Receipt"
                                width={500}
                                height={300}
                                className="rounded-md max-w-full h-auto"
                            />
                        </div>
                    </div>
                )}

                {transaction.negotiationHistory && transaction.negotiationHistory.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted text-sm">Negotiation History</p>
                        <div className="bg-whatsapp-panel-bg p-3 rounded-lg border border-whatsapp-divider max-h-40 overflow-y-auto space-y-2 text-xs">
                            {transaction.negotiationHistory.map((item, index) => (
                                <div key={index} className="p-2 bg-whatsapp-bg rounded-md">
                                    <p className="text-whatsapp-text-primary">
                                        {typeof item === 'object' ? JSON.stringify(item) : item.toString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {transaction.extractedDetails && (
                    <div className="space-y-1">
                        <p className="text-whatsapp-text-muted text-sm">Extracted Details</p>
                        <pre className="text-whatsapp-text-primary font-mono bg-whatsapp-panel-bg p-3 rounded-md border border-whatsapp-divider text-xs overflow-x-auto">
                            {JSON.stringify(transaction.extractedDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}; 