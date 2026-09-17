import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
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
  userEmail?: string;
  userName?: string;
}

export function TrialGate({ onSuccess, userEmail, userName }: TrialGateProps) {
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
      <div className="max-w-3xl w-full z-10 space-y-6 my-auto py-4">
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
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowCheckout(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Back
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
          <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-12 space-y-8 animate-in fade-in duration-300">
            {/* Header / App Brand */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-black flex items-center justify-center ring-4 ring-amber-500/20">
                  <img src="/app_logo.jpg" alt="Course Generator" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                  PRO
                </div>
              </div>

              <div className="space-y-2 max-w-xl">
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-3 py-1 text-xs sm:text-sm rounded-full inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  Special Creator Access: 3-Day Free Trial
                </Badge>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Turn Any Idea Into A High-Value Course In 60 Seconds
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Generate complete curricula, in-depth lesson scripts, auto-generated quizzes, and push directly to your Whop community with full creator access.
                </p>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Magic AI Course Builder</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Auto-writes comprehensive modules, lessons, and step-by-step frameworks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">AI Cover Art & Quizzes</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Creates custom course thumbnails and interactive knowledge-check quizzes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Document-to-Course</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Upload PDFs or raw text notes and watch the AI turn them into formatted courses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">1-Click Whop Publishing</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Push live to your members, set custom pricing, and start earning on day 1.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute-Proof Protection Banner */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block sm:inline">100% Risk-Free. $0.00 Due Today: </span>
                <span>You will not be billed during your 3-day trial. Easily cancel anytime with 1-click in your Whop dashboard before Day 3 if you choose not to continue.</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleStartTrial}
                disabled={isLoading}
                size="lg"
                className="w-full h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                    Preparing Secure Trial...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2.5 h-5 w-5 fill-current" />
                    Start 3-Day Free Trial ($0 Today)
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Already subscribed? Refresh status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
