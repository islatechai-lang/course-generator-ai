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
            className={`fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '580px',
                    maxHeight: 'calc(100vh - 48px)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#111113',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                className={`transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Video Section */}
                <div style={{ flex: '1 1 auto', minHeight: 0, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video
                        src="/course_generator_demo.mp4"
                        controls
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>

                {/* Bottom Section */}
                <div
                    style={{
                        flexShrink: 0,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        background: 'linear-gradient(to bottom, #151518, #111113)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '5px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                        }}>
                            <PlayCircle style={{ height: '18px', width: '18px', color: '#818cf8' }} />
                        </div>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em', color: '#f0f0f0' }}>
                            Welcome to Whop Course Generator
                        </h2>
                        <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', maxWidth: '340px', lineHeight: 1.5 }}>
                            Watch the quick demo above to see how you can create AI-powered courses in minutes.
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full max-w-xs h-10 text-xs font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleLetsGo}
                    >
                        Let's go!
                    </Button>
                </div>
            </div>
        </div>
    );
}
