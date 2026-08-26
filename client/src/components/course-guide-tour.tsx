import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  X,
  CheckCircle2,
  Eye,
  Settings,
  Send,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TourStep {
  id: string;
  target: string;
  fallbackTarget?: string;
  title: string;
  instruction: string;
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
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    arrowOffset: number;
    placement: "top" | "bottom" | "left" | "right";
  }>({ top: 0, left: 0, arrowOffset: 160, placement: "bottom" });

  const steps: TourStep[] = [
    {
      id: "edit-mode",
      target: '[data-tour="edit-mode-toggle"]',
      title: "1. Switch to Edit Mode",
      instruction: "👉 Click 'Edit Mode' below to start editing",
      icon: Eye,
      badge: "Step 1",
      preferredPlacement: "top",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
    {
      id: "content-blocks",
      target: '[data-tour="add-block-button"]',
      fallbackTarget: '[data-tour="lesson-content-area"]',
      title: "2. Add Content Block (+)",
      instruction: "👉 Click the '+' button to insert text, image or videos blocks",
      icon: PlusCircle,
      badge: "Step 2",
      preferredPlacement: "bottom",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
        if (!isEditMode) enterEditMode();
      },
    },
    {
      id: "settings-pricing",
      target: '[data-tour="sidebar-settings"]',
      title: "3. Thumbnail & Pricing",
      instruction: "👉 Click 'Settings' to edit course price, thumbnail etc",
      icon: Settings,
      badge: "Step 3",
      preferredPlacement: "right",
      onEnter: () => {
        setActiveTab("settings");
      },
    },
    {
      id: "publish-live",
      target: '[data-tour="publish-button"]',
      title: "4. Publish Your Course Live",
      instruction: "👉 Click 'Publish' to make your course live for students",
      icon: Send,
      badge: "Step 4",
      preferredPlacement: "bottom",
      onEnter: () => {
        if (activeTab !== "content") setActiveTab("content");
      },
    },
  ];

  // Expose global console helper for easy testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).resetGuide = () => {
        localStorage.removeItem(storageKey);
        console.log("Guide tour reset! Reloading page...");
        window.location.reload();
      };
      (window as any).resetTour = (window as any).resetGuide;
    }
  }, [storageKey]);

  // Initialize on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setIsOpen(true);
      setIsMinimized(false);
      setIsCompleted(false);
    } else {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
        if (parsed.isCompleted || parsed.completedSteps?.length >= steps.length) {
          setIsCompleted(true);
          setIsMinimized(false);
          setIsOpen(false);
        } else {
          // Incomplete progress - start the guide immediately!
          setIsOpen(true);
          setIsMinimized(false);
          setIsCompleted(false);
        }
      } catch (e) {
        setIsOpen(true);
        setIsMinimized(false);
      }
    }
  }, [courseId, storageKey]);

  // Progressive auto-advancement event listeners
  // 1. If at Step 0 ("edit-mode") and user enters edit mode, auto-advance to Step 1!
  useEffect(() => {
    if (isOpen && currentStepIndex === 0 && isEditMode) {
      const timer = setTimeout(() => {
        handleNext();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, isOpen, currentStepIndex]);

  // 2. If at Step 1 ("content-blocks") and user adds a block, auto-advance to Step 2!
  useEffect(() => {
    const handleBlockAdded = () => {
      if (isOpen && currentStepIndex === 1) {
        handleNext();
      }
    };
    window.addEventListener("tour-block-added", handleBlockAdded);
    return () => window.removeEventListener("tour-block-added", handleBlockAdded);
  }, [isOpen, currentStepIndex]);

  // 3. If at Step 2 ("settings-pricing") and user clicks settings tab, recalculate placement
  useEffect(() => {
    if (isOpen && currentStepIndex === 2 && activeTab === "settings") {
      updatePosition();
    }
  }, [activeTab, isOpen, currentStepIndex]);

  // Update target rect and compute precise arrow and popover coordinates
  const updatePosition = useCallback(() => {
    if (!isOpen || isMinimized) {
      setTargetRect(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    currentStep.onEnter?.();

    setTimeout(() => {
      let el = document.querySelector(currentStep.target);
      if (!el && currentStep.fallbackTarget) {
        el = document.querySelector(currentStep.fallbackTarget);
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Smoothly bring element into view if needed
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        const popoverWidth = Math.min(320, window.innerWidth - 32);
        const popoverHeight = 140;
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        let placement = currentStep.preferredPlacement || "bottom";
        let top = 0;
        let left = 0;
        let arrowOffset = popoverWidth / 2;

        if (placement === "top") {
          top = rect.top - popoverHeight - 14;
          left = targetCenterX - popoverWidth / 2;
          if (top < 10) {
            placement = "bottom";
            top = rect.bottom + 14;
          }
        } else if (placement === "bottom") {
          top = rect.bottom + 14;
          left = targetCenterX - popoverWidth / 2;
          if (top + popoverHeight > window.innerHeight - 10) {
            placement = "top";
            top = rect.top - popoverHeight - 14;
          }
        } else if (placement === "right") {
          left = rect.right + 14;
          top = targetCenterY - popoverHeight / 2;
          if (left + popoverWidth > window.innerWidth - 10) {
            placement = "bottom";
            top = rect.bottom + 14;
            left = targetCenterX - popoverWidth / 2;
          }
        } else if (placement === "left") {
          left = rect.left - popoverWidth - 14;
          top = targetCenterY - popoverHeight / 2;
          if (left < 10) {
            placement = "bottom";
            top = rect.bottom + 14;
            left = targetCenterX - popoverWidth / 2;
          }
        }

        // Clamp inside window boundaries
        const clampedLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));
        const clampedTop = Math.max(16, Math.min(window.innerHeight - popoverHeight - 16, top));

        // Arrow offset relative to popover so it points directly at the target center
        if (placement === "top" || placement === "bottom") {
          arrowOffset = Math.max(20, Math.min(popoverWidth - 20, targetCenterX - clampedLeft));
        } else {
          arrowOffset = Math.max(20, Math.min(popoverHeight - 20, targetCenterY - clampedTop));
        }

        setPopoverPos({
          top: clampedTop,
          left: clampedLeft,
          arrowOffset,
          placement,
        });
      } else {
        setTargetRect(null);
      }
    }, 120);
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

  const saveProgress = (completed: string[], done: boolean = false) => {
    setCompletedSteps(completed);
    if (done) setIsCompleted(true);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        completedSteps: completed,
        isCompleted: done,
        lastUpdated: new Date().toISOString(),
      })
    );
  };

  const handleNext = () => {
    const currentStep = steps[currentStepIndex];
    const newCompleted = Array.from(new Set([...completedSteps, currentStep.id]));

    if (currentStepIndex < steps.length - 1) {
      saveProgress(newCompleted, false);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed all steps - cleanly hide!
      saveProgress(newCompleted, true);
      setIsOpen(false);
      setIsMinimized(false);
      setIsCompleted(true);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setIsMinimized(true);
    saveProgress(completedSteps, false);
  };

  const handleOpenStep = (index: number) => {
    setCurrentStepIndex(index);
    setIsOpen(true);
    setIsMinimized(false);
    setIsCompleted(false);
  };

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* 1. Spotlight Outline & Directional Arrow Attached Directly to Target Element */}
      <AnimatePresence>
        {isOpen && !isMinimized && targetRect && (
          <>
            {/* Spotlight Border (Passes pointer events so button is directly clickable) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed pointer-events-none z-[9990] transition-all duration-200 ease-out"
              style={{
                top: Math.max(0, targetRect.top - 6),
                left: Math.max(0, targetRect.left - 6),
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                borderRadius: "12px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 25px rgba(99, 102, 241, 0.85)",
                border: "2px solid #818cf8",
              }}
            />

            {/* Attached Interactive Directional Tooltip Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[9995] w-[calc(100vw-32px)] sm:w-[320px] bg-slate-950 text-slate-50 border border-indigo-500/50 shadow-2xl rounded-xl p-3.5 backdrop-blur-xl"
              style={{
                top: popoverPos.top,
                left: popoverPos.left,
              }}
            >
              {/* Exact Pointer Arrow pointing directly to target center */}
              <div
                className="absolute pointer-events-none transition-all duration-150"
                style={
                  popoverPos.placement === "top"
                    ? {
                        bottom: "-8px",
                        left: `${popoverPos.arrowOffset}px`,
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: "8px solid #6366f1",
                      }
                    : popoverPos.placement === "bottom"
                    ? {
                        top: "-8px",
                        left: `${popoverPos.arrowOffset}px`,
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderBottom: "8px solid #6366f1",
                      }
                    : popoverPos.placement === "right"
                    ? {
                        left: "-8px",
                        top: `${popoverPos.arrowOffset}px`,
                        transform: "translateY(-50%)",
                        width: 0,
                        height: 0,
                        borderTop: "8px solid transparent",
                        borderBottom: "8px solid transparent",
                        borderRight: "8px solid #6366f1",
                      }
                    : {
                        right: "-8px",
                        top: `${popoverPos.arrowOffset}px`,
                        transform: "translateY(-50%)",
                        width: 0,
                        height: 0,
                        borderTop: "8px solid transparent",
                        borderBottom: "8px solid transparent",
                        borderLeft: "8px solid #6366f1",
                      }
                }
              />

              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Badge className="bg-indigo-500/30 text-indigo-300 border-indigo-500/40 text-[10px] px-1.5 py-0 font-bold shrink-0">
                    {currentStep.badge}
                  </Badge>
                  <span className="text-xs font-bold text-slate-100 truncate">{currentStep.title}</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800 shrink-0"
                  title="Minimize"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Short Action Instruction */}
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-200 mb-3 leading-snug">
                {currentStep.instruction}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-7 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium"
                >
                  Skip
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-7 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Docked Bottom-Right Steps Checklist (Titles Only) - Hidden when finished/completed */}
      <AnimatePresence>
        {isMinimized && !isCompleted && completedSteps.length < steps.length && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end"
          >
            {isChecklistExpanded ? (
              /* Concise Titles-Only Checklist Card */
              <div className="w-[280px] bg-slate-950 text-slate-50 border border-indigo-500/40 shadow-2xl rounded-2xl p-3.5 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold">Course Setup Steps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0 border-0">
                      {completedSteps.length}/{steps.length}
                    </Badge>
                    <button
                      onClick={() => setIsChecklistExpanded(false)}
                      className="text-slate-400 hover:text-slate-200 p-1"
                      title="Minimize"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Steps List (Titles only) */}
                <div className="space-y-1">
                  {steps.map((step, idx) => {
                    const isDone = completedSteps.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        onClick={() => handleOpenStep(idx)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors group ${
                          isDone
                            ? "text-slate-400 hover:bg-slate-900"
                            : "text-slate-200 hover:bg-indigo-500/15 hover:text-indigo-300 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-400 shrink-0">
                              {idx + 1}
                            </div>
                          )}
                          <span className={`truncate ${isDone ? "line-through text-slate-500" : ""}`}>
                            {step.title.replace(/^\d+\.\s*/, "")}
                          </span>
                        </div>
                        <Play className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Collapsed Pill */
              <Button
                onClick={() => setIsChecklistExpanded(true)}
                className="h-9 px-3 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-semibold shadow-xl shadow-indigo-500/20 border border-indigo-500/40 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>Guide Steps</span>
                <Badge className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0 border border-indigo-500/40">
                  {completedSteps.length}/{steps.length}
                </Badge>
                <ChevronUp className="h-3 w-3 text-slate-400" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
