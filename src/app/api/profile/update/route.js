import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name");
    const imageFile = formData.get("image");

    // Validate required fields
    if (!name) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400 }
      );
    }

    // Handle image upload
    let imageUrl = session.user.image;
    
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
          return new Response(
            JSON.stringify({ error: "Please upload a valid image file" }),
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          return new Response(
            JSON.stringify({ error: "Image size should be less than 5MB" }),
            { status: 400 }
          );
        }

        // Convert file to buffer
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'social-circle/profiles',
              public_id: `profile_${session.user.id}_${Date.now()}`,
              overwrite: true,
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        imageUrl = result.secure_url;
        
        // If user had a previous Cloudinary image, delete it
        if (session.user.image && session.user.image.includes('cloudinary.com')) {
          try {
            const publicId = session.user.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.log('Could not delete old image:', error);
          }
        }
        
      } catch (error) {
        console.error("Image processing error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process image" }),
          { status: 400 }
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name,
        image: imageUrl
      }
    });

    console.log("Profile updated successfully:", {
      userId: session.user.id,
      name: updatedUser.name,
      imageUrl: updatedUser.image,
      oldImage: session.user.image
    });

    // Verify the update by fetching the user again
    const verifyUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    console.log("Verification - User in database:", {
      name: verifyUser.name,
      image: verifyUser.image
    });

    return new Response(
      JSON.stringify({ 
        message: "Profile updated successfully",
        user: {
          name: updatedUser.name,
          image: updatedUser.image
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Profile update error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update profile" }),
      { status: 500 }
    );
  }
} 