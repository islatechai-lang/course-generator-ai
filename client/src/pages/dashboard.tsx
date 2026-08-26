import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UpgradeModal } from "@/components/upgrade-modal";
import { OnboardingDemo } from "@/components/onboarding-demo";
import { CourseGenerator, CoursePreview } from "@/components/course-generator";
import { generateCourseImage } from "@/lib/image-generator";
import type { GeneratedCourse, Course } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { safeLocalStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BookOpen,
  HelpCircle,
  Sparkles,
  Wallet,
  Plus,
  LayoutGrid,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { CourseCard } from "@/components/course-card";
import { WithdrawRequestDialog } from "@/components/withdraw-request-dialog";

interface DashboardData {
  user: { id: string; username: string; email: string };
  courses: (Course & { moduleCount: number; lessonCount: number; studentCount: number })[];
  companyId: string;
  earnings: {
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
  };
  generationLimit?: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: string;
    isPro: boolean;
    isBasic: boolean;
  };
}

export default function DashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [activeTab, setActiveTab] = useState("courses");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("[Frontend] Dashboard showUpgradeModal changed to:", showUpgradeModal);
  }, [showUpgradeModal]);

  useEffect(() => {
    const handleTriggerUpgrade = () => {
      console.log("Global upgrade trigger event received in dashboard");
      setShowUpgradeModal(true);
    };
    window.addEventListener("trigger-upgrade-modal", handleTriggerUpgrade);
    return () => {
      window.removeEventListener("trigger-upgrade-modal", handleTriggerUpgrade);
    };
  }, []);

  // Check if any courses are still generating to enable polling
  const hasGeneratingCourses = (courses: DashboardData["courses"] | undefined) =>
    courses?.some(c => c.generationStatus === "generating") ?? false;

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", companyId],
    enabled: !!companyId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if there are courses still generating
      const courses = query.state.data?.courses;
      return hasGeneratingCourses(courses) ? 5000 : false;
    },
  });

  useEffect(() => {
    if (data) {
      console.log("[Frontend] Dashboard data received:", data);
      
      // Show onboarding demo if user hasn't seen it yet OR if they have 0 courses
      const hasSeenDemo = safeLocalStorage.getItem("hasSeenOnboardingDemo");
      const hasNoCourses = data.courses && data.courses.length === 0;
      const hasDismissedInSession = sessionStorage.getItem("hasDismissedOnboardingSession") === "true";

      if ((!hasSeenDemo || hasNoCourses) && !hasDismissedInSession) {
        console.log("[Frontend] User needs onboarding (unseen or 0 courses). Showing onboarding.");
        setShowOnboarding(true);
      }
    }
  }, [data]);

  const handleOnboardingComplete = () => {
    safeLocalStorage.setItem("hasSeenOnboardingDemo", "true");
    sessionStorage.setItem("hasDismissedOnboardingSession", "true");
    setShowUpgradeModal(true);
  };

  const handleOnboardingOpenChange = (open: boolean) => {
    setShowOnboarding(open);
    if (!open) {
      sessionStorage.setItem("hasDismissedOnboardingSession", "true");
    }
  };

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createTabRef = useRef<HTMLDivElement>(null);

  const scrollToCreate = useCallback(() => {
    setActiveTab("create");
    const performScroll = () => {
      if (createTabRef.current) {
        createTabRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (scrollContainerRef.current) {
        const targetTop = createTabRef.current ? Math.max(0, createTabRef.current.offsetTop - 20) : 350;
        scrollContainerRef.current.scrollTo({ top: targetTop, behavior: "smooth" });
      }
      window.scrollTo({ top: 350, behavior: "smooth" });
    };
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 200);
  }, []);

  useEffect(() => {
    if (activeTab === "create") {
      scrollToCreate();
    }
  }, [activeTab, scrollToCreate]);

  const [savingStatus, setSavingStatus] = useState<string>("");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (courseData: { generatedCourse: GeneratedCourse; isFree: boolean; price: string; coverImage?: string; generateLessonImages?: boolean; generateVideo?: boolean }) => {
      return apiRequest("POST", `/api/dashboard/${companyId}/courses`, courseData);
    },
    onMutate: async (courseData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/dashboard", companyId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(["/api/dashboard", companyId]);

      // Optimistically add the new course to the list with all required fields
      if (previousData) {
        const now = new Date().toISOString();
        const optimisticCourse = {
          id: `temp-${Date.now()}`,
          creatorId: previousData.user.id,
          title: courseData.generatedCourse.course_title,
          description: courseData.generatedCourse.description || null,
          coverImage: courseData.coverImage || null,
          published: false,
          isFree: courseData.isFree,
          price: courseData.isFree ? "0" : courseData.price,
          generationStatus: (courseData.generateLessonImages || courseData.generateVideo) ? "generating" as const : "complete" as const,
          createdAt: now,
          updatedAt: now,
          moduleCount: courseData.generatedCourse.modules.length,
          lessonCount: courseData.generatedCourse.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0,
          studentCount: 0,
        };

        queryClient.setQueryData<DashboardData>(["/api/dashboard", companyId], {
          ...previousData,
          courses: [optimisticCourse as any, ...previousData.courses],
        });
      }

      return { previousData };
    },
    onSuccess: (newCourse: Course & { moduleCount: number; lessonCount: number; studentCount: number }) => {
      // Proactively update the cache with the real course data to replace the temp ID
      queryClient.setQueryData(["/api/dashboard", companyId], (old: DashboardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          courses: [newCourse, ...old.courses.filter(c => !c.id.toString().startsWith("temp-"))]
        };
      });

      // Also invalidate to be sure, but the setQueryData above handles the immediate UI update
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", companyId] });
      setIsGeneratingImages(false);

      // Only clear state and switch tabs on success
      setGeneratedCourse(null);

      // If it was a scratch/manual course, redirect to editor immediately
      if (newCourse.id) {
        window.location.href = `/dashboard/${companyId}/courses/${newCourse.id}/edit`;
      } else {
        setActiveTab("courses");
      }
    },
    onError: (_, __, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/dashboard", companyId], context.previousData);
      }
      setIsGeneratingImages(false);
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateScratch = async (title: string) => {
    const scratchData: GeneratedCourse = {
      course_title: title.trim() || "Untitled Course",
      description: "Manually created course.",
      modules: [
        {
          module_title: "Module 1",
          lessons: [
            {
              lesson_title: "Lesson 1",
              content: "Start writing your course content here..."
            }
          ]
        }
      ]
    };

    saveMutation.mutate({
      generatedCourse: scratchData,
      isFree: true,
      price: "0",
      generateLessonImages: false,
      generateVideo: false,
    });
  };

  const handleSaveCourse = async (options: { isFree: boolean; price: string; generateLessonImages: boolean; generateVideo: boolean }) => {
    if (!generatedCourse || isGeneratingImage || saveMutation.isPending) return;

    // Handle "From Scratch" mode specifically if it exists
    if ((generatedCourse as any).mode === "scratch") {
      const scratchData: GeneratedCourse = {
        course_title: "Untitled Course",
        description: "Set your course description here",
        modules: [
          {
            module_title: "Module 1",
            lessons: [
              {
                lesson_title: "Lesson 1",
                content: "Start writing your course content here..."
              }
            ]
          }
        ]
      };

      saveMutation.mutate({
        generatedCourse: scratchData,
        isFree: true,
        price: "0",
        generateLessonImages: false,
        generateVideo: false,
      });
      return;
    }

    // Store the course data before clearing state
    const courseToSave = generatedCourse;

    setIsGeneratingImage(true);
    setIsGeneratingImages(options.generateLessonImages);
    setSavingStatus("Generating cover image...");

    let coverImage: string | undefined;
    try {
      const generatedImage = await generateCourseImage(courseToSave.course_title);
      coverImage = generatedImage || undefined;
    } catch (error) {
      console.error("Failed to generate cover image:", error);
    }

    setIsGeneratingImage(false);
    setSavingStatus("");

    // Show toast immediately
    toast({
      title: "Creating your course...",
      description: options.generateLessonImages
        ? "Your course is being created. You'll receive a notification when lesson images are ready."
        : "Your course is being created.",
    });

    // Now trigger the mutation - the UI has already switched to courses tab
    saveMutation.mutate({
      generatedCourse: courseToSave,
      isFree: options.isFree,
      price: options.price,
      coverImage,
      generateLessonImages: options.generateLessonImages,
      generateVideo: options.generateVideo,
    });
  };

  const togglePublishMutation = useMutation({
    mutationFn: async ({ courseId, published }: { courseId: string; published: boolean }) => {
      setPublishingCourseId(courseId);
      try {
        const response = await apiRequest("PATCH", `/api/dashboard/${companyId}/courses/${courseId}`, { published });
        return response;
      } catch (err: any) {
        console.log("[Frontend] togglePublishMutation error data:", err.data);
        if (err.data?.needsUpgrade) {
          console.log("[Frontend] Setting showUpgradeModal to true");
          setShowUpgradeModal(true);
          throw new Error("upgrade_required");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", companyId] });
      setPublishingCourseId(null);
    },
    onError: (err: any) => {
      setPublishingCourseId(null);
      if (err.message !== "upgrade_required") {
        toast({
          title: "Error",
          description: err.message || "Failed to update course.",
          variant: "destructive",
        });
      }
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-destructive text-lg">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin access to this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Ambient Glow */}
        <div className="absolute h-96 w-96 rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm z-10 animate-in fade-in duration-500">
          {/* Animated App Logo */}
          <div className="relative flex items-center justify-center animate-bounce duration-1000">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-30 blur-md animate-pulse" />
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/80 flex items-center justify-center">
              <img src="/app_logo.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground animate-pulse">Loading Your Studio</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preparing your AI course environment and learning workspace...
            </p>
          </div>

          {/* Minimalist Spinner */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            <span>Connecting to Whop...</span>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalCourses: data?.courses.length || 0,
    publishedCourses: data?.courses.filter((c) => c.published).length || 0,
    totalStudents: data?.courses.reduce((acc, c) => acc + c.studentCount, 0) || 0,
    totalEarnings: data?.earnings?.totalEarnings || 0,
    availableBalance: data?.earnings?.availableBalance || 0,
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="border-b bg-background shrink-0">
        <div className="flex h-14 items-center justify-between px-3 sm:px-5">
          <div className="flex items-center gap-2">
            {/* New Glowing C App Logo */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-md border border-white/10 shrink-0 bg-black">
              <img src="/app_logo.jpg" alt="Course Generator AI Logo" className="h-full w-full object-cover" />
            </div>
            {/* User Profile on Left for Mobile */}
            <div className="sm:hidden">
              <UserMenu />
            </div>
            <h1 className="font-semibold hidden sm:block">Course Generator AI</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHowItWorks(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground flex"
              data-testid="button-how-it-works"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User Profile on Right for Desktop */}
            <div className="hidden sm:block">
              <UserMenu />
            </div>
            {data?.generationLimit?.isPro ? (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm shrink-0 shadow-sm">
                <span>👑</span>
                <span>Pro</span>
              </div>
            ) : data?.generationLimit?.isBasic ? (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm shrink-0 shadow-sm">
                <span>👑</span>
                <span>Basic</span>
              </div>
            ) : null}
            {!data?.generationLimit?.isPro && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="h-9 px-3 sm:px-4 gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shrink-0"
              >
                <Sparkles className="h-4 w-4 fill-current" />
                <span className="text-xs sm:text-sm font-medium">{isMobile ? "Upgrade" : "Upgrade Plan"}</span>
              </Button>
            )}
            <Button
              onClick={() => setShowWithdrawDialog(true)}
              data-testid="button-withdraw"
              className="h-9 px-3 sm:px-4 gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none shrink-0"
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium">Withdraw</span>
            </Button>
            <Button
              onClick={scrollToCreate}
              data-testid="button-create-course"
              className="h-9 px-3 sm:px-4 shrink-0"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium">{isMobile ? "Create" : "Create Course"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5" ref={scrollContainerRef}>
        {!data?.generationLimit?.isPro && !data?.generationLimit?.isBasic && (
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">
                  Free Account: <span className="text-amber-600 dark:text-amber-400 font-bold">{data?.generationLimit?.remaining ?? 1} Free Trial Generation</span> remaining.
                </p>
                <p className="text-[11px] text-muted-foreground">Upgrade to Creator Pro to unlock guided document imports, 2 daily generations & 10 published courses.</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs h-8 shrink-0 shadow-md border-none"
            >
              Get Pro Access ⚡
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Wallet} label="Available Balance" value={stats.availableBalance} testId="stat-available-balance" bgColor="bg-emerald-500/10 dark:bg-emerald-400/10" iconColor="text-emerald-600 dark:text-emerald-400" isCurrency />
          <StatCard icon={DollarSign} label="Total Earnings" value={stats.totalEarnings} testId="stat-earnings" bgColor="bg-amber-500/10 dark:bg-amber-400/10" iconColor="text-amber-600 dark:text-amber-400" isCurrency />
          <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} testId="stat-total-courses" bgColor="bg-blue-500/10 dark:bg-blue-400/10" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard icon={TrendingUp} label="Published" value={stats.publishedCourses} testId="stat-published" bgColor="bg-emerald-500/10 dark:bg-emerald-400/10" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents} testId="stat-students" bgColor="bg-violet-500/10 dark:bg-violet-400/10" iconColor="text-violet-600 dark:text-violet-400" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5">
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-courses">
              <LayoutGrid className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2" data-testid="tab-create">
              <Sparkles className="h-4 w-4" />
              Create
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-5">
            {data?.courses && data.courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    companyId={companyId}
                    moduleCount={course.moduleCount}
                    lessonCount={course.lessonCount}
                    isCreator={true}
                    onTogglePublish={(id, published) =>
                      togglePublishMutation.mutate({ courseId: id, published })
                    }
                    isPublishing={publishingCourseId === course.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">No courses yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                    Create your first AI-powered course to get started.
                  </p>
                  <Button onClick={scrollToCreate} data-testid="button-create-first-course">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-5" ref={createTabRef}>
            <div className="max-w-2xl mx-auto">
              {!generatedCourse ? (
                <CourseGenerator
                  companyId={companyId || ""}
                  onGenerated={setGeneratedCourse}
                  onCreateScratch={handleCreateScratch}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                  generationLimit={data?.generationLimit}
                  onUpgrade={() => {
                    console.log("[Frontend] Dashboard onUpgrade called");
                    setShowUpgradeModal(true);
                  }}
                />
              ) : (
                <CoursePreview
                  course={generatedCourse}
                  onSave={handleSaveCourse}
                  onDiscard={() => setGeneratedCourse(null)}
                  isSaving={isGeneratingImage || saveMutation.isPending}
                  savingStatus={savingStatus}
                  onUpgrade={() => setShowUpgradeModal(true)}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Cursai Works</DialogTitle>
            <DialogDescription>Everything you need to know about running your courses on our platform</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                AI Course Generation
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Enter any topic and our AI instantly generates a complete course with modules, lessons, and structured content. No more spending hours on curriculum design—let AI handle it.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Customization & Control
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Customize every module and lesson. Add your own content, regenerate sections, and personalize the course before publishing. You have full control.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Free or Paid Courses
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Decide whether your course is free or paid. Set any price you want. Free courses grow your audience, paid courses generate revenue.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Member Access
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once published, your community members can discover and access your courses. Free courses are instantly available. Paid courses require purchase.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Revenue Split
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                <span className="font-semibold text-foreground">You earn 90% of every course sale</span>. Cursai keeps 10% to maintain the platform and power the AI. It's a fair partnership.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Earn Passively
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once your course is published, it sells 24/7. Watch your earnings grow as members purchase access. No ongoing effort required after publishing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Clean Learning Experience
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Members enjoy a distraction-free reading and listening experience. They can read lessons or listen with AI-powered text-to-speech powered by Murf TTS. Navigate through modules, track progress, and learn at their own pace without clutter.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-6">
              <p className="text-sm text-foreground font-semibold mb-2">Quick Start:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>1. Click "Create Course" and enter a topic</li>
                <li>2. Review the AI-generated course structure</li>
                <li>3. Customize modules and lessons as needed</li>
                <li>4. Set it as free or add a price</li>
                <li>5. Publish and start earning</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WithdrawRequestDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        companyId={companyId || ""}
        availableBalance={stats.availableBalance}
      />

      {null}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={data?.generationLimit?.isPro ? "pro" : (data?.generationLimit?.isBasic ? "basic" : "free")}
      />

      <OnboardingDemo
        open={showOnboarding}
        onOpenChange={handleOnboardingOpenChange}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}

interface StatCardProps {
  icon: typeof BookOpen;
  label: string;
  value: number;
  testId: string;
  bgColor?: string;
  iconColor?: string;
  isCurrency?: boolean;
}

function StatCard({ icon: Icon, label, value, testId, bgColor = "bg-primary/10", iconColor = "text-primary", isCurrency }: StatCardProps) {
  const displayValue = isCurrency ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value;
  return (
    <Card data-testid={testId} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-tighter font-semibold text-muted-foreground/90 truncate mb-0.5">{label}</p>
            <p className="text-xl font-bold tracking-tight truncate leading-none">{displayValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


