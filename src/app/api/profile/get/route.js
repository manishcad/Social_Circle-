import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    return new Response(
      JSON.stringify({ 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified
        },
        session: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          emailVerified: session.user.emailVerified
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Get profile error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get profile" }),
      { status: 500 }
    );
  }
} 