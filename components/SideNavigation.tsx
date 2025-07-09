import React from 'react';
import { MessageCircle, Phone, Users, Settings, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import profileAvatar from '@/assets/avatar-male-1.jpg';

interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tab: 'chats' | 'transactions' | 'settings' | 'calls' | 'updates') => void;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'transactions', icon: Receipt, label: 'Transactions' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-14 bg-whatsapp-panel-bg border-r border-whatsapp-border flex flex-col items-center py-4 gap-4">
      {/* Profile */}
      <Avatar className="w-8 h-8 mb-2">
        <AvatarImage src={profileAvatar.src} alt="Profile" />
        <AvatarFallback className="bg-whatsapp-primary text-white text-xs">ME</AvatarFallback>
      </Avatar>

      {/* Navigation Items */}
      <div className="flex flex-col gap-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              onClick={() => onTabChange(item.id as 'chats' | 'transactions' | 'settings' | 'calls' | 'updates')}
              className={`w-10 h-10 mx-auto relative ${isActive
                ? 'text-whatsapp-primary bg-whatsapp-hover'
                : 'text-whatsapp-text-muted hover:text-whatsapp-text-secondary hover:bg-whatsapp-hover'
                }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-whatsapp-primary rounded-r-full"></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};