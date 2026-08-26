import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Play,
  MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TourStep {
  id: string;
  target: string;
  fallbackTarget?: string;
  title: string;
  instruction: string;
  dropdownInstruction?: string;
  menuInstruction?: string;
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
  const globalStorageKey = "cursai_course_tour_completed_global";
  const storageKey = `cursai_course_tour_${courseId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    width: number;
    arrowOffset: number;
    placement: "top" | "bottom" | "left" | "right";
  }>({ top: 0, left: 12, width: 320, arrowOffset: 160, placement: "bottom" });

  const steps: TourStep[] = [
    {
      id: "edit-mode",
      target: '[data-tour="edit-mode-toggle"]',
      title: "1. Switch to Edit Mode",
      instruction: "👉 Click 'Edit Mode' to start editing",
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
      dropdownInstruction: "👉 Choose any block to insert (Text, Image, Video, etc.)",
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
      fallbackTarget: '[data-tour="mobile-sidebar-trigger"]',
      title: "3. Thumbnail & Pricing",
      instruction: "👉 Go to Settings to edit pricing, course details etc",
      menuInstruction: "👉 Open menu & tap 'Settings' to edit pricing, course details etc",
      icon: Settings,
      badge: "Step 3",
      preferredPlacement: "right",
      onEnter: () => {
        // onEnter
      },
    },
    {
      id: "publish-live",
      target: '[data-tour="publish-button"]',
      title: "4. Publish Your Course Live",
      instruction: "👉 When you're ready, hit 'Publish' to make your course live on Whop",
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
        localStorage.removeItem(globalStorageKey);
        localStorage.removeItem(storageKey);
        console.log("Guide tour reset! Reloading page...");
        window.location.reload();
      };
      (window as any).resetTour = (window as any).resetGuide;
    }
  }, [storageKey, globalStorageKey]);

  // Initialize on mount (checks global completion first so creators aren't prompted repeatedly)
  useEffect(() => {
    const isGlobalCompleted = localStorage.getItem(globalStorageKey) === "true";
    if (isGlobalCompleted) {
      setIsCompleted(true);
      setIsMinimized(false);
      setIsOpen(false);
      return;
    }

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
          setIsOpen(true);
          setIsMinimized(false);
          setIsCompleted(false);
        }
      } catch (e) {
        setIsOpen(true);
        setIsMinimized(false);
      }
    }
  }, [courseId, storageKey, globalStorageKey]);

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

  // 3. If at Step 2 ("settings-pricing") and user navigates to settings tab, auto-advance to Step 3!
  useEffect(() => {
    if (isOpen && currentStepIndex === 2 && activeTab === "settings") {
      const timer = setTimeout(() => {
        handleNext();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isOpen, currentStepIndex]);

  // Helper to find visible element among multiple selectors (especially on mobile)
  const getVisibleElement = (selector: string): Element | null => {
    const elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return el;
      }
    }
    return null;
  };

  // Check for dropdown menu opening in Step 2 to move highlight to options!
  useEffect(() => {
    if (!isOpen || currentStepIndex !== 1) return;

    const checkDropdown = () => {
      const dropdown = document.querySelector('[data-tour="block-dropdown-options"]');
      if (dropdown && dropdown.getBoundingClientRect().width > 0) {
        if (!isDropdownOpen) {
          setIsDropdownOpen(true);
        }
      } else {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
      }
    };

    const interval = setInterval(checkDropdown, 150);
    return () => clearInterval(interval);
  }, [isOpen, currentStepIndex, isDropdownOpen]);

  // Check for mobile sidebar drawer opening in Step 3 to highlight Settings!
  useEffect(() => {
    if (!isOpen || currentStepIndex !== 2) return;

    const checkSettings = () => {
      const settingsEl = getVisibleElement('[data-tour="sidebar-settings"]');
      const isVisible = !!settingsEl;
      if (isVisible !== isSettingsVisible) {
        setIsSettingsVisible(isVisible);
      }
    };

    const interval = setInterval(checkSettings, 150);
    return () => clearInterval(interval);
  }, [isOpen, currentStepIndex, isSettingsVisible]);

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
      let el: Element | null = null;

      // In Step 2, if dropdown is open, highlight the dropdown options menu directly!
      if (currentStep.id === "content-blocks") {
        const dropdown = getVisibleElement('[data-tour="block-dropdown-options"]');
        if (dropdown) {
          el = dropdown;
        }
      }

      // In Step 3, check if settings item is visible in drawer/sidebar; otherwise target mobile menu button
      if (currentStep.id === "settings-pricing") {
        const settingsEl = getVisibleElement('[data-tour="sidebar-settings"]');
        if (settingsEl) {
          el = settingsEl;
        } else {
          el = getVisibleElement('[data-tour="mobile-sidebar-trigger"]') || getVisibleElement('[data-testid="sidebar-toggle"]');
        }
      }

      if (!el) {
        el = getVisibleElement(currentStep.target);
      }

      if (!el && currentStep.fallbackTarget) {
        el = getVisibleElement(currentStep.fallbackTarget);
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Smoothly bring element into view if needed
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        const isMobile = window.innerWidth < 640;
        const popoverWidth = isMobile ? Math.min(340, window.innerWidth - 24) : 320;
        const popoverHeight = isMobile ? 150 : 135;
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        let placement = currentStep.preferredPlacement || "bottom";

        // On mobile, prefer top or bottom to avoid horizontal clipping
        if (isMobile && (placement === "left" || placement === "right")) {
          placement = rect.top > 220 ? "top" : "bottom";
        }

        let top = 0;
        let left = 0;

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

        // Clamp inside window boundaries strictly
        const clampedLeft = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));
        const clampedTop = Math.max(12, Math.min(window.innerHeight - popoverHeight - 12, top));

        // Arrow offset relative to popover so it points directly at the target center
        let arrowOffset = popoverWidth / 2;
        if (placement === "top" || placement === "bottom") {
          arrowOffset = Math.max(24, Math.min(popoverWidth - 24, targetCenterX - clampedLeft));
        } else {
          arrowOffset = Math.max(24, Math.min(popoverHeight - 24, targetCenterY - clampedTop));
        }

        setPopoverPos({
          top: clampedTop,
          left: clampedLeft,
          width: popoverWidth,
          arrowOffset,
          placement,
        });
      } else {
        setTargetRect(null);
      }
    }, 80);
  }, [isOpen, isMinimized, currentStepIndex, activeTab, isEditMode, isDropdownOpen, isSettingsVisible]);

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
    if (done) {
      setIsCompleted(true);
      localStorage.setItem(globalStorageKey, "true");
    }
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

  // Compute active instruction dynamically based on current UI state
  let activeInstruction = currentStep.instruction;
  if (currentStep.id === "content-blocks" && isDropdownOpen && currentStep.dropdownInstruction) {
    activeInstruction = currentStep.dropdownInstruction;
  } else if (currentStep.id === "settings-pricing") {
    const isSettingsInDOM = !!getVisibleElement('[data-tour="sidebar-settings"]');
    if (!isSettingsInDOM && currentStep.menuInstruction) {
      activeInstruction = currentStep.menuInstruction;
    }
  }

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
                top: Math.max(0, targetRect.top - 4),
                left: Math.max(0, targetRect.left - 4),
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                borderRadius: "10px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 25px rgba(99, 102, 241, 0.85)",
                border: "2px solid #818cf8",
              }}
            />

            {/* Big Animated Directional Arrow Pointer pointing directly at target to click */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="fixed pointer-events-none z-[9996]"
              style={{
                top:
                  popoverPos.placement === "top"
                    ? Math.max(10, targetRect.top - 48)
                    : popoverPos.placement === "bottom"
                    ? Math.min(window.innerHeight - 52, targetRect.bottom + 6)
                    : targetRect.top + targetRect.height / 2,
                left:
                  popoverPos.placement === "right"
                    ? Math.max(12, targetRect.left - 48)
                    : popoverPos.placement === "left"
                    ? Math.min(window.innerWidth - 60, targetRect.right + 8)
                    : Math.max(20, Math.min(window.innerWidth - 20, targetRect.left + targetRect.width / 2)),
                transform:
                  popoverPos.placement === "top" || popoverPos.placement === "bottom"
                    ? "translateX(-50%)"
                    : "translateY(-50%)",
              }}
            >
              <motion.div
                animate={
                  popoverPos.placement === "top"
                    ? { y: [0, 6, 0] }
                    : popoverPos.placement === "bottom"
                    ? { y: [0, -6, 0] }
                    : popoverPos.placement === "right"
                    ? { x: [0, 6, 0] }
                    : { x: [0, -6, 0] }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: "easeInOut",
                }}
                className="flex flex-col items-center gap-0.5 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              >
                {popoverPos.placement === "bottom" && (
                  <div className="text-amber-400 -mb-1">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_10px_rgba(245,158,11,1)] fill-current" viewBox="0 0 24 24">
                      <path d="M12 3l-6 7h3.5v11h5v-11h3.5z" />
                    </svg>
                  </div>
                )}

                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.95)] border-2 border-white tracking-wider flex items-center gap-1 whitespace-nowrap">
                  <span>👉</span>
                  <span>CLICK HERE</span>
                </div>

                {popoverPos.placement === "top" && (
                  <div className="text-amber-400 -mt-1">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_10px_rgba(245,158,11,1)] fill-current" viewBox="0 0 24 24">
                      <path d="M12 21l6-7h-3.5v-11h-5v11h-3.5z" />
                    </svg>
                  </div>
                )}
                {popoverPos.placement === "right" && (
                  <div className="text-amber-400 -mt-1">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_10px_rgba(245,158,11,1)] fill-current" viewBox="0 0 24 24">
                      <path d="M21 12l-7-6v3.5h-11v5h11v3.5z" />
                    </svg>
                  </div>
                )}
                {popoverPos.placement === "left" && (
                  <div className="text-amber-400 -mt-1">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_10px_rgba(245,158,11,1)] fill-current" viewBox="0 0 24 24">
                      <path d="M3 12l7 6v-3.5h11v-5h-11v-3.5z" />
                    </svg>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Attached Interactive Directional Tooltip Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[9995] bg-slate-950 text-slate-50 border border-indigo-500/50 shadow-2xl rounded-xl p-3 sm:p-3.5 backdrop-blur-xl box-border overflow-hidden"
              style={{
                top: popoverPos.top,
                left: popoverPos.left,
                width: popoverPos.width,
                maxWidth: "calc(100vw - 24px)",
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
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-200 mb-2.5 leading-snug break-words flex items-center gap-1.5">
                <span>{activeInstruction}</span>
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
                    "Got it 👍"
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
            className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[9999] flex flex-col items-end max-w-[calc(100vw-32px)]"
          >
            {isChecklistExpanded ? (
              /* Concise Titles-Only Checklist Card */
              <div className="w-[calc(100vw-32px)] sm:w-[280px] bg-slate-950 text-slate-50 border border-indigo-500/40 shadow-2xl rounded-2xl p-3.5 backdrop-blur-xl box-border">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
                    <span className="text-xs font-bold truncate">Course Setup Steps</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
