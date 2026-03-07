import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Zap, Cpu, MousePointer2 } from "lucide-react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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

    const handleStartCheckout = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest("POST", "/api/pro/checkout");
            if (data.checkoutId) {
                setCheckoutId(data.checkoutId);
                setShowCheckout(true);
            }
        } catch (error) {
            console.error("[UpgradeModal] Checkout preparation failed:", error);
            toast({
                title: "Error",
                description: "Failed to prepare checkout. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
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
                className={`w-full max-w-2xl bg-card border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 relative max-h-[95vh] ${showCheckout ? 'overflow-hidden' : 'overflow-y-auto'}`}
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
                                        description: "Welcome to Pro!",
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        1 Daily Generation
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <X className="h-4 w-4 shrink-0" />
                                        Magic AI
                                    </li>
                                    <li className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <X className="h-4 w-4 shrink-0" />
                                        Guided Mode
                                    </li>
                                </ul>

                                <Button variant="outline" className="w-full h-10 text-xs font-semibold cursor-default opacity-70 pointer-events-none" disabled>
                                    Current Plan
                                </Button>
                            </div>

                            {/* Pro Plan */}
                            <div
                                className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 relative group ${isHovered ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-primary/10' : 'border-primary/50 bg-primary/5 shadow-xl'}`}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
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
                                            <span className="text-3xl font-bold text-foreground">$20</span>
                                            <span className="text-muted-foreground text-xs font-semibold">/month</span>
                                            <span className="text-muted-foreground/60 text-sm line-through ml-1">$39.99</span>
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
                                </ul>

                                <Button
                                    className="w-full h-10 text-xs font-bold shadow-lg shadow-primary/20"
                                    onClick={handleStartCheckout}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Loading..." : "Upgrade to Pro"}
                                </Button>
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
