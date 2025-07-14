import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, MessageCircle, Plus, User, Bot, Image, Eye } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIState, useWhatsAppStore } from '@/lib/store';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { EmptyState } from './ui/empty-state';
import { Skeleton } from './ui/skeleton';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type ConversationWithUser = Doc<"conversations"> & { user: Doc<"users"> | null };

interface ChatListProps {
  conversations: ConversationWithUser[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  selectedChatId?: Id<"conversations">;
  onChatSelect: (chatId: Id<"conversations">) => void;
  isMobile?: boolean;
  activeTab?: string;
  onTabChange?: (tab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank') => void;
}

const LoadingMoreSpinner: React.FC = () => (
  <div className="flex items-center gap-4 p-3">
    <Skeleton className="h-12 w-12 rounded-full bg-gray-200/10" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-3/4 bg-gray-200/10" />
      <Skeleton className="h-4 w-1/2 bg-gray-200/10" />
    </div>
  </div>
);

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  status,
  loadMore,
  selectedChatId,
  onChatSelect,
  isMobile = false,
  activeTab = 'chats',
  onTabChange
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const { searchQuery } = useUIState();
  const setSearchQuery = useWhatsAppStore((state) => state.setSearchQuery);
  const { ref, inView } = useInView();

  // Get all transactions to check for image review status
  const allTransactions = useQuery(api.transactions.getAllTransactions, { paginationOpts: { numItems: 1000, cursor: null } });

  useEffect(() => {
    if (inView && status === 'CanLoadMore') {
      loadMore(20);
    }
  }, [inView, status, loadMore]);

  const filters = [
    { id: 'All', label: 'All', icon: MessageCircle },
    { id: 'Unread', label: 'Unread', icon: Eye },
    { id: 'Admin', label: 'Admin', icon: User },
    { id: 'Bot', label: 'Bot', icon: Bot },
    { id: 'ImageReview', label: 'Image Review', icon: Image },
  ];

  const filteredChats = conversations.filter((conversation) => {
    const matchesSearch = (conversation.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (conversation.lastMessageSummary?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'All':
        return true;
      case 'Unread':
        return (conversation.unreadCount || 0) > 0;
      case 'Admin':
        return conversation.inCharge === 'admin';
      case 'Bot':
        return conversation.inCharge === 'bot';
      case 'ImageReview':
        // Check if this conversation has any transactions with image_received_and_being_reviewed status
        if (!allTransactions) return false;
        return allTransactions.page.some((transaction: any) =>
          transaction.conversationId === conversation._id &&
          transaction.status === 'image_received_and_being_reviewed'
        );
      default:
        return true;
    }
  });

  const getFilterCount = (filterId: string) => {
    switch (filterId) {
      case 'Unread':
        return conversations.filter(c => (c.unreadCount || 0) > 0).length;
      case 'Admin':
        return conversations.filter(c => c.inCharge === 'admin').length;
      case 'Bot':
        return conversations.filter(c => c.inCharge === 'bot').length;
      case 'ImageReview':
        if (!allTransactions) return 0;
        const conversationIdsWithImageReview = new Set(
          allTransactions.page
            .filter((t: any) => t.status === 'image_received_and_being_reviewed')
            .map((t: any) => t.conversationId)
        );
        return conversations.filter(c => conversationIdsWithImageReview.has(c._id)).length;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel border-r border-whatsapp-border backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-whatsapp-panel-bg to-whatsapp-panel-bg/80 border-b border-whatsapp-border/50 flex-shrink-0 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-whatsapp-text-primary bg-gradient-to-r from-whatsapp-text-primary to-whatsapp-primary bg-clip-text">
          {isMobile ? 'Chats' : 'WhatsApp'}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 hover:backdrop-blur-sm">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 hover:backdrop-blur-sm">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-gradient-to-r from-whatsapp-panel-bg/90 to-whatsapp-panel-bg/70 flex-shrink-0 backdrop-blur-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-whatsapp-text-muted group-focus-within:text-whatsapp-primary transition-colors duration-300" />
          <Input
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 w-full whatsapp-input bg-whatsapp-bg/80 border border-whatsapp-border/50 text-sm text-whatsapp-text-primary placeholder:text-whatsapp-text-muted focus:ring-2 focus:ring-whatsapp-primary/30 focus:border-whatsapp-primary transition-all duration-300"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-gradient-to-r from-whatsapp-panel-bg/70 to-whatsapp-panel-bg/50 backdrop-blur-sm">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 py-3">
            {filters.map((filter) => {
              const IconComponent = filter.icon;
              const count = getFilterCount(filter.id);
              return (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center gap-1.5 ${activeFilter === filter.id
                    ? 'bg-gradient-to-r from-whatsapp-primary to-whatsapp-accent text-white hover:from-whatsapp-primary/90 hover:to-whatsapp-accent/90 shadow-lg glow-purple'
                    : 'bg-whatsapp-hover/60 text-whatsapp-text-secondary hover:bg-whatsapp-border/60 hover:text-whatsapp-primary backdrop-blur-sm border border-whatsapp-border/30'
                    }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {filter.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-whatsapp-accent/20 text-whatsapp-accent border border-whatsapp-accent/30 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
            <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 whatsapp-scrollbar">
        <div className="flex flex-col">
          {filteredChats.map((chat: any) => (
            <div
              key={chat._id}
              onClick={() => onChatSelect(chat._id)}
              className={`chat-item flex items-center p-4 cursor-pointer border-b border-whatsapp-divider/50 transition-all duration-300 hover:bg-whatsapp-hover/40 hover:backdrop-blur-sm hover:border-whatsapp-primary/20 ${selectedChatId === chat._id ? 'bg-gradient-to-r from-whatsapp-active to-whatsapp-active/80 active shadow-lg border-l-4 border-l-whatsapp-primary glow-purple' : ''
                }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12 mr-4 ring-2 ring-whatsapp-border/30 transition-all duration-300 hover:ring-whatsapp-primary/50">
                  <AvatarImage src={chat.user?.avatar || '/assets/avatar-male-1.jpg'} alt={chat.userName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white font-semibold">
                    {chat.userName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                {chat.user?.isOnline && (
                  <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-whatsapp-online rounded-full border-2 border-whatsapp-panel-bg"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-whatsapp-text-primary truncate group-hover:text-whatsapp-primary transition-colors duration-300">{chat.userName}</h3>
                  <span className={`text-xs font-medium ${chat.unreadCount ? 'text-whatsapp-unread' : 'text-whatsapp-text-muted'}`}>
                    {new Date(chat.lastMessageAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    {chat.inCharge === 'admin' && (
                      <div className="w-2 h-2 bg-whatsapp-primary rounded-full glow-purple-small" title="Handled by Admin"></div>
                    )}
                    {chat.inCharge === 'bot' && (
                      <div className="w-2 h-2 bg-whatsapp-accent rounded-full glow-purple-small" title="Handled by Bot"></div>
                    )}
                    {allTransactions && allTransactions.page.some((t: any) =>
                      t.conversationId === chat._id &&
                      t.status === 'image_received_and_being_reviewed'
                    ) && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full glow-orange-small" title="Image Review Required"></div>
                      )}
                    <p className="truncate text-sm text-whatsapp-text-muted max-w-[180px] group-hover:text-whatsapp-text-secondary transition-colors duration-300">
                      {chat.lastMessageSummary || 'No messages yet'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-gradient-to-r from-whatsapp-unread to-whatsapp-accent text-white rounded-full px-2 py-0.5 text-xs min-w-[20px] h-5 flex items-center justify-center shadow-lg pulse-purple">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={ref} className="h-1" />
          {status === 'LoadingMore' && <LoadingMoreSpinner />}
          {(status === 'Exhausted' || status === 'CanLoadMore') && conversations.length === 0 && (
            <EmptyState
              icon={<MessageCircle className="w-12 h-12" />}
              title="No conversations yet"
              message="Start a new conversation and it will appear here."
              className="pt-16"
            />
          )}
          {status !== 'LoadingFirstPage' && conversations.length > 0 && filteredChats.length === 0 && (
            <EmptyState
              icon={<Search className="w-12 h-12" />}
              title="No chats found"
              message={`Your search for "${searchQuery}" did not return any results.`}
              className="pt-16"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
