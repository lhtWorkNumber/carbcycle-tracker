import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/supabase/server";

export async function getDbUserForAuthUser(authUserId: string) {
  return prisma.user.findUnique({
    where: {
      auth_user_id: authUserId
    }
  });
}

export async function getCurrentDbUser() {
  const context = await getCurrentDbUserContext();
  return context.user;
}

export async function getCurrentDbUserContext() {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return {
      status: "unauthenticated" as const,
      authUser: null,
      user: null
    };
  }

  const user = await getDbUserForAuthUser(authUser.id);

  if (!user) {
    return {
      status: "missing_profile" as const,
      authUser,
      user: null
    };
  }

  return {
    status: "ready" as const,
    authUser,
    user
  };
}
