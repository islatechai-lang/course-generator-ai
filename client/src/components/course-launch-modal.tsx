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
import { Badge } from "@/components/ui/badge";
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
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#f85514", "#ff7a3d", "#f59e0b", "#10b981", "#ffffff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#f85514", "#ff7a3d", "#f59e0b"],
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#f85514", "#ff7a3d", "#10b981"],
        });
      }, 250);
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
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/60 bg-card dark:bg-[#121316] shadow-2xl">
        {/* Glowing Banner Header */}
        <div className="relative p-6 pt-7 text-center overflow-hidden bg-gradient-to-b from-[#f85514]/15 via-orange-500/5 to-transparent border-b border-border/50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#f85514]/20 blur-2xl rounded-full pointer-events-none" />

          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#f85514] to-amber-500 text-white shadow-lg shadow-[#f85514]/30 mb-3 animate-in zoom-in-75 duration-300">
            <Rocket className="h-7 w-7" />
          </div>

          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Your Course is Ready!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              AI built your masterclass curriculum, practical blueprints, and 24/7 AI Tutor.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Course Summary Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl border border-border/60 bg-muted/30">
            <div className="h-16 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50 relative">
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white/50">
                  <BookOpen className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {course.title}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span>{course.moduleCount} Modules</span>
                <span>•</span>
                <span>{course.lessonCount} Lessons</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[#f85514] font-medium">
                  <Bot className="h-3 w-3" /> AI Tutor Active
                </span>
              </div>
            </div>
          </div>

          {/* Monetization / Access Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Choose Community Access
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMonetizationType("free")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  monetizationType === "free"
                    ? "border-[#f85514] bg-[#f85514]/10 shadow-sm"
                    : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Gift className={`h-4 w-4 ${monetizationType === "free" ? "text-[#f85514]" : "text-muted-foreground"}`} />
                  {monetizationType === "free" && <CheckCircle2 className="h-4 w-4 text-[#f85514]" />}
                </div>
                <div className="font-semibold text-xs sm:text-sm text-foreground">Free for Members</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Instant value for your community</div>
              </button>

              <button
                type="button"
                onClick={() => setMonetizationType("paid")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  monetizationType === "paid"
                    ? "border-[#f85514] bg-[#f85514]/10 shadow-sm"
                    : "border-border/60 hover:border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <DollarSign className={`h-4 w-4 ${monetizationType === "paid" ? "text-[#f85514]" : "text-muted-foreground"}`} />
                  {monetizationType === "paid" && <CheckCircle2 className="h-4 w-4 text-[#f85514]" />}
                </div>
                <div className="font-semibold text-xs sm:text-sm text-foreground">Paid Course</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Monetize access directly</div>
              </button>
            </div>

            {monetizationType === "paid" && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                <span className="text-xs font-medium text-muted-foreground">Price (USD):</span>
                <div className="relative flex-1 max-w-[130px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                    $
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-7 h-9 text-sm font-semibold"
                    placeholder="49"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <Button
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="w-full h-11 rounded-xl font-semibold text-white bg-[#f85514] hover:bg-[#e0480d] shadow-lg shadow-[#f85514]/25 gap-2 text-sm sm:text-base transition-all"
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

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                onClick={onEdit}
                disabled={isPublishing}
                className="flex-1 h-9 rounded-lg text-xs font-medium gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Customize in Studio</span>
              </Button>

              <button
                type="button"
                onClick={onLater}
                disabled={isPublishing}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
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
