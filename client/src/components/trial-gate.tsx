import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Check,
  X,
  Zap,
  Cpu,
  MousePointer2,
  Video,
  ShieldCheck,
  Loader2
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
  const [isLoading, setIsLoading] = useState<"basic" | "pro" | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const { toast } = useToast();

  // Hide X for the first 10 seconds to ensure users review plans
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartCheckout = async (plan: "basic" | "pro") => {
    setIsLoading(plan);
    try {
      const endpoint = plan === "basic" ? "/api/basic/checkout" : "/api/pro/checkout";
      const data = await apiRequest("POST", endpoint);
      if (data.checkoutId) {
        setCheckoutId(data.checkoutId);
        setShowCheckout(true);
      } else {
        throw new Error("No checkout session returned");
      }
    } catch (error) {
      console.error(`[TrialGate] ${plan} checkout error:`, error);
      toast({
        title: "Error preparing checkout",
        description: "Could not initialize Whop checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
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
      title: "Plan Activated! 🎉",
      description: "Welcome to Course Generator! Your trial is now active.",
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-indigo-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className={`w-full z-10 space-y-6 my-auto py-4 sm:py-6 transition-all ${showCheckout ? 'max-w-2xl' : 'max-w-5xl lg:max-w-6xl xl:max-w-[1240px]'}`}>
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
          <div className="bg-card/90 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 space-y-8 lg:space-y-10 animate-in fade-in duration-300 relative">
            {/* Top-Right Dismiss Button - Appears after 10 seconds */}
            {onDismiss && canDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/60 hover:text-foreground h-9 w-9 lg:h-10 lg:w-10 rounded-full hover:bg-muted flex items-center justify-center z-20 animate-in fade-in duration-500"
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', left: 'auto' }}
                onClick={onDismiss}
                title="Continue with Limited Free Plan"
              >
                <X className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            )}

            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-3 lg:space-y-4 pt-1">
              <div className="relative">
                <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-black flex items-center justify-center ring-4 ring-primary/20">
                  <img src="/app_logo.jpg" alt="Course Generator" className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="space-y-1.5 lg:space-y-2 max-w-xl lg:max-w-2xl">
                <Badge
                  variant="outline"
                  className="bg-primary/10 border-primary/30 text-primary font-semibold px-3 py-0.5 text-xs lg:text-sm rounded-full inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3 w-3 lg:h-3.5 lg:w-3.5 fill-current" />
                  3-Day Free Trial Available
                </Badge>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Choose a Plan to Get Started
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Unlock powerful AI course tools and <span className="font-semibold text-foreground">start earning on day 1.</span>
                </p>
              </div>
            </div>

            {/* 3 Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* 1. Free Plan */}
              <div className="flex flex-col p-5 md:p-6 lg:p-7 rounded-2xl border bg-muted/20">
                <div className="mb-4 lg:mb-6">
                  <h3 className="text-sm lg:text-base font-semibold uppercase tracking-wider text-muted-foreground">Free</h3>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-3xl lg:text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground text-xs lg:text-sm font-medium">/month</span>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 lg:space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-muted-foreground">
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                    Course Publishing (Requires Plan)
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-foreground/80 font-medium">
                    <Check className="h-4 w-4 text-primary/60 shrink-0" />
                    1 Lifetime Trial Generation
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-foreground/80 font-medium">
                    <Check className="h-4 w-4 text-primary/60 shrink-0" />
                    Magic AI Access (1 Try)
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-muted-foreground">
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                    Guided Mode
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-muted-foreground">
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                    Direct Video Upload (Embeds Only)
                  </li>
                </ul>

                <Button
                  variant="outline"
                  className="w-full h-11 lg:h-12 text-xs sm:text-sm font-bold text-muted-foreground bg-muted/40 border-border cursor-default mt-auto pointer-events-none"
                  disabled
                >
                  Current Plan
                </Button>
              </div>

              {/* 2. Basic Plan */}
              <div
                className={`flex flex-col p-5 md:p-6 lg:p-7 rounded-2xl border-2 transition-all duration-300 relative group ${hoveredPlan === "basic" ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-blue-500/10' : 'border-blue-500/50 bg-blue-500/5 shadow-lg'}`}
                onMouseEnter={() => setHoveredPlan("basic")}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] lg:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  BASIC
                </div>
                <div className="mb-4 lg:mb-6 pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm lg:text-base font-bold uppercase tracking-wider text-blue-500">Basic</h3>
                  </div>
                  <div className="flex flex-col mt-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl lg:text-4xl font-bold text-foreground">$5</span>
                      <span className="text-muted-foreground text-xs lg:text-sm font-semibold">/week</span>
                    </div>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 lg:space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-blue-500">
                    <Zap className="h-4 w-4 shrink-0" />
                    10 Published Courses
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-blue-500">
                    <Check className="h-4 w-4 shrink-0" />
                    1 Daily Course Generation
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-blue-500">
                    <Cpu className="h-4 w-4 shrink-0" />
                    Magic AI
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm text-muted-foreground">
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                    Guided Mode
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-blue-500">
                    <Video className="h-4 w-4 shrink-0" />
                    Direct Video Upload (800MB Storage)
                  </li>
                </ul>

                <Button
                  className="w-full h-11 lg:h-12 text-xs sm:text-sm lg:text-base font-bold shadow-lg shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] ring-2 ring-blue-500/20 ring-offset-2 mt-auto text-white"
                  onClick={() => handleStartCheckout("basic")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "basic" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start 3-Day Free Trial"
                  )}
                </Button>
              </div>

              {/* 3. Pro Plan */}
              <div
                className={`flex flex-col p-5 md:p-6 lg:p-7 rounded-2xl border-2 transition-all duration-300 relative group ${hoveredPlan === "pro" ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-primary/10' : 'border-primary/50 bg-primary/5 shadow-xl'}`}
                onMouseEnter={() => setHoveredPlan("pro")}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] lg:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  PRO • POPULAR
                </div>
                <div className="mb-4 lg:mb-6 pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm lg:text-base font-bold uppercase tracking-wider text-primary">Pro</h3>
                    <span className="bg-primary/20 text-primary text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-md animate-pulse">
                      50% OFF
                    </span>
                  </div>
                  <div className="flex flex-col mt-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl lg:text-4xl font-bold text-foreground">$8</span>
                      <span className="text-muted-foreground text-xs lg:text-sm font-semibold">/week</span>
                      <span className="text-muted-foreground/60 text-sm lg:text-base line-through ml-1">$16</span>
                    </div>
                    <p className="text-[11px] lg:text-xs font-bold text-primary mt-1 flex items-center gap-1 italic">
                      <Sparkles className="h-3 w-3" />
                      Founder's pricing ends soon
                    </p>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 lg:space-y-3.5 mb-8">
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-primary">
                    <Zap className="h-4 w-4 shrink-0" />
                    Unlimited Published Courses
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-primary">
                    <Check className="h-4 w-4 shrink-0" />
                    2 Daily Course Generation
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-primary">
                    <Cpu className="h-4 w-4 shrink-0" />
                    Magic AI
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-primary">
                    <MousePointer2 className="h-4 w-4 shrink-0" />
                    Guided Mode (Upload Docs)
                  </li>
                  <li className="flex items-center gap-2.5 text-xs lg:text-sm font-bold text-primary">
                    <Video className="h-4 w-4 shrink-0" />
                    Direct Video Upload (2GB Storage)
                  </li>
                </ul>

                <Button
                  className="w-full h-11 lg:h-12 text-xs sm:text-sm lg:text-base font-bold shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] ring-2 ring-primary/20 ring-offset-2 mt-auto text-white"
                  onClick={() => handleStartCheckout("pro")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "pro" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start 3-Day Free Trial"
                  )}
                </Button>
              </div>
            </div>

            {/* Footer Trust Text */}
            <div className="pt-2">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs lg:text-sm text-center">
                <ShieldCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground shrink-0" />
                <span>100% Risk-Free. Cancel anytime in your Whop Settings.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
