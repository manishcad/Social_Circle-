'use client'
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('user');
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [eventSource, setEventSource] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth");
      return;
    }

    fetchConversations();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      setSelectedConversation(conversations.find(c => c.userId === selectedUserId));
      
      // Set up real-time streaming for this conversation
      setupRealTimeStreaming(selectedUserId);
    }
  }, [selectedUserId, conversations]);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        
        // If there's a selected user from URL, find their conversation
        if (selectedUserId) {
          const conversation = data.conversations.find(c => c.userId === selectedUserId);
          setSelectedConversation(conversation);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);
    setMessage("");

    // Optimistically add message to UI immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageContent,
      senderId: session.user.id,
      receiverId: selectedConversation.userId,
      createdAt: new Date().toISOString(),
      sender: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image
      },
      receiver: {
        id: selectedConversation.userId,
        name: selectedConversation.user.name,
        image: selectedConversation.user.image
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: messageContent
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? data.data : msg
        ));
        // Refresh conversations to update last message
        fetchConversations();
        setMessage("Message sent successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        // Remove optimistic message if failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setMessage(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessage("Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  const setupRealTimeStreaming = (userId) => {
    // Close existing event source
    if (eventSource) {
      eventSource.close();
    }

    // Create new event source for real-time messages
    const newEventSource = new EventSource(`/api/messages/stream?userId=${userId}`);
    
    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          // Check if this message is not already in our messages array using the previous state
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === data.message.id);
            
            if (!messageExists) {
              // Also refresh conversations to update last message
              fetchConversations();
              return [...prev, data.message];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    newEventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      newEventSource.close();
    };

    setEventSource(newEventSource);
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.userId);
    // Update URL without page reload
    router.push(`/messages?user=${conversation.userId}`, { scroll: false });
    // On mobile, hide conversations after selection
    setShowConversations(false);
  };

  if (status === "loading" || isLoading) {
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
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-sm sm:text-base text-gray-600">Connect with your friends</p>
        </div>

        {/* Message Status */}
        {message && (
          <div className={`text-center mb-4 sm:mb-6 p-3 rounded-lg text-sm sm:text-base ${
            message.includes("successfully") 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row h-[500px] sm:h-[600px]">
            {/* Conversations List - Mobile Toggle Button */}
            <div className="lg:hidden p-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  {selectedConversation ? selectedConversation.user.name : 'Select Conversation'}
                </span>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Conversations List */}
            <div className={`lg:w-1/3 border-r border-gray-200 bg-gray-50 ${
              showConversations ? 'block' : 'hidden lg:block'
            }`}>
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              
              <div className="overflow-y-auto max-h-[200px] sm:max-h-[300px] lg:max-h-none">
                {conversations.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-gray-500">No conversations yet</p>
                    <p className="text-xs sm:text-sm text-gray-400">Start messaging your friends!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedConversation?.userId === conversation.userId ? 'bg-indigo-50 border-indigo-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="relative flex-shrink-0">
                          {conversation.user.image ? (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-gray-200">
                              <Image
                                src={conversation.user.image}
                                alt={conversation.user.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                              {conversation.user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                            {conversation.user.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="lg:hidden">
                        <button
                          onClick={() => setShowConversations(true)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="relative">
                        {selectedConversation.user.image ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-200">
                            <Image
                              src={selectedConversation.user.image}
                              alt={selectedConversation.user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            {selectedConversation.user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedConversation.user.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm sm:text-base text-gray-500">No messages yet</p>
                        <p className="text-xs sm:text-sm text-gray-400">Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg) => {
                          const isOwnMessage = msg.senderId === session.user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] sm:max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm break-words">{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
                                }`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
                    <div className="flex space-x-2 sm:space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm sm:text-base"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="px-4 py-2 sm:px-6 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                      >
                        {isSending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-sm sm:text-base text-gray-500">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 