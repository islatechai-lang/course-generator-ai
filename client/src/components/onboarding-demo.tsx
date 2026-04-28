import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface OnboardingDemoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDemo({ open, onOpenChange, onComplete }: OnboardingDemoProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl">
                <div className="relative w-full aspect-video group">
                    <video 
                        src="/course_generator_demo.mp4" 
                        controls 
                        autoPlay 
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="p-8 bg-card flex flex-col items-center gap-6 border-t border-border/50">
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
                        onClick={() => {
                            onOpenChange(false);
                            onComplete();
                        }}
                    >
                        Lets go!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
