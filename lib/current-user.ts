import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/supabase/server";

export async function getCurrentDbUser() {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      auth_user_id: authUser.id
    }
  });

  return user;
}
