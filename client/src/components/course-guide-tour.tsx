import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Eye,
  Layers,
  Settings,
  Send,
  PlusCircle,
  Minimize2,
  Maximize2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  actionHint?: string;
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
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      id: "edit-mode",
      target: '[data-tour="edit-mode-toggle"]',
      title: "1. Switch to Edit Mode",
      description: "By default, you see the student preview. Click 'Edit Mode' in the sidebar footer or top toolbar to start editing lessons, adding modules, and organizing your curriculum.",
      icon: Eye,
      badge: "Essential",
      actionHint: "Click Edit Mode to enable full editing capabilities.",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
    {
      id: "content-blocks",
      target: '[data-tour="lesson-content-area"]',
      title: "2. Edit Content & Add Interactive Blocks",
      description: "Click into any lesson to edit text. Use the Block Toolbar to add rich images, AI voiceovers, code snippets, video embeds, and callout tips.",
      icon: PlusCircle,
      badge: "Interactive Blocks",
      actionHint: "You can format markdown, add custom media, or generate illustrations.",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
        if (!isEditMode) enterEditMode();
      },
    },
    {
      id: "module-quiz",
      target: '[data-tour="sidebar-modules"]',
      title: "3. Organize Modules & Add Quizzes",
      description: "Organize lessons into modules. At the end of each module, you can add interactive quizzes with multiple-choice questions and instant feedback to test student knowledge.",
      icon: Layers,
      badge: "Curriculum",
      actionHint: "Add new modules or customize review quizzes.",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
    {
      id: "settings-pricing",
      target: '[data-tour="sidebar-settings"]',
      title: "4. Set Thumbnail, Theme & Pricing",
      description: "Navigate to Settings to upload or AI-generate a custom cover image, personalize your brand colors, and set your course price or offer it for Free.",
      icon: Settings,
      badge: "Branding & Price",
      actionHint: "Customize course thumbnail and pricing options.",
      onEnter: () => {
        setActiveTab("settings");
      },
    },
    {
      id: "publish-live",
      target: '[data-tour="publish-button"]',
      title: "5. Publish Your Course Live",
      description: "Once your curriculum is ready, hit 'Publish' in the top header. Your course will immediately become accessible to your Whop community and students!",
      icon: Send,
      badge: "Go Live",
      actionHint: "Ready to launch? Toggle Publish when you're set.",
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
      }, 700);
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

  // Update spotlight rect when step changes or window resizes
  const updateSpotlight = useCallback(() => {
    if (!isOpen || isMinimized) {
      setSpotlightRect(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    currentStep.onEnter?.();

    setTimeout(() => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightRect(rect);
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setSpotlightRect(null);
      }
    }, 150);
  }, [isOpen, isMinimized, currentStepIndex, activeTab, isEditMode]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [updateSpotlight]);

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

  const handleOpenStep = (index: number) => {
    setCurrentStepIndex(index);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const currentStep = steps[currentStepIndex];
  const progressPercent = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <>
      {/* 1. Global Spotlight Highlight Box (when Tour is actively open) */}
      <AnimatePresence>
        {isOpen && !isMinimized && spotlightRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[9990] transition-all duration-300 ease-out"
            style={{
              top: Math.max(0, spotlightRect.top - 8),
              left: Math.max(0, spotlightRect.left - 8),
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 25px rgba(99, 102, 241, 0.7)",
              border: "2px solid #818cf8",
            }}
          />
        )}
      </AnimatePresence>

      {/* 2. Floating Bottom-Right Guide Widget */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end">
        <AnimatePresence mode="wait">
          {/* A. Minimized Floating Pill Badge */}
          {isMinimized ? (
            <motion.div
              key="minimized"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="flex items-center gap-2"
            >
              <Button
                onClick={() => {
                  setIsMinimized(false);
                  setIsOpen(true);
                }}
                className="h-11 px-4 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-xl shadow-indigo-500/25 border border-indigo-400/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <span className="text-xs sm:text-sm">Course Setup Guide</span>
                <Badge className="bg-white/20 hover:bg-white/20 text-white text-[11px] px-1.5 py-0 border-0">
                  {completedSteps.length}/{steps.length}
                </Badge>
              </Button>
            </motion.div>
          ) : (
            /* B. Expanded Step-by-Step Card */
            <motion.div
              key="expanded"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-[90vw] sm:w-[380px] bg-card border border-border/80 shadow-2xl rounded-2xl p-5 backdrop-blur-xl flex flex-col gap-4 text-card-foreground"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">Course Creator Tour</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => {
                      setIsMinimized(true);
                      setIsOpen(false);
                    }}
                    title="Minimize"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={handleSkip}
                    title="Close Tour"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Progress</span>
                  <span>{progressPercent}% completed</span>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-muted" />
              </div>

              {/* Active Step Content */}
              <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(currentStep.icon, {
                      className: "h-4 w-4 text-indigo-500 shrink-0",
                    })}
                    <span className="text-xs font-bold text-foreground">
                      {currentStep.title}
                    </span>
                  </div>
                  {currentStep.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                      {currentStep.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>

                {currentStep.actionHint && (
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-lg px-2.5 py-1.5 font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{currentStep.actionHint}</span>
                  </div>
                )}
              </div>

              {/* Step Checklist Navigator */}
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {steps.map((step, idx) => {
                  const isDone = completedSteps.includes(step.id);
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleOpenStep(idx)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                        isCurrent
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/30"
                          : isDone
                          ? "text-muted-foreground hover:bg-muted/60"
                          : "text-muted-foreground/80 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                            isCurrent ? "border-indigo-500 text-indigo-500 font-bold" : "border-muted-foreground/40"
                          }`}>
                            {idx + 1}
                          </div>
                        )}
                        <span className="truncate">{step.title.replace(/^\d+\.\s*/, "")}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-indigo-500 shrink-0">Current</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStepIndex === 0}
                  className="h-8 px-2.5 text-xs text-muted-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    className="h-8 px-3 text-xs"
                  >
                    Skip Tour
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-8 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                  >
                    {currentStepIndex === steps.length - 1 ? (
                      "Complete 🎉"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
