import { Resend } from "resend";
import { hash } from "bcryptjs";
import prisma from "../../lib/prisma";
import DOMPurify from 'isomorphic-dompurify';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    
    // Sanitize inputs
    const sanitizedName = DOMPurify.sanitize(name?.trim() || '');
    const sanitizedEmail = DOMPurify.sanitize(email?.trim() || '').toLowerCase();
    
    console.log('Sanitized inputs:', { name: sanitizedName, email: sanitizedEmail });

    // Check if required environment variables are set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500 }
      );
    }

    if (!process.env.EMAIL_FROM) {
      console.error("EMAIL_FROM is not set");
      return new Response(
        JSON.stringify({ error: "Email sender not configured" }),
        { status: 500 }
      );
    }

    if (!process.env.NEXTAUTH_URL) {
      console.error("NEXTAUTH_URL is not set");
      return new Response(
        JSON.stringify({ error: "App URL not configured" }),
        { status: 500 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
      });
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        emailVerified: null, // initially not verified
      },
    });

    // Create a verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store the verification token (you might want to create a separate table for this)
    // For now, we'll use a simple approach with the user's email as identifier
    
    // Send verification email with a link to the verification page
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?email=${sanitizedEmail}&token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: sanitizedEmail,
        subject: "Verify your email",
        html: `
          <h2>Verify Your Email</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>After verification, you can login with your email and password.</p>
        `,
      });
      console.log("Email sent successfully to:", sanitizedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Delete the user if email fails
      await prisma.user.delete({ where: { email: sanitizedEmail } });
      return new Response(
        JSON.stringify({ error: "Failed to send verification email. Please try again." }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Check your email to verify your account." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "Registration failed. Please try again." }),
      { status: 500 }
    );
  }
}
