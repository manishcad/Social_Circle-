'use client'
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [likeStatus, setLikeStatus] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const [commentStatus, setCommentStatus] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  
  const observer = useRef();
  const lastPostRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth");
      return;
    }

    fetchPosts();
    fetchFollowStatus();
  }, [session, status, router]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/home/feed?page=1");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setHasMore(data.hasMore);
        setPage(2);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/home/feed?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(prev => [...prev, ...data.posts]);
        setHasMore(data.hasMore);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    try {
      const response = await fetch("/api/explore/follow-status");
      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data.followStatus);
      }
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikeStatus(prev => ({
          ...prev,
          [postId]: data.isLiked
        }));
        
        // Update post like count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, likes: data.isLiked ? post._count.likes + 1 : post._count.likes - 1 } }
            : post
        ));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await fetch("/api/explore/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowStatus(prev => ({
          ...prev,
          [userId]: data.isFollowing
        }));
        setMessage(data.isFollowing ? "User followed successfully!" : "User unfollowed successfully!");
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleComment = async (postId) => {
    // Check if comments section is currently closed (will be opened)
    const isCurrentlyClosed = !commentStatus[postId];
    
    // Toggle comment section
    setCommentStatus(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // Fetch comments if section is being opened and comments not already loaded
    if (isCurrentlyClosed && !comments[postId]) {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(prev => ({
            ...prev,
            [postId]: data.comments
          }));
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          postId, 
          content: newComment.trim() 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add new comment to the list
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        
        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, comments: post._count.comments + 1 } }
            : post
        ));
        
        setNewComment("");
        setMessage("Comment added successfully!");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setMessage("Failed to add comment");
    }
  };

  const handleShare = (postId) => {
    // Copy post URL to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    setMessage("Post link copied to clipboard!");
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage("");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-white to-green-500">
      {/* Main App Title */}
      <div className="text-center py-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <h1 className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
          Social Circle
        </h1>
        <div className="w-24 h-1 bg-white mx-auto rounded-full mb-6"></div>
        <p className="text-2xl md:text-3xl font-light text-indigo-100">
          Connect With Ours Friends And Family
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-6">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome back, {session.user?.name}! 👋
            </h2>
            <p className="text-xl text-gray-600 mb-2">Discover amazing content from your network</p>
            <p className="text-gray-500">Scroll to explore posts from people you follow and discover new creators</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`text-center mb-6 p-3 rounded-lg ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700" 
              : "bg-blue-100 text-blue-700"
          }`}>
            {message}
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post, index) => {
            const isLiked = likeStatus[post.id] || false;
            const isFollowing = followStatus[post.author.id] || false;
            const isOwnPost = post.author.id === session.user.id;
            
            if (posts.length === index + 1) {
              return (
                <div key={post.id} ref={lastPostRef} className="group">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {post.author.image ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                <Image
                                  src={post.author.image}
                                  alt={post.author.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                {post.author.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/user/${post.author.id}`}
                                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                {post.author.name}
                              </Link>
                              {!isOwnPost && (
                                <button
                                  onClick={() => handleFollow(post.author.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                    isFollowing
                                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                                  }`}
                                >
                                  {isFollowing ? "Following" : "Follow"}
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.author.id === session.user.id ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Your Post
                            </span>
                          ) : post.author.id !== session.user.id && !isFollowing ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              New User
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      {post.title && (
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                      )}
                      <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
                      
                      {post.image && (
                        <div className="mb-4">
                          <div 
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(post.image)}
                          >
                            <Image
                              src={post.image}
                              alt="Post image"
                              width={600}
                              height={400}
                              className="w-full h-64 rounded-lg object-contain bg-gray-100"
                            />
                          </div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-2 transition-all duration-200 ${
                              isLiked 
                                ? "text-red-500 hover:text-red-600" 
                                : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            <svg className={`w-5 h-5 ${isLiked ? "fill-current" : "stroke-current"}`} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post._count?.likes || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleComment(post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post._count?.comments || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShare(post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span>Share</span>
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {post.author.id !== session.user.id && !isFollowing && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              Discover
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {commentStatus[post.id] && (
                        <div className="border-t border-gray-100 pt-4">
                          {/* Comment Form */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="flex-shrink-0">
                              {session.user?.image ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                  <Image
                                    src={session.user.image}
                                    alt={session.user.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-black text-white placeholder-gray-400"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComment.trim()}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Post
                            </button>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {comment.user.image ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                                      <Image
                                        src={comment.user.image}
                                        alt={comment.user.name}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      {comment.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={post.id} className="group">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {post.author.image ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                <Image
                                  src={post.author.image}
                                  alt={post.author.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                {post.author.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/user/${post.author.id}`}
                                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                {post.author.name}
                              </Link>
                              {!isOwnPost && (
                                <button
                                  onClick={() => handleFollow(post.author.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                    isFollowing
                                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                                  }`}
                                >
                                  {isFollowing ? "Following" : "Follow"}
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.author.id === session.user.id ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Your Post
                            </span>
                          ) : post.author.id !== session.user.id && !isFollowing ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              New User
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      {post.title && (
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                      )}
                      <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
                      
                      {post.image && (
                        <div className="mb-4">
                          <div 
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(post.image)}
                          >
                            <Image
                              src={post.image}
                              alt="Post image"
                              width={600}
                              height={400}
                              className="w-full h-64 rounded-lg object-contain bg-gray-100"
                            />
                          </div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-2 transition-all duration-200 ${
                              isLiked 
                                ? "text-red-500 hover:text-red-600" 
                                : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            <svg className={`w-5 h-5 ${isLiked ? "fill-current" : "stroke-current"}`} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post._count?.likes || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleComment(post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post._count?.comments || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleShare(post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span>Share</span>
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {post.author.id !== session.user.id && !isFollowing && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              Discover
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {commentStatus[post.id] && (
                        <div className="border-t border-gray-100 pt-4">
                          {/* Comment Form */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="flex-shrink-0">
                              {session.user?.image ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                  <Image
                                    src={session.user.image}
                                    alt={session.user.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-black text-white placeholder-gray-400"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComment.trim()}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Post
                            </button>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {comment.user.image ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                                      <Image
                                        src={comment.user.image}
                                        alt={comment.user.name}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      {comment.user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading more posts...</p>
          </div>
        )}

        {/* No Posts Message */}
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">Start following people to see their posts here!</p>
            <Link
              href="/explore"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Explore Users
            </Link>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCloseImageModal}
            ></div>
            
            {/* Modal Content */}
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              {/* Close Button */}
              <button
                onClick={handleCloseImageModal}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={selectedImage}
                  alt="Full size image"
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
