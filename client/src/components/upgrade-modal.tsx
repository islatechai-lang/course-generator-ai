import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutGrid, PenTool, TrendingUp, CheckCircle2 } from "lucide-react";
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
    const [step, setStep] = useState<"intro" | "checkout">("intro");
    const { toast } = useToast();

    console.log("[UpgradeModal] Rendered. open=", open);

    useEffect(() => {
        console.log("[UpgradeModal] Component mounted.");
        return () => console.log("[UpgradeModal] Component unmounted.");
    }, []);

    useEffect(() => {
        // Reset step when modal opens
        if (open) {
            console.log("[UpgradeModal] Modal opened. Resetting step to intro.");
            setStep("intro");
        }
    }, [open]);

    const handleStartUpgrade = async () => {
        console.log("[UpgradeModal] handleStartUpgrade clicked.");
        setStep("checkout");
        if (!checkoutId) {
            console.log("[UpgradeModal] No checkoutId, fetching one...");
            setIsLoading(true);
            try {
                const data = await apiRequest("POST", "/api/pro/checkout");
                console.log("[UpgradeModal] Checkout data received:", data);
                if (data.checkoutId) {
                    setCheckoutId(data.checkoutId);
                }
            } catch (error) {
                console.error("[UpgradeModal] Failed to get checkout ID:", error);
                toast({
                    title: "Upgrade Error",
                    description: "Failed to prepare checkout. Please try again later.",
                    variant: "destructive",
                });
                setStep("intro");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-4 border-red-500 bg-white shadow-2xl z-[9999]">
                <div className="relative bg-white rounded-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                    <div className="md:w-1/2 p-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white flex flex-col justify-between">
                        <div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-white mb-4 leading-tight">
                                    <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                                    Elevate to Pro
                                </DialogTitle>
                                <DialogDescription className="text-indigo-100 text-lg leading-relaxed mb-8">
                                    Unlock the full power of AI and scale your curriculum business to the next level.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-8">
                                <div className="flex items-start gap-4 transform transition-all hover:translate-x-1">
                                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                                        <LayoutGrid className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Publish 10 Courses</p>
                                        <p className="text-indigo-100 text-sm">Scale from 1 to 10 published courses for your students.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 transform transition-all hover:translate-x-1">
                                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">2 Daily AI Generations</p>
                                        <p className="text-indigo-100 text-sm">Create more content every day with boosted AI limits.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 transform transition-all hover:translate-x-1">
                                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                                        <PenTool className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Magic AI & Guided Access</p>
                                        <p className="text-indigo-100 text-sm">Use our most advanced course generation modes.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 transform transition-all hover:translate-x-1">
                                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Premium AI Models</p>
                                        <p className="text-indigo-100 text-sm">Higher quality outputs with our latest engine updates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-10 border-t border-white/20">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">$35.00</span>
                                <span className="text-indigo-200 text-lg font-medium">/ month</span>
                            </div>
                            <p className="text-xs text-indigo-200 mt-2">Cancel anytime. All features unlocked instantly.</p>
                        </div>
                    </div>

                    <div className="md:w-1/2 p-0 flex flex-col items-center justify-center bg-slate-50 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 hover:bg-slate-200 z-10"
                            onClick={() => onOpenChange(false)}
                        >
                            <LayoutGrid className="h-4 w-4 text-slate-400 rotate-45" />
                        </Button>

                        {step === "intro" ? (
                            <div className="p-10 flex flex-col items-center text-center max-w-sm w-full">
                                <div className="h-20 w-20 rounded-3xl bg-indigo-100 flex items-center justify-center mb-8 shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to scale?</h3>
                                <p className="text-slate-600 mb-10 leading-relaxed">
                                    Join other successful creators and unlock your full potential today.
                                </p>
                                <Button
                                    onClick={handleStartUpgrade}
                                    className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                                >
                                    Get Pro Access
                                    <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="mt-6 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="h-14 w-14 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin shadow-lg" />
                                <div className="text-center">
                                    <p className="text-slate-900 font-bold text-lg mb-1">Preparing Checkout</p>
                                    <p className="text-slate-500 text-sm">Securing your custom upgrade link...</p>
                                </div>
                            </div>
                        ) : checkoutId ? (
                            <div className="w-full h-full flex flex-col">
                                <div className="p-4 border-b bg-white flex items-center gap-2">
                                    <button onClick={() => setStep("intro")} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <TrendingUp className="h-4 w-4 rotate-180" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Checkout</span>
                                </div>
                                <div className="flex-1 overflow-auto flex items-center justify-center">
                                    <WhopCheckoutEmbed
                                        checkoutId={checkoutId}
                                        onComplete={() => {
                                            toast({
                                                title: "Upgrade Successful!",
                                                description: "You now have Pro Access. Please refresh the page.",
                                            });
                                            onOpenChange(false);
                                            window.location.reload();
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center max-w-xs">
                                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Checkout Error</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed">We couldn't initialize your secure checkout. This might be a temporary connection issue.</p>
                                <Button variant="outline" onClick={() => window.location.reload()} className="w-full py-6 font-bold">
                                    Try Refreshing Page
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
