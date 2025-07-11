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
    <div className="w-16 glass-panel border-r border-whatsapp-border flex flex-col items-center py-6 gap-6 backdrop-blur-xl">
      {/* Profile */}
      <div className="relative group">
        <Avatar className="w-10 h-10 mb-4 ring-2 ring-whatsapp-primary/20 transition-all duration-300 group-hover:ring-whatsapp-primary/50 group-hover:scale-105">
          <AvatarImage src={profileAvatar.src} alt="Profile" className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent text-white text-sm font-semibold">ME</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-whatsapp-online rounded-full border-2 border-whatsapp-panel-bg"></div>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-3 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div key={item.id} className="relative group">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTabChange(item.id as 'chats' | 'transactions' | 'settings' | 'calls' | 'updates')}
                className={`w-12 h-12 mx-auto relative transition-all duration-300 hover:scale-105 ${isActive
                  ? 'text-white bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent shadow-lg glow-purple'
                  : 'text-whatsapp-text-muted hover:text-whatsapp-primary hover:bg-whatsapp-hover/50 hover:backdrop-blur-sm'
                  }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`} />
                {isActive && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-whatsapp-primary to-whatsapp-accent rounded-r-full shadow-lg"></div>
                )}
              </Button>

              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-whatsapp-panel-bg/90 backdrop-blur-sm text-whatsapp-text-primary text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-whatsapp-border/50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decorative bottom accent */}
      <div className="mt-auto w-8 h-0.5 bg-gradient-to-r from-transparent via-whatsapp-primary to-transparent rounded-full opacity-50"></div>
    </div>
  );
};