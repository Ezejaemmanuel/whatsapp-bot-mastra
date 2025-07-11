import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Wallet } from 'lucide-react';
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
import { EmptyState } from './ui/empty-state';

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
        return <CheckCircle className="w-4 h-4 text-whatsapp-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-whatsapp-warning" />;
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-whatsapp-primary" />;
      case 'paid':
        return <ArrowUpRight className="w-4 h-4 text-whatsapp-accent" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-whatsapp-text-muted" />;
      default:
        return <AlertCircle className="w-4 h-4 text-whatsapp-text-muted" />;
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
      default:
        return 'bg-whatsapp-text-muted/20 text-whatsapp-text-muted border border-whatsapp-text-muted/30';
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
    <div className="flex flex-col h-full glass-panel border-r border-whatsapp-border backdrop-blur-xl">
      <TransactionListHeader />
      <TransactionSearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filters={filters}
      />
      <TransactionItems
        initialTransactions={transactions || []}
        transactions={filteredTransactions || []}
        searchQuery={searchQuery}
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
  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-whatsapp-panel-bg to-whatsapp-panel-bg/80 border-b border-whatsapp-border/50 flex-shrink-0 backdrop-blur-sm">
    <h1 className="text-xl font-semibold bg-gradient-to-r from-whatsapp-text-primary to-whatsapp-primary bg-clip-text text-transparent">Transactions</h1>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105">
        <Plus className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105">
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
  <div className="p-4 bg-gradient-to-r from-whatsapp-panel-bg/90 to-whatsapp-panel-bg/70 flex-shrink-0 backdrop-blur-sm">
    <div className="relative mb-3 group">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-whatsapp-text-muted group-focus-within:text-whatsapp-primary transition-colors duration-300" />
      <Input
        placeholder="Search by name, number, ref, ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-12 whatsapp-input bg-whatsapp-bg/80 border border-whatsapp-border/50 text-whatsapp-text-primary focus:ring-2 focus:ring-whatsapp-primary/30 focus:border-whatsapp-primary transition-all duration-300"
      />
    </div>
    <ScrollArea className="w-full">
      <div className="flex gap-3">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap transition-all duration-300 hover:scale-105 ${activeFilter === filter
              ? 'bg-gradient-to-r from-whatsapp-primary to-whatsapp-accent text-white hover:from-whatsapp-primary/90 hover:to-whatsapp-accent/90 shadow-lg glow-purple'
              : 'bg-whatsapp-hover/60 text-whatsapp-text-secondary hover:bg-whatsapp-border/60 hover:text-whatsapp-primary backdrop-blur-sm border border-whatsapp-border/30'
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
  initialTransactions: TransactionWithDetails[];
  transactions: TransactionWithDetails[];
  searchQuery: string;
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
  initialTransactions,
  transactions,
  searchQuery,
  selectedTransactionId,
  onTransactionSelect,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatTimeAgo,
  handleStatusUpdate,
  loadMoreRef
}) => {
  if (initialTransactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={<Wallet />}
          title="No Transactions Yet"
          message="When you have transactions, they will appear here."
        />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={<Search />}
          title="No Transactions Found"
          message={`Your search for "${searchQuery}" did not return any results.`}
        />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 whatsapp-scrollbar">
      <div className="space-y-2 p-3">
        {transactions.map((transaction) => (
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
        <div ref={loadMoreRef} className="h-1" />
      </div>
    </ScrollArea>
  )
};

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
    className={`p-4 border border-whatsapp-border/50 rounded-xl cursor-pointer transition-all duration-300 hover:bg-whatsapp-hover/40 hover:backdrop-blur-sm hover:border-whatsapp-primary/30 hover:scale-[1.02] hover:shadow-lg group ${isSelected
      ? 'bg-gradient-to-r from-whatsapp-active to-whatsapp-active/80 border-whatsapp-primary shadow-lg glow-purple backdrop-blur-sm'
      : 'bg-whatsapp-panel-bg/50 backdrop-blur-sm'
      }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-10 h-10 ring-2 ring-whatsapp-border/30 transition-all duration-300 group-hover:ring-whatsapp-primary/50">
            <AvatarImage src={'/assets/avatar-male-1.jpg'} alt={transaction.user?.profileName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white text-sm font-semibold">
              {transaction.user?.profileName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!transaction.isRead && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-whatsapp-accent rounded-full border-2 border-whatsapp-panel-bg pulse-purple"></div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-whatsapp-text-primary text-sm group-hover:text-whatsapp-primary transition-colors duration-300">
            {transaction.user?.profileName || 'Unknown User'}
          </h3>
          <p className="text-xs text-whatsapp-text-muted">
            {transaction.user?.phoneNumber}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transaction.status)} backdrop-blur-sm`}>
          <span className="flex items-center gap-1">
            {getStatusIcon(transaction.status)}
            {transaction.status}
          </span>
        </Badge>
        <span className="text-xs text-whatsapp-text-muted font-medium">
          {formatTimeAgo(transaction.createdAt)}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-whatsapp-border/30">
        <p className="text-xs text-whatsapp-text-muted mb-1">From</p>
        <p className="font-bold text-whatsapp-text-primary text-lg">
          {formatCurrency(transaction.amountFrom, transaction.currencyFrom)}
        </p>
        <p className="text-xs text-whatsapp-text-secondary">{transaction.currencyFrom}</p>
      </div>
      <div className="glass-panel p-3 rounded-lg backdrop-blur-sm border border-whatsapp-border/30">
        <p className="text-xs text-whatsapp-text-muted mb-1">To</p>
        <p className="font-bold text-whatsapp-primary text-lg">
          {formatCurrency(transaction.amountTo, transaction.currencyTo)}
        </p>
        <p className="text-xs text-whatsapp-text-secondary">{transaction.currencyTo}</p>
      </div>
    </div>

    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <span className="text-whatsapp-text-muted">
          ID: {transaction._id.slice(-8)}
        </span>
        {transaction.paymentReference && (
          <span className="text-whatsapp-text-muted">
            Ref: {transaction.paymentReference}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-panel border border-whatsapp-border/50 backdrop-blur-xl">
            {transactionStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={(e) => onStatusUpdate(e, transaction._id, status)}
                className="text-whatsapp-text-primary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ArrowRight className="w-4 h-4 text-whatsapp-text-muted group-hover:text-whatsapp-primary transition-colors duration-300" />
      </div>
    </div>
  </div>
);