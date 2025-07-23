import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MarkdownText } from '@/components/MarkdownText';
import { ClickableImage } from '@/components/ClickableImage';
import { Button } from '@/components/ui/button';

interface TransactionDetailViewProps {
    transaction: Doc<"transactions"> & {
        receiptImageUrls?: string[];
        transactionBankName?: string;
        transactionAccountNumber?: string;
        transactionAccountName?: string;
        user?: {
            profileName?: string;
            phoneNumber?: string;
            bankName?: string;
            accountName?: string;
            accountNumber?: string;
            avatar?: string;
        };
        conversation?: {
            lastMessageSummary?: string;
            userName?: string;
        };
    };
    isMobile?: boolean;
}

export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
    transaction,
    isMobile = false,
}) => {
    const updateTransactionStatus = useMutation(api.transactions.updateTransactionStatus);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const imageUrls = transaction.receiptImageUrls || [];

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [transaction._id]);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
    };

    const handleUpdateTransactionStatus = async (
        transactionId: Id<"transactions">,
        status: Doc<"transactions">["status"]
    ) => {
        try {
            await updateTransactionStatus({ transactionId, status });
        } catch (error) {
            console.error("Failed to update transaction status", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-whatsapp-success/20 text-whatsapp-success border border-whatsapp-success/30';
            case 'pending':
                return 'bg-whatsapp-warning/20 text-whatsapp-warning border border-whatsapp-warning/30';
            case 'verified':
                return 'bg-whatsapp-primary/20 text-whatsapp-primary border border-whatsapp-primary/30';
            case 'paid':
                return 'bg-whatsapp-accent/20 text-whatsapp-accent border border-whatsapp-accent/30';
            case 'failed':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'cancelled':
                return 'bg-whatsapp-text-muted/20 text-whatsapp-text-muted border border-whatsapp-text-muted/30';
            case 'image_sent_waiting_for_confirmation':
                return 'bg-whatsapp-accent/20 text-whatsapp-accent border border-whatsapp-accent/30';
            default:
                return 'bg-whatsapp-text-muted/20 text-whatsapp-text-muted border border-whatsapp-text-muted/30';
        }
    };

    if (isMobile) {
        return (
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-whatsapp-bg via-whatsapp-chat-bg to-whatsapp-bg">
                <div className="glass-panel rounded-xl p-5 space-y-4 text-sm backdrop-blur-xl border border-whatsapp-border/50">
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted font-medium">Status</p>
                        <Select
                            value={transaction.status}
                            onValueChange={(newStatus) =>
                                handleUpdateTransactionStatus(
                                    transaction._id,
                                    newStatus as Doc<"transactions">["status"]
                                )
                            }
                        >
                            <SelectTrigger className="w-full glass-panel border border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300">
                                <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border border-whatsapp-border/50 backdrop-blur-xl">
                                {[
                                    "pending",
                                    "paid",
                                    "verified",
                                    "completed",
                                    "failed",
                                    "cancelled",
                                    "image_sent_waiting_for_confirmation",
                                ].map((status) => (
                                    <SelectItem key={status} value={status} className="hover:bg-whatsapp-hover/60 transition-all duration-300">
                                        <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2 backdrop-blur-sm"}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Badge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-whatsapp-border/30">
                            <span className="text-whatsapp-text-muted text-xs">From</span>
                            <div className="font-bold text-whatsapp-text-primary text-lg">{transaction.amountFrom} {transaction.currencyFrom}</div>
                        </div>
                        <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-whatsapp-border/30">
                            <span className="text-whatsapp-text-muted text-xs">To</span>
                            <div className="font-bold text-whatsapp-primary text-lg">{transaction.amountTo} {transaction.currencyTo}</div>
                        </div>
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

                <div className="glass-panel rounded-xl p-5 space-y-4 text-sm mt-4 backdrop-blur-xl border border-whatsapp-border/50">
                    <h3 className="text-whatsapp-primary font-semibold">User Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Phone Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.user?.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Bank Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.user?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Name</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.user?.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Number</span>
                            <span className="font-medium text-whatsapp-text-primary">{transaction.user?.accountNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {(transaction.transactionBankName || transaction.transactionAccountNumber || transaction.transactionAccountName) && (
                    <div className="glass-panel rounded-xl p-5 space-y-4 text-sm mt-4 backdrop-blur-xl border border-whatsapp-accent/50">
                        <h3 className="text-whatsapp-accent font-semibold">Transaction Bank Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Bank Name</span>
                                <span className="font-medium text-whatsapp-text-primary">{transaction.transactionBankName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Account Name</span>
                                <span className="font-medium text-whatsapp-text-primary">{transaction.transactionAccountName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Account Number</span>
                                <span className="font-medium text-whatsapp-text-primary">{transaction.transactionAccountNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {(imageUrls.length > 0) && (
                    <div className="space-y-3 mt-4">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Receipts</p>
                        <div className="glass-panel p-3 rounded-xl border border-whatsapp-border/50 backdrop-blur-xl relative">
                            <ClickableImage
                                src={imageUrls[currentImageIndex]}
                                alt={`Transaction Receipt ${currentImageIndex + 1}`}
                                title={`Receipt ${currentImageIndex + 1} of ${imageUrls.length}`}
                                width={500}
                                height={300}
                                className="object-contain w-full h-auto rounded-lg"
                            />
                            {imageUrls.length > 1 && (
                                <>
                                    <Button onClick={handlePrevImage} variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-105">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <Button onClick={handleNextImage} variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-105">
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-panel text-whatsapp-text-primary text-xs px-3 py-1 rounded-full border border-whatsapp-border/30">
                                        {currentImageIndex + 1} / {imageUrls.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {transaction.conversation?.lastMessageSummary && (
                    <div className="space-y-3 mt-4">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Related Conversation</p>
                        <div className="glass-panel p-4 rounded-xl backdrop-blur-xl border border-whatsapp-border/50">
                            <div className="text-whatsapp-text-primary text-sm italic">
                                <MarkdownText>{`"${transaction.conversation.lastMessageSummary}"`}</MarkdownText>
                            </div>
                            <p className="text-xs text-whatsapp-text-muted mt-2 text-right"> - Last message from {transaction.conversation.userName}</p>
                        </div>
                    </div>
                )}

                {transaction.extractedDetails && (
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Extracted Details</p>
                        <pre className="text-whatsapp-text-primary font-mono glass-panel p-4 rounded-xl border border-whatsapp-border/50 text-xs overflow-x-auto backdrop-blur-xl whatsapp-scrollbar">
                            {JSON.stringify(transaction.extractedDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    }

    // Desktop view
    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-whatsapp-chat-bg via-whatsapp-bg to-whatsapp-chat-bg relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-primary/5 via-transparent to-whatsapp-accent/5 pointer-events-none"></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-whatsapp-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-whatsapp-accent/10 rounded-full blur-3xl"></div>

            <div className="p-6 border-b border-whatsapp-border/50 glass-panel backdrop-blur-xl relative z-10">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-whatsapp-text-primary to-whatsapp-primary bg-clip-text text-transparent">Transaction Details</h2>
                <p className="text-whatsapp-text-secondary text-sm font-medium">ID: {transaction._id}</p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6 whatsapp-scrollbar relative z-10">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted font-medium">Status</p>
                        <Select
                            value={transaction.status}
                            onValueChange={(newStatus) =>
                                handleUpdateTransactionStatus(
                                    transaction._id,
                                    newStatus as Doc<"transactions">["status"]
                                )
                            }
                        >
                            <SelectTrigger className="w-full glass-panel border border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300">
                                <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent className="glass-panel border border-whatsapp-border/50 backdrop-blur-xl">
                                {[
                                    "pending",
                                    "paid",
                                    "verified",
                                    "completed",
                                    "failed",
                                    "cancelled",
                                    "image_sent_waiting_for_confirmation",
                                ].map((status) => (
                                    <SelectItem key={status} value={status} className="hover:bg-whatsapp-hover/60 transition-all duration-300">
                                        <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2 backdrop-blur-sm"}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Badge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted font-medium">User</p>
                        <p className="text-whatsapp-text-primary font-semibold flex items-center gap-3">
                            <Avatar className="w-8 h-8 ring-2 ring-whatsapp-border/30">
                                <AvatarImage src={'/assets/avatar-male-2.jpg'} />
                                <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white text-sm font-semibold">{transaction.user?.profileName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            {transaction.user?.profileName || 'Unknown'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted font-medium">Date</p>
                        <p className="text-whatsapp-text-primary font-semibold">{new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted font-medium">Last Update</p>
                        <p className="text-whatsapp-text-primary font-semibold">{new Date(transaction.updatedAt).toLocaleString()}</p>
                    </div>
                </div>

                {(imageUrls.length > 0) && (
                    <div className="col-span-2 space-y-3">
                        <p className="text-whatsapp-text-muted font-medium">Receipts</p>
                        <div className="glass-panel p-4 rounded-xl border border-whatsapp-border/50 backdrop-blur-xl relative aspect-video">
                            <ClickableImage
                                src={imageUrls[currentImageIndex]}
                                alt={`Transaction Receipt ${currentImageIndex + 1}`}
                                title={`Receipt ${currentImageIndex + 1} of ${imageUrls.length}`}
                                width={800}
                                height={600}
                                className="object-contain w-full h-full rounded-lg"
                            />
                            {imageUrls.length > 1 && (
                                <>
                                    <Button onClick={handlePrevImage} variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-105">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <Button onClick={handleNextImage} variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-105">
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-panel text-whatsapp-text-primary text-xs px-3 py-1 rounded-full border border-whatsapp-border/30">
                                        {currentImageIndex + 1} / {imageUrls.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-whatsapp-text-muted text-sm font-medium">User Details</p>
                    <div className="glass-panel p-5 rounded-xl backdrop-blur-xl border border-whatsapp-border/50 space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Phone Number</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Bank Name</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Name</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-whatsapp-text-muted">Account Number</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.accountNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {(transaction.transactionBankName || transaction.transactionAccountNumber || transaction.transactionAccountName) && (
                    <div className="space-y-3">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Transaction Bank Details</p>
                        <div className="glass-panel p-5 rounded-xl backdrop-blur-xl border border-whatsapp-accent/50 space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Bank Name</span>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionBankName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Account Name</span>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionAccountName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-whatsapp-text-muted">Account Number</span>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionAccountNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-whatsapp-text-muted text-sm font-medium">Transaction</p>
                    <div className="glass-panel p-5 rounded-xl backdrop-blur-xl border border-whatsapp-border/50 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-red-500/30">
                                <span className="font-bold text-lg text-red-400">{transaction.amountFrom.toLocaleString()} {transaction.currencyFrom}</span>
                            </div>
                            <ArrowUpRight className="w-6 h-6 text-whatsapp-primary mx-4" />
                            <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-whatsapp-success/30">
                                <span className="font-bold text-lg text-whatsapp-success">{transaction.amountTo.toLocaleString()} {transaction.currencyTo}</span>
                            </div>
                        </div>
                        <p className="text-xs text-whatsapp-text-muted text-center font-medium">Rate: 1 {transaction.currencyFrom} = {transaction.negotiatedRate} {transaction.currencyTo}</p>
                    </div>
                </div>

                {transaction.paymentReference && (
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Payment Reference</p>
                        <p className="text-whatsapp-text-primary font-mono glass-panel p-3 rounded-lg text-xs backdrop-blur-sm border border-whatsapp-border/50">{transaction.paymentReference}</p>
                    </div>
                )}

                {transaction.conversation?.lastMessageSummary && (
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Related Conversation</p>
                        <div className="glass-panel p-4 rounded-xl backdrop-blur-xl border border-whatsapp-border/50">
                            <div className="text-whatsapp-text-primary text-sm italic">
                                <MarkdownText>{`"${transaction.conversation.lastMessageSummary}"`}</MarkdownText>
                            </div>
                            <p className="text-xs text-whatsapp-text-muted mt-2 text-right font-medium"> - Last message from {transaction.conversation.userName}</p>
                        </div>
                    </div>
                )}

                {transaction.extractedDetails && (
                    <div className="space-y-2">
                        <p className="text-whatsapp-text-muted text-sm font-medium">Extracted Details</p>
                        <pre className="text-whatsapp-text-primary font-mono glass-panel p-4 rounded-xl border border-whatsapp-border/50 text-xs overflow-x-auto backdrop-blur-xl whatsapp-scrollbar">
                            {JSON.stringify(transaction.extractedDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};