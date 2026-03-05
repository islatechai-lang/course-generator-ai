import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Shield, Zap, Globe } from "lucide-react";
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
    const { toast } = useToast();

    useEffect(() => {
        console.log("[UpgradeModal] Prop 'open' changed to:", open);
        if (open) {
            console.log("[UpgradeModal] Modal is officially OPEN (No-Portal Mode)");
            setShowCheckout(false); // Reset to comparison view when opened
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
        console.log("[UpgradeModal] Starting checkout process...");
        setIsLoading(true);
        try {
            const data = await apiRequest("POST", "/api/pro/checkout");
            console.log("[UpgradeModal] Checkout response:", data);
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
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => onOpenChange(false)}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10"
                    onClick={() => onOpenChange(false)}
                >
                    <X className="h-5 w-5" />
                </Button>

                {showCheckout && checkoutId ? (
                    <div className="w-full h-[650px] flex flex-col bg-white">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCheckout(false)}
                                className="text-slate-500 hover:text-indigo-600"
                            >
                                ← Back to Plans
                            </Button>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secure Payment</span>
                            <div className="w-20" /> {/* Spacer */}
                        </div>
                        <div className="flex-1 overflow-auto">
                            <WhopCheckoutEmbed
                                checkoutId={checkoutId}
                                onComplete={() => {
                                    toast({
                                        title: "Success!",
                                        description: "Welcome to Pro! Refreshing...",
                                    });
                                    onOpenChange(false);
                                    window.location.reload();
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row min-h-[550px]">
                        {/* Comparison Sidebar / Info */}
                        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between">
                            <div>
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Join the elite creators using Cursai to scale their education business.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Shield className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <span>Unlimited Potential</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Zap className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <span>Instant Activation</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Globe className="h-3.5 w-3.5 text-indigo-400" />
                                        </div>
                                        <span>Global Reaching</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <p className="text-xs text-slate-500">
                                    Trusted by 500+ creators worldwide.
                                </p>
                            </div>
                        </div>

                        {/* Main Comparison Area */}
                        <div className="md:w-2/3 p-8 md:p-12 bg-white flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-8 mb-10">
                                {/* Free Plan */}
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h3 className="font-bold text-slate-900 mb-1">Free Plan</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-2xl font-black text-slate-900">$0</span>
                                        <span className="text-slate-500 text-xs">/mo</span>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-xs text-slate-600">
                                            <Check className="h-3.5 w-3.5 text-emerald-500" /> 1 Published Course
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-slate-600">
                                            <Check className="h-3.5 w-3.5 text-emerald-500" /> Basic AI Access
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-slate-400">
                                            <X className="h-3.5 w-3.5" /> No Pro Collections
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-slate-400">
                                            <X className="h-3.5 w-3.5" /> Normal AI Priority
                                        </li>
                                    </ul>
                                </div>

                                {/* Pro Plan */}
                                <div className="p-6 rounded-2xl bg-indigo-50 border-2 border-indigo-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                        Recommended
                                    </div>
                                    <h3 className="font-bold text-indigo-900 mb-1">Pro Plan</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-2xl font-black text-indigo-900">$35</span>
                                        <span className="text-indigo-600/60 text-xs">/mo</span>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
                                            <Check className="h-3.5 w-3.5 text-indigo-600" /> 10 Published Courses
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
                                            <Check className="h-3.5 w-3.5 text-indigo-600" /> Priority AI Access
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
                                            <Check className="h-3.5 w-3.5 text-indigo-600" /> Advanced Logic Modes
                                        </li>
                                        <li className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
                                            <Check className="h-3.5 w-3.5 text-indigo-600" /> Guided Generations
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    onClick={handleStartCheckout}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            Upgrade My Account Now
                                            <Sparkles className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 px-8">
                                    Payment processed securely by Whop. Cancel anytime with one click.
                                    Subscription unlocks features for all your experiences.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
