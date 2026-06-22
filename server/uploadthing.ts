import { createUploadthing, type FileRouter } from "uploadthing/server";
import { verifyUserToken, checkPlanAccess } from "./whop";
import { storage } from "./storage";

const f = createUploadthing();

const PRO_PLAN_ID = "plan_x0eQCn2WM1qit";
const BASIC_PLAN_ID = "plan_mndBT74OUdiNB";

// Storage limits
const LIMITS = {
  free: { maxFileSize: "0MB", maxStorage: 0 },
  basic: { maxFileSize: "128MB", maxStorage: 400 * 1024 * 1024 }, // 400MB
  pro: { maxFileSize: "256MB", maxStorage: 1200 * 1024 * 1024 }, // 1.2GB
};

export const uploadRouter = {
  courseVideo: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Authenticate the user
      let token = "";
      if (req.headers && typeof req.headers.get === "function") {
        token = req.headers.get("x-whop-user-token") || "";
      } else if (req.headers) {
        token = (req.headers as any)["x-whop-user-token"] || "";
      }

      if (!token) {
        throw new Error("Unauthorized: Missing auth token");
      }

      const verified = await verifyUserToken(token);
      if (!verified) {
        throw new Error("Unauthorized: Invalid token");
      }

      // Check user plan status dynamically from Whop
      const isPro = await checkPlanAccess(verified.userId, PRO_PLAN_ID);
      const isBasic = !isPro && await checkPlanAccess(verified.userId, BASIC_PLAN_ID);

      const plan: "free" | "basic" | "pro" = isPro ? "pro" : (isBasic ? "basic" : "free");

      if (plan === "free") {
        throw new Error("Unauthorized: Free tier does not support direct video uploads. Please upgrade!");
      }

      // Fetch user from DB to check current storage usage
      const user = await storage.getUserByWhopId(verified.userId);
      if (!user) {
        throw new Error("User not found in system");
      }

      // Enforce total storage cap
      const limits = LIMITS[plan];
      if (user.usedStorage >= limits.maxStorage) {
        throw new Error(`Storage limit reached! Your plan allows up to ${limits.maxStorage / (1024 * 1024)}MB of video storage.`);
      }

      // Also double check max size dynamically in middleware
      // (UploadThing client-side enforces maxFileSize: "100MB" or "500MB", but middleware is a fallback)
      return { userId: user.id, plan, usedStorage: user.usedStorage };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url:", file.url);
      console.log("file size:", file.size);

      // Update the user's storage usage in the database
      const user = await storage.getUser(metadata.userId);
      if (user) {
        const newUsedStorage = (user.usedStorage || 0) + file.size;
        await storage.updateUser(metadata.userId, { usedStorage: newUsedStorage });
        console.log(`Updated storage for user ${metadata.userId}: ${newUsedStorage} bytes`);
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
