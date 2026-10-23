import { Sparkles } from "lucide-react";

export function StudioSkeleton() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 sm:py-20 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Top Floating User Profile Skeleton Only */}
      <div className="absolute top-0 right-0 z-20 p-4 sm:p-6 pointer-events-auto">
        <div className="h-9 w-9 rounded-full bg-muted/60 animate-pulse" />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[250px] sm:h-[320px] bg-[#f85514]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Canvas Skeleton */}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Eyebrow Pill Skeleton */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#f85514]/20 bg-[#f85514]/5 text-[#f85514]/70 text-xs font-semibold shadow-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#f85514]" />
          <div className="h-3 w-32 bg-[#f85514]/20 rounded-full animate-pulse" />
        </div>

        {/* Title Skeletons */}
        <div className="space-y-2.5 flex flex-col items-center">
          <div className="h-8 sm:h-12 w-4/5 max-w-lg rounded-2xl bg-muted/70 animate-pulse" />
          <div className="h-6 sm:h-8 w-2/3 max-w-sm rounded-xl bg-gradient-to-r from-[#f85514]/30 via-orange-500/20 to-amber-500/30 animate-pulse" />
          <div className="h-3.5 w-3/4 max-w-md rounded-md bg-muted/40 animate-pulse mt-2" />
        </div>

        {/* Input Bar Skeleton */}
        <div className="w-full max-w-2xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-card/80 border border-border/60 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2.5 w-full px-3 py-2">
            <div className="h-4 w-4 rounded-md bg-muted/50 shrink-0" />
            <div className="h-4 w-3/4 max-w-sm rounded-md bg-muted/40 animate-pulse" />
          </div>
          <div className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#f85514]/35 animate-pulse shrink-0" />
        </div>

        {/* Starter Cards Skeletons */}
        <div className="space-y-2.5 pt-1">
          <div className="h-3 w-40 rounded bg-muted/40 animate-pulse mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-left">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-border/50 bg-muted/20"
              >
                <div className="h-8 w-8 rounded-lg bg-[#f85514]/15 border border-[#f85514]/20 shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1.5 text-left">
                  <div className="h-3.5 w-32 rounded bg-muted/60 animate-pulse" />
                  <div className="h-2.5 w-44 rounded bg-muted/30 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
