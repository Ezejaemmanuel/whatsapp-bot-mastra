import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send, X, ChevronDown, Users, Bot, Check } from 'lucide-react';
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
import avatarMale1 from '@/assets/avatar-male-1.jpg';
import Image from 'next/image';
import { useWhatsAppStore } from '@/lib/store';
import { useInView } from 'react-intersection-observer';
import { ChatViewLoader } from './ui/loader';
import { EmptyState } from './ui/empty-state';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation as useConvexMutation } from "convex/react";
import { ImagePreviewDialog } from './ImagePreviewDialog';


interface ChatViewProps {
  chatId?: Id<"conversations">;
  onBack?: () => void;
  isMobile?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatId, onBack, isMobile = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [imageForPreview, setImageForPreview] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const prevMessagesLength = useRef(0);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView();
  const { openImageDialog } = useWhatsAppStore();
  const generateUploadUrl = useConvexMutation(api.mediaFiles.generateUploadUrl);


  // Get conversation and messages from Convex
  const conversation = useQuery(api.conversations.getConversationById,
    chatId ? { conversationId: chatId } : "skip"
  );
  const isAdminInCharge = conversation?.inCharge === 'admin';

  const {
    results: messages,
    status: messagesStatus,
    loadMore,
  } = usePaginatedQuery(
    api.messages.getConversationHistory,
    chatId ? { conversationId: chatId } : "skip",
    { initialNumItems: 20 }
  );

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
      storageId?: Id<"_storage">,
      mediaType?: string, // Added mediaType
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
    if ((message.trim() || imageForPreview) && chatId) {
      // For text messages
      if (message.trim() && !imageForPreview) {
        const promise = async () => {
          if (conversation?.inCharge === 'bot') {
            await updateInChargeMutation({
              conversationId: chatId,
              inCharge: 'admin',
              isFirstAdminMessage: true,
            });
          }
          await sendMessageMutation({
            conversationId: chatId,
            senderRole: "admin",
            senderName: "Admin",
            messageType: "text",
            content: message.trim(),
          });
        };

        toast.promise(promise(), {
          loading: 'Sending message...',
          success: () => {
            setMessage('');
            return 'Message sent!';
          },
          error: (err) => err.message || 'Failed to send message',
        });
      }
      // Image sending is handled by the dialog's callback
    }
  };

  const handleSendImage = async (caption: string) => {
    if (!imageForPreview || !chatId) return;

    const promise = async () => {
      if (conversation?.inCharge === 'bot') {
        await updateInChargeMutation({
          conversationId: chatId,
          inCharge: 'admin',
          isFirstAdminMessage: true,
        });
      }

      const postUrl = await generateUploadUrl();
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": imageForPreview.type },
        body: imageForPreview,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }
      const { storageId } = await response.json();

      await sendMessageMutation({
        conversationId: chatId,
        senderRole: "admin",
        senderName: "Admin",
        messageType: "image",
        storageId: storageId,
        mediaType: imageForPreview.type,
        caption: caption,
      });
    };

    toast.promise(promise(), {
      loading: 'Uploading and sending image...',
      success: () => {
        setImageForPreview(null);
        return 'Image sent successfully!';
      },
      error: (err) => err.message || 'Failed to send image',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageForPreview(file);
    } else if (file) {
      toast.error("Please select a valid image file.");
    }
  };

  const handleCancelImagePreview = () => {
    setImageForPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <ImagePreviewDialog
        isOpen={!!imageForPreview}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCancelImagePreview();
          }
        }}
        imageFile={imageForPreview}
        onSend={handleSendImage}
        onCancel={handleCancelImagePreview}
      />
      <div className="flex-1 flex flex-col bg-whatsapp-chat-bg whatsapp-chat-pattern h-full overflow-x-hidden relative">
        {/* Background decorative gradient */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isAdminInCharge ? 'bg-gradient-to-br from-amber-400/10 via-transparent to-amber-300/5' : 'bg-gradient-to-br from-whatsapp-primary/5 via-transparent to-whatsapp-accent/5'}`}></div>


        {/* Header */}
        <div className={`flex items-center gap-3 glass-panel border-b border-whatsapp-border/50 flex-shrink-0 backdrop-blur-xl relative z-10 ${isMobile ? 'px-4 py-3' : 'px-5 py-4'
          }`}>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}

          <div className="relative">
            <Avatar className={`ring-2 ring-whatsapp-border/30 transition-all duration-300 hover:ring-whatsapp-primary/50 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}>
              <AvatarImage src={avatarMale1.src} alt={conversation?.userName || "User"} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white font-semibold">
                {conversation?.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-whatsapp-online rounded-full border-2 border-whatsapp-panel-bg shadow-lg"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-whatsapp-text-primary truncate ${isMobile ? 'text-base' : 'text-lg'
              }`}>
              {conversation?.userName || "Loading..."}
            </h3>
            <p className={`text-whatsapp-text-muted truncate ${isMobile ? 'text-xs' : 'text-sm'
              }`}>
              {conversation?.inCharge === 'bot'
                ? '🤖 Conversation handled by Khaliwid Bot'
                : '👤 An admin is handling this conversation'}
            </p>
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
                <DropdownMenuLabel>Conversation Control</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleInChargeChange('admin')}
                  disabled={conversation?.inCharge === 'admin'}
                  className="flex justify-between items-center"
                >
                  <span>Take Over (Admin)</span>
                  <Users className="w-4 h-4 ml-2" />
                  {conversation?.inCharge === 'admin' && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleInChargeChange('bot')}
                  disabled={conversation?.inCharge === 'bot'}
                  className="flex justify-between items-center"
                >
                  <span>Return to Bot</span>
                  <Bot className="w-4 h-4 ml-2" />
                  {conversation?.inCharge === 'bot' && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Admin in charge Indicator */}
        {isAdminInCharge && (
          <div className="relative z-10 flex items-center justify-center gap-2 bg-amber-400/10 text-amber-200 py-1.5 px-4 text-xs font-medium backdrop-blur-sm border-b border-amber-400/20 shadow-inner-top">
            <Users className="h-4 w-4" />
            <span>You are in control. The AI Bot is currently paused.</span>
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
                          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mb-2 cursor-pointer group overflow-hidden rounded-lg"
                          onClick={() => openImageDialog(msg.mediaUrl as string, msg.caption || 'Image')}
                        >
                          <div className="relative aspect-square w-full">
                            <Image
                              src={msg.mediaUrl}
                              alt={msg.caption || 'Image'}
                              fill
                              className="object-cover rounded-lg transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                              sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 p-2 shadow-lg glow-purple bg-whatsapp-primary/90 hover:bg-whatsapp-primary text-white border border-whatsapp-primary/50 backdrop-blur-sm"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Message Input */}
        <div className={`flex items-center gap-3 glass-panel border-t border-whatsapp-border/50 flex-shrink-0 backdrop-blur-xl relative z-10 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'
          }`}>
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
            }`}>
            <Smile className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>

          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
            }`}
            onClick={() => fileInputRef.current?.click()}
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

          <div className="flex-1 relative">
            <Input
              placeholder={"Type a message"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="whatsapp-input bg-whatsapp-bg/80 border border-whatsapp-border/50 focus:ring-2 focus:ring-whatsapp-primary/30 focus:border-whatsapp-primary transition-all duration-300"
            />
          </div>

          {message.trim() ? (
            <Button
              onClick={handleSendMessage}
              size="icon"
              className={`modern-button transition-all duration-300 hover:scale-110 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
                }`}
            >
              <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
                } ${isRecording ? 'text-red-400 bg-red-500/10' : ''}`}
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
              onMouseLeave={() => setIsRecording(false)}
            >
              <Mic className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} transition-all duration-300 ${isRecording ? 'scale-110' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};