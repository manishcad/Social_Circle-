import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ following: [] });
    }

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get users that the current user is following
    const following = await prisma.follower.findMany({
      where: {
        followerId: userId
      },
      include: {
        followee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            _count: {
              select: {
                followers: true,
                following: true,
                posts: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to return just the followee user data
    const followingUsers = following.map(follow => follow.followee);

    return Response.json({ following: followingUsers });

  } catch (error) {
    console.error("Error fetching following:", error);
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ following: [] });
    }
    return Response.json({ error: "Failed to fetch following" }, { status: 500 });
  }
} 