import { useState } from "react";
import { UploadDropzone } from "../lib/uploadthing";
import { useAuth } from "../lib/auth";
import { useToast } from "../hooks/use-toast";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, HardDrive, CheckCircle2, AlertCircle, Video, Loader2 } from "lucide-react";

interface VideoUploaderProps {
  onUploadComplete: (videoData: { url: string; fileKey: string; fileSize: number }) => void;
  onCancel?: () => void;
}

const PLAN_LIMITS = {
  free: { name: "Free", maxStorage: 0, maxFileSize: "0MB" },
  basic: { name: "Basic", maxStorage: 800 * 1024 * 1024, maxFileSize: "128MB" },
  pro: { name: "Pro", maxStorage: 2000 * 1024 * 1024, maxFileSize: "256MB" },
};

export function VideoUploader({ onUploadComplete, onCancel }: VideoUploaderProps) {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const plan = user?.plan || "free";
  const limit = PLAN_LIMITS[plan];
  const usedStorage = user?.usedStorage || 0;
  const storagePercentage = limit.maxStorage > 0 ? (usedStorage / limit.maxStorage) * 100 : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (plan === "free") {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-center w-full max-w-full overflow-hidden box-border">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3 sm:mb-4 shrink-0">
          <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-500 animate-pulse" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg mb-1.5 sm:mb-2">
          Direct Video Upload is Locked
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4 sm:mb-6">
          Uploading videos directly is only available on our <strong className="font-semibold text-slate-800 dark:text-slate-200">Basic</strong> or <strong className="font-semibold text-slate-800 dark:text-slate-200">Pro</strong> plans. Free plans support video embeds via links.
        </p>
        <Button 
          onClick={() => {
            // Trigger upgrade modal or redirect to subscription page
            const upgradeBtn = document.querySelector('[data-upgrade-trigger="true"]');
            if (upgradeBtn instanceof HTMLElement) {
              upgradeBtn.click();
            } else {
              // Dispatch custom event to trigger the upgrade modal globally
              window.dispatchEvent(new CustomEvent("trigger-upgrade-modal"));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-200 dark:shadow-none text-xs sm:text-sm h-9 sm:h-10 px-4"
        >
          View Upgrade Options
        </Button>
      </div>
    );
  }

  const isStorageFull = usedStorage >= limit.maxStorage;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20 shadow-sm w-full max-w-full overflow-hidden box-border">
      {/* Storage Meter */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            Storage Capacity ({limit.name} Plan)
          </span>
          <span className="text-[11px] sm:text-xs">
            {formatSize(usedStorage)} / {formatSize(limit.maxStorage)}
          </span>
        </div>
        <Progress 
          value={Math.min(storagePercentage, 100)} 
          className={`h-2 ${storagePercentage >= 90 ? "bg-red-500" : storagePercentage >= 75 ? "bg-amber-500" : "bg-indigo-600"}`}
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Max file size: <strong className="font-semibold text-slate-500 dark:text-slate-400">{limit.maxFileSize}</strong> per upload. Direct upload uses cloud storage.
        </p>
      </div>

      {isStorageFull ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs">
            You have exhausted your plan's storage capacity ({formatSize(limit.maxStorage)}). Please delete some unused videos or upgrade your plan to upload more.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="relative w-full max-w-full overflow-hidden">
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 rounded-lg p-4 text-center">
              <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Uploading your video...
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Do not close this page or navigate away
              </p>
            </div>
          )}

          <UploadDropzone
            endpoint="courseVideo"
            config={{ mode: "auto" }}
            headers={{
              // Uploadthing client component will automatically supply headers if we provide them, 
              // but we rely on cookie session auth or header auth.
              // For safety in iframe/sandbox apps, we attach the user token header.
              "x-whop-user-token": localStorage.getItem("x-whop-user-token") || localStorage.getItem("whop_user_token") || "",
            }}
            onUploadBegin={() => {
              setIsUploading(true);
            }}
            onClientUploadComplete={async (res) => {
              setIsUploading(false);
              const file = res?.[0];
              if (file) {
                toast({
                  title: "Video Uploaded Successfully!",
                  description: `${file.name} is now saved.`,
                });
                await refetchUser(); // Refresh usedStorage count
                onUploadComplete({
                  url: file.url,
                  fileKey: file.key,
                  fileSize: file.size,
                });
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              toast({
                title: "Upload Failed",
                description: error.message || "Something went wrong during the upload.",
                variant: "destructive",
              });
            }}
            appearance={{
              container: "w-full max-w-full border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-colors p-4 sm:p-6 rounded-lg bg-slate-50/50 dark:bg-slate-900/10 overflow-hidden box-border min-h-[140px] flex flex-col justify-center items-center gap-2",
              label: "text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer text-xs sm:text-sm text-center break-words px-2 max-w-full",
              allowedContent: "text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs text-center break-words px-2",
              button: "bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 sm:px-4 py-2 rounded-lg shadow-sm cursor-pointer mt-2 sm:mt-4 max-w-full",
            }}
            content={{
              label({ isDragActive }) {
                if (isDragActive) return "Drop the video here!";
                return "Drag & drop a video file, or click to browse";
              },
              allowedContent() {
                return `MP4, WebM, or OGG up to ${limit.maxFileSize}`;
              }
            }}
          />
        </div>
      )}

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-slate-500">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
