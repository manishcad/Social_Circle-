import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all users the current user is following
    const following = await prisma.follower.findMany({
      where: {
        followerId: userId
      },
      select: {
        followeeId: true
      }
    });

    // Create a map of follow status
    const followStatus = {};
    following.forEach(follow => {
      followStatus[follow.followeeId] = true;
    });

    return Response.json({ followStatus });

  } catch (error) {
    console.error("Error fetching follow status:", error);
    return Response.json({ error: "Failed to fetch follow status" }, { status: 500 });
  }
} 