import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, X } from "lucide-react";

interface OnboardingDemoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDemo({ open, onOpenChange, onComplete }: OnboardingDemoProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (open) {
            // Small delay to trigger the animation
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [open]);

    if (!open) return null;

    const handleLetsGo = () => {
        setIsVisible(false);
        // Wait for fade-out animation before calling callbacks
        setTimeout(() => {
            onOpenChange(false);
            onComplete();
        }, 200);
    };

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div
                className={`w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Video Section */}
                <div className="relative w-full aspect-video bg-black">
                    <video
                        src="/course_generator_demo.mp4"
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Bottom Section */}
                <div className="p-8 flex flex-col items-center gap-6 border-t border-border/50">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-xl mb-2">
                            <PlayCircle className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Quick Demo</h2>
                        <p className="text-muted-foreground text-sm max-w-md">
                            See how easily you can generate high-quality courses with AI. Watch the demo to get started!
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full max-w-xs h-12 text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleLetsGo}
                    >
                        Lets go!
                    </Button>
                </div>
            </div>
        </div>
    );
}
