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
import { usePaginatedQuery, useMutation as useConvexMutation, useQuery } from 'convex/react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { EmptyState } from './ui/empty-state';
import { ChatListLoader, TransactionListLoader, FullScreenLoader } from './ui/loader';
import { MessageSquare, Wallet, Settings, Landmark, AreaChart } from 'lucide-react';
import { TransactionStatus } from '@/convex/schemaUnions';
import { toast } from 'sonner';

const WhatsAppLayoutContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'chats');
  const [selectedConversationId, setSelectedConversationId] = useState(searchParams.get('chatId') as Id<"conversations"> | undefined);
  const [selectedTransactionId, setSelectedTransactionId] = useState(searchParams.get('transactionId') as Id<"transactions"> | undefined);

  // State for the status update dialog
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateInfo, setStatusUpdateInfo] = useState<{
    transactionId: Id<"transactions">;
    status: TransactionStatus;
  } | null>(null);


  const { isMobile } = useUIState();
  const setIsMobile = useWhatsAppStore((state) => state.setIsMobile);

  const {
    results: conversations,
    status: conversationsStatus,
    loadMore: loadMoreConversations,
  } = usePaginatedQuery(
    api.conversations.getAllConversationsWithUsers,
    {},
    { initialNumItems: 20 }
  );
  const markAsRead = useConvexMutation(api.conversations.markConversationAsRead);

  const {
    results: transactions,
    status: transactionsStatus,
    loadMore: loadMoreTransactions,
  } = usePaginatedQuery(
    api.transactions.getAllTransactions,
    {},
    { initialNumItems: 20 }
  );

  const markTransactionAsRead = useConvexMutation(api.transactions.markTransactionAsRead);

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

  const handleUpdateTransactionStatus = (
    transactionId: Id<"transactions">,
    status: TransactionStatus
  ) => {
    setStatusUpdateInfo({ transactionId, status });
    setIsStatusUpdateDialogOpen(true);
  };

  const { mutateAsync: updateStatusMutation, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (variables: { transactionId: Id<"transactions">, status: TransactionStatus, message?: string }) => {
      const response = await fetch('/api/transactions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Transaction status updated and notification sent.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    },
    onSettled: () => {
      setIsStatusUpdateDialogOpen(false);
      setStatusUpdateInfo(null);
    }
  });


  const confirmStatusUpdate = async (message?: string) => {
    if (!statusUpdateInfo) return;
    await toast.promise(updateStatusMutation({
      transactionId: statusUpdateInfo.transactionId,
      status: statusUpdateInfo.status,
      message,
    }), {
      loading: "Updating transaction status...",
      success: "Transaction status updated successfully.",
      error: "Failed to update transaction status."
    }).unwrap()
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
          isMobile={true}
          isStatusUpdateDialogOpen={isStatusUpdateDialogOpen}
          statusUpdateInfo={statusUpdateInfo}
          onConfirmStatusUpdate={confirmStatusUpdate}
          onCancelStatusUpdate={() => setIsStatusUpdateDialogOpen(false)}
        />;
      case 'rates':
        return <RatesView isMobile={true} />;
      case 'bank':
        return <BankDetailsView isMobile={true} />;
      case 'chats':
      default:
        return <ChatList
          conversations={sortedConversations}
          status={conversationsStatus}
          loadMore={loadMoreConversations}
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

  const showSidebar = activeTab === 'chats' || activeTab === 'transactions';

  const renderSidebar = () => {
    switch (activeTab) {
      case 'chats':
        if (conversationsStatus === 'LoadingFirstPage') {
          return <ChatListLoader />;
        }
        return <ChatList
          conversations={sortedConversations}
          status={conversationsStatus}
          loadMore={loadMoreConversations}
          selectedChatId={selectedConversationId}
          onChatSelect={handleChatSelect}
          isMobile={false} />;
      case 'transactions':
        if (transactionsStatus === 'LoadingFirstPage') {
          return <TransactionListLoader />;
        }
        return <TransactionList
          transactions={sortedTransactions}
          status={transactionsStatus}
          loadMore={loadMoreTransactions}
          selectedTransactionId={selectedTransactionId}
          onTransactionSelect={handleTransactionSelect}
          onUpdateStatus={handleUpdateTransactionStatus}
          isMobile={false}
          isStatusUpdateDialogOpen={isStatusUpdateDialogOpen}
          statusUpdateInfo={statusUpdateInfo}
          onConfirmStatusUpdate={confirmStatusUpdate}
          onCancelStatusUpdate={() => setIsStatusUpdateDialogOpen(false)}
        />;
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

    const emptyStateInfo = {
      transactions: {
        icon: <Wallet />,
        title: "Select a Transaction",
        message: "Choose a transaction from the list on the left to see its details."
      },
      rates: {
        icon: <AreaChart />,
        title: "Exchange Rates",
        message: "This feature is under construction. Soon you'll be able to view rates here."
      },
      bank: {
        icon: <Landmark />,
        title: "Bank Details",
        message: "This feature is under construction. Soon you'll be able to manage bank details here."
      },
      settings: {
        icon: <Settings />,
        title: "Settings",
        message: "This feature is under construction. Soon you'll be able to manage your settings here."
      },
      chats: {
        icon: <MessageSquare />,
        title: "WhatsApp Chat",
        message: "Select a chat to start messaging."
      }
    }[activeTab] || {
      icon: <MessageSquare />,
      title: "Welcome",
      message: "Select a feature from the sidebar to get started."
    };

    return (
      <div className="flex items-center justify-center h-full bg-whatsapp-chat-bg">
        <EmptyState
          icon={emptyStateInfo.icon}
          title={emptyStateInfo.title}
          message={emptyStateInfo.message}
        />
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-whatsapp-bg overflow-hidden">
      <SideNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {showSidebar &&
        <div className="w-96 flex-shrink-0">
          {renderSidebar()}
        </div>
      }


      <div className="flex-1">
        {renderMainContent()}
      </div>

      <ImageDialog />
    </div>
  );
};

export const WhatsAppLayout: React.FC = () => (
  <Suspense fallback={<FullScreenLoader message="Loading workspace..." />}>
    <WhatsAppLayoutContent />
  </Suspense>
);