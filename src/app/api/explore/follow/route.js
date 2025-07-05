import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    const currentUserId = session.user.id;

    // Check if already following
    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: userId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follower.delete({
        where: {
          followerId_followeeId: {
            followerId: currentUserId,
            followeeId: userId
          }
        }
      });

      return Response.json({ 
        success: true, 
        isFollowing: false,
        message: "User unfollowed successfully" 
      });
    } else {
      // Follow
      await prisma.follower.create({
        data: {
          followerId: currentUserId,
          followeeId: userId
        }
      });

      return Response.json({ 
        success: true, 
        isFollowing: true,
        message: "User followed successfully" 
      });
    }

  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return Response.json({ error: "Failed to follow/unfollow user" }, { status: 500 });
  }
} 