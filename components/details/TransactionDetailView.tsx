import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'verified':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            case 'paid':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'failed':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'cancelled':
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
            case 'image_sent_waiting_for_confirmation':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    if (isMobile) {
        return (
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-whatsapp-bg via-whatsapp-chat-bg to-whatsapp-bg space-y-4">
                {/* Status and Basic Info */}
                <div className="glass-panel rounded-2xl p-6 space-y-5 backdrop-blur-xl border border-whatsapp-border/50 shadow-xl">
                    <div className="space-y-3">
                        <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Transaction Status</p>
                        <Select
                            value={transaction.status}
                            onValueChange={(newStatus) =>
                                handleUpdateTransactionStatus(
                                    transaction._id,
                                    newStatus as Doc<"transactions">["status"]
                                )
                            }
                        >
                            <SelectTrigger className="w-full glass-panel border border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300 h-12">
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
                                        <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2 backdrop-blur-sm font-medium"}>
                                            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                                        </Badge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Amount Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-xl backdrop-blur-sm border border-red-500/30 bg-red-500/5">
                            <span className="text-red-400 text-xs font-medium uppercase tracking-wide">From</span>
                            <div className="font-bold text-red-400 text-xl mt-1">{transaction.amountFrom.toLocaleString()} {transaction.currencyFrom}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl backdrop-blur-sm border border-emerald-500/30 bg-emerald-500/5">
                            <span className="text-emerald-400 text-xs font-medium uppercase tracking-wide">To</span>
                            <div className="font-bold text-emerald-400 text-xl mt-1">{transaction.amountTo.toLocaleString()} {transaction.currencyTo}</div>
                        </div>
                    </div>
                    
                    {/* Rate and Date */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-whatsapp-text-muted font-medium">Exchange Rate</span>
                            <span className="font-bold text-whatsapp-text-primary bg-whatsapp-primary/10 px-3 py-1 rounded-full text-sm">
                                1 {transaction.currencyFrom} = {transaction.negotiatedRate} {transaction.currencyTo}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-whatsapp-text-muted font-medium">Created</span>
                            <span className="font-semibold text-whatsapp-text-primary text-sm">{new Date(transaction.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Receipt Images */}
                {(imageUrls.length > 0) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-whatsapp-primary" />
                            <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Receipt Screenshots</p>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl border border-whatsapp-border/50 backdrop-blur-xl relative shadow-xl">
                            <div className="aspect-[9/16] max-w-sm mx-auto bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-xl overflow-hidden">
                                <ClickableImage
                                    src={imageUrls[currentImageIndex]}
                                    alt={`Transaction Receipt ${currentImageIndex + 1}`}
                                    title={`Receipt ${currentImageIndex + 1} of ${imageUrls.length}`}
                                    width={400}
                                    height={700}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                            {imageUrls.length > 1 && (
                                <>
                                    <Button 
                                        onClick={handlePrevImage} 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute left-2 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-110 shadow-lg"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <Button 
                                        onClick={handleNextImage} 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-110 shadow-lg"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-panel text-whatsapp-text-primary text-xs px-4 py-2 rounded-full border border-whatsapp-border/30 font-medium shadow-lg">
                                        {currentImageIndex + 1} / {imageUrls.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* User Details */}
                <div className="glass-panel rounded-2xl p-6 space-y-4 backdrop-blur-xl border border-whatsapp-border/50 shadow-xl">
                    <h3 className="text-whatsapp-primary font-bold text-lg flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={'/assets/avatar-male-2.jpg'} />
                            <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white text-xs">
                                {transaction.user?.profileName?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        User Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-whatsapp-border/20">
                            <span className="text-whatsapp-text-muted font-medium">Phone Number</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-whatsapp-border/20">
                            <span className="text-whatsapp-text-muted font-medium">Bank Name</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-whatsapp-border/20">
                            <span className="text-whatsapp-text-muted font-medium">Account Name</span>
                            <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.accountName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-whatsapp-text-muted font-medium">Account Number</span>
                            <span className="font-semibold text-whatsapp-text-primary font-mono">{transaction.user?.accountNumber || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Transaction Bank Details */}
                {(transaction.transactionBankName || transaction.transactionAccountNumber || transaction.transactionAccountName) && (
                    <div className="glass-panel rounded-2xl p-6 space-y-4 backdrop-blur-xl border border-whatsapp-accent/50 shadow-xl">
                        <h3 className="text-whatsapp-accent font-bold text-lg">Transaction Bank Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-whatsapp-border/20">
                                <span className="text-whatsapp-text-muted font-medium">Bank Name</span>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionBankName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-whatsapp-border/20">
                                <span className="text-whatsapp-text-muted font-medium">Account Name</span>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionAccountName || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-whatsapp-text-muted font-medium">Account Number</span>
                                <span className="font-semibold text-whatsapp-text-primary font-mono">{transaction.transactionAccountNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Extracted Details */}
                {transaction.extractedDetails && (
                    <div className="space-y-3">
                        <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Extracted Details</p>
                        <pre className="text-whatsapp-text-primary font-mono glass-panel p-4 rounded-xl border border-whatsapp-border/50 text-xs overflow-x-auto backdrop-blur-xl whatsapp-scrollbar shadow-xl">
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

            {/* Header */}
            <div className="p-6 border-b border-whatsapp-border/50 glass-panel backdrop-blur-xl relative z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-whatsapp-text-primary to-whatsapp-primary bg-clip-text text-transparent">
                    Transaction Details
                </h2>
                <p className="text-whatsapp-text-secondary text-sm font-medium mt-1">ID: {transaction._id}</p>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto whatsapp-scrollbar relative z-10">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Status and Basic Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Status</p>
                            <Select
                                value={transaction.status}
                                onValueChange={(newStatus) =>
                                    handleUpdateTransactionStatus(
                                        transaction._id,
                                        newStatus as Doc<"transactions">["status"]
                                    )
                                }
                            >
                                <SelectTrigger className="w-full glass-panel border border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300 h-12">
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
                                            <Badge variant="outline" className={getStatusColor(status) + " text-xs mr-2 backdrop-blur-sm font-medium"}>
                                                {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                                            </Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">User</p>
                            <div className="flex items-center gap-3 glass-panel p-3 rounded-xl border border-whatsapp-border/50">
                                <Avatar className="w-10 h-10 ring-2 ring-whatsapp-border/30">
                                    <AvatarImage src={'/assets/avatar-male-2.jpg'} />
                                    <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white font-semibold">
                                        {transaction.user?.profileName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.profileName || 'Unknown'}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Created</p>
                            <div className="glass-panel p-3 rounded-xl border border-whatsapp-border/50">
                                <p className="text-whatsapp-text-primary font-semibold text-sm">{new Date(transaction.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide">Last Update</p>
                            <div className="glass-panel p-3 rounded-xl border border-whatsapp-border/50">
                                <p className="text-whatsapp-text-primary font-semibold text-sm">{new Date(transaction.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Amount Display */}
                    <div className="glass-panel p-8 rounded-2xl backdrop-blur-xl border border-whatsapp-border/50 shadow-xl">
                        <h3 className="text-whatsapp-text-muted font-semibold text-sm uppercase tracking-wide mb-6">Transaction Details</h3>
                        <div className="flex justify-between items-center max-w-2xl mx-auto">
                            <div className="glass-panel p-6 rounded-xl backdrop-blur-sm border border-red-500/30 bg-red-500/5 text-center">
                                <span className="text-red-400 text-sm font-medium uppercase tracking-wide block mb-2">From</span>
                                <span className="font-bold text-red-400 text-3xl">{transaction.amountFrom.toLocaleString()} {transaction.currencyFrom}</span>
                            </div>
                            <ArrowUpRight className="w-8 h-8 text-whatsapp-primary mx-8" />
                            <div className="glass-panel p-6 rounded-xl backdrop-blur-sm border border-emerald-500/30 bg-emerald-500/5 text-center">
                                <span className="text-emerald-400 text-sm font-medium uppercase tracking-wide block mb-2">To</span>
                                <span className="font-bold text-emerald-400 text-3xl">{transaction.amountTo.toLocaleString()} {transaction.currencyTo}</span>
                            </div>
                        </div>
                        <p className="text-center text-whatsapp-text-muted font-medium mt-6">
                            Rate: 1 {transaction.currencyFrom} = {transaction.negotiatedRate} {transaction.currencyTo}
                        </p>
                    </div>

                    {/* Receipt Images */}
                    {(imageUrls.length > 0) && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-whatsapp-primary" />
                                <h3 className="text-whatsapp-text-muted font-semibold text-lg uppercase tracking-wide">Receipt Screenshots</h3>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border border-whatsapp-border/50 backdrop-blur-xl relative shadow-xl">
                                <div className="aspect-[9/16] max-w-md mx-auto bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-xl overflow-hidden">
                                    <ClickableImage
                                        src={imageUrls[currentImageIndex]}
                                        alt={`Transaction Receipt ${currentImageIndex + 1}`}
                                        title={`Receipt ${currentImageIndex + 1} of ${imageUrls.length}`}
                                        width={500}
                                        height={900}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                                {imageUrls.length > 1 && (
                                    <>
                                        <Button 
                                            onClick={handlePrevImage} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-110 shadow-lg"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </Button>
                                        <Button 
                                            onClick={handleNextImage} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute right-4 top-1/2 -translate-y-1/2 glass-panel hover:bg-whatsapp-primary/20 text-whatsapp-text-primary transition-all duration-300 hover:scale-110 shadow-lg"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel text-whatsapp-text-primary text-sm px-4 py-2 rounded-full border border-whatsapp-border/30 font-medium shadow-lg">
                                            {currentImageIndex + 1} / {imageUrls.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User and Bank Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* User Details */}
                        <div className="space-y-4">
                            <h3 className="text-whatsapp-text-muted font-semibold text-lg uppercase tracking-wide">User Details</h3>
                            <div className="glass-panel p-6 rounded-2xl backdrop-blur-xl border border-whatsapp-border/50 space-y-4 shadow-xl">
                                <div className="flex justify-between items-center py-3 border-b border-whatsapp-border/20">
                                    <span className="text-whatsapp-text-muted font-medium">Phone Number</span>
                                    <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-whatsapp-border/20">
                                    <span className="text-whatsapp-text-muted font-medium">Bank Name</span>
                                    <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.bankName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-whatsapp-border/20">
                                    <span className="text-whatsapp-text-muted font-medium">Account Name</span>
                                    <span className="font-semibold text-whatsapp-text-primary">{transaction.user?.accountName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-whatsapp-text-muted font-medium">Account Number</span>
                                    <span className="font-semibold text-whatsapp-text-primary font-mono">{transaction.user?.accountNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Bank Details */}
                        {(transaction.transactionBankName || transaction.transactionAccountNumber || transaction.transactionAccountName) && (
                            <div className="space-y-4">
                                <h3 className="text-whatsapp-text-muted font-semibold text-lg uppercase tracking-wide">Transaction Bank Details</h3>
                                <div className="glass-panel p-6 rounded-2xl backdrop-blur-xl border border-whatsapp-accent/50 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-center py-3 border-b border-whatsapp-border/20">
                                        <span className="text-whatsapp-text-muted font-medium">Bank Name</span>
                                        <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionBankName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-whatsapp-border/20">
                                        <span className="text-whatsapp-text-muted font-medium">Account Name</span>
                                        <span className="font-semibold text-whatsapp-text-primary">{transaction.transactionAccountName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-whatsapp-text-muted font-medium">Account Number</span>
                                        <span className="font-semibold text-whatsapp-text-primary font-mono">{transaction.transactionAccountNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Reference */}
                    {transaction.paymentReference && (
                        <div className="space-y-3">
                            <h3 className="text-whatsapp-text-muted font-semibold text-lg uppercase tracking-wide">Payment Reference</h3>
                            <div className="glass-panel p-4 rounded-xl border border-whatsapp-border/50 backdrop-blur-xl shadow-xl">
                                <p className="text-whatsapp-text-primary font-mono text-sm">{transaction.paymentReference}</p>
                            </div>
                        </div>
                    )}

                    {/* Extracted Details */}
                    {transaction.extractedDetails && (
                        <div className="space-y-4">
                            <h3 className="text-whatsapp-text-muted font-semibold text-lg uppercase tracking-wide">Extracted Details</h3>
                            <pre className="text-whatsapp-text-primary font-mono glass-panel p-6 rounded-2xl border border-whatsapp-border/50 text-sm overflow-x-auto backdrop-blur-xl whatsapp-scrollbar shadow-xl">
                                {JSON.stringify(transaction.extractedDetails, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};