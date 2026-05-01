import { Link, useLocation } from "wouter";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthPage() {
  const [location] = useLocation();
  const isSignUp = location === "/sign-up";
  const redirectTo = `${window.location.origin}/journal`;

  return (
    <div className="min-h-[calc(100dvh-4rem)] grid grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundImage: "linear-gradient(160deg, hsl(var(--primary) / 0.18), transparent 60%), linear-gradient(0deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0) 100%)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 30% 80%, hsl(var(--primary) / 0.25), transparent 50%), radial-gradient(circle at 80% 10%, hsl(var(--secondary) / 0.18), transparent 55%)" }} />
        <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back home
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-handwritten text-3xl text-primary mb-3">
            {isSignUp ? "A new notebook" : "Welcome back"}
          </p>
          <h2 className="font-serif text-4xl leading-tight tracking-tight">
            Pull up a chair.<br />The page is warm.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            {isSignUp
              ? "Make a free account in a moment. Your entries are private — only you ever see them."
              : "Sign in to keep your pages in one quiet place — they'll be right where you left them."}
          </p>
          <div className="mt-10 paper-card rounded-2xl p-5 max-w-sm">
            <p className="font-handwritten text-xl text-primary">Tonight, October 14</p>
            <p className="font-serif text-lg mt-0.5">A quiet kind of day.</p>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              Walked home the long way. Tea steeped a minute too long. The kind of day worth remembering on purpose.
            </p>
          </div>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">Cozy Diary · {new Date().getFullYear()}</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />Back home
          </Link>
        </div>
        <div className="w-full max-w-sm">
          <Auth
            supabaseClient={supabase}
            view={isSignUp ? "sign_up" : "sign_in"}
            providers={["google"]}
            redirectTo={redirectTo}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(14, 60%, 46%)",
                    brandAccent: "hsl(14, 60%, 38%)",
                    brandButtonText: "white",
                    defaultButtonBackground: "hsl(36, 35%, 95%)",
                    defaultButtonBackgroundHover: "hsl(36, 35%, 88%)",
                    inputBackground: "hsl(36, 35%, 95%)",
                    inputBorder: "hsl(30, 22%, 80%)",
                    inputBorderHover: "hsl(14, 60%, 46%)",
                    inputBorderFocus: "hsl(14, 60%, 46%)",
                    inputText: "hsl(25, 30%, 16%)",
                  },
                  radii: {
                    borderRadiusButton: "0.75rem",
                    buttonBorderRadius: "0.75rem",
                    inputBorderRadius: "0.75rem",
                  },
                  fonts: {
                    bodyFontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                    buttonFontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                    inputFontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                    labelFontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
