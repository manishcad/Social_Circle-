import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Set up SSE headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to message stream' })}\n\n`));

        // Set up polling for new messages
        const pollInterval = setInterval(async () => {
          try {
            // Get latest messages for this conversation
            const messages = await prisma.message.findMany({
              where: {
                OR: [
                  {
                    AND: [
                      { senderId: session.user.id },
                      { receiverId: userId }
                    ]
                  },
                  {
                    AND: [
                      { senderId: userId },
                      { receiverId: session.user.id }
                    ]
                  }
                ]
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                },
                receiver: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            });

            if (messages.length > 0) {
              const latestMessage = messages[0];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'new_message', 
                message: latestMessage 
              })}\n\n`));
            }
          } catch (error) {
            console.error("Error polling messages:", error);
          }
        }, 2000); // Poll every 2 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error("Error in message stream:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 