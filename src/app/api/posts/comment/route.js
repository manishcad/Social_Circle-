import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, content } = await request.json();

    if (!postId || !content || content.trim() === "") {
      return Response.json({ error: "Post ID and content are required" }, { status: 400 });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: postId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return Response.json({ 
      success: true, 
      comment,
      message: "Comment added successfully" 
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return Response.json({ error: "Failed to add comment" }, { status: 500 });
  }
} 