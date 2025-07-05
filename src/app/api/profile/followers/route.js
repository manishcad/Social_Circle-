import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ followers: [] });
    }

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get users who are following the current user
    const followers = await prisma.follower.findMany({
      where: {
        followeeId: userId
      },
      include: {
        follower: {
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

    // Transform the data to return just the follower user data
    const followerUsers = followers.map(follow => follow.follower);

    return Response.json({ followers: followerUsers });

  } catch (error) {
    console.error("Error fetching followers:", error);
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ followers: [] });
    }
    return Response.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
} 