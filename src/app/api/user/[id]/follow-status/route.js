import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;

    // Check if current user is following the target user
    const followRelationship = await prisma.follower.findUnique({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: id
        }
      }
    });

    const isFollowing = !!followRelationship;

    return Response.json({ isFollowing });

  } catch (error) {
    console.error("Error checking follow status:", error);
    return Response.json({ error: "Failed to check follow status" }, { status: 500 });
  }
} 