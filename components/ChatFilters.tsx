import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, MessageCircle, Eye, User, Bot, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useWhatsAppStore, useUIState } from '@/lib/store';

interface Filter {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const FILTERS: Filter[] = [
    { id: 'All', label: 'All', icon: MessageCircle },
    { id: 'Unread', label: 'Unread', icon: Eye },
    { id: 'Admin', label: 'Admin', icon: User },
    { id: 'Bot', label: 'Bot', icon: Bot },
    { id: 'ImageReview', label: 'Image Review', icon: Image },
];

const STORAGE_KEY = 'chat-filter-order';

interface ChatFiltersProps {
    conversations: any[];
    allTransactions?: any;
}

export const ChatFilters: React.FC<ChatFiltersProps> = ({ conversations, allTransactions }) => {
    const { activeFilter, filterOrder } = useUIState();
    const { setActiveFilter, setFilterOrder } = useWhatsAppStore();
    const [showMore, setShowMore] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load filter order from localStorage on mount
    useEffect(() => {
        const savedOrder = localStorage.getItem(STORAGE_KEY);
        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder);
                setFilterOrder(parsedOrder);
            } catch (error) {
                console.error('Failed to parse saved filter order:', error);
            }
        }
    }, [setFilterOrder]);

    // Save filter order to localStorage when it changes
    useEffect(() => {
        if (filterOrder.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOrder));
        }
    }, [filterOrder]);

    const handleFilterClick = (filterId: string) => {
        setActiveFilter(filterId);

        // Update filter order: move clicked filter to front (after 'All')
        const newOrder = ['All', ...filterOrder.filter(id => id !== 'All' && id !== filterId), filterId];
        setFilterOrder(newOrder);
    };

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

    const visibleFilters = showMore ? filterOrder : filterOrder.slice(0, 4);
    const hasMoreFilters = filterOrder.length > 4;

    return (
        <div className="flex-shrink-0 bg-gradient-to-r from-whatsapp-panel-bg/70 to-whatsapp-panel-bg/50 backdrop-blur-sm">
            <ScrollArea className="w-full">
                <div className="flex gap-2 px-4 py-3" ref={scrollRef}>
                    {visibleFilters.map((filterId) => {
                        const filter = FILTERS.find(f => f.id === filterId);
                        if (!filter) return null;

                        const IconComponent = filter.icon;
                        const count = getFilterCount(filterId);

                        return (
                            <Button
                                key={filterId}
                                variant={activeFilter === filterId ? "default" : "secondary"}
                                size="sm"
                                onClick={() => handleFilterClick(filterId)}
                                className={`whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center gap-1.5 ${activeFilter === filterId
                                    ? 'bg-gradient-to-r from-whatsapp-primary to-whatsapp-accent text-white hover:from-whatsapp-primary/90 hover:to-whatsapp-accent/90 shadow-lg glow-purple'
                                    : 'bg-whatsapp-hover/60 text-whatsapp-text-secondary hover:bg-whatsapp-border/60 hover:text-whatsapp-primary backdrop-blur-sm border border-whatsapp-border/30'
                                    }`}
                            >
                                <IconComponent className="w-3.5 h-3.5" />
                                {filter.label}
                                {count > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 bg-whatsapp-accent/20 text-whatsapp-accent border border-whatsapp-accent/30 text-xs"
                                    >
                                        {count}
                                    </Badge>
                                )}
                            </Button>
                        );
                    })}

                    {hasMoreFilters && !showMore && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMore(true)}
                            className="text-whatsapp-text-secondary hover:bg-whatsapp-hover/60 hover:text-whatsapp-primary transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
        </div>
    );
}; 