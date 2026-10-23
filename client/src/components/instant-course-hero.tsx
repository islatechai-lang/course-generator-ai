import { useState } from "react";
import { Sparkles, ArrowRight, TrendingUp, Zap, DollarSign, Users, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InstantCourseHeroProps {
  onGenerate: (topic: string) => void;
  isGenerating?: boolean;
  onOpenAdvanced?: () => void;
}

const STARTER_CHIPS = [
  {
    icon: TrendingUp,
    label: "Creator Audience & Monetization Playbook",
    topic: "Creator Audience Growth & Monetization Playbook",
  },
  {
    icon: DollarSign,
    label: "Trading & Risk Management Blueprint",
    topic: "Day Trading & Risk Management Blueprint",
  },
  {
    icon: Zap,
    label: "AI Automation & Workflows Masterclass",
    topic: "AI Automation, Agents & Workflows Masterclass",
  },
  {
    icon: Users,
    label: "High-Ticket Client Acquisition Secrets",
    topic: "High-Ticket B2B Client Acquisition System",
  },
];

export function InstantCourseHero({
  onGenerate,
  isGenerating = false,
  onOpenAdvanced,
}: InstantCourseHeroProps) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim() || isGenerating) return;
    onGenerate(topic.trim());
  };

  const handleChipClick = (chipTopic: string) => {
    setTopic(chipTopic);
    onGenerate(chipTopic);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Ambient background glow matching #f85514 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#f85514]/12 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[250px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Top Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#f85514]/30 bg-[#f85514]/10 text-[#f85514] text-xs font-semibold shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Zero Effort • AI Course Studio</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            What do you want to teach{" "}
            <span className="bg-gradient-to-r from-[#f85514] via-orange-500 to-amber-500 bg-clip-text text-transparent">
              your community?
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Enter any topic or tap an idea below. AI instantly creates your complete interactive curriculum, action blueprints, and 24/7 AI Tutor.
          </p>
        </div>

        {/* Hero Input Bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-card/90 dark:bg-[#121316]/90 border border-border/70 shadow-2xl backdrop-blur-xl focus-within:border-[#f85514] focus-within:ring-4 focus-within:ring-[#f85514]/15 transition-all duration-300">
            <div className="flex items-center gap-2.5 w-full px-2 sm:px-3">
              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Scalable Growth Playbook, Trading Mastery, Notion Systems..."
                disabled={isGenerating}
                className="border-0 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 w-full"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!topic.trim() || isGenerating}
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold text-white bg-[#f85514] hover:bg-[#e0480d] shadow-lg shadow-[#f85514]/25 shrink-0 transition-all duration-200 gap-2 text-sm sm:text-base"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Course</span>
              <ArrowRight className="h-4 w-4 ml-0.5 hidden sm:inline" />
            </Button>
          </div>
        </form>

        {/* Starter Topic Chips */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Popular starter templates (tap to generate)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {STARTER_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.topic)}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-[#f85514]/40 hover:text-[#f85514] text-xs sm:text-sm font-medium text-foreground transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5 text-[#f85514]" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternative / Advanced Options link */}
        {onOpenAdvanced && (
          <div className="pt-4">
            <button
              type="button"
              onClick={onOpenAdvanced}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#f85514] transition-colors" />
              <span>Have an existing PDF document or want manual control? <span className="underline font-medium text-foreground">Advanced Options</span></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
