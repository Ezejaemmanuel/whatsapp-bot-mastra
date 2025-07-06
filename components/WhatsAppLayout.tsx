"use client";
import React, { useEffect, Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChatList } from './ChatList';
import { ChatView } from './ChatView';
import { SideNavigation } from './SideNavigation';
import { TransactionList } from './TransactionList';
import { useWhatsAppStore, useUIState } from '@/lib/store';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useShallow } from 'zustand/react/shallow';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight } from 'lucide-react';

const WhatsAppLayoutContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'chats');
  const [selectedConversationId, setSelectedConversationId] = useState(searchParams.get('chatId') as Id<"conversations"> | undefined);
  const [selectedTransactionId, setSelectedTransactionId] = useState(searchParams.get('transactionId') as Id<"transactions"> | undefined);

  const { isMobile } = useUIState();
  const setIsMobile = useWhatsAppStore((state) => state.setIsMobile);

  const {
    results: conversations,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.conversations.getAllConversationsWithUsers,
    {},
    { initialNumItems: 20 }
  );
  const markAsRead = useMutation(api.conversations.markConversationAsRead);

  const {
    results: transactions,
    status: transactionsStatus,
    loadMore: loadMoreTransactions,
  } = usePaginatedQuery(
    api.transactions.getAllTransactions,
    {},
    { initialNumItems: 20 }
  );

  const selectedTransaction = useQuery(
    api.transactions.getTransaction,
    selectedTransactionId ? { transactionId: selectedTransactionId } : "skip"
  );

  // Sort conversations by lastMessageAt in descending order (latest first)
  const sortedConversations = useMemo(() => {
    if (!conversations) return [];

    return [...conversations].sort((a, b) => {
      const aTime = a.lastMessageAt || 0;
      const bTime = b.lastMessageAt || 0;
      return bTime - aTime; // Descending order (latest first)
    });
  }, [conversations]);

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];

    return [...transactions].sort((a, b) => {
      return b.createdAt - a.createdAt; // Descending order (latest first)
    });
  }, [transactions]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedConversationId) {
      params.set('chatId', selectedConversationId);
    } else {
      params.delete('chatId');
    }
    if (selectedTransactionId) {
      params.set('transactionId', selectedTransactionId);
    } else {
      params.delete('transactionId');
    }
    params.set('tab', activeTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedConversationId, selectedTransactionId, activeTab, pathname, router, searchParams]);

  const handleChatSelect = (chatId: Id<"conversations">) => {
    setSelectedConversationId(chatId);
    setSelectedTransactionId(undefined);
    markAsRead({ conversationId: chatId });
  };

  const handleTransactionSelect = (transactionId: Id<"transactions">) => {
    setSelectedTransactionId(transactionId);
    setSelectedConversationId(undefined);
  };

  const handleTabChange = (tab: 'chats' | 'transactions' | 'settings' | 'calls') => {
    setActiveTab(tab);
    setSelectedConversationId(undefined);
    setSelectedTransactionId(undefined);
  };

  const handleBack = () => {
    setSelectedConversationId(undefined);
    setSelectedTransactionId(undefined);
  };

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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-whatsapp-bg">
        {selectedConversationId ? (
          <ChatView chatId={selectedConversationId} onBack={handleBack} isMobile={true} />
        ) : selectedTransactionId && selectedTransaction ? (
          // Mobile Transaction Detail View
          <div className="h-full flex flex-col bg-whatsapp-chat-bg">
            <div className="flex items-center gap-3 bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0">
              <button onClick={handleBack} className="text-whatsapp-text-secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-lg font-medium text-whatsapp-text-primary">Transaction Details</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-whatsapp-panel-bg rounded-lg p-4 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-whatsapp-text-muted">Status</span>
                  <Badge variant="outline" className={getStatusColor(selectedTransaction.status) + " text-xs"}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-whatsapp-text-muted">From</span>
                  <span className="font-medium text-whatsapp-text-primary">{selectedTransaction.amountFrom} {selectedTransaction.currencyFrom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-whatsapp-text-muted">To</span>
                  <span className="font-medium text-whatsapp-text-primary">{selectedTransaction.amountTo} {selectedTransaction.currencyTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-whatsapp-text-muted">Rate</span>
                  <span className="font-medium text-whatsapp-text-primary">{selectedTransaction.negotiatedRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-whatsapp-text-muted">Date</span>
                  <span className="font-medium text-whatsapp-text-primary">{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'transactions' ? (
          <TransactionList
            transactions={sortedTransactions}
            status={transactionsStatus}
            loadMore={loadMoreTransactions}
            selectedTransactionId={selectedTransactionId}
            onTransactionSelect={handleTransactionSelect}
            isMobile={true} />
        ) : (
          <ChatList
            conversations={sortedConversations}
            status={status}
            loadMore={loadMore}
            selectedChatId={selectedConversationId}
            onChatSelect={handleChatSelect}
            isMobile={true}
            activeTab={activeTab}
            onTabChange={handleTabChange} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-whatsapp-bg overflow-hidden">
      <SideNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="w-96 flex-shrink-0">
        {activeTab === 'chats' ? (
          <ChatList
            conversations={sortedConversations}
            status={status}
            loadMore={loadMore}
            selectedChatId={selectedConversationId}
            onChatSelect={handleChatSelect}
            isMobile={false} />
        ) : activeTab === 'transactions' ? (
          <TransactionList
            transactions={sortedTransactions}
            status={transactionsStatus}
            loadMore={loadMoreTransactions}
            selectedTransactionId={selectedTransactionId}
            onTransactionSelect={handleTransactionSelect}
            isMobile={false} />
        ) : (
          <div className="flex items-center justify-center h-full bg-whatsapp-panel-bg">
            <p className="text-whatsapp-text-muted">Coming soon...</p>
          </div>
        )}
      </div>

      <div className="flex-1">
        {activeTab === 'chats' ? (
          <ChatView chatId={selectedConversationId} isMobile={false} />
        ) : activeTab === 'transactions' && selectedTransactionId && selectedTransaction ? (
          <div className="h-full flex flex-col bg-whatsapp-chat-bg">
            <div className="p-6 border-b border-whatsapp-divider bg-whatsapp-panel-bg">
              <h2 className="text-xl font-medium text-whatsapp-text-primary">Transaction Details</h2>
              <p className="text-whatsapp-text-secondary text-sm">ID: {selectedTransaction._id}</p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedTransaction.status) + " text-xs"}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted">User</p>
                  <p className="text-whatsapp-text-primary font-medium flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={(selectedTransaction as any).user?.avatar || '/assets/avatar-male-2.jpg'} />
                      <AvatarFallback>{(selectedTransaction as any).user?.profileName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    {(selectedTransaction as any).user?.profileName || 'Unknown'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted">Date</p>
                  <p className="text-whatsapp-text-primary font-medium">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted">Last Update</p>
                  <p className="text-whatsapp-text-primary font-medium">{new Date(selectedTransaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-whatsapp-text-muted text-sm">Transaction</p>
                <div className="bg-whatsapp-panel-bg p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-red-500">{selectedTransaction.amountFrom.toLocaleString()} {selectedTransaction.currencyFrom}</span>
                    <ArrowUpRight className="w-5 h-5 text-whatsapp-text-muted mx-2" />
                    <span className="font-semibold text-lg text-green-500">{selectedTransaction.amountTo.toLocaleString()} {selectedTransaction.currencyTo}</span>
                  </div>
                  <p className="text-xs text-whatsapp-text-muted text-center">Rate: 1 {selectedTransaction.currencyFrom} = {selectedTransaction.negotiatedRate} {selectedTransaction.currencyTo}</p>
                </div>
              </div>

              {selectedTransaction.paymentReference && (
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted text-sm">Payment Reference</p>
                  <p className="text-whatsapp-text-primary font-mono bg-whatsapp-panel-bg p-2 rounded-md text-xs">{selectedTransaction.paymentReference}</p>
                </div>
              )}
              {(selectedTransaction as any).conversation?.lastMessageSummary && (
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted text-sm">Related Conversation</p>
                  <div className="bg-whatsapp-panel-bg p-3 rounded-lg">
                    <p className="text-whatsapp-text-primary text-sm italic">"{(selectedTransaction as any).conversation.lastMessageSummary}"</p>
                    <p className="text-xs text-whatsapp-text-muted mt-2 text-right"> - Last message from {(selectedTransaction as any).conversation.userName}</p>
                  </div>
                </div>
              )}

              {selectedTransaction.receiptImageUrl && (
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted text-sm">Receipt</p>
                  <div className="bg-whatsapp-panel-bg p-2 rounded-lg border border-whatsapp-divider">
                    <img
                      src={selectedTransaction.receiptImageUrl}
                      alt="Transaction Receipt"
                      className="rounded-md max-w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {selectedTransaction.negotiationHistory && selectedTransaction.negotiationHistory.length > 0 && (
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted text-sm">Negotiation History</p>
                  <div className="bg-whatsapp-panel-bg p-3 rounded-lg border border-whatsapp-divider max-h-40 overflow-y-auto space-y-2 text-xs">
                    {selectedTransaction.negotiationHistory.map((item, index) => (
                      <div key={index} className="p-2 bg-whatsapp-bg rounded-md">
                        <p className="text-whatsapp-text-primary">
                          {typeof item === 'object' ? JSON.stringify(item) : item.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransaction.extractedDetails && (
                <div className="space-y-1">
                  <p className="text-whatsapp-text-muted text-sm">Extracted Details</p>
                  <pre className="text-whatsapp-text-primary font-mono bg-whatsapp-panel-bg p-3 rounded-md border border-whatsapp-divider text-xs overflow-x-auto">
                    {JSON.stringify(selectedTransaction.extractedDetails, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-whatsapp-chat-bg">
            <div className="text-center">
              <h2 className="text-2xl font-light text-whatsapp-text-primary mb-2">
                {activeTab === 'transactions' ? 'Select a Transaction' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-whatsapp-text-secondary">
                {activeTab === 'transactions' ? 'Choose a transaction to view its details' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} feature coming soon...`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const WhatsAppLayout: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WhatsAppLayoutContent />
  </Suspense>
);