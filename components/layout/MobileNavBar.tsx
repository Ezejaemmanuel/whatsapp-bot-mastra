import React from 'react';
import { MessageCircle, DollarSign, Users, Settings, Receipt, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileNavBarProps {
    activeTab: string;
    onTabChange: (tab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank') => void;
    unreadCount?: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange, unreadCount = 0 }) => {
    const navItems = [
        { id: 'bank', icon: <Landmark className="w-6 h-6" />, label: 'Bank' },
        { id: 'rates', icon: <DollarSign className="w-6 h-6" />, label: 'Rates' },
        { id: 'transactions', icon: <Receipt className="w-6 h-6" />, label: 'Transactions' },
        { id: 'chats', icon: <MessageCircle className="w-6 h-6" />, label: 'Chats', badge: unreadCount },
        { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-whatsapp-border/50 glass-panel backdrop-blur-xl z-50 shadow-2xl">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-whatsapp-primary to-transparent opacity-50"></div>

            <div className="flex items-center justify-around py-3 px-2">
                {navItems.map(item => (
                    <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => onTabChange(item.id as any)}
                        className={`flex flex-col items-center gap-1.5 h-full px-3 py-2 relative transition-all duration-300 hover:scale-110 ${activeTab === item.id
                            ? 'text-whatsapp-primary bg-whatsapp-primary/10 backdrop-blur-sm rounded-lg shadow-lg glow-purple'
                            : 'text-whatsapp-text-muted hover:text-whatsapp-primary hover:bg-whatsapp-hover/50'
                            }`}
                    >
                        <div className={`transition-all duration-300 ${activeTab === item.id ? 'drop-shadow-lg' : ''}`}>
                            {item.icon}
                        </div>
                        <span className={`text-xs font-medium transition-all duration-300 ${activeTab === item.id ? 'text-whatsapp-primary font-semibold' : ''
                            }`}>
                            {item.label}
                        </span>

                        {/* Active indicator */}
                        {activeTab === item.id && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-whatsapp-primary rounded-full shadow-lg"></div>
                        )}

                        {/* Chat badge */}
                        {item.id === 'chats' && item.badge && item.badge > 0 && (
                            <Badge className="bg-gradient-to-r from-whatsapp-unread to-whatsapp-accent text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full absolute -top-1 -right-1 shadow-lg pulse-purple border border-whatsapp-accent/50">
                                {item.badge}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}; 