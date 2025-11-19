import { Link, useLocation } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { Button } from './ui/button';
import { useApp } from '@/contexts/AppContext';

export const Header = () => {
  const location = useLocation();
  const { user, setUser } = useApp();

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold">μG</span>
          </div>
          <span className="hidden sm:inline-block">Micro-Grant Platform</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link to={`/${user.role}`}>
                <Button 
                  variant={location.pathname.includes(user.role) ? "default" : "ghost"} 
                  size="sm"
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <WalletConnect />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <WalletConnect />
          )}
        </nav>
      </div>
    </header>
  );
};
