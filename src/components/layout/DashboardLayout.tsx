import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Zap, Folder, Sparkles, Store, History, Key,
  LogOut, Settings, User, ChevronDown, CreditCard, Shield, Code, FileText, Mail, Menu, Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Workflows', href: '/dashboard', icon: Folder },
  { label: 'Templates', href: '/templates', icon: Sparkles },
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Executions', href: '/executions', icon: History },
  { label: 'Credentials', href: '/credentials', icon: Key },
  { label: 'Email', href: '/email-marketing', icon: Mail },
  { label: 'API', href: '/api-keys', icon: Code },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">BiztoriBD</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-muted-foreground',
                      isActive && 'text-foreground bg-muted'
                    )}
                    asChild
                  >
                    <Link to={item.href}>
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile hamburger menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary-foreground" />
                    </div>
                    BiztoriBD
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-4 pb-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors',
                          isActive && 'bg-muted text-primary font-medium'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                        {item.label}
                      </Link>
                    );
                  })}
                  
                  <div className="h-px bg-border my-3" />
                  
                  <Link
                    to="/billing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors',
                      location.pathname === '/billing' && 'bg-muted text-primary font-medium'
                    )}
                  >
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Billing
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/50 transition-colors',
                        location.pathname === '/admin' && 'bg-muted text-primary font-medium'
                      )}
                    >
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Admin
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Billing Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'text-muted-foreground',
                location.pathname === '/billing' && 'text-foreground bg-muted'
              )}
              asChild
            >
              <Link to="/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Billing</span>
              </Link>
            </Button>

            {/* Admin Button - Only visible to admins */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-muted-foreground',
                  location.pathname === '/admin' && 'text-foreground bg-muted'
                )}
                asChild
              >
                <Link to="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="hidden md:inline">{profile?.full_name || profile?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {profile?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/api-keys">
                    <Code className="h-4 w-4 mr-2" />
                    API Keys
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/api-docs">
                    <FileText className="h-4 w-4 mr-2" />
                    API Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
