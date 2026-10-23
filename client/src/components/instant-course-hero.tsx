import { useState, useRef } from "react";
import { Sparkles, ArrowRight, TrendingUp, Zap, DollarSign, Users, BookOpen, Layers, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InstantCourseHeroProps {
  onGenerate: (topic: string) => void;
  isGenerating?: boolean;
  onOpenAdvanced?: () => void;
  topRight?: React.ReactNode;
  topLeft?: React.ReactNode;
}

const STARTER_CHIPS = [
  {
    icon: TrendingUp,
    label: "Creator Audience Growth",
    description: "Monetization & audience playbook",
    prompt: "Generate a Creator Audience Growth & Monetization Playbook course",
  },
  {
    icon: DollarSign,
    label: "Day Trading Blueprint",
    description: "Risk management & strategies",
    prompt: "Generate a Day Trading & Risk Management Blueprint course",
  },
  {
    icon: Zap,
    label: "AI Automation & Systems",
    description: "Agents & modern workflows",
    prompt: "Generate an AI Automation, Agents & Workflows Masterclass course",
  },
  {
    icon: Users,
    label: "Client Acquisition Secrets",
    description: "High-ticket sales & outreach",
    prompt: "Generate a High-Ticket B2B Client Acquisition System course",
  },
];

export function InstantCourseHero({
  onGenerate,
  isGenerating = false,
  onOpenAdvanced,
  topRight,
  topLeft,
}: InstantCourseHeroProps) {
  const [topic, setTopic] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim() || isGenerating) return;
    onGenerate(topic.trim());
  };

  const handleChipClick = (promptText: string) => {
    setTopic(promptText);
    // Focus the input field and position cursor
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20 overflow-hidden bg-background">
      {/* Top Floating Header with Logo on Left and User Profile on Right (No harsh borders) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3.5 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {topLeft || (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-md border border-white/10 shrink-0 bg-black">
                <img src="/app_logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-bold text-sm sm:text-base text-foreground hidden sm:inline tracking-tight">
                Course Generator AI
              </span>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {topRight}
        </div>
      </div>

      {/* Ambient background glow matching #f85514 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[250px] sm:h-[350px] bg-[#f85514]/12 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[250px] sm:w-[350px] h-[180px] sm:h-[250px] bg-amber-500/10 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* Top Eyebrow Pill */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#f85514]/30 bg-[#f85514]/10 text-[#f85514] text-[11px] sm:text-xs font-bold shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
          <span>Zero Effort • AI Course Studio</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-2 sm:space-y-3 px-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.2]">
            What do you want to teach{" "}
            <span className="bg-gradient-to-r from-[#f85514] via-orange-500 to-amber-500 bg-clip-text text-transparent">
              your community?
            </span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Type any command or tap an idea below. AI instantly creates your complete interactive curriculum, action blueprints, and 24/7 AI Tutor.
          </p>
        </div>

        {/* Hero Input Bar */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-card/90 dark:bg-[#121316]/90 border border-border/70 shadow-xl backdrop-blur-xl focus-within:border-[#f85514] focus-within:ring-4 focus-within:ring-[#f85514]/15 transition-all duration-300">
            <div className="flex items-center gap-2.5 w-full px-2 sm:px-3">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Generate a course on Scalable Creator Growth, Crypto Trading..."
                disabled={isGenerating}
                className="border-0 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 w-full font-medium"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!topic.trim() || isGenerating}
              className="w-full sm:w-auto h-11 px-5 sm:px-6 rounded-xl font-bold text-white bg-[#f85514] hover:bg-[#e0480d] shadow-lg shadow-[#f85514]/25 shrink-0 transition-all duration-200 gap-2 text-xs sm:text-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Course</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5 hidden sm:inline" />
            </Button>
          </div>
        </form>

        {/* Starter Topic Cards Grid */}
        <div className="space-y-2.5 pt-1">
          <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
            Popular starter topics (tap to insert AI prompt)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {STARTER_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const isSelected = topic === chip.prompt;

              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  disabled={isGenerating}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border text-left text-start transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 group relative w-full ${
                    isSelected
                      ? "border-[#f85514] bg-[#f85514]/10 ring-1 ring-[#f85514]/30 shadow-md"
                      : "border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-[#f85514]/40 text-foreground"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-[#f85514] text-white border-[#f85514]"
                      : "bg-[#f85514]/10 text-[#f85514] border-[#f85514]/20"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-left text-start">
                    <div className="flex items-center justify-between gap-1 text-left text-start">
                      <span className={`text-xs sm:text-sm font-bold truncate text-left text-start transition-colors ${
                        isSelected ? "text-[#f85514]" : "text-foreground group-hover:text-[#f85514]"
                      }`}>
                        {chip.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#f85514] shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate text-left text-start block mt-0.5">
                      {chip.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternative / Advanced Options link */}
        {onOpenAdvanced && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAdvanced}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#f85514] transition-colors" />
              <span>Have an existing PDF document or want manual control? <span className="underline font-semibold text-foreground">Advanced Options</span></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
