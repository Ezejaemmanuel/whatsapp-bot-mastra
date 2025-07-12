import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send, X, ChevronDown, Users, Bot, Check, AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { InCharge } from '@/convex/schemaUnions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import avatarMale1 from '@/assets/avatar-male-1.jpg';
import Image from 'next/image';
import { useWhatsAppStore } from '@/lib/store';
import { useInView } from 'react-intersection-observer';
import { ChatViewLoader } from './ui/loader';
import { EmptyState } from './ui/empty-state';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';


interface ChatViewProps {
  chatId?: Id<"conversations">;
  onBack?: () => void;
  isMobile?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatId, onBack, isMobile = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const prevMessagesLength = useRef(0);

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView();


  const { openImageDialog } = useWhatsAppStore();

  // Get conversation and messages from Convex
  const conversation = useQuery(api.conversations.getConversationById,
    chatId ? { conversationId: chatId } : "skip"
  );
  const {
    results: messages,
    status: messagesStatus,
    loadMore,
  } = usePaginatedQuery(
    api.messages.getConversationHistory,
    chatId ? { conversationId: chatId } : "skip",
    { initialNumItems: 20 }
  );

  // Determine who's in charge and set visual theme
  const isAdminInCharge = conversation?.inCharge === 'admin';
  const isBotInCharge = conversation?.inCharge === 'bot';

  // Dynamic theme classes based on who's in charge
  const getThemeClasses = () => {
    if (isAdminInCharge) {
      return {
        background: 'bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80',
        pattern: 'whatsapp-chat-pattern-admin',
        statusBar: 'bg-gradient-to-r from-orange-500 to-amber-500',
        statusText: 'text-white',
        accent: 'from-orange-500/20 to-amber-500/20',
        border: 'border-orange-200/50',
        glow: 'shadow-orange-200/50'
      };
    } else {
      return {
        background: 'bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80',
        pattern: 'whatsapp-chat-pattern-bot',
        statusBar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        statusText: 'text-white',
        accent: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-200/50',
        glow: 'shadow-blue-200/50'
      };
    }
  };

  const theme = getThemeClasses();

  // API Mutations
  const { mutateAsync: updateInChargeMutation } = useMutation({
    mutationFn: async (variables: { conversationId: Id<"conversations">, inCharge: InCharge, isFirstAdminMessage?: boolean }) => {
      const response = await fetch('/api/conversations/update-in-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      return response.json();
    }
  });

  const { mutateAsync: sendMessageMutation } = useMutation({
    mutationFn: async (variables: {
      conversationId: Id<"conversations">,
      senderRole: "admin" | "bot",
      senderName: string,
      messageType: "text" | "image",
      content?: string,
      mediaUrl?: string,
      caption?: string
    }) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      return response.json();
    }
  });


