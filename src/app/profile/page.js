'use client'
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Add custom styles for animations
const bannerStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.1; }
    50% { opacity: 0.3; }
  }
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animated-gradient {
    background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }
  
  .floating-element {
    animation: float 6s ease-in-out infinite;
  }
  
  .pulsing-element {
    animation: pulse 4s ease-in-out infinite;
  }
`;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // Inject custom styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = bannerStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [userStats, setUserStats] = useState({
    followers: 0,
    following: 0,
    posts: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'followers' or 'following'
  const [modalUsers, setModalUsers] = useState([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth");
      return;
    }

    // Initialize form data with session data
    setFormData({
      name: session.user?.name || "",
      email: session.user?.email || ""
    });
    setPreviewImage(session.user?.image || "");
    setImageError(false);

    // Fetch user stats
    const fetchUserStats = async () => {
      try {
        const response = await fetch("/api/profile/stats");
        if (response.ok) {
          const stats = await response.json();
          setUserStats(stats);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    fetchUserStats();
  }, [session, status, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage("Please select a valid image file");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setImageError(false);
      };
      reader.readAsDataURL(file);
      setMessage(""); // Clear any previous error messages
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDebug = async () => {
    try {
      const response = await fetch("/api/profile/get");
      const data = await response.json();
      console.log("Debug - Database vs Session:", data);
      setMessage(`Debug: DB Image: ${data.user.image}, Session Image: ${data.session.image}`);
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  const handleCreateSamplePost = async () => {
    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Sample Post ${Date.now()}`,
          content: "This is a sample post created for testing the post count functionality."
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("Sample post created successfully! Refreshing stats...");
        
        // Refresh user stats
        const statsResponse = await fetch("/api/profile/stats");
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setUserStats(stats);
        }
      } else {
        setMessage("Failed to create sample post");
      }
    } catch (error) {
      console.error("Error creating sample post:", error);
      setMessage("Error creating sample post");
    }
  };

  const handleOpenModal = async (type) => {
    setModalType(type);
    setShowModal(true);
    setIsLoadingModal(true);
    setModalUsers([]);

    try {
      const endpoint = type === 'followers' ? '/api/profile/followers' : '/api/profile/following';
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setModalUsers(type === 'followers' ? data.followers : data.following);
      } else {
        setMessage("Failed to load users");
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setMessage(`Error loading ${type}`);
    } finally {
      setIsLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setModalUsers([]);
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await fetch("/api/explore/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Remove user from modal list
        setModalUsers(prev => prev.filter(user => user.id !== userId));
        
        // Update user stats
        const statsResponse = await fetch("/api/profile/stats");
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setUserStats(stats);
        }
        
        setMessage("User unfollowed successfully!");
      } else {
        setMessage("Failed to unfollow user");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setMessage("Error unfollowing user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }

      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setSelectedImage(null);
        
        // Update the session with new data
        await update({
          user: {
            name: data.user.name,
            image: data.user.image
          }
        });
        
        // Force a small delay to ensure session is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force session refresh by calling update again
        await update();
        
        // Update local state
        setFormData({
          name: data.user.name,
          email: session.user.email
        });
        setPreviewImage(data.user.image || "");
        setImageError(false);
        
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="h-48 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 animated-gradient"></div>
            
            {/* Geometric pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2v2l-6 6V4zm0 4l8-8h2L42 10V8zm0 4L52 0h2L42 12v-2zm0 4L56 0h2L42 16v-2zm0 4L60 0h2L42 20v-2zm0 4L64 0h2L42 24v-2zm0 4L68 0h2L42 28v-2zm0 4L72 0h2L42 32v-2zm0 4L76 0h2L42 36v-2zm0 4L80 0v2L42 40h-2zm-4 0L80 4v2L46 40h-8zm-4 0L80 8v2L50 40h-12zm-4 0L80 12v2L54 40h-16zm-4 0L80 16v2L58 40h-20zm-4 0L80 20v2L62 40h-24zm-4 0L80 24v2L66 40h-28zm-4 0L80 28v2L70 40h-32zm-4 0L80 32v2L74 40h-36zm-4 0L80 36v2L78 40h-40zm-4 0L80 40v2L80 42h-42zm-4 0L76 44L42 40H0v-2l42 2zm-4 0L72 44L42 40H0v-6l42 6zm-4 0L68 44L42 40H0v-10l42 10zm-4 0L64 44L42 40H0v-14l42 14zm-4 0L60 44L42 40H0v-18l42 18zm-4 0L56 44L42 40H0v-22l42 22zm-4 0L52 44L42 40H0v-26l42 26zm-4 0L48 44L42 40H0v-30l42 30zm-4 0L44 44L42 40H0v-34l42 34zm-4 0L40 44L42 40H0v-38l42 38zm-4 0L36 44L42 40H0v-42l42 42zm-4 0L32 44L42 40H0v-46l42 46zm-4 0L28 44L42 40H0v-50l42 50zm-4 0L24 44L42 40H0v-54l42 54zm-4 0L20 44L42 40H0v-58l42 58zm-4 0L16 44L42 40H0v-62l42 62zm-4 0L12 44L42 40H0v-66l42 66zm-4 0L8 44L42 40H0v-70l42 70zm-4 0L4 44L42 40H0v-74l42 74zm-4 0L0 44L42 40H0v-78l42 78zm-4 0L0 40L42 36H0V0l42 40zm-4 0L0 36L42 32H0V0l42 36zm-4 0L0 32L42 28H0V0l42 32zm-4 0L0 28L42 24H0V0l42 28zm-4 0L0 24L42 20H0V0l42 24zm-4 0L0 20L42 16H0V0l42 20zm-4 0L0 16L42 12H0V0l42 16zm-4 0L0 12L42 8H0V0l42 12zm-4 0L0 8L42 4H0V0l42 8zm-4 0L0 4L42 0H0V0l42 4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px'
              }}></div>
            </div>
            
            {/* Animated floating elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full floating-element"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 bg-white bg-opacity-20 rounded-full pulsing-element"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white bg-opacity-15 rounded-full transform -translate-y-1/2 floating-element" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white bg-opacity-25 rounded-full pulsing-element" style={{animationDelay: '1s'}}></div>
            
            {/* Subtle overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            
            {/* Add some sparkle effects */}
            <div className="absolute top-6 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 floating-element" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-12 right-1/3 w-1 h-1 bg-white rounded-full opacity-80 pulsing-element" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-16 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-70 floating-element" style={{animationDelay: '4s'}}></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Profile Image */}
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {previewImage && !imageError ? (
                    <Image
                      src={previewImage}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                      {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Social Stats */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex space-x-12">
                  {/* Followers */}
                  <div 
                    className="text-center group cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => handleOpenModal('followers')}
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      {userStats.followers > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                          <span>+</span>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-1">{userStats.followers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 font-medium">Followers</div>
                  </div>

                  {/* Following */}
                  <div 
                    className="text-center group cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => handleOpenModal('following')}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-1">{userStats.following.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 font-medium">Following</div>
                  </div>

                  {/* Posts */}
                  <div className="text-center group cursor-pointer hover:scale-105 transition-transform duration-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-1">{userStats.posts.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 font-medium">Posts</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-center mt-6 space-x-3">
                  <button className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Share Profile
                  </button>
                  <button className="px-6 py-2 bg-white/20 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium hover:bg-white/30 transition-all duration-200 border border-gray-200/50">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Invite Friends
                  </button>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`text-center mb-4 p-3 rounded-lg ${
                message.includes("successfully") 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {message}
              </div>
            )}

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isEditing 
                        ? "bg-black border-gray-300" 
                        : "bg-black border-gray-200 text-gray-500"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="w-full px-4 py-3 border rounded-lg bg-black border-gray-200 text-gray-500 cursor-not-allowed"
                    placeholder="Email address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Member since:</span>
                    <span className="ml-2 text-gray-900">
                      {session.user?.emailVerified 
                        ? new Date(session.user.emailVerified).toLocaleDateString()
                        : "Not verified"
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                {!isEditing ? (
                  <>
                    
                    <Link
                      href="/posts"
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      View Posts
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: session.user?.name || "",
                          email: session.user?.email || ""
                        });
                        setPreviewImage(session.user?.image || "");
                        setSelectedImage(null);
                        setMessage("");
                        setImageError(false);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {modalType === 'followers' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold capitalize">{modalType}</h2>
                    <p className="text-white/80 text-sm">
                      {modalUsers.length} {modalType === 'followers' ? 'people following you' : 'people you follow'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoadingModal ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading {modalType}...</p>
                  </div>
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No {modalType} yet</h3>
                  <p className="text-gray-500">
                    {modalType === 'followers' 
                      ? "When people follow you, they'll appear here." 
                      : "People you follow will appear here."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalUsers.map((user, index) => (
                    <div 
                      key={user.id}
                      className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* User Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>

                          {/* User Info */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">
                                {user._count?.posts || 0} posts
                              </span>
                              <span className="text-xs text-gray-400">
                                {user._count?.followers || 0} followers
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          {modalType === 'following' && (
                            <button
                              onClick={() => handleUnfollow(user.id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              Unfollow
                            </button>
                          )}
                          <Link
                            href={`/user/${user.id}`}
                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 