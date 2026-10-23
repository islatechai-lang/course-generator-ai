import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Zap, CheckCircle2, Circle, Loader2, Search, Layout, PenTool, Sparkles } from "lucide-react";

interface GenerationProgressProps {
  topic: string;
  isComplete?: boolean;
  statusText?: string;
}

const steps = [
  {
    id: "init",
    label: "Analyzing your vision",
    description: "Processing topic and setting AI parameters...",
    icon: Zap,
  },
  {
    id: "research",
    label: "Magic AI Research",
    description: "Gathering latest insights and curriculum structure...",
    icon: Search,
  },
  {
    id: "outline",
    label: "Architecting Course Flow",
    description: "Designing modules, lessons, and learning objectives...",
    icon: Layout,
  },
  {
    id: "visuals",
    label: "Designing Course Visuals",
    description: "Generating high-converting thumbnail & visual cover...",
    icon: PenTool,
  },
  {
    id: "final",
    label: "Polishing & Finalizing",
    description: "Finalizing curriculum ready for preview...",
    icon: Sparkles,
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
        // Smooth progression: approaches 95% over ~35s
        newProgress = 100 * (1 - Math.exp(-seconds / 22));
        newProgress = Math.min(96, newProgress);
      }
      
      setProgress((prev) => (isComplete ? 100 : Math.max(prev, newProgress)));

      const stepThreshold = 100 / steps.length;
      const currentStep = Math.min(
        Math.floor((isComplete ? 100 : newProgress) / stepThreshold),
        steps.length - 1
      );
      setActiveStepIndex(isComplete ? steps.length - 1 : currentStep);
    }, 150);

    return () => clearInterval(updateInterval);
  }, [isComplete]);

  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-2xl bg-card/90 dark:bg-[#0d0e12]/90 backdrop-blur-2xl p-0 rounded-2xl sm:rounded-3xl">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f85514] via-orange-500 to-amber-500" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#f85514]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative p-4 sm:p-7 md:p-8 space-y-5 sm:space-y-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#f85514] animate-pulse shrink-0" />
              <span>Creating your curriculum</span>
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md line-clamp-2">
              Magic AI is building a masterclass for{" "}
              <span className="font-bold text-foreground bg-[#f85514]/10 text-[#f85514] px-2 py-0.5 rounded-md border border-[#f85514]/20 inline-block mt-0.5">
                {topic}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums drop-shadow-sm">
              {Math.round(progress)}%
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#f85514] animate-pulse">
              System Active
            </div>
          </div>
        </div>

        {/* Improved Progress Bar */}
        <div className="relative h-2.5 sm:h-3 bg-muted rounded-full p-0.5 overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-[#f85514] via-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out relative group"
            style={{ width: `${progress}%` }}
          >
            {/* Glowing trail effect */}
            <div className="absolute top-0 right-0 h-full w-8 bg-white/30 blur-md -mr-4 rounded-full" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:50px_50px] animate-[shimmer_2s_infinite_linear]" />
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5 mt-4 sm:mt-6">
          {steps.map((step, index) => {
            const isFinished = isComplete || index < activeStepIndex;
            const isActive = !isComplete && index === activeStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 border ${
                  isActive 
                    ? "bg-muted/60 border-border shadow-md scale-[1.01]" 
                    : isFinished 
                    ? "opacity-80 border-transparent bg-muted/20" 
                    : "opacity-40 border-transparent"
                }`}
              >
                <div className="relative">
                  <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isFinished ? "bg-green-500/20 text-green-600 dark:text-green-400" : 
                    isActive ? "bg-[#f85514] text-white shadow-[0_0_15px_rgba(248,85,20,0.5)] animate-pulse" : 
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isFinished ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : isActive ? (
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Circle className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 bg-[#f85514]/20 rounded-xl blur-md animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-xs sm:text-sm transition-colors duration-300 ${
                      isActive ? "text-foreground" : isFinished ? "text-foreground/80" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-[#f85514] flex items-center gap-1 uppercase tracking-wider shrink-0">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] sm:text-xs truncate transition-colors duration-300 mt-0.5 ${
                    isActive ? "text-muted-foreground" : isFinished ? "text-muted-foreground/80" : "text-muted-foreground/60"
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