  // Effect to load more messages when the top is reached
  useEffect(() => {
    if (loadMoreInView) {
      loadMore(20);
    }
  }, [loadMoreInView, loadMore]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Effect to scroll to bottom on new messages
  useEffect(() => {
    const wasAtBottom = isAtBottom;

    if (wasAtBottom) {
      scrollToBottom();
    }

    if (messages.length > prevMessagesLength.current) {
      if (!wasAtBottom) {
        setShowNewMessageIndicator(true);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isAtBottom]);


  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 10;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setShowNewMessageIndicator(false);
    }
  };


  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-whatsapp-chat-bg whatsapp-chat-pattern relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-primary/5 via-transparent to-whatsapp-accent/5"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-whatsapp-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-whatsapp-accent/10 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <div className="w-72 h-72 mx-auto mb-8 opacity-30 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-primary/20 to-whatsapp-accent/20 rounded-full blur-2xl"></div>
            <svg viewBox="0 0 303 172" className="w-full h-full relative z-10">
              <defs>
                <linearGradient id="a" x1="50%" x2="50%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#9f7aea" stopOpacity=".05"></stop>
                  <stop offset="100%" stopColor="#b794f6" stopOpacity=".3"></stop>
                </linearGradient>
              </defs>
              <path fill="url(#a)" d="M229.221 63.241L51.638 63.241C23.097 63.241-.5 86.838-.5 115.379L-.5 171.5L303 171.5L303 115.379C303 86.838 279.403 63.241 250.862 63.241L229.221 63.241Z"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-light bg-gradient-to-r from-whatsapp-text-primary to-whatsapp-primary bg-clip-text text-transparent mb-3">WhatsApp Web</h2>
          <p className="text-whatsapp-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
            Send and receive messages without keeping your phone online.<br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
          <div className="flex items-center justify-center text-whatsapp-text-muted glass-panel px-4 py-2 rounded-full max-w-lg mx-auto">
            <div className="w-2 h-2 bg-whatsapp-primary rounded-full mr-3 animate-pulse"></div>
            <span className="text-sm">Messages and calls are end-to-end encrypted. Only people in this chat can read, listen, or share them. Click to learn more</span>
          </div>
        </div>
      </div>
    );
  }

  if (messagesStatus === 'LoadingFirstPage') {
    return <ChatViewLoader />;
  }

  const handleInChargeChange = async (newInCharge: InCharge) => {
    if (chatId && conversation && conversation.inCharge !== newInCharge) {
      await updateInChargeMutation({
        conversationId: chatId,
        inCharge: newInCharge,
      })
    }
  };

  const handleSendMessage = async () => {
    if ((message.trim() || attachment) && chatId) {
      try {
        if (conversation?.inCharge === 'bot') {
          await updateInChargeMutation({
            conversationId: chatId,
            inCharge: 'admin',
            isFirstAdminMessage: true,
          });
        }

        let mediaUrl, caption;
        if (attachment) {
          mediaUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'; // Placeholder
          caption = message.trim();
        }

        await sendMessageMutation({
          conversationId: chatId,
          senderRole: "admin",
          senderName: "Admin",
          messageType: attachment ? "image" : "text",
          content: attachment ? undefined : message.trim(),
          mediaUrl: mediaUrl,
          caption: caption,
        })

        setMessage('');
        setAttachment(null);
      } catch (error) {
        // Errors are handled by the toast promise, but you can still log here if needed
        console.error('An error occurred during message sending:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${theme.background} ${theme.pattern} h-full overflow-x-hidden relative transition-all duration-500`}>
      {/* Enhanced Background decorative gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} pointer-events-none transition-all duration-500`}></div>

      {/* Status Bar - Fixed at top */}
      <div className={`${theme.statusBar} ${theme.statusText} px-4 py-2 text-center text-sm font-medium shadow-lg relative z-20 transition-all duration-500`}>
        <div className="flex items-center justify-center gap-2">
          {isAdminInCharge ? (
            <>
              <Crown className="w-4 h-4" />
              <span>You are now in charge of this conversation</span>
              <Crown className="w-4 h-4" />
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>Khaliwid Bot is handling this conversation</span>
              <Bot className="w-4 h-4" />
            </>
          )}
        </div>
      </div>

      {/* Enhanced Header */}
      <div className={`flex items-center gap-3 glass-panel ${theme.border} border-b backdrop-blur-xl relative z-10 transition-all duration-500 ${theme.glow} shadow-lg ${isMobile ? 'px-4 py-3' : 'px-5 py-4'}`}>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}

        <div className="relative">
          <Avatar className={`ring-2 transition-all duration-300 hover:scale-105 ${isAdminInCharge ? 'ring-orange-300/50 hover:ring-orange-400/70' : 'ring-blue-300/50 hover:ring-blue-400/70'} ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <AvatarImage src={avatarMale1.src} alt={conversation?.userName || "User"} className="object-cover" />
            <AvatarFallback className={`text-white font-semibold transition-all duration-300 ${isAdminInCharge ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
              {conversation?.userName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${isAdminInCharge ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-whatsapp-text-primary truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
            {conversation?.userName || "Loading..."}
          </h3>
          <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isAdminInCharge ? (
              <>
                <Crown className="w-3 h-3 text-orange-500" />
                <span className="text-orange-600 font-medium">Admin in charge</span>
              </>
            ) : (
              <>
                <Bot className="w-3 h-3 text-blue-500" />
                <span className="text-blue-600 font-medium">Bot handling conversation</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
            <Video className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
            <Phone className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                <MoreVertical className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel">
              <DropdownMenuLabel className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Conversation Control
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleInChargeChange('admin')}
                disabled={conversation?.inCharge === 'admin'}
                className={`flex justify-between items-center transition-all duration-200 ${conversation?.inCharge === 'admin' ? 'bg-orange-50 text-orange-700' : 'hover:bg-orange-50'}`}
              >
                <span>Take Over (Admin)</span>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  {conversation?.inCharge === 'admin' && <Check className="w-4 h-4 text-orange-500" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleInChargeChange('bot')}
                disabled={conversation?.inCharge === 'bot'}
                className={`flex justify-between items-center transition-all duration-200 ${conversation?.inCharge === 'bot' ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'}`}
              >
                <span>Return to Bot</span>
                <div className="flex items-center gap-1">
                  <Bot className="w-4 h-4" />
                  {conversation?.inCharge === 'bot' && <Check className="w-4 h-4 text-blue-500" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alert Banner for Admin Control */}
      {isAdminInCharge && (
        <div className="px-4 py-2 relative z-10">
          <Alert className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 font-medium">
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                You&apos;re in control! The bot won&apos;t respond automatically. Click &quot;Return to Bot&quot; when ready.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto whatsapp-scrollbar relative z-10" ref={scrollRef} onScroll={handleScroll}>
        <div className="p-4 space-y-3">
          <div ref={loadMoreRef} className="h-1" />

          {messages.length === 0 && (
            <EmptyState
              icon={<MessageSquare className="w-16 h-16" />}
              title={`This is the beginning of your direct message history with ${conversation?.userName}`}
              message="Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."
            />
          )}

          {messages.map((msg: Doc<"messages">, index: number) => {
            if (msg.messageType === 'system') {
              return (
                <div key={msg._id} className="flex justify-center my-2">
                  <div className="text-xs text-center text-whatsapp-text-muted bg-whatsapp-panel-bg/60 rounded-full px-3 py-1 shadow-sm glass-panel">
                    {msg.content}
                  </div>
                </div>
              );
            }

            const prevMsg = messages[index - 1];
            const isOwn = msg.senderRole === 'admin' || msg.senderRole === 'bot';
            const isConsecutive = prevMsg && prevMsg.senderRole === msg.senderRole;
            const showTime = !isConsecutive || (prevMsg && new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000); // 5 minutes

            const getBubbleClasses = () => {
              let classes = 'message-bubble transition-all duration-300 hover:scale-105 ';
              if (msg.senderRole === 'admin') {
                classes += 'outgoing admin';
              } else if (msg.senderRole === 'bot') {
                classes += 'outgoing bot';
              } else {
                classes += 'incoming';
              }
              return classes;
            };

            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive && !showTime ? 'mt-1' : 'mt-4'}`}>
                <div className={getBubbleClasses()}>
                  {!isOwn && !isConsecutive && (
                    <p className="text-xs font-semibold text-whatsapp-primary mb-1">{msg.senderName}</p>
                  )}
                  <div className="flex flex-col">
                    {msg.messageType === 'image' && msg.mediaUrl ? (
                      <div
                        className="relative w-64 h-64 mb-1 cursor-pointer group"
                        onClick={() => openImageDialog(msg.mediaUrl as string, msg.caption || 'Image')}
                      >
                        <Image
                          src={msg.mediaUrl}
                          alt={msg.caption || 'Image'}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md transition-all duration-300 group-hover:brightness-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {msg.content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.messageType === 'image' && msg.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">{msg.caption}</p>
                    )}
                    <div className="flex items-center justify-end mt-1 gap-1">
                      <span className={`text-xs opacity-70 font-medium ${isOwn ? 'text-white' : 'text-whatsapp-text-muted'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOwn && (
                        <div className="message-status">
                          <svg viewBox="0 0 16 15" className="w-4 h-4 fill-current opacity-80">
                            <path d="m15.01 3.316-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.466c.143.14.361.125.484-.033L10.91 3.379a.366.366 0 0 0-.063-.51z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {showNewMessageIndicator && (
          <Button
            variant="secondary"
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 p-2 shadow-lg text-white border backdrop-blur-sm transition-all duration-300 ${isAdminInCharge ? 'bg-orange-500/90 hover:bg-orange-500 border-orange-400/50 glow-orange' : 'bg-blue-500/90 hover:bg-blue-500 border-blue-400/50 glow-blue'}`}
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Enhanced Message Input */}
      <div className={`flex items-center gap-3 glass-panel ${theme.border} border-t backdrop-blur-xl relative z-10 transition-all duration-500 ${theme.glow} shadow-lg ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}>
          <Smile className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
        </Button>

        <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}
          onClick={handleAttachmentClick}
        >
          <Paperclip className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        {attachment && (
          <div className={`absolute bottom-12 left-0 right-0 p-3 glass-panel ${theme.border} border-t backdrop-blur-xl transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <div className={`relative w-10 h-10 rounded-lg overflow-hidden ring-2 transition-all duration-300 ${isAdminInCharge ? 'ring-orange-300' : 'ring-blue-300'}`}>
                <Image src={URL.createObjectURL(attachment)} alt="preview" layout="fill" objectFit="cover" />
              </div>
              <span className="text-sm text-whatsapp-text-primary truncate flex-1 font-medium">{attachment.name}</span>
              <Button variant="ghost" size="icon" onClick={handleRemoveAttachment} className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-red-400 transition-all duration-300">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          <Input
            placeholder={attachment ? "Add a caption..." : "Type a message"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`whatsapp-input bg-whatsapp-bg/80 focus:ring-2 transition-all duration-300 ${isAdminInCharge ? 'border-orange-200/50 focus:ring-orange-300/30 focus:border-orange-400' : 'border-blue-200/50 focus:ring-blue-300/30 focus:border-blue-400'}`}
          />
        </div>

        {message.trim() || attachment ? (
          <Button
            onClick={handleSendMessage}
            size="icon"
            className={`transition-all duration-300 hover:scale-110 text-white shadow-lg ${isAdminInCharge ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'} ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}
          >
            <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'} ${isRecording ? 'text-red-400 bg-red-500/10' : ''}`}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onMouseLeave={() => setIsRecording(false)}
          >
            <Mic className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} transition-all duration-300 ${isRecording ? 'scale-110' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );
};