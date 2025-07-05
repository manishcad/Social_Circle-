import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../lib/prisma";

export async function GET() {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ posts: [] });
    }

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all posts by the current user, ordered by creation date (newest first)
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    return Response.json({ posts });

  } catch (error) {
    console.error("Error fetching posts:", error);
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ posts: [] });
    }
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
} 