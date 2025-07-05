import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get all posts by the user, ordered by creation date (newest first)
    const posts = await prisma.post.findMany({
      where: {
        authorId: id
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
        }
      }
    });

    return Response.json({ posts });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    return Response.json({ error: "Failed to fetch user posts" }, { status: 500 });
  }
} 