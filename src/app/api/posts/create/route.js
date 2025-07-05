import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
  // Configure Cloudinary inside the function to avoid build-time issues
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const content = formData.get("content");
    const imageFile = formData.get("image");
    const userId = session.user.id;

    let imageUrl = null;

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
          return Response.json({ error: "Please upload a valid image file" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          return Response.json({ error: "Image size should be less than 5MB" }, { status: 400 });
        }

        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'social-circle/posts',
              public_id: `post_${userId}_${Date.now()}`,
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        imageUrl = result.secure_url;
      } catch (error) {
        console.error("Image upload error:", error);
        return Response.json({ error: "Failed to upload image" }, { status: 400 });
      }
    }

    const post = await prisma.post.create({
      data: {
        title: title || null,
        content: content,
        image: imageUrl,
        authorId: userId
      }
    });

    return Response.json({ 
      success: true, 
      post,
      message: "Post created successfully" 
    });

  } catch (error) {
    console.error("Error creating post:", error);
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
} 