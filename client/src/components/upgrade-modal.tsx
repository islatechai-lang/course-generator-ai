import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Zap, Cpu, MousePointer2, Video } from "lucide-react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPlan?: "free" | "basic" | "pro";
}

export function UpgradeModal({ open, onOpenChange, currentPlan = "free" }: UpgradeModalProps) {
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<"basic" | "pro" | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setShowCheckout(false);
        }
    }, [open]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) onOpenChange(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onOpenChange]);

    const handleStartCheckout = async (plan: "basic" | "pro") => {
        setIsLoading(plan);
        try {
            const endpoint = plan === "basic" ? "/api/basic/checkout" : "/api/pro/checkout";
            const data = await apiRequest("POST", endpoint);
            if (data.checkoutId) {
                setCheckoutId(data.checkoutId);
                setShowCheckout(true);
            }
        } catch (error) {
            console.error(`[UpgradeModal] ${plan} checkout preparation failed:`, error);
            toast({
                title: "Error",
                description: "Failed to prepare checkout. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(null);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => onOpenChange(false)}
        >
            <div
                className={`w-full max-w-3xl bg-card border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 relative max-h-[95vh] ${showCheckout ? 'overflow-hidden' : 'overflow-y-auto'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-muted-foreground/50 hover:text-foreground z-10 h-8 w-8 rounded-full hover:bg-muted block ml-auto"
                    onClick={() => onOpenChange(false)}
                    style={{ left: 'auto' }}
                >
                    <X className="h-4 w-4" />
                </Button>

                {showCheckout && checkoutId ? (
                    <div className="w-full h-[600px] flex flex-col bg-card">
                        <div className="p-3 border-b flex items-center justify-center bg-muted/30 relative">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Secure Checkout</span>
                        </div>
                        <div className="flex-1 overflow-auto bg-white">
                            <WhopCheckoutEmbed
                                sessionId={checkoutId}
                                returnUrl={window.location.href}
                                onComplete={() => {
                                    toast({
                                        title: "Success!",
                                        description: "Welcome! Your plan is now active.",
                                    });
                                    onOpenChange(false);
                                    window.location.reload();
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-6 md:p-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-xl mb-4">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Upgrade your plan</h2>
                            <p className="text-muted-foreground text-sm mt-1.5 font-medium">Choose the plan that's right for you</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Free Plan */}
                            <div className="flex flex-col p-5 rounded-xl border bg-muted/20">
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Free</h3>
                                    <div className="flex items-baseline gap-1.5 mt-1.5">
                                        <span className="text-3xl font-bold">$0</span>
                                        <span className="text-muted-foreground text-xs font-medium">/month</span>
                                    </div>
                                </div>

                                <ul className="flex-1 space-y-3 mb-8">
                                    <li className="flex items-center gap-2.5 text-xs text-foreground/80 font-medium">
                                        <Check className="h-4 w-4 text-primary/60 shrink-0" />
                                        1 Published Course
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-foreground/80 font-medium">
                                        <Check className="h-4 w-4 text-primary/60 shrink-0" />
                                        1 Lifetime Trial Generation
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-foreground/80 font-medium">
                                        <Check className="h-4 w-4 text-primary/60 shrink-0" />
                                        Magic AI Access (1 Try)
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <X className="h-4 w-4 shrink-0 text-red-500" />
                                        Guided Mode
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <X className="h-4 w-4 shrink-0 text-red-500" />
                                        Direct Video Upload (Embeds Only)
                                    </li>
                                </ul>

                                {currentPlan === "free" ? (
                                    <Button 
                                        variant="outline" 
                                        className="w-full h-10 text-xs font-bold text-muted-foreground bg-muted/40 border-border cursor-default mt-auto pointer-events-none"
                                        disabled
                                    >
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="ghost" 
                                        className="w-full h-10 text-xs font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 transition-colors mt-auto"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Choose plan
                                    </Button>
                                )}
                            </div>

                            {/* Basic Plan */}
                            <div
                                className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 relative group ${hoveredPlan === "basic" ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-blue-500/10' : 'border-blue-500/50 bg-blue-500/5 shadow-lg'}`}
                                onMouseEnter={() => setHoveredPlan("basic")}
                                onMouseLeave={() => setHoveredPlan(null)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl" />
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                    BASIC
                                </div>
                                <div className="mb-4 pt-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">Basic</h3>
                                    </div>
                                    <div className="flex flex-col mt-1.5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-bold text-foreground">$5</span>
                                            <span className="text-muted-foreground text-xs font-semibold">/week</span>
                                        </div>
                                    </div>
                                </div>

                                <ul className="flex-1 space-y-3 mb-8">
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-blue-500">
                                        <Zap className="h-4 w-4 shrink-0" />
                                        3 Published Courses
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-blue-500">
                                        <Check className="h-4 w-4 shrink-0" />
                                        1 Daily Course Generation
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-blue-500">
                                        <Cpu className="h-4 w-4 shrink-0" />
                                        Magic AI
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <X className="h-4 w-4 shrink-0 text-red-500" />
                                        Guided Mode
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-blue-500">
                                        <Video className="h-4 w-4 shrink-0" />
                                        Direct Video Upload (800MB Storage)
                                    </li>
                                </ul>

                                {currentPlan === "basic" ? (
                                    <Button
                                        className="w-full h-11 text-sm font-bold bg-blue-500/20 text-blue-500 border border-blue-500/40 cursor-default mt-auto pointer-events-none"
                                        disabled
                                    >
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full h-11 text-sm font-bold shadow-lg shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] ring-2 ring-blue-500/20 ring-offset-2 mt-auto text-white"
                                        onClick={() => handleStartCheckout("basic")}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === "basic" ? "Loading..." : "Choose plan"}
                                    </Button>
                                )}
                            </div>

                            {/* Pro Plan */}
                            <div
                                className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 relative group ${hoveredPlan === "pro" ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-primary/10' : 'border-primary/50 bg-primary/5 shadow-xl'}`}
                                onMouseEnter={() => setHoveredPlan("pro")}
                                onMouseLeave={() => setHoveredPlan(null)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-2xl" />
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                    PRO
                                </div>
                                <div className="mb-4 pt-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Pro</h3>
                                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                                             50% OFF
                                        </span>
                                    </div>
                                    <div className="flex flex-col mt-1.5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-bold text-foreground">$8</span>
                                            <span className="text-muted-foreground text-xs font-semibold">/week</span>
                                            <span className="text-muted-foreground/60 text-sm line-through ml-1">$16</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1 italic">
                                            <Sparkles className="h-3 w-3" />
                                            Founder's pricing ends soon
                                        </p>
                                    </div>
                                </div>

                                <ul className="flex-1 space-y-3 mb-8">
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-primary">
                                        <Zap className="h-4 w-4 shrink-0" />
                                        10 Published Courses
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-primary">
                                        <Check className="h-4 w-4 shrink-0" />
                                        2 Daily Course Generation
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-primary">
                                        <Cpu className="h-4 w-4 shrink-0" />
                                        Magic AI
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-primary">
                                        <MousePointer2 className="h-4 w-4 shrink-0" />
                                        Guided
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs font-bold text-primary">
                                        <Video className="h-4 w-4 shrink-0" />
                                        Direct Video Upload (2GB Storage)
                                    </li>
                                </ul>

                                {currentPlan === "pro" ? (
                                    <Button
                                        className="w-full h-11 text-sm font-bold bg-primary/20 text-primary border border-primary/40 cursor-default mt-auto pointer-events-none"
                                        disabled
                                    >
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full h-11 text-sm font-bold shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] ring-2 ring-primary/20 ring-offset-2 mt-auto"
                                        onClick={() => handleStartCheckout("pro")}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === "pro" ? "Loading..." : "Choose plan"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <p className="text-center text-[10px] text-muted-foreground mt-8 px-10 leading-relaxed font-medium">
                            Securely processed by Whop. Cancel anytime.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
