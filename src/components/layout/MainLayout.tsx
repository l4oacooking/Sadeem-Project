import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type MainLayoutProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

export default function MainLayout({ children, isAdmin = false }: MainLayoutProps) {
  const { rtl, language } = useTranslation();
  
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex",
      rtl && "flex-row-reverse"
    )}
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Sidebar isAdmin={isAdmin} />
      <div className={cn(
        "flex-1",
        rtl ? "mr-16 md:mr-64" : "ml-16 md:ml-64"
      )}>
        <TopNav isAdmin={isAdmin} />
        <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
