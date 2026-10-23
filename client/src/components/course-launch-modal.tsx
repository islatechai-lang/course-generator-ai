import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Rocket,
  Edit3,
  BookOpen,
  Bot,
  DollarSign,
  Gift,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Layers,
} from "lucide-react";

export interface LaunchCourseData {
  id: string;
  title: string;
  moduleCount: number;
  lessonCount: number;
  coverImage?: string | null;
  isFree?: boolean;
  price?: string;
  published?: boolean;
}

interface CourseLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: LaunchCourseData | null;
  onPublish: (options: { isFree: boolean; price: string }) => Promise<void> | void;
  onEdit: () => void;
  onLater: () => void;
  isPublishing?: boolean;
}

const PRESET_PRICES = ["19", "29", "49", "99"];

export function CourseLaunchModal({
  open,
  onOpenChange,
  course,
  onPublish,
  onEdit,
  onLater,
  isPublishing = false,
}: CourseLaunchModalProps) {
  const [monetizationType, setMonetizationType] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("49");

  useEffect(() => {
    if (open) {
      // Trigger joyful celebratory confetti
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#f85514", "#ff7a3d", "#f59e0b", "#10b981", "#ffffff"],
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 50,
          origin: { x: 0.05, y: 0.6 },
          colors: ["#f85514", "#ff7a3d", "#f59e0b"],
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 50,
          origin: { x: 0.95, y: 0.6 },
          colors: ["#f85514", "#ff7a3d", "#10b981"],
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!course) return null;

  const handlePublishClick = async () => {
    await onPublish({
      isFree: monetizationType === "free",
      price: monetizationType === "free" ? "0" : price || "49",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-[500px] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card dark:bg-[#111215] shadow-2xl">
        {/* Glowing Banner Header */}
        <div className="relative px-5 py-5 sm:py-6 text-center overflow-hidden bg-gradient-to-b from-[#f85514]/15 via-orange-500/5 to-transparent border-b border-border/50 shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#f85514]/20 blur-2xl rounded-full pointer-events-none" />

          {/* Celebration Icon Pill */}
          <div className="inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-[#f85514] to-amber-500 text-white shadow-lg shadow-[#f85514]/30 mb-2.5 sm:mb-3 animate-in zoom-in-75 duration-300">
            <Rocket className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <DialogHeader className="space-y-1 text-center">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Your Course is Ready!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto leading-normal">
              AI generated your complete curriculum, interactive lessons, and 24/7 AI Tutor.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Course Summary Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/30">
            <div className="h-14 w-20 sm:h-16 sm:w-24 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50 relative shadow-sm">
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white/50">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 leading-snug">
                {course.title}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-semibold text-foreground/80">
                  {course.moduleCount} Modules
                </span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px] font-semibold text-foreground/80">
                  {course.lessonCount} Lessons
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f85514]/10 text-[#f85514] text-[10px] sm:text-[11px] font-bold border border-[#f85514]/20">
                  <Bot className="h-3 w-3" /> AI Tutor
                </span>
              </div>
            </div>
          </div>

          {/* Monetization / Access Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Community Access
              </label>
              <span className="text-[11px] text-muted-foreground">You can change this anytime</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Free Option */}
              <button
                type="button"
                onClick={() => setMonetizationType("free")}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all relative ${
                  monetizationType === "free"
                    ? "border-[#f85514] bg-[#f85514]/10 ring-1 ring-[#f85514]/30 shadow-sm"
                    : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Gift className={`h-4 w-4 ${monetizationType === "free" ? "text-[#f85514]" : "text-muted-foreground"}`} />
                  {monetizationType === "free" ? (
                    <div className="h-4 w-4 rounded-full bg-[#f85514] text-white flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-foreground">Free for Members</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  Instant access for all community members
                </div>
              </button>

              {/* Paid Option */}
              <button
                type="button"
                onClick={() => setMonetizationType("paid")}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all relative ${
                  monetizationType === "paid"
                    ? "border-[#f85514] bg-[#f85514]/10 ring-1 ring-[#f85514]/30 shadow-sm"
                    : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <DollarSign className={`h-4 w-4 ${monetizationType === "paid" ? "text-[#f85514]" : "text-muted-foreground"}`} />
                  {monetizationType === "paid" ? (
                    <div className="h-4 w-4 rounded-full bg-[#f85514] text-white flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-foreground">Paid Course</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  Charge members to unlock access
                </div>
              </button>
            </div>

            {/* Price setting when paid */}
            {monetizationType === "paid" && (
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Course Price (USD)</span>
                  <div className="flex items-center gap-1">
                    {PRESET_PRICES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrice(preset)}
                        className={`px-2 py-0.5 text-xs rounded-md font-semibold border transition-all ${
                          price === preset
                            ? "bg-[#f85514] text-white border-[#f85514]"
                            : "bg-card text-muted-foreground border-border/70 hover:border-foreground"
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                    $
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-7 h-10 text-sm font-bold bg-background"
                    placeholder="49"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <Button
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="w-full h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base text-white bg-[#f85514] hover:bg-[#e0480d] shadow-lg shadow-[#f85514]/25 gap-2 active:scale-[0.99] transition-all"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing to Community...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Publish to Community Now</span>
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                onClick={onEdit}
                disabled={isPublishing}
                className="w-full sm:w-auto flex-1 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5 border-border/70 hover:border-[#f85514]/50 hover:text-[#f85514]"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Customize in Studio</span>
              </Button>

              <button
                type="button"
                onClick={onLater}
                disabled={isPublishing}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground py-2 px-3 text-center transition-colors font-medium"
              >
                I'll do this later
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
