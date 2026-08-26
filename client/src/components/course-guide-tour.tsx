import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Eye,
  Layers,
  Settings,
  Send,
  PlusCircle,
  BookOpen,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  instruction: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
  onEnter?: () => void;
}

interface CourseGuideTourProps {
  courseId: string;
  isEditMode: boolean;
  enterEditMode: () => void;
  activeTab: "content" | "settings" | "students";
  setActiveTab: (tab: "content" | "settings" | "students") => void;
}

export function CourseGuideTour({
  courseId,
  isEditMode,
  enterEditMode,
  activeTab,
  setActiveTab,
}: CourseGuideTourProps) {
  const storageKey = `cursai_course_tour_${courseId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom" | "left" | "right";
  }>({ top: 0, left: 0, placement: "bottom" });

  const steps: TourStep[] = [
    {
      id: "edit-mode",
      target: '[data-tour="edit-mode-toggle"]',
      title: "Switch to Edit Mode",
      instruction: "👉 Click 'Edit Mode' below to enable editing",
      description: "You're currently in preview mode. Entering Edit Mode unlocks editing lesson text, adding modules, and generating AI media.",
      icon: Eye,
      badge: "Step 1",
      preferredPlacement: "top",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
    {
      id: "content-blocks",
      target: '[data-tour="lesson-content-area"]',
      title: "Edit Content & Add Blocks",
      instruction: "✏️ Click into any lesson or block to customize",
      description: "Type directly into lessons or use the Block Toolbar to insert images, AI voiceovers, code blocks, videos, and callouts.",
      icon: PlusCircle,
      badge: "Step 2",
      preferredPlacement: "bottom",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
        if (!isEditMode) enterEditMode();
      },
    },
    {
      id: "module-quiz",
      target: '[data-tour="sidebar-modules"]',
      title: "Modules & Review Quizzes",
      instruction: "📚 Organize lessons & attach module quizzes",
      description: "Structure your curriculum with modules. At the end of each module, you can add interactive quizzes with instant answer feedback.",
      icon: Layers,
      badge: "Step 3",
      preferredPlacement: "right",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
    {
      id: "settings-pricing",
      target: '[data-tour="sidebar-settings"]',
      title: "Thumbnail, Theme & Pricing",
      instruction: "⚙️ Click 'Settings' to customize thumbnail & price",
      description: "Upload or AI-generate a cover thumbnail, customize brand colors, and set course pricing (Free or Paid).",
      icon: Settings,
      badge: "Step 4",
      preferredPlacement: "right",
      onEnter: () => {
        setActiveTab("settings");
      },
    },
    {
      id: "publish-live",
      target: '[data-tour="publish-button"]',
      title: "Publish Your Course Live",
      instruction: "🚀 Click 'Publish' when your course is ready",
      description: "When you're happy with your curriculum, click Publish to immediately make the course available to students on Whop.",
      icon: Send,
      badge: "Final Step",
      preferredPlacement: "bottom",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
  ];

  // Initialize on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setIsMinimized(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
        if (parsed.completedSteps?.length < steps.length) {
          setIsMinimized(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [courseId, storageKey]);

  // Progressive auto-advancement listeners
  // 1. If at Step 0 ("edit-mode") and user enters edit mode, auto-advance to Step 1!
  useEffect(() => {
    if (isOpen && currentStepIndex === 0 && isEditMode) {
      const timer = setTimeout(() => {
        handleNext();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, isOpen, currentStepIndex]);

  // 2. If at Step 3 ("settings-pricing") and user navigates to settings, update target position
  useEffect(() => {
    if (isOpen && currentStepIndex === 3 && activeTab === "settings") {
      updatePosition();
    }
  }, [activeTab, isOpen, currentStepIndex]);

  // Update target rect and popover position
  const updatePosition = useCallback(() => {
    if (!isOpen || isMinimized) {
      setTargetRect(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    currentStep.onEnter?.();

    setTimeout(() => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Smoothly bring element into view if needed
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        const popoverWidth = Math.min(340, window.innerWidth - 32);
        const popoverHeight = 180; // approximate
        let placement = currentStep.preferredPlacement || "bottom";
        let top = 0;
        let left = 0;

        if (placement === "top") {
          top = rect.top - popoverHeight - 16;
          left = rect.left + rect.width / 2 - popoverWidth / 2;
          if (top < 10) {
            placement = "bottom";
            top = rect.bottom + 16;
          }
        } else if (placement === "bottom") {
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - popoverWidth / 2;
          if (top + popoverHeight > window.innerHeight - 10) {
            placement = "top";
            top = rect.top - popoverHeight - 16;
          }
        } else if (placement === "right") {
          left = rect.right + 16;
          top = rect.top + rect.height / 2 - popoverHeight / 2;
          if (left + popoverWidth > window.innerWidth - 10) {
            placement = "bottom";
            top = rect.bottom + 16;
            left = rect.left;
          }
        } else if (placement === "left") {
          left = rect.left - popoverWidth - 16;
          top = rect.top + rect.height / 2 - popoverHeight / 2;
          if (left < 10) {
            placement = "bottom";
            top = rect.bottom + 16;
            left = rect.left;
          }
        }

        // Clamp inside window boundaries
        left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));
        top = Math.max(16, Math.min(window.innerHeight - popoverHeight - 16, top));

        setPopoverPos({ top, left, placement });
      } else {
        setTargetRect(null);
      }
    }, 150);
  }, [isOpen, isMinimized, currentStepIndex, activeTab, isEditMode]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition]);

  const saveProgress = (completed: string[]) => {
    setCompletedSteps(completed);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        completedSteps: completed,
        lastUpdated: new Date().toISOString(),
      })
    );
  };

  const handleNext = () => {
    const currentStep = steps[currentStepIndex];
    const newCompleted = Array.from(new Set([...completedSteps, currentStep.id]));
    saveProgress(newCompleted);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
      setIsMinimized(true);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setIsMinimized(true);
    saveProgress(completedSteps);
  };

  const handleRestartTour = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* 1. Spotlight Outline & Pointer Arrow Attached Directly to Target Element */}
      <AnimatePresence>
        {isOpen && !isMinimized && targetRect && (
          <>
            {/* Spotlight Border Overlay (Passes pointer events so target remains clickable) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed pointer-events-none z-[9990] transition-all duration-200 ease-out"
              style={{
                top: Math.max(0, targetRect.top - 6),
                left: Math.max(0, targetRect.left - 6),
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                borderRadius: "10px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.8)",
                border: "2px solid #818cf8",
              }}
            />

            {/* Pulsing Target Marker Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed pointer-events-none z-[9991] flex items-center justify-center"
              style={{
                top: targetRect.top - 10,
                right: window.innerWidth - targetRect.right - 10,
              }}
            >
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-600 border-2 border-white items-center justify-center text-[10px] text-white font-bold">
                  {currentStepIndex + 1}
                </span>
              </span>
            </motion.div>

            {/* Attached Interactive Tooltip Card */}
            <motion.div
              initial={{ opacity: 0, y: popoverPos.placement === "top" ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: popoverPos.placement === "top" ? 10 : -10 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[9995] w-[calc(100vw-32px)] sm:w-[340px] bg-slate-900/95 dark:bg-slate-900/95 text-slate-50 border border-indigo-500/40 shadow-2xl rounded-2xl p-4 backdrop-blur-xl"
              style={{
                top: popoverPos.top,
                left: popoverPos.left,
              }}
            >
              {/* Pointing Arrow Indicator */}
              <div
                className={`absolute flex items-center justify-center text-indigo-400 ${
                  popoverPos.placement === "top"
                    ? "bottom-[-18px] left-1/2 -translate-x-1/2 animate-bounce"
                    : popoverPos.placement === "bottom"
                    ? "top-[-18px] left-1/2 -translate-x-1/2 animate-bounce"
                    : popoverPos.placement === "right"
                    ? "left-[-18px] top-1/2 -translate-y-1/2"
                    : "right-[-18px] top-1/2 -translate-y-1/2"
                }`}
              >
                {popoverPos.placement === "top" && <ArrowDown className="h-5 w-5 drop-shadow-md stroke-[3]" />}
                {popoverPos.placement === "bottom" && <ArrowUp className="h-5 w-5 drop-shadow-md stroke-[3]" />}
                {popoverPos.placement === "right" && <ArrowLeft className="h-5 w-5 drop-shadow-md stroke-[3]" />}
                {popoverPos.placement === "left" && <ArrowRight className="h-5 w-5 drop-shadow-md stroke-[3]" />}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-500/30 text-indigo-300 border-indigo-500/40 text-[10px] px-2 py-0 font-bold uppercase tracking-wider">
                    {currentStep.badge || `Step ${currentStepIndex + 1} of ${steps.length}`}
                  </Badge>
                  <span className="text-xs font-bold text-slate-100">{currentStep.title}</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800"
                  title="Close Guide"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action Instruction Callout */}
              <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-200 mb-2">
                {currentStep.instruction}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
                {currentStep.description}
              </p>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStepIndex
                          ? "w-4 bg-indigo-400"
                          : completedSteps.includes(steps[i].id)
                          ? "w-1.5 bg-green-400"
                          : "w-1.5 bg-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentStepIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-3 w-3 mr-0.5" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-7 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                  >
                    {currentStepIndex === steps.length - 1 ? (
                      "Finish 🎉"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Docked Bottom-Right Trigger Pill (Only visible when Tour is minimized / closed) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-[9999]"
          >
            <Button
              onClick={() => {
                setIsMinimized(false);
                setIsOpen(true);
              }}
              className="h-10 px-3.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-semibold shadow-xl shadow-indigo-500/20 border border-indigo-500/40 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Course Setup Guide</span>
              <Badge className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0 border border-indigo-500/40">
                {completedSteps.length}/{steps.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
