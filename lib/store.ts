import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Id } from '@/convex/_generated/dataModel';
import {
    ConversationStatus,
    InCharge,
    MessageDirection,
    SenderRole,
    MessageType,
    MessageStatus,
    TransactionStatus
} from '@/convex/types';

// Types for the store
export interface User {
    _id: Id<"users">;
    whatsappId: string;
    profileName?: string;
    phoneNumber?: string;
    isBlocked?: boolean;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    metadata?: any;
}

export interface Conversation {
    _id: Id<"conversations">;
    userId: Id<"users">;
    userName: string;
    status?: ConversationStatus;
    inCharge: InCharge;
    lastMessageAt?: number;
    lastMessageSummary?: string;
    metadata?: any;
}

export interface Message {
    _id: Id<"messages">;
    conversationId: Id<"conversations">;
    whatsappMessageId?: string;
    direction: MessageDirection;
    senderRole: SenderRole;
    senderName: string;
    messageType: MessageType;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    caption?: string;
    location?: any;
    contacts?: any;
    context?: any;
    status?: MessageStatus;
    timestamp: number;
    metadata?: any;
    error?: string;
}

export interface Transaction {
    _id: Id<"transactions">;
    userId: Id<"users">;
    conversationId: Id<"conversations">;
    currencyFrom: string;
    currencyTo: string;
    amountFrom: number;
    amountTo: number;
    negotiatedRate: number;
    paymentReference?: string;
    receiptImageUrl?: string;
    extractedDetails?: any;
    status: TransactionStatus;
    negotiationHistory?: any[];
    createdAt: number;
    updatedAt: number;
    metadata?: any;
}

// UI State interfaces
interface UIState {
    selectedConversationId?: Id<"conversations">;
    selectedTransactionId?: Id<"transactions">;
    activeTab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank';
    isMobile: boolean;
    searchQuery: string;
    chatFilter: 'all' | 'unread' | 'groups' | 'favorites';
    activeFilter: string;
    filterOrder: string[];
    isTyping: boolean;
    onlineUsers: Set<string>;
    imageDialog: {
        isOpen: boolean;
        imageUrl: string;
        title?: string;
    };
}

// Main store interface
interface WhatsAppStore {
    // Data
    users: Map<Id<"users">, User>;
    conversations: Map<Id<"conversations">, Conversation>;
    messages: Map<Id<"conversations">, Message[]>;
    transactions: Map<Id<"transactions">, Transaction>;

    // UI State
    ui: UIState;

    // Actions
    setUsers: (users: User[]) => void;
    setUser: (user: User) => void;

    setConversations: (conversations: Conversation[]) => void;
    setConversation: (conversation: Conversation) => void;

    setMessages: (conversationId: Id<"conversations">, messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (messageId: Id<"messages">, updates: Partial<Message>) => void;

    setTransactions: (transactions: Transaction[]) => void;
    setTransaction: (transaction: Transaction) => void;

    // UI Actions
    setSelectedConversation: (conversationId: Id<"conversations">) => void;
    setSelectedTransaction: (transactionId: Id<"transactions">) => void;
    setActiveTab: (tab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank') => void;
    handleBack: () => void;
    setIsMobile: (isMobile: boolean) => void;
    setSearchQuery: (query: string) => void;
    setChatFilter: (filter: 'all' | 'unread' | 'groups' | 'favorites') => void;
    setActiveFilter: (filter: string) => void;
    setFilterOrder: (order: string[]) => void;
    setIsTyping: (isTyping: boolean) => void;
    setUserOnline: (userId: string, isOnline: boolean) => void;
    openImageDialog: (imageUrl: string, title?: string) => void;
    closeImageDialog: () => void;

    // Computed selectors
    getUserById: (userId: Id<"users">) => User | undefined;
}

export const useWhatsAppStore = create<WhatsAppStore>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // Initial state
            users: new Map(),
            conversations: new Map(),
            messages: new Map(),
            transactions: new Map(),

            ui: {
                selectedConversationId: undefined,
                selectedTransactionId: undefined,
                activeTab: 'chats',
                isMobile: false,
                searchQuery: '',
                chatFilter: 'all',
                activeFilter: 'All',
                filterOrder: ['All', 'Unread', 'Admin', 'Bot', 'ImageReview'],
                isTyping: false,
                onlineUsers: new Set(),
                imageDialog: {
                    isOpen: false,
                    imageUrl: '',
                    title: undefined,
                },
            },

            // User actions
            setUsers: (users) => set((state) => ({
                users: new Map(users.map(user => [user._id, user]))
            })),

            setUser: (user) => set((state) => ({
                users: new Map(state.users.set(user._id, user))
            })),

            // Conversation actions
            setConversations: (conversations) => set((state) => ({
                conversations: new Map(conversations.map(conv => [conv._id, conv]))
            })),

            setConversation: (conversation) => set((state) => ({
                conversations: new Map(state.conversations.set(conversation._id, conversation))
            })),

            // Message actions
            setMessages: (conversationId, messages) => set((state) => ({
                messages: new Map(state.messages.set(conversationId, messages))
            })),

            addMessage: (message) => set((state) => {
                const conversationMessages = state.messages.get(message.conversationId) || [];
                const updatedMessages = [...conversationMessages, message];
                return {
                    messages: new Map(state.messages.set(message.conversationId, updatedMessages))
                };
            }),

            updateMessage: (messageId, updates) => set((state) => {
                const newMessages = new Map(state.messages);
                for (const [conversationId, messages] of newMessages.entries()) {
                    const messageIndex = messages.findIndex(msg => msg._id === messageId);
                    if (messageIndex !== -1) {
                        const updatedMessages = [...messages];
                        updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updates };
                        newMessages.set(conversationId, updatedMessages);
                        break;
                    }
                }
                return { messages: newMessages };
            }),

