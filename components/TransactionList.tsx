import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIState, useWhatsAppStore } from '@/lib/store';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { useInView } from 'react-intersection-observer';

type TransactionWithDetails = Doc<"transactions"> & {
  user: Doc<"users"> | null;
  conversation: Doc<"conversations"> | null;
};

interface TransactionListProps {
  transactions: TransactionWithDetails[] | undefined;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  selectedTransactionId?: Id<"transactions">;
  onTransactionSelect: (transactionId: Id<"transactions">) => void;
  isMobile?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  status,
  loadMore,
  selectedTransactionId,
  onTransactionSelect,
  isMobile = false
}) => {
  const { searchQuery } = useUIState();
  const setSearchQuery = useWhatsAppStore((state) => state.setSearchQuery);
  const [activeFilter, setActiveFilter] = useState('All');
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && status === 'CanLoadMore') {
      loadMore(20);
    }
  }, [inView, status, loadMore]);

  const filters = ['All', 'Pending', 'Completed', 'Failed'];

  const filteredTransactions = transactions?.filter(transaction => {
    const typedTransaction = transaction as any;
    const matchesSearch = (typedTransaction.user?.profileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      transaction.currencyFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.currencyTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.paymentReference?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Pending') return matchesSearch && transaction.status === 'pending';
    if (activeFilter === 'Completed') return matchesSearch && transaction.status === 'completed';
    if (activeFilter === 'Failed') return matchesSearch && transaction.status === 'failed';
    return false; // Should not happen with the current filters
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paid':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NGN' ? 'USD' : currency, // Fallback for NGN
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    }).format(amount).replace('$', currency === 'NGN' ? '₦' : '$');
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="flex flex-col h-full bg-whatsapp-panel-bg border-r border-whatsapp-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-whatsapp-panel-bg border-b border-whatsapp-border">
        <h1 className="text-xl font-medium text-whatsapp-text-primary">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover">
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-whatsapp-panel-bg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-whatsapp-text-muted" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-whatsapp-bg border-whatsapp-border text-whatsapp-text-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 py-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap ${activeFilter === filter
                  ? 'bg-whatsapp-primary text-white'
                  : 'bg-whatsapp-hover text-whatsapp-text-secondary'
                  }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Transaction List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredTransactions?.map((transaction) => (
            <div
              key={transaction._id}
              onClick={() => onTransactionSelect(transaction._id)}
              className={`flex items-start gap-4 p-3 cursor-pointer hover:bg-whatsapp-hover ${selectedTransactionId === transaction._id ? 'bg-whatsapp-active' : ''}`}
            >
              <div className="mt-1">
                {getStatusIcon(transaction.status)}
              </div>
              <div className="flex-1 border-t border-whatsapp-divider pt-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-whatsapp-text-primary">{transaction.user?.profileName || 'Unknown User'}</h3>
                  <span className="text-whatsapp-text-muted text-xs">{formatTimeAgo(transaction.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-whatsapp-text-primary">{formatCurrency(transaction.amountFrom, transaction.currencyFrom)}</span>
                    <ArrowRight className="w-4 h-4 text-whatsapp-text-muted" />
                    <span className="font-medium text-whatsapp-text-primary">{formatCurrency(transaction.amountTo, transaction.currencyTo)}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(transaction.status)}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          <div ref={ref} />
        </div>
      </ScrollArea>
    </div>
  );
};