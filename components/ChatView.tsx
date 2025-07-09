import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import avatarMale1 from '@/assets/avatar-male-1.jpg';
import Image from 'next/image';
import { useWhatsAppStore } from '@/lib/store';
import { useInView } from 'react-intersection-observer';


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

  // Mutations
  const storeMessage = useMutation(api.messages.storeOutgoingMessage);

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
      <div className="flex-1 flex items-center justify-center bg-whatsapp-chat-bg whatsapp-chat-pattern">
        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-8 opacity-20">
            <svg viewBox="0 0 303 172" className="w-full h-full">
              <defs>
                <linearGradient id="a" x1="50%" x2="50%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#25D366" stopOpacity=".05"></stop>
                  <stop offset="100%" stopColor="#25D366" stopOpacity=".3"></stop>
                </linearGradient>
              </defs>
              <path fill="url(#a)" d="M229.221 63.241L51.638 63.241C23.097 63.241-.5 86.838-.5 115.379L-.5 171.5L303 171.5L303 115.379C303 86.838 279.403 63.241 250.862 63.241L229.221 63.241Z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-light text-whatsapp-text-primary mb-2">WhatsApp Web</h2>
          <p className="text-whatsapp-text-secondary mb-8">
            Send and receive messages without keeping your phone online.<br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
          <div className="flex items-center justify-center text-whatsapp-text-muted">
            <div className="w-2 h-2 bg-whatsapp-text-muted rounded-full mr-2"></div>
            <span className="text-sm">Messages and calls are end-to-end encrypted. Only people in this chat can read, listen, or share them. Click to learn more</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if ((message.trim() || attachment) && chatId) {
      try {
        let mediaUrl, caption;
        if (attachment) {
          // In a real app, you'd upload the file to a storage service
          // and get a URL. For now, we'll use a placeholder.
          mediaUrl = '/assets/avatar-female-1.jpg'; // Placeholder
          caption = message.trim();
        }

        // Store the message in Convex
        await storeMessage({
          conversationId: chatId,
          senderRole: "admin",
          senderName: "Admin",
          messageType: attachment ? "image" : "text",
          content: attachment ? undefined : message.trim(),
          mediaUrl: mediaUrl,
          caption: caption,
        });

        setMessage('');
        setAttachment(null);
      } catch (error) {
        console.error('Failed to send message:', error);
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
    <div className="flex-1 flex flex-col bg-whatsapp-chat-bg whatsapp-chat-pattern h-full overflow-x-hidden">
      {/* Header */}
      <div className={`flex items-center gap-3 bg-whatsapp-panel-bg border-b border-whatsapp-border flex-shrink-0 ${isMobile ? 'px-4 py-3' : 'px-4 py-4'
        }`}>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-whatsapp-text-secondary -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}

        <Avatar className={`${isMobile ? 'w-9 h-9' : 'w-10 h-10'}`}>
          <AvatarImage src={avatarMale1.src} alt={conversation?.userName || "User"} />
          <AvatarFallback className="bg-whatsapp-primary text-white">
            {conversation?.userName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-whatsapp-text-primary truncate ${isMobile ? 'text-base' : 'text-lg'
            }`}>
            {conversation?.userName || "Loading..."}
          </h3>
          <p className={`text-whatsapp-text-muted truncate ${isMobile ? 'text-xs' : 'text-sm'
            }`}>
            {conversation?.inCharge === 'bot'
              ? 'Conversation handled by Khaliwid Bot'
              : 'An admin is handling this conversation'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
            <Video className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
            <Phone className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
          <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
            <MoreVertical className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
        </div>
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto whatsapp-scrollbar relative" ref={scrollRef} onScroll={handleScroll}>
        <div className="p-4 space-y-3">
          {messagesStatus === 'LoadingFirstPage' && (
            <div className="flex justify-center items-center h-full">
              <p>Loading messages...</p>
            </div>
          )}

          {messagesStatus !== 'LoadingFirstPage' && (
            <div ref={loadMoreRef} className="h-1" />
          )}

          {messages.map((msg: Doc<"messages">, index: number) => {
            const prevMsg = messages[index - 1];
            const isOwn = msg.senderRole === 'admin' || msg.senderRole === 'bot';
            const isConsecutive = prevMsg && prevMsg.senderRole === msg.senderRole;
            const showTime = !isConsecutive || (prevMsg && new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000); // 5 minutes

            const getBubbleClasses = () => {
              let classes = 'message-bubble ';
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
                        className="relative w-64 h-64 mb-1 cursor-pointer"
                        onClick={() => openImageDialog(msg.mediaUrl as string, msg.caption || 'Image')}
                      >
                        <Image
                          src={msg.mediaUrl}
                          alt={msg.caption || 'Image'}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                    ) : null}
                    {msg.content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.messageType === 'image' && msg.caption && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">{msg.caption}</p>
                    )}
                    <div className="flex items-center justify-end mt-1 gap-1">
                      <span className={`text-xs opacity-70 ${isOwn ? 'text-white' : 'text-whatsapp-text-muted'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOwn && (
                        <div className="message-status">
                          <svg viewBox="0 0 16 15" className="w-4 h-4 fill-current">
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
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 p-2 shadow-lg"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Message Input */}
      <div className={`flex items-center gap-3 bg-whatsapp-panel-bg border-t border-whatsapp-border flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'
        }`}>
        <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
          }`}>
          <Smile className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
        </Button>

        <Button variant="ghost" size="icon" className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
          }`}
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
          <div className="absolute bottom-12 left-0 right-0 p-2 bg-whatsapp-panel-bg">
            <div className="flex items-center gap-2">
              <Image src={URL.createObjectURL(attachment)} alt="preview" width={40} height={40} className="rounded" />
              <span className="text-sm text-whatsapp-text-primary truncate">{attachment.name}</span>
              <Button variant="ghost" size="icon" onClick={handleRemoveAttachment} className="ml-auto text-whatsapp-text-secondary">
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
            className="whatsapp-input"
          />
        </div>

        {message.trim() ? (
          <Button
            onClick={handleSendMessage}
            size="icon"
            className={`bg-whatsapp-primary hover:bg-whatsapp-dark text-white ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
              }`}
          >
            <Send className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`text-whatsapp-text-secondary hover:bg-whatsapp-hover ${isMobile ? 'w-9 h-9' : 'w-10 h-10'
              }`}
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onMouseLeave={() => setIsRecording(false)}
          >
            <Mic className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} ${isRecording ? 'text-red-500' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );
};