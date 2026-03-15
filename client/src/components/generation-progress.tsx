import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Zap, CheckCircle2, Circle, Loader2, Search, Layout, BookOpen, PenTool, Sparkles } from "lucide-react";

interface GenerationProgressProps {
  topic: string;
  isComplete?: boolean;
}

const steps = [
  {
    id: "init",
    label: "Analyzing your vision",
    description: "Processing topic and setting AI parameters...",
    icon: Zap,
    duration: 15,
  },
  {
    id: "research",
    label: "Magic AI Research",
    description: "Gathering latest insights and cross-referencing...",
    icon: Search,
    duration: 25,
  },
  {
    id: "outline",
    label: "Architecting Course Flow",
    description: "Designing modules and learning objectives...",
    icon: Layout,
    duration: 20,
  },
  {
    id: "content",
    label: "Crafting Comprehensive Content",
    description: "Generating detailed lessons and examples...",
    icon: BookOpen,
    duration: 30,
  },
  {
    id: "final",
    label: "Polishing & Finalizing",
    description: "Reviewing curriculum for quality and tone...",
    icon: Sparkles,
    duration: 10,
  },
];

export function GenerationProgress({ topic, isComplete = false }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      let newProgress: number;
      
      if (isComplete) {
        newProgress = 100;
        setActiveStepIndex(steps.length - 1);
      } else {
        const seconds = elapsed / 1000;
        // Exponential approach to 98%
        newProgress = 100 * (1 - Math.exp(-seconds / 25));
        newProgress = Math.min(98, newProgress);
      }
      
      setProgress(newProgress);

      // Determine active step based on progress
      // We divide 100% by number of steps for a rough estimate
      const stepThreshold = 100 / steps.length;
      const currentStep = Math.min(
        Math.floor(newProgress / stepThreshold),
        steps.length - 1
      );
      setActiveStepIndex(currentStep);
    }, 200);

    return () => clearInterval(updateInterval);
  }, [isComplete]);

  return (
    <Card className="relative overflow-hidden border border-border/50 shadow-2xl bg-card/80 dark:bg-[#0d0e12]/80 backdrop-blur-2xl p-0" style={{ borderRadius: '24px' }}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
              Creating your curriculum
            </h3>
            <p className="text-muted-foreground text-base max-w-md">
              Our Magic AI is building a masterclass for{" "}
              <span className="font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {topic}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-3xl font-black text-foreground tabular-nums drop-shadow-sm">
              {Math.round(progress)}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
              System Active
            </div>
          </div>
        </div>

        {/* Improved Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full p-0.5 overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative group"
            style={{ width: `${progress}%` }}
          >
            {/* Glowing trail effect */}
            <div className="absolute top-0 right-0 h-full w-8 bg-white/30 blur-md -mr-4 rounded-full" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:50px_50px] animate-[shimmer_2s_infinite_linear]" />
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          {steps.map((step, index) => {
            const isFinished = isComplete || index < activeStepIndex;
            const isActive = !isComplete && index === activeStepIndex;
            const isWaiting = !isComplete && index > activeStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${
                  isActive 
                    ? "bg-muted/50 border-border shadow-lg scale-[1.02]" 
                    : isFinished 
                    ? "opacity-80 border-transparent" 
                    : "opacity-40 border-transparent"
                }`}
              >
                <div className="relative">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isFinished ? "bg-green-500/20 text-green-600 dark:text-green-400" : 
                    isActive ? "bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" : 
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isFinished ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isActive ? (
                      <step.icon className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold text-base transition-colors duration-500 ${
                      isActive ? "text-foreground" : isFinished ? "text-foreground/70" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-tighter">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate transition-colors duration-500 ${
                    isActive ? "text-muted-foreground" : isFinished ? "text-muted-foreground/80" : "text-muted-foreground/60"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Scanning educational benchmarks...</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              AI Engine: V3-Optimized
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
