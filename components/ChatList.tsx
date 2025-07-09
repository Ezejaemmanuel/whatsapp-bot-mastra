import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, MessageCircle, Phone, Receipt, Settings, Camera, Plus } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIState, useWhatsAppStore } from '@/lib/store';
import { Doc, Id } from '@/convex/_generated/dataModel';

type ConversationWithUser = Doc<"conversations"> & { user: Doc<"users"> | null };

interface ChatListProps {
  conversations: ConversationWithUser[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  selectedChatId?: Id<"conversations">;
  onChatSelect: (chatId: Id<"conversations">) => void;
  isMobile?: boolean;
  activeTab?: string;
  onTabChange?: (tab: 'chats' | 'transactions' | 'settings' | 'calls' | 'updates') => void;
}

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

  useEffect(() => {
    if (inView && status === 'CanLoadMore') {
      loadMore(20);
    }
  }, [inView, status, loadMore]);

  const filters = ['All', 'Unread'];

  const filteredChats = conversations.filter((conversation) => {
    const matchesSearch = (conversation.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (conversation.lastMessageSummary?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Unread' && (conversation.unreadCount || 0) > 0) return matchesSearch;
    return false;
  });

  return (
    <div className="flex flex-col h-full bg-whatsapp-panel-bg border-r border-whatsapp-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-whatsapp-panel-bg border-b border-whatsapp-border flex-shrink-0">
        <h1 className="text-xl font-medium text-whatsapp-text-primary">
          {isMobile ? 'Chats' : 'WhatsApp'}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-whatsapp-panel-bg flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-whatsapp-text-muted" />
          <Input
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-whatsapp-bg border-none text-sm text-whatsapp-text-primary placeholder:text-whatsapp-text-muted"
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
                  ? 'bg-whatsapp-primary text-white hover:bg-whatsapp-dark'
                  : 'bg-whatsapp-hover text-whatsapp-text-secondary hover:bg-whatsapp-border'
                  }`}
              >
                {filter}
                {filter === 'Unread' && (
                  <Badge variant="secondary" className="ml-2 bg-whatsapp-text-muted text-whatsapp-bg">
                    {conversations.filter(c => (c.unreadCount || 0) > 0).length}
                  </Badge>
                )}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="text-whatsapp-text-secondary hover:bg-whatsapp-hover">
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
              className={`chat-item flex items-center p-3 cursor-pointer border-b border-whatsapp-divider ${selectedChatId === chat._id ? 'bg-whatsapp-active active' : ''
                }`}
            >
              <Avatar className="w-12 h-12 mr-4">
                <AvatarImage src={chat.user?.avatar || '/assets/avatar-male-1.jpg'} alt={chat.userName} />
                <AvatarFallback className="bg-whatsapp-primary text-white">
                  {chat.userName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-whatsapp-text-primary truncate">{chat.userName}</h3>
                  <span className={`text-xs ${chat.unreadCount ? 'text-whatsapp-unread' : 'text-whatsapp-text-muted'}`}>
                    {new Date(chat.lastMessageAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="truncate text-sm text-whatsapp-text-muted max-w-[200px]">
                    {chat.lastMessageSummary || 'No messages yet'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-whatsapp-unread text-white rounded-full px-2 py-0.5 text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={ref} className="h-1" />
          {(status === 'LoadingFirstPage' || status === 'LoadingMore') && (
            <div className="flex justify-center items-center p-4">
              <p className="text-whatsapp-text-muted">Loading more conversations...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