            // Transaction actions
            setTransactions: (transactions) => set((state) => ({
                transactions: new Map(transactions.map(txn => [txn._id, txn]))
            })),

            setTransaction: (transaction) => set((state) => ({
                transactions: new Map(state.transactions.set(transaction._id, transaction))
            })),

            // UI actions
            setSelectedConversation: (conversationId) => set((state) => ({
                ui: { ...state.ui, selectedConversationId: conversationId, selectedTransactionId: undefined }
            })),

            setSelectedTransaction: (transactionId) => set((state) => ({
                ui: { ...state.ui, selectedTransactionId: transactionId, selectedConversationId: undefined }
            })),

            setActiveTab: (tab) => set((state) => ({
                ui: { ...state.ui, activeTab: tab, selectedConversationId: undefined, selectedTransactionId: undefined }
            })),

            handleBack: () => set((state) => ({
                ui: { ...state.ui, selectedConversationId: undefined, selectedTransactionId: undefined }
            })),

            setIsMobile: (isMobile) => set((state) => ({ ui: { ...state.ui, isMobile } })),

            setSearchQuery: (query) => set((state) => ({ ui: { ...state.ui, searchQuery: query } })),

            setChatFilter: (filter) => set((state) => ({
                ui: { ...state.ui, chatFilter: filter }
            })),

            setActiveFilter: (filter) => set((state) => ({
                ui: { ...state.ui, activeFilter: filter }
            })),

            setFilterOrder: (order) => set((state) => ({
                ui: { ...state.ui, filterOrder: order }
            })),

            setIsTyping: (isTyping) => set((state) => ({
                ui: { ...state.ui, isTyping }
            })),

            setUserOnline: (userId, isOnline) => set((state) => {
                const newOnlineUsers = new Set(state.ui.onlineUsers);
                if (isOnline) {
                    newOnlineUsers.add(userId);
                } else {
                    newOnlineUsers.delete(userId);
                }
                return {
                    ui: { ...state.ui, onlineUsers: newOnlineUsers }
                };
            }),

            openImageDialog: (imageUrl, title) => set((state) => ({
                ui: {
                    ...state.ui,
                    imageDialog: {
                        isOpen: true,
                        imageUrl,
                        title,
                    }
                }
            })),

            closeImageDialog: () => set((state) => ({
                ui: {
                    ...state.ui,
                    imageDialog: {
                        isOpen: false,
                        imageUrl: '',
                        title: undefined,
                    }
                }
            })),

            // Selectors
            getUserById: (userId) => {
                const state = get();
                return state.users.get(userId);
            },
        })),
        { name: 'whatsapp-store' }
    )
);

// Custom hooks for easy access to store slices
export const useUsers = () => useWhatsAppStore(state => Array.from(state.users.values()));
export const useUser = (userId?: Id<"users">) => useWhatsAppStore(state => userId ? state.users.get(userId) : undefined);

export const useConversations = () => useWhatsAppStore(
    useShallow(state => Array.from(state.conversations.values()))
);

export const useConversation = (conversationId?: Id<"conversations">) => useWhatsAppStore(
    state => conversationId ? state.conversations.get(conversationId) : undefined
);

export const useConversationMessages = (conversationId?: Id<"conversations">) =>
    useWhatsAppStore(
        useShallow(state => conversationId ? state.messages.get(conversationId) || [] : [])
    );

export const useUIState = () => useWhatsAppStore(state => state.ui);

export const useSelectedConversation = () => useWhatsAppStore(
    (state) => state.ui.selectedConversationId ? state.conversations.get(state.ui.selectedConversationId) : undefined
);

export const useSelectedTransaction = () => useWhatsAppStore(
    (state) => state.ui.selectedTransactionId ? state.transactions.get(state.ui.selectedTransactionId) : undefined
);

// Actions can be exported directly if they don't need to be bound to the component lifecycle
export const {
    setUsers,
    setUser,
    setConversations,
    setConversation,
    setMessages,
    addMessage,
    updateMessage,
    setTransactions,
    setTransaction,
    setSelectedConversation,
    setSelectedTransaction,
    setActiveTab,
    setIsMobile,
    setSearchQuery,
    setChatFilter,
    setIsTyping,
    setUserOnline,
    handleBack,
    openImageDialog,
    closeImageDialog
} = useWhatsAppStore.getState();