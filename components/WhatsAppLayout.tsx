"use client";
import React, { useEffect, Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChatList } from './ChatList';
import { ChatView } from './ChatView';
import { SideNavigation } from './SideNavigation';
import { TransactionList } from './TransactionList';
import { TransactionDetailView } from './details/TransactionDetailView';
import { ImageDialog } from './ImageDialog';
import { MobileNavBar } from './layout/MobileNavBar';
import { RatesView } from './rates/RatesView';
import { BankDetailsView } from './bank-details/BankDetailsView';
import { useWhatsAppStore, useUIState } from '@/lib/store';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';

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

  const updateTransactionStatus = useMutation(api.transactions.updateTransactionStatus);
  const markTransactionAsRead = useMutation(api.transactions.markTransactionAsRead);

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

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

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
    markTransactionAsRead({ transactionId });
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

  const handleTabChange = (tab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank') => {
    setActiveTab(tab);
    setSelectedConversationId(undefined);
    setSelectedTransactionId(undefined);
  };

  const handleBack = () => {
    setSelectedConversationId(undefined);
    setSelectedTransactionId(undefined);
  };

  const renderMobileView = () => {
    if (selectedConversationId) {
      return <ChatView chatId={selectedConversationId} onBack={handleBack} isMobile={true} />;
    }
    if (selectedTransactionId && selectedTransaction) {
      return (
        <div className="h-full flex flex-col bg-whatsapp-chat-bg">
          <div className="flex items-center gap-3 bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0">
            <button onClick={handleBack} className="text-whatsapp-text-secondary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-medium text-whatsapp-text-primary">Transaction Details</h2>
          </div>
          <TransactionDetailView
            transaction={selectedTransaction as any}
            isMobile={true}
          />
        </div>
      );
    }
    switch (activeTab) {
      case 'transactions':
        return <TransactionList
          transactions={sortedTransactions}
          status={transactionsStatus}
          loadMore={loadMoreTransactions}
          selectedTransactionId={selectedTransactionId}
          onTransactionSelect={handleTransactionSelect}
          onUpdateStatus={handleUpdateTransactionStatus}
          isMobile={true} />;
      case 'rates':
        return <RatesView isMobile={true} />;
      case 'bank':
        return <BankDetailsView isMobile={true} />;
      case 'chats':
      default:
        return <ChatList
          conversations={sortedConversations}
          status={status}
          loadMore={loadMore}
          selectedChatId={selectedConversationId}
          onChatSelect={handleChatSelect}
          isMobile={true}
          activeTab={activeTab}
          onTabChange={handleTabChange} />;
    }
  };

  if (isMobile) {
    return (
      <div className="h-[100dvh] bg-whatsapp-bg">
        <div className="h-full pb-16 overflow-y-auto">
          {renderMobileView()}
        </div>

        {!(selectedConversationId || selectedTransactionId) && (
          <MobileNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unreadCount={totalUnreadCount}
          />
        )}

        <ImageDialog />
      </div>
    );
  }

  const renderSidebar = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatList
          conversations={sortedConversations}
          status={status}
          loadMore={loadMore}
          selectedChatId={selectedConversationId}
          onChatSelect={handleChatSelect}
          isMobile={false} />;
      case 'transactions':
        return <TransactionList
          transactions={sortedTransactions}
          status={transactionsStatus}
          loadMore={loadMoreTransactions}
          selectedTransactionId={selectedTransactionId}
          onTransactionSelect={handleTransactionSelect}
          onUpdateStatus={handleUpdateTransactionStatus}
          isMobile={false} />;
      case 'rates':
        return <RatesView isMobile={false} />;
      case 'bank':
        return <BankDetailsView isMobile={false} />;
      default:
        return (
          <div className="flex items-center justify-center h-full bg-whatsapp-panel-bg">
            <p className="text-whatsapp-text-muted">Coming soon...</p>
          </div>
        );
    }
  };

  const renderMainContent = () => {
    if (activeTab === 'chats') {
      return <ChatView chatId={selectedConversationId} isMobile={false} />;
    }
    if (activeTab === 'transactions' && selectedTransactionId && selectedTransaction) {
      return <TransactionDetailView transaction={selectedTransaction as any} isMobile={false} />;
    }
    if (activeTab === 'rates') {
      return <RatesView isMobile={false} />;
    }
    if (activeTab === 'bank') {
      return <BankDetailsView isMobile={false} />;
    }
    return (
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
    );
  };

  return (
    <div className="h-screen flex bg-whatsapp-bg overflow-hidden">
      <SideNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="w-96 flex-shrink-0">
        {renderSidebar()}
      </div>

      <div className="flex-1">
        {renderMainContent()}
      </div>

      <ImageDialog />
    </div>
  );
};

export const WhatsAppLayout: React.FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <WhatsAppLayoutContent />
  </Suspense>
);