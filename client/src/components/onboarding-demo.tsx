import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface OnboardingDemoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDemo({ open, onOpenChange, onComplete }: OnboardingDemoProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [open]);

    if (!open) return null;

    const handleLetsGo = () => {
        setIsVisible(false);
        setTimeout(() => {
            onOpenChange(false);
            onComplete();
        }, 200);
    };

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    margin: '16px',
                    maxHeight: 'calc(100vh - 32px)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
                className={`bg-card transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Video Section - scrollable if needed */}
                <div style={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0 }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', backgroundColor: '#000' }}>
                        <video
                            src="/course_generator_demo.mp4"
                            controls
                            autoPlay
                            playsInline
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                </div>

                {/* Bottom Section - always visible */}
                <div
                    style={{
                        flexShrink: 0,
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        borderTop: '1px solid hsl(var(--border) / 0.5)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div className="inline-flex items-center justify-center p-1.5 bg-primary/10 rounded-lg mb-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">Welcome to Cursai!</h2>
                        <p className="text-muted-foreground text-xs mt-1 max-w-sm">
                            Watch the quick demo above to see how you can create AI-powered courses in minutes.
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full max-w-xs h-11 text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleLetsGo}
                    >
                        Let's go!
                    </Button>
                </div>
            </div>
        </div>
    );
}
