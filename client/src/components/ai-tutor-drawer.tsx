import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Bot, User, Loader2, RotateCcw, Lightbulb, Dumbbell, HelpCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface AiTutorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  currentLessonId?: string;
  currentLessonTitle?: string;
  companyId?: string;
  experienceId?: string;
}

const PROMPT_CHIPS = [
  { icon: Lightbulb, label: "3 Key Takeaways", prompt: "Can you give me the top 3 key takeaways from this lesson in simple terms?" },
  { icon: Dumbbell, label: "Practical Exercise", prompt: "Give me a quick 5-minute practical challenge to apply what I just learned." },
  { icon: HelpCircle, label: "Quiz Me", prompt: "Ask me a challenging multiple-choice question to test my understanding of this lesson." },
  { icon: Sparkles, label: "Real-World Example", prompt: "Can you explain this concept using a concrete, real-world case study or scenario?" },
];

export function AiTutorDrawer({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  currentLessonId,
  currentLessonTitle,
  companyId,
  experienceId,
}: AiTutorDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initial welcome message when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: `👋 Hey there! I'm your **24/7 AI Tutor** for **${courseTitle}**.\n\nI have full context on your current lesson: *"${currentLessonTitle || 'Current Lesson'}"*. Ask me anything, or pick one of the quick prompts below!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, courseTitle, currentLessonTitle, messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build past history
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Determine endpoint
      let endpoint = `/api/courses/${courseId}/ask-tutor`;
      if (companyId) {
        endpoint = `/api/dashboard/${companyId}/courses/${courseId}/ask-tutor`;
      } else if (experienceId) {
        endpoint = `/api/experiences/${experienceId}/courses/${courseId}/ask-tutor`;
      }

      const res = await apiRequest("POST", endpoint, {
        lessonId: currentLessonId,
        query: textToSend,
        chatHistory,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: res.response || "I'm ready for your next question!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("AI Tutor send error:", err);
      toast({
        title: "Tutor error",
        description: err.message || "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        text: `Chat reset! How can I assist you with **${currentLessonTitle || courseTitle}**?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/80 shadow-2xl z-50"
      >
        {/* Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold flex items-center gap-1.5">
                  AI Course Tutor
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                    24/7 Mentor
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground truncate max-w-[240px]">
                  Lesson: {currentLessonTitle || "Course Material"}
                </SheetDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              onClick={handleReset}
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-sm animate-in fade-in duration-200 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-md shadow-primary/20"
                    : "bg-muted/60 text-foreground border border-border/50 rounded-tl-xs whitespace-pre-line"
                }`}
              >
                {m.text}
              </div>

              {m.role === "user" && (
                <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-sm animate-in fade-in duration-200">
              <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs font-medium">Tutor is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="p-3 border-t border-border/40 bg-muted/10 shrink-0">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Suggested questions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CHIPS.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSend(chip.prompt)}
                  className="inline-flex items-center gap-1.5 text-xs bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/60 rounded-full px-2.5 py-1 text-muted-foreground transition-colors disabled:opacity-50"
                >
                  <Icon className="h-3 w-3 text-primary" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t border-border/60 bg-background shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this lesson..."
              disabled={isLoading}
              className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
