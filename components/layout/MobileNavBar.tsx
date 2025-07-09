import React from 'react';
import { MessageCircle, Phone, Users, Settings, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileNavBarProps {
    activeTab: string;
    onTabChange: (tab: 'chats' | 'transactions' | 'settings' | 'calls' | 'updates') => void;
    unreadCount?: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange, unreadCount = 0 }) => {
    const navItems = [
        { id: 'updates', icon: <div className="w-6 h-6 bg-whatsapp-primary rounded-full"></div>, label: 'Updates' },
        { id: 'calls', icon: <Phone className="w-6 h-6" />, label: 'Calls' },
        { id: 'transactions', icon: <Receipt className="w-6 h-6" />, label: 'Transactions' },
        { id: 'chats', icon: <MessageCircle className="w-6 h-6" />, label: 'Chats', badge: unreadCount },
        { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-whatsapp-border bg-whatsapp-panel-bg z-10">
            <div className="flex items-center justify-around py-2">
                {navItems.map(item => (
                    <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => onTabChange(item.id as any)}
                        className={`flex flex-col items-center gap-1 h-full px-2 py-1 relative ${activeTab === item.id ? 'text-whatsapp-primary' : 'text-whatsapp-text-muted'
                            }`}
                    >
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                        {item.id === 'chats' && item.badge && item.badge > 0 && (
                            <Badge className="bg-whatsapp-unread text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full absolute -top-1 -right-1">
                                {item.badge}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}; 