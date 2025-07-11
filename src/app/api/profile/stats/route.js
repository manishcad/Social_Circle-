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

    // Get followers count (people following this user)
    const followersCount = await prisma.follower.count({
      where: {
        followeeId: userId
      }
    });

    // Get following count (people this user is following)
    const followingCount = await prisma.follower.count({
      where: {
        followerId: userId
      }
    });

    // Get posts count for this user
    const postsCount = await prisma.post.count({
      where: {
        authorId: userId
      }
    });

    return Response.json({
      followers: followersCount,
      following: followingCount,
      posts: postsCount
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return Response.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
} 