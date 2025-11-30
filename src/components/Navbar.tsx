import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { Home, History } from 'lucide-react';

interface NavbarProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
}

export function Navbar({ showBackButton = false, onBackClick, rightContent }: NavbarProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Logo className="text-foreground" />
            </Link>
          </div>

          <nav className="flex items-center gap-6">
            {!isHomePage && (
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            )}
            <Link
              to="/negotiations-history"
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-2",
                location.pathname === '/negotiations-history'
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>
            {rightContent}
          </nav>
        </div>
      </div>
    </header>
  );
}

