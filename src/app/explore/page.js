'use client'
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [followStatus, setFollowStatus] = useState({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth");
      return;
    }

    fetchUsers();
    fetchFollowStatus();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/explore/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
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
        
        // Refresh users to update follower counts
        fetchUsers();
      } else {
        setMessage("Failed to follow/unfollow user");
      }
    } catch (error) {
      console.error("Error following user:", error);
      setMessage("Error following user");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  // Gradient colors for user cards
  const gradients = [
    "from-pink-400 via-purple-500 to-indigo-600",
    "from-blue-400 via-cyan-500 to-teal-600",
    "from-green-400 via-emerald-500 to-teal-600",
    "from-yellow-400 via-orange-500 to-red-600",
    "from-purple-400 via-pink-500 to-red-600",
    "from-indigo-400 via-purple-500 to-pink-600",
    "from-teal-400 via-cyan-500 to-blue-600",
    "from-orange-400 via-red-500 to-pink-600",
    "from-emerald-400 via-teal-500 to-cyan-600",
    "from-violet-400 via-purple-500 to-indigo-600"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-white to-green-500">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Explore</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover new people and connect with them</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`text-center mb-4 sm:mb-6 p-3 rounded-lg text-sm sm:text-base ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-black/90 backdrop-blur-sm text-sm sm:text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Find Users</h2>
            <div className="text-xs sm:text-sm text-gray-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base sm:text-lg">No users found</p>
              <p className="text-gray-400 text-sm sm:text-base">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredUsers.map((user, index) => {
                const gradient = gradients[index % gradients.length];
                const isFollowing = followStatus[user.id] || false;
                
                return (
                  <div key={user.id} className="group">
                    <div 
                      className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}
                      onClick={() => router.push(`/user/${user.id}`)}
                    >
                      {/* Card Header */}
                      <div className="p-6 text-white">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            {user.image ? (
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                                <Image
                                  src={user.image}
                                  alt={user.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{user.name}</h3>
                            <p className="text-white/80 text-sm">{user.email}</p>
                          </div>
                        </div>

                        {/* User Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{user._count?.followers || 0}</div>
                            <div className="text-xs text-white/80">Followers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{user._count?.posts || 0}</div>
                            <div className="text-xs text-white/80">Posts</div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={user.id === session.user.id}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            user.id === session.user.id
                              ? "bg-white/20 text-white/60 cursor-not-allowed"
                              : isFollowing
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "bg-white text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          {user.id === session.user.id 
                            ? "This is you" 
                            : isFollowing 
                            ? "Following" 
                            : "Follow"
                          }
                        </button>
                      </div>

                      {/* Card Footer */}
                      <div className="bg-white/10 backdrop-blur-sm p-4">
                        <div className="flex items-center justify-between text-white/80 text-sm">
                          <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 