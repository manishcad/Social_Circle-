import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get all users with base64 images
    const usersWithBase64Images = await prisma.user.findMany({
      where: {
        image: {
          startsWith: 'data:'
        }
      }
    });

    let cleanedCount = 0;

    for (const user of usersWithBase64Images) {
      try {
        const base64Data = user.image;
        
        // Extract the base64 data
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) continue;
        
        const [, mimeType, base64String] = matches;
        const buffer = Buffer.from(base64String, 'base64');
        
        // Determine file extension from mime type
        const extension = mimeType.split('/')[1] || 'jpg';
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}-${randomString}.${extension}`;
        
        // Save file to public/uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);
        
        // Update user with new image path
        await prisma.user.update({
          where: { id: user.id },
          data: {
            image: `/uploads/${fileName}`
          }
        });
        
        cleanedCount++;
        
      } catch (error) {
        console.error(`Failed to clean up image for user ${user.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Cleaned up ${cleanedCount} base64 images`,
        cleanedCount
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Image cleanup error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to cleanup images" }),
      { status: 500 }
    );
  }
} 