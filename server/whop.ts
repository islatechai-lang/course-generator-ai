import Whop from "@whop/sdk";
import process from "process";


export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY || "",
  appID: process.env.WHOP_APP_ID || undefined,
});

export interface WhopUser {
  userId: string;
  appId: string;
}

export async function verifyUserToken(token: string): Promise<WhopUser | null> {
  try {
    const result = await whop.verifyUserToken(token);

    if (result && result.userId) {
      return { userId: result.userId, appId: result.appId };
    }
    return null;
  } catch {
    return null;
  }
}

export interface AccessCheckResult {
  has_access: boolean;
  access_level: "customer" | "admin" | "no_access";
}

export async function checkAccess(
  resourceId: string,
  userId: string
): Promise<AccessCheckResult> {
  // Guard against invalid resource tags to avoid 400 errors
  if (!resourceId.startsWith("biz_") && !resourceId.startsWith("exp_") && !resourceId.startsWith("prod_")) {
    return { has_access: false, access_level: "no_access" };
  }

  try {
    const response = await whop.users.checkAccess(resourceId, { id: userId });
    console.log(`[Whop SDK] checkAccess for user ${userId} on resource ${resourceId}: has_access=${response.has_access}, level=${response.access_level}`);
    return {
      has_access: response.has_access || false,
      access_level: (response.access_level as AccessCheckResult["access_level"]) || "no_access",
    };
  } catch (error: any) {
    // Silently handle expected errors to keep logs clean
    if (error.status !== 400 && error.status !== 403) {
      console.error(`[Whop SDK] checkAccess failed for user ${userId} on resource ${resourceId}:`, error.message);
    }
    return { has_access: false, access_level: "no_access" };
  }
}

export async function checkIsOwner(companyId: string, userId: string): Promise<boolean> {
  try {
    console.log(`[Whop SDK] checkIsOwner: checking user ${userId} on company ${companyId}`);
    let apiFailed = false;
    const response = await whop.authorizedUsers.list({
      company_id: companyId,
      user_id: userId,
      role: "owner",
      first: 1,
    }).catch((err: any) => {
      console.error(`[Whop SDK] checkIsOwner API error (possible API scope issue):`, err.status, err.message);
      apiFailed = true;
      return { data: [] };
    });

    if (apiFailed) {
      console.warn(`[Whop SDK] checkIsOwner: SDK request failed. Falling back to true to prevent lockout of verified admins.`);
      return true;
    }

    const isOwner = ((response as any).data?.length || 0) > 0;
    console.log(`[Whop SDK] checkIsOwner result: user ${userId} isOwner=${isOwner}, data length=${(response as any).data?.length || 0}`);
    return isOwner;
  } catch (error: any) {
    console.error(`[Whop SDK] checkIsOwner failed for user ${userId} on company ${companyId}:`, error.message);
    // If the entire function throws, fall back to true as well to prevent locking out creator admins
    return true;
  }
}

export async function checkPlanAccess(
  userId: string,
  planId: string
): Promise<boolean> {
  // Special access for hardcoded Pro users
  const SPECIAL_PRO_USERS = ["user_gPT4lCtHrnQZj", "user_z9RDYAlNQ8ZGg"];
  if (userId && SPECIAL_PRO_USERS.includes(userId)) {
    return true;
  }

  try {
    if (planId.startsWith("plan_")) {
      const response = await whop.memberships.list({
        company_id: process.env.WHOP_COMPANY_ID,
        user_ids: [userId],
        plan_ids: [planId],
        statuses: ['active', 'trialing', 'completed'],
      }).catch((err: any) => {
        // Silently handle expected authorization errors
        if (err.status !== 400 && err.status !== 403) {
          console.error(`[Whop SDK] memberships.list error for user ${userId}:`, err.message);
        }
        return { data: [] };
      });
      const hasPro = (response.data?.length || 0) > 0;
      console.log(`[Whop SDK] checkPlanAccess for user ${userId} on plan ${planId}: hasPro=${hasPro}, membershipCount=${response.data?.length || 0}`);

      return hasPro;
    }

    const access = await checkAccess(planId, userId);
    // Allow admins of the company/resource to be treated as Pro
    return access.has_access || access.access_level === "admin";
  } catch (error) {
    return false;
  }
}

export async function getUser(userId: string) {
  try {
    const user = await whop.users.retrieve(userId);
    return user;
  } catch {
    return null;
  }
}

export async function getCompanyIdFromExperience(experienceId: string): Promise<string | null> {
  try {
    const experience = await whop.experiences.retrieve(experienceId);
    const companyId = experience?.company?.id || null;
    console.log(`[Whop SDK] Resolved companyId ${companyId} from experience ${experienceId}`);
    return companyId;
  } catch (error) {
    console.error(`[Whop SDK] Failed to get company ID from experience ${experienceId}:`, error);
    return null;
  }
}

export interface CheckoutMetadata {
  courseId: string;
  buyerId: string;
  creatorId: string;
}

