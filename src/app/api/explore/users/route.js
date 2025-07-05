import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ users: [] });
    }

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users except the current user, with follower and post counts
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            posts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return Response.json({ users });

  } catch (error) {
    console.error("Error fetching users:", error);
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ users: [] });
    }
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
} 