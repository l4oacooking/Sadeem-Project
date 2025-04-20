import { useState } from 'react';
import { Bell, User, Languages, Check, LogOut, Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type TopNavProps = {
  isAdmin?: boolean;
};

export default function TopNav({ isAdmin = false }: TopNavProps) {
  const { language, toggleLanguage, t, rtl } = useTranslation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // In a real app, this would clear authentication tokens
    localStorage.removeItem('auth_token');
    
    // Show success toast
    toast.success(t("Logged out successfully"));
    
    // Redirect to login page
    navigate('/login');
  };
  
  const navigateToSettings = () => {
    navigate('/settings');
  };
  
  const navigateToProfile = () => {
    // This would navigate to a profile page if you have one
    // For now, we'll just show a toast
    toast.info(t("Profile feature coming soon"));
  };
  
  return (
    <header 
      className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/50 sticky top-0 z-30 w-full"
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className={`container flex h-16 items-center py-4 ${rtl ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {isAdmin ? t("Administration") : t("Dashboard")}
          </h2>
        </div>
        
        <div className={`flex items-center gap-4 ml-auto ${rtl ? 'flex-row-reverse' : ''}`}>
          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={`relative ${rtl ? 'ml-1' : 'mr-1'}`}>
                <span className="sr-only">{t('Select Language')}</span>
                <Languages size={20} />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-600" 
                  title={`Current language: ${language === 'en' ? 'English' : 'العربية'}`}></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={rtl ? 'start' : 'end'}>
              <DropdownMenuItem 
                onClick={() => toggleLanguage('en')}
                className={language === 'en' ? 'bg-secondary' : ''}
              >
                🇺🇸 English
                {language === 'en' && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleLanguage('ar')}
                className={language === 'ar' ? 'bg-secondary' : ''}
              >
                🇸🇦 العربية
                {language === 'ar' && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  localStorage.removeItem('language');
                  toggleLanguage('en');
                  window.location.reload();
                }}
                className="text-red-500 font-medium"
              >
                🔄 Reset Language
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell size={20} />
                <span className="sr-only">{t("Notifications")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={rtl ? "start" : "end"} className="w-80">
              <DropdownMenuLabel>{t("Notifications")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-muted-foreground">
                <p>{t("No notifications")}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center font-medium">
                {t("View all notifications")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">{t("User menu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={rtl ? "start" : "end"}>
              <DropdownMenuLabel>{t("My Account")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">
                <UserCircle className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t("Profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={navigateToSettings} className="cursor-pointer">
                <Settings className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t("Settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className={`${rtl ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t("Log out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
