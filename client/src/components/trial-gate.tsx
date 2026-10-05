import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Loader2,
  Layers,
  FileText,
  X
} from "lucide-react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface TrialGateProps {
  onSuccess?: () => void;
  onDismiss?: () => void;
  userEmail?: string;
  userName?: string;
}

export function TrialGate({ onSuccess, onDismiss, userEmail, userName }: TrialGateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("POST", "/api/pro/checkout");
      if (data.checkoutId) {
        setCheckoutId(data.checkoutId);
        setShowCheckout(true);
      } else {
        throw new Error("No checkout session returned");
      }
    } catch (error) {
      console.error("[TrialGate] Failed to initiate checkout:", error);
      toast({
        title: "Error preparing checkout",
        description: "Could not initialize Whop checkout. Please try again or refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutComplete = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#6366f1", "#ec4899"],
      });
    } catch (e) {
      // ignore
    }

    toast({
      title: "Trial Activated! 🎉",
      description: "Welcome to Course Generator Pro! Your 3-day all-access trial is active.",
    });

    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className={`w-full z-10 space-y-6 my-auto py-4 transition-all ${showCheckout ? 'max-w-2xl' : 'max-w-lg'}`}>
        {showCheckout && checkoutId ? (
          <div className="bg-card border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <div className="p-4 border-b flex items-center justify-between bg-muted/40 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Whop Secure Checkout • 3-Day Free Trial ($0.00 Due Today)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setShowCheckout(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full h-[650px] max-h-[78vh] overflow-y-auto overflow-x-hidden bg-white">
              <WhopCheckoutEmbed
                sessionId={checkoutId}
                returnUrl={window.location.href}
                onComplete={handleCheckoutComplete}
              />
            </div>
          </div>
        ) : (
          <div className="bg-card/90 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300 relative">
            {/* Top-Right Dismiss Button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/60 hover:text-foreground h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center z-20"
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', left: 'auto' }}
                onClick={onDismiss}
                title="Continue with Limited Free Plan"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Header / App Brand */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-black flex items-center justify-center ring-4 ring-amber-500/20">
                  <img src="/app_logo.jpg" alt="Course Generator" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md">
                  PRO
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-0.5 text-xs rounded-full inline-flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="h-3 w-3 fill-current" />
                  3-Day Free Trial
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                  Start Your 3-Day Free Trial
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Build and launch high-value courses with Magic AI and <span className="font-semibold text-foreground">start earning on day 1.</span>
                </p>
              </div>
            </div>

            {/* Compact Highlights List */}
            <div className="space-y-2.5 py-1">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="text-xs sm:text-sm text-foreground">
                  <span className="font-semibold">Magic AI Builder:</span> Generate full curricula & lesson scripts in 60s
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-xs sm:text-sm text-foreground">
                  <span className="font-semibold">Auto Assets:</span> Instant AI cover art & interactive student quizzes
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="text-xs sm:text-sm text-foreground">
                  <span className="font-semibold">1-Click Publishing:</span> Push live to Whop & start earning on day 1
                </div>
              </div>
            </div>

            {/* Trust Banner */}
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span><strong>$0.00 due today.</strong> Cancel anytime in 1-click before Day 3.</span>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3 pt-1">
              <Button
                onClick={handleStartTrial}
                disabled={isLoading}
                size="lg"
                className="w-full h-12 sm:h-13 text-sm sm:text-base font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Secure Trial...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 fill-current" />
                    Start 3-Day Free Trial ($0 Today)
                  </>
                )}
              </Button>

              {onDismiss && (
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4 inline-flex items-center gap-1"
                  >
                    <span>Continue with Limited Free Plan</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
