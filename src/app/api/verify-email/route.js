import prisma from "../../lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }),
        { status: 400 }
      );
    }

    // Find the user (email is not encoded now)
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return new Response(
        JSON.stringify({ message: "Email is already verified" }),
        { status: 200 }
      );
    }

    // Update the user's emailVerified field
    await prisma.user.update({
      where: { email: email },
      data: {
        emailVerified: new Date()
      }
    });

    // Redirect to login page with success message
    const redirectUrl = `${process.env.NEXTAUTH_URL}/auth?verified=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl
      }
    });

  } catch (error) {
    console.error("Email verification error:", error);
    return new Response(
      JSON.stringify({ error: "Email verification failed" }),
      { status: 500 }
    );
  }
} 