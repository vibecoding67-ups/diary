import { Link, useLocation } from "wouter";
import { Moon, Sun, BookOpen, CalendarRange, BarChart3, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV = [
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarRange },
  { to: "/stats", label: "Stats", icon: BarChart3 },
];

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();
  const { user, session } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Diary keeper";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={session ? "/journal" : "/"} className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="Cozy Diary" className="h-8 w-8" />
            <span className="font-serif text-lg font-semibold tracking-tight">Cozy Diary</span>
          </Link>

          {session && (
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link key={to} href={to} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors hover-elevate ${location.startsWith(to) ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" /><span>{label}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full hover-elevate active-elevate-2 p-0.5">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={avatar} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-muted-foreground truncate">{email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/sign-up"><Button size="sm">Start writing</Button></Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bottom navigation bar for mobile */}
      {session && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-background/90 border-t border-border">
          <div className="flex items-center justify-around h-16">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                href={to}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  location.startsWith(to) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
