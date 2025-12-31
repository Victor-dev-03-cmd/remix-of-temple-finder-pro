import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from './DashboardSidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 lg:hidden">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>
          <main className="flex-1 w-full px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
