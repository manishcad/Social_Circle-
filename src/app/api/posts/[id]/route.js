import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Check if the post exists and belongs to the current user
    const post = await prisma.post.findFirst({
      where: {
        id: id,
        authorId: userId
      }
    });

    if (!post) {
      return Response.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    // Delete the post (cascade will handle likes and comments)
    await prisma.post.delete({
      where: {
        id: id
      }
    });

    return Response.json({ 
      success: true, 
      message: "Post deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
} 