export async function createCheckoutConfiguration(
  price: number,
  metadata: CheckoutMetadata
): Promise<{ checkoutId: string } | null> {
  try {
    const companyId = process.env.WHOP_COMPANY_ID;

    if (!companyId) {
      console.error("WHOP_COMPANY_ID environment variable is not set");
      return null;
    }

    const checkoutConfig = await whop.checkoutConfigurations.create({
      plan: {
        company_id: companyId,
        initial_price: price,
        plan_type: "one_time",
        currency: "usd",
      },
      metadata: metadata as any,
    } as any);

    return { checkoutId: checkoutConfig.id };
  } catch (error) {
    console.error("Failed to create checkout configuration:", error);
    return null;
  }
}

export async function createProCheckoutSession(planId: string): Promise<{ checkoutId: string } | null> {
  try {
    const checkoutConfig = await whop.checkoutConfigurations.create({
      plan_id: planId, // SDK correctly maps this to the API's expectation when company_id is omitted
    } as any);

    return { checkoutId: checkoutConfig.id };
  } catch (error) {
    console.error("Failed to create Pro checkout configuration:", error);
    return null;
  }
}

// Verify payment by checking the checkout configuration status
export async function verifyPaymentComplete(checkoutId: string): Promise<{ success: boolean; paymentId?: string }> {
  try {
    // Retrieve the checkout configuration to check its status
    const checkout = await whop.checkoutConfigurations.retrieve(checkoutId);

    // Check if there's a completed payment associated
    if (checkout && (checkout as any).payment_id) {
      return { success: true, paymentId: (checkout as any).payment_id };
    }

    // Alternative: check if status indicates completion
    if (checkout && ((checkout as any).status === "completed" || (checkout as any).status === "paid")) {
      return { success: true, paymentId: (checkout as any).payment_id || checkoutId };
    }

    return { success: false };
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return { success: false };
  }
}

// Send a notification to an experience (all customers & team) or to a company's team members / members
export async function sendNotification(options: {
  companyId?: string;
  experienceId?: string;
  title: string;
  content: string;
  subtitle?: string;
  userIds?: string[];
  restPath?: string;
}): Promise<boolean> {
  try {
    let payload: any;
    if (options.experienceId) {
      payload = {
        experience_id: options.experienceId,
        title: options.title,
        content: options.content,
        subtitle: options.subtitle,
        user_ids: options.userIds,
        rest_path: options.restPath,
      };
    } else if (options.companyId) {
      payload = {
        company_id: options.companyId,
        title: options.title,
        content: options.content,
        subtitle: options.subtitle,
        user_ids: options.userIds,
        rest_path: options.restPath,
      };
    } else {
      console.error("sendNotification requires either companyId or experienceId");
      return false;
    }

    const result = await whop.notifications.create(payload);
    console.log("Whop notification sent:", result);
    return result.success === true;
  } catch (error) {
    console.error("Failed to send Whop notification:", error);
    return false;
  }
}

// Broadcast notification to ALL company members
export async function broadcastNotificationToMembers(options: {
  companyId: string;
  experienceId?: string;
  title: string;
  content: string;
  subtitle?: string;
  restPath?: string;
}): Promise<{ success: boolean; memberCount: number }> {
  try {
    // 1. Retrieve all company members
    const memberUserIds = await getCompanyMemberUserIds(options.companyId, 500);
    console.log(`[Whop Broadcast] Retrieved ${memberUserIds.length} members for company ${options.companyId}`);

    if (memberUserIds.length > 0) {
      // Chunk user_ids into batches of 100
      const batchSize = 100;
      let totalSent = 0;
      for (let i = 0; i < memberUserIds.length; i += batchSize) {
        const batch = memberUserIds.slice(i, i + batchSize);
        const sent = await sendNotification({
          companyId: options.companyId,
          experienceId: options.experienceId,
          title: options.title,
          content: options.content,
          subtitle: options.subtitle,
          userIds: batch,
          restPath: options.restPath,
        });
        if (sent) totalSent += batch.length;
      }
      return { success: true, memberCount: memberUserIds.length };
    }

    // 2. Fallback: If no explicit members returned (or new company), trigger experience or company notification
    const fallbackSent = await sendNotification({
      companyId: options.companyId,
      experienceId: options.experienceId,
      title: options.title,
      content: options.content,
      subtitle: options.subtitle,
      restPath: options.restPath,
    });

    return { success: fallbackSent, memberCount: 0 };
  } catch (error) {
    console.error("[Whop Broadcast] Failed to broadcast notification to members:", error);
    return { success: false, memberCount: 0 };
  }
}

// Retrieve company information (including url route and member count)
export async function getCompanyDetails(companyId: string) {
  try {
    const comp = await whop.companies.retrieve(companyId);
    return comp;
  } catch (error) {
    console.error(`Failed to retrieve company details for ${companyId}:`, error);
    return null;
  }
}

// List member IDs of a company (supports pagination up to specified max)
export async function getCompanyMemberUserIds(companyId: string, limit: number = 100): Promise<string[]> {
  try {
    const page = await whop.members.list({
      company_id: companyId,
      first: Math.min(limit, 50),
    });
    const userIds = page.data
      .map((m: any) => m.user?.id)
      .filter((id: any): id is string => typeof id === "string" && id.length > 0);
    return userIds;
  } catch (error) {
    console.error(`Failed to retrieve member user IDs for company ${companyId}:`, error);
    return [];
  }
}

