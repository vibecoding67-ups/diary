import { useEffect, useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { AuthContext } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Landing } from "@/pages/Landing";
import { Journal } from "@/pages/Journal";
import { EntryDetail } from "@/pages/EntryDetail";
import { CalendarPage } from "@/pages/CalendarPage";
import { Stats } from "@/pages/Stats";
import { AuthPage } from "@/pages/AuthPages";
import NotFound from "@/pages/not-found";

function HomeRedirect() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);
  if (session === undefined) return null;
  if (session) return <Redirect to="/journal" />;
  return <Landing />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);
  if (session === undefined) return null;
  if (!session) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) queryClient.clear();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={HomeRedirect} />
                <Route path="/sign-in" component={AuthPage} />
                <Route path="/sign-up" component={AuthPage} />
                <Route path="/journal"><Protected><Journal /></Protected></Route>
                <Route path="/entries/:id"><Protected><EntryDetail /></Protected></Route>
                <Route path="/calendar"><Protected><CalendarPage /></Protected></Route>
                <Route path="/stats"><Protected><Stats /></Protected></Route>
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
