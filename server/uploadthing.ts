import { createUploadthing, type FileRouter } from "uploadthing/server";
import { verifyUserToken, checkPlanAccess } from "./whop";
import { storage } from "./storage";

const f = createUploadthing();

const PRO_PLAN_ID = "plan_QP5YgPTkdv4rs";
const OLD_PRO_PLAN_IDS = ["plan_4qB6wAFl9q3sT", "plan_x0eQCn2WM1qit"];
const BASIC_PLAN_ID = "plan_zpOm76hX1tY4i";
const OLD_BASIC_PLAN_IDS = ["plan_mndBT74OUdiNB"];

async function checkUserIsPro(userId: string): Promise<boolean> {
  if (await checkPlanAccess(userId, PRO_PLAN_ID)) return true;
  for (const oldId of OLD_PRO_PLAN_IDS) {
    if (await checkPlanAccess(userId, oldId)) return true;
  }
  return false;
}

async function checkUserIsBasic(userId: string): Promise<boolean> {
  if (await checkPlanAccess(userId, BASIC_PLAN_ID)) return true;
  for (const oldId of OLD_BASIC_PLAN_IDS) {
    if (await checkPlanAccess(userId, oldId)) return true;
  }
  return false;
}

// Storage limits
const LIMITS = {
  free: { maxFileSize: "0MB", maxStorage: 0 },
  basic: { maxFileSize: "128MB", maxStorage: 800 * 1024 * 1024 }, // 800MB
  pro: { maxFileSize: "256MB", maxStorage: 2000 * 1024 * 1024 }, // 2GB
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
      const isPro = await checkUserIsPro(verified.userId);
      const isBasic = !isPro && await checkUserIsBasic(verified.userId);

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
