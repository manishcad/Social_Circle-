import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET(request) {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ posts: [], hasMore: false, currentPage: 1, totalPosts: 0 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const userId = session.user.id;

    // Get users the current user is following
    const following = await prisma.follower.findMany({
      where: {
        followerId: userId
      },
      select: {
        followeeId: true
      }
    });

    const followingIds = following.map(f => f.followeeId);

    // Get posts from followed users, your own posts, and some posts from new users
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          // Posts from users you follow
          {
            authorId: {
              in: followingIds
            }
          },
          // Your own posts
          {
            authorId: userId
          },
          // Some posts from new users (limit to 3 per page for discovery)
          {
            authorId: {
              notIn: [...followingIds, userId] // Exclude followed users and self
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    // Check if there are more posts
    const totalPosts = await prisma.post.count({
      where: {
        OR: [
          {
            authorId: {
              in: followingIds
            }
          },
          {
            authorId: userId
          },
          {
            authorId: {
              notIn: [...followingIds, userId]
            }
          }
        ]
      }
    });

    const hasMore = offset + limit < totalPosts;

    return Response.json({
      posts,
      hasMore,
      currentPage: page,
      totalPosts
    });

  } catch (error) {
    console.error("Error fetching feed:", error);
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      return Response.json({ posts: [], hasMore: false, currentPage: 1, totalPosts: 0 });
    }
    return Response.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
} 