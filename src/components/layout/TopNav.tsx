// 📄 TopNav.tsx (Updated with dynamic avatar fetch)
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

const supabase = createClient(
  'https://rrmrownqurlhnngqeoqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybXJvd25xdXJsaG5uZ3Flb3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDkxMDUsImV4cCI6MjA1OTEyNTEwNX0.sMBDivG_y_EHyChuAEIMz1mz20GPXGHKL2anEMli00E'
);
interface TopNavProps {
  isAdmin?: boolean;
  avatar?: string;
}

export default function TopNav({ isAdmin = false, avatar }: TopNavProps) {
  const { language, toggleLanguage, t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

 return (
    <div className="flex items-center justify-end gap-2 py-4 px-6 border-b bg-background/50 backdrop-blur">
      {/* زرّ الإشعارات (كما هو) */}
      <Button variant="ghost" size="icon" title={t('Notifications')}>
        <Bell className="w-5 h-5" />
      </Button>

      {/* زرّ الترجمة */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleLanguage()}                // يبدّل بين ar / en
        title={language === 'ar' ? 'English' : 'العربية'}
      >
        {language === 'ar' ? 'EN' : 'ع'}                {/* نصّ مختصر */}
      </Button>

      {/* قائمة الحساب (كما كانت) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={avatar || '/placeholder.svg'} alt="User Avatar" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('My Account')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" /> {t('Settings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> {t('Log out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
