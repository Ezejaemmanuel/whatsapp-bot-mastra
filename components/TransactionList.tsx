import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUIState, useWhatsAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { useInView } from 'react-intersection-observer';

type TransactionStatus = "pending" | "completed" | "failed" | "verified" | "paid" | "cancelled";

const transactionStatuses: TransactionStatus[] = ["pending", "verified", "paid", "completed", "failed", "cancelled"];

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
  onUpdateStatus: (transactionId: Id<"transactions">, status: TransactionStatus) => void;
  isMobile?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  status,
  loadMore,
  selectedTransactionId,
  onTransactionSelect,
  onUpdateStatus,
  isMobile = false
}) => {
  const { searchQuery, setSearchQuery } = useWhatsAppStore(
    useShallow((state) => ({
      searchQuery: state.ui.searchQuery,
      setSearchQuery: state.setSearchQuery,
    }))
  );
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
      (transaction.user?.phoneNumber?.includes(searchQuery)) ||
      transaction.currencyFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.currencyTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.paymentReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction._id.toLowerCase().includes(searchQuery.toLowerCase());

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
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for unknown currency codes
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleStatusUpdate = (e: React.MouseEvent, transactionId: Id<"transactions">, newStatus: TransactionStatus) => {
    e.stopPropagation(); // Prevent card click event
    onUpdateStatus(transactionId, newStatus);
  };

  return (
    <div className="flex flex-col h-full bg-whatsapp-panel-bg border-r border-whatsapp-border">
      <TransactionListHeader />
      <TransactionSearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filters={filters}
      />
      <TransactionItems
        transactions={filteredTransactions}
        selectedTransactionId={selectedTransactionId}
        onTransactionSelect={onTransactionSelect}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        formatCurrency={formatCurrency}
        formatTimeAgo={formatTimeAgo}
        handleStatusUpdate={handleStatusUpdate}
        loadMoreRef={ref}
      />
    </div>
  );
};

const TransactionListHeader = () => (
  <div className="flex items-center justify-between p-4 bg-whatsapp-panel-bg border-b border-whatsapp-border flex-shrink-0">
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
);

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  filters: string[];
}

const TransactionSearchAndFilter: React.FC<SearchAndFilterProps> = ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter, filters }) => (
  <div className="p-3 bg-whatsapp-panel-bg flex-shrink-0">
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-whatsapp-text-muted" />
      <Input
        placeholder="Search by name, number, ref, ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 bg-whatsapp-bg border-whatsapp-border text-whatsapp-text-primary"
      />
    </div>
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
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
);

interface TransactionItemsProps {
  transactions: TransactionWithDetails[] | undefined;
  selectedTransactionId?: Id<"transactions">;
  onTransactionSelect: (transactionId: Id<"transactions">) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  formatTimeAgo: (timestamp: number) => string;
  handleStatusUpdate: (e: React.MouseEvent, transactionId: Id<"transactions">, newStatus: TransactionStatus) => void;
  loadMoreRef: React.Ref<HTMLDivElement>;
}

const TransactionItems: React.FC<TransactionItemsProps> = ({
  transactions,
  selectedTransactionId,
  onTransactionSelect,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatTimeAgo,
  handleStatusUpdate,
  loadMoreRef
}) => (
  <ScrollArea className="flex-1">
    <div className="flex flex-col p-2">
      {transactions?.map((transaction) => (
        <TransactionCard
          key={transaction._id}
          transaction={transaction}
          isSelected={selectedTransactionId === transaction._id}
          onSelect={onTransactionSelect}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          formatCurrency={formatCurrency}
          formatTimeAgo={formatTimeAgo}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
      <div ref={loadMoreRef} />
    </div>
  </ScrollArea>
);

interface TransactionCardProps {
  transaction: TransactionWithDetails;
  isSelected: boolean;
  onSelect: (transactionId: Id<"transactions">) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  formatTimeAgo: (timestamp: number) => string;
  onStatusUpdate: (e: React.MouseEvent, transactionId: Id<"transactions">, newStatus: TransactionStatus) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  isSelected,
  onSelect,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatTimeAgo,
  onStatusUpdate
}) => (
  <div
    onClick={() => onSelect(transaction._id)}
    className={`rounded-lg mb-2 transition-all duration-200 ${isSelected ? 'bg-whatsapp-active shadow-md' : 'bg-whatsapp-bg hover:bg-whatsapp-hover'} ${!transaction.isRead ? 'border-l-4 border-whatsapp-unread' : ''}`}
  >
    <div className="p-3 cursor-pointer">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 border">
          <AvatarImage src={undefined} alt={transaction.user?.profileName} />
          <AvatarFallback>{transaction.user?.profileName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <h3 className="font-semibold text-sm text-whatsapp-text-primary">{transaction.user?.profileName || 'Unknown User'}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-whatsapp-text-muted text-xs">{formatTimeAgo(transaction.createdAt)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-whatsapp-text-muted">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {transactionStatuses.map((status) => (
                    <DropdownMenuItem key={status} onClick={(e) => onStatusUpdate(e, transaction._id, status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-whatsapp-text-muted mb-2">{transaction.user?.phoneNumber}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-whatsapp-text-primary">{formatCurrency(transaction.amountFrom, transaction.currencyFrom)}</span>
              <ArrowRight className="w-4 h-4 text-whatsapp-text-muted" />
              <span className="font-bold text-whatsapp-text-primary">{formatCurrency(transaction.amountTo, transaction.currencyTo)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor(transaction.status)}`}>
              <span className="mr-1">{getStatusIcon(transaction.status)}</span>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
);