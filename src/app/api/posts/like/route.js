import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await request.json();
    const userId = session.user.id;

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId
        }
      }
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId
          }
        }
      });

      return Response.json({ 
        success: true, 
        isLiked: false,
        message: "Post unliked successfully" 
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: userId,
          postId: postId
        }
      });

      return Response.json({ 
        success: true, 
        isLiked: true,
        message: "Post liked successfully" 
      });
    }

  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return Response.json({ error: "Failed to like/unlike post" }, { status: 500 });
  }
} 