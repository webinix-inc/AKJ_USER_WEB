import { message } from "antd";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaSearch } from "react-icons/fa";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { IoIosArrowForward, IoMdCheckbox, IoMdDoneAll } from "react-icons/io";
import { IoLinkOutline } from "react-icons/io5";
import { format } from "rsuite/esm/internals/utils/date";
import { io } from "socket.io-client";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import { useUser } from "../../Context/UserContext";
import img2 from "../../Image2/LOGO.jpeg";
import { UI_CONSTANTS } from "../../utils/constants";

// Lazy load heavy components
const EmojiPicker = lazy(() => import("emoji-picker-react"));

// commented by Himanshu
// const ReactMic = lazy(() => import('react-mic'));

// Initialize socket connection with better configuration for scalability
// Centralized socket configuration - Fixed URL to match backend (removed trailing slash)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://lms-backend-724799456037.europe-west1.run.app";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  // FIX: Add connection management for better scalability
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
  // Reduce memory usage per connection
  forceNew: false,
  // Connection pooling settings
  multiplex: true,
});

const limitOnUser = UI_CONSTANTS.MAX_CONCURRENT_USERS; // Use centralized constant
const MAX_MESSAGES_PER_CHAT = UI_CONSTANTS.MAX_MESSAGES_PER_CHAT; // Use centralized constant

const Messages = () => {
  const { userData } = useUser();
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [currentMessages, setCurrentMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const storedNotifications = localStorage.getItem("unreadNotifications");
    return storedNotifications ? JSON.parse(storedNotifications) : {};
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  // FIX: Add connection status monitoring
  const [socketConnected, setSocketConnected] = useState(false);

  // Save notifications to local storage when they change
  useEffect(() => {
    localStorage.setItem(
      "unreadNotifications",
      JSON.stringify(unreadNotifications)
    );
  }, [unreadNotifications]);

  useEffect(() => {
    setActiveIndex(1);
  }, []);

  // FIX: Add proper WebSocket connection cleanup and monitoring
  useEffect(() => {
    // Setup socket connection with cleanup
    const handleMessage = (message) => {
      const normalized = normalizeMessages([message]);

      if (
        selectedUser &&
        (message.receiver === selectedUser._id ||
          message.sender === selectedUser._id)
      ) {
        setCurrentMessages((prevMessages) => {
          // FIX: Prevent memory leak by limiting message array size
          const newMessages = sortMessages([...prevMessages, ...normalized]);
          return limitMessageArray(newMessages);
        });
        setUnreadNotifications((prev) => ({
          ...prev,
          [selectedUser._id]: 0,
        }));
      } else {
        setUnreadNotifications((prev) => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1,
        }));
      }
    };

    // Connection event handlers for better reliability
    const handleConnect = () => {
      console.log('Socket connected');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    };

    // Add event listeners
    socket.on("message", handleMessage);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // Set initial connection status
    setSocketConnected(socket.connected);

    // Cleanup function to remove event listeners
    return () => {
      socket.off("message", handleMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [selectedUser]); // Re-run when selectedUser changes

  const [showAllUsers, setShowAllUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/chat/getUsersBasedOnRoles", {
        params: { page: 1, limitOnUser },
      });
      setAllUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  console.log("Show all users all:", showAllUsers);

  // Open the modal to display all users
  const handleOpenAllUsers = () => {
    setShowAllUsers(true);
    fetchAllUsers();
  };

  // Close the modal
  const handleCloseAllUsers = () => {
    setShowAllUsers(false);
  };

  // Select a user from the modal and start chatting
  const handleSelectUser = (user) => {
    setShowAllUsers(false);
    handleUserClick(null, user);
  };

  // Helper function to limit message array size and prevent memory leaks
  const limitMessageArray = (messages, maxSize = MAX_MESSAGES_PER_CHAT) => {
    if (messages.length > maxSize) {
      return messages.slice(-maxSize); // Keep only the latest messages
    }
    return messages;
  };

  const normalizeMessages = (msgs = []) =>
    msgs.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
    }));

  const sortMessages = (msgs) =>
    [...msgs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/chat/users/withMessages", {
          params: { page: 1, limit: 10 },
        });
        const usersWithUnread = response.data.users.reduce((acc, user) => {
          acc[user._id] = user.unreadCount || 0;
          return acc;
        }, {});

        setData(response.data.users);
        setUnreadNotifications((prev) => ({ ...prev, ...usersWithUnread }));

        // Automatically select the first user if there are users
        if (response.data.users.length > 0) {
          handleUserClick(0, response.data.users[0]);
        }
      } catch (error) {
        // Error fetching users, but continue silently
      }
    };
    fetchUsers();
  }, []);

  const isRead = data.isRead;

  const { logout, profileData } = useUser();

  // Socket event listener moved to useEffect above for proper cleanup

  // Handle user selection and fetch their messages
  const handleUserClick = async (index, user) => {
    if (!user) return; // Just a safety check

    setActiveIndex(index);
    setSelectedUser(user);
    setMessageInput("");
    setCurrentMessages([]);
    setUnreadNotifications((prev) => ({
      ...prev,
      [user._id]: 0,
    }));
    
    // Mark messages as read when opening chat
    try {
      await api.get(`/chat/markAsRead/${user._id}`);
      // Update local state to remove unread count
      setData(prevData => 
        prevData.map(u => 
          u._id === user._id 
            ? { ...u, unreadCount: 0 }
            : u
        )
      );
    } catch (error) {
      // Error marking messages as read, but continue silently
    }
    
    await fetchMessages(user._id);
  };

  // FIX: Enhanced fetch messages with better pagination and memory management
  const fetchMessages = async (receiverId, cursor = null) => {
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat/${receiverId}`, {
        params: { 
          cursor, 
          limit: UI_CONSTANTS.MESSAGE_FETCH_LIMIT // Use centralized constant
        },
      });
      const {
        data: { data: fetchedMessages, nextCursor },
      } = response;

      const normalized = normalizeMessages(fetchedMessages).reverse();

      setCurrentMessages((prevMessages) => {
        // FIX: Prevent memory leak with smarter message management
        let newMessages;
        if (cursor) {
          // Loading more messages - append to existing
          newMessages = sortMessages([...prevMessages, ...normalized]);
        } else {
          // Initial load - replace existing
          newMessages = normalized;
        }
        
        // Always apply memory limit but be smarter about it
        return limitMessageArray(newMessages, MAX_MESSAGES_PER_CHAT);
      });
      setCursor(nextCursor);
    } catch (error) {
      console.error("Error fetching messages:", error);
      // FIX: Better error handling - don't crash the chat
      if (error.response?.status === 401) {
        console.warn("Authentication error in chat");
      } else if (error.response?.status >= 500) {
        console.error("Server error in chat");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !userData) return;

    const messageToSend = {
      _id: Date.now().toString(),
      content: messageInput,
      sender: userData.userId,
      receiverId: selectedUser._id,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setCurrentMessages((prev) => {
      // FIX: Prevent memory leak by limiting message array size
      const newMessages = sortMessages([...prev, normalizeMessages([messageToSend])[0]]);
      return limitMessageArray(newMessages);
    });

    try {
      await api.post("/chat/send", {
        receiverId: selectedUser._id,
        message: messageInput,
      });
      socket.emit("message", {
        receiverId: selectedUser._id,
        message: messageInput,
        timestamp: messageToSend.timestamp,
      });
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setCurrentMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageToSend._id)
      );
    }
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleRecordStart = () => {
    setIsRecording(true);
  };

  const handleRecordStop = (recordedBlob) => {
    setIsRecording(false);
    // FIX: Prevent memory leak by limiting message array size
    const newMessages = [
      ...currentMessages,
      { message: "Voice message sent!", sender: userData.userId },
    ];
    setCurrentMessages(limitMessageArray(newMessages));
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || !files.length || !selectedUser) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("attachments", file));
    formData.append("receiverId", selectedUser._id);

    try {
      const res = await api.post("/chat/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { data: sentMessage } = res.data;
      setCurrentMessages((prev) => {
        // FIX: Prevent memory leak by limiting message array size
        const newMessages = sortMessages([...prev, ...normalizeMessages([sentMessage])]);
        return limitMessageArray(newMessages);
      });

      socket.emit("message", sentMessage);
    } catch (err) {
      console.error("File upload failed:", err);
      message.error("File upload failed");
    } finally {
      e.target.value = ""; // Reset input so same file can be reselected
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(timestamp)) / 1000);

    const timeFrames = [
      { label: "second", seconds: 1 },
      { label: "minute", seconds: 60 },
      { label: "hour", seconds: 3600 },
      { label: "day", seconds: 86400 },
      { label: "month", seconds: 2592000 },
      { label: "year", seconds: 31536000 },
    ];

    for (const { label, seconds } of timeFrames.reverse()) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return `${interval} ${label}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  };

  // const handleOutsideClick = (e) => {
  //     if (searchRef.current && !searchRef.current.contains(e.target)) {
  //       setIsSearchOpen(false);
  //     }
  //   };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  console.log("Filter User:", filteredUsers);

  console.log("Content data print:", currentMessages);

  return (
    <div className="w-full animate-apple-fade-in">
      {/* Hero Section - Compact */}
      <div className="relative overflow-hidden gradient-apple-primary text-white compact-hero rounded-apple-xl mb-4 shadow-apple mx-4">
        <div className="absolute inset-0 bg-black/10 rounded-apple-xl"></div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <h1 className="app-subtitle text-white mb-2 font-apple">
            💬 <span className="text-brand-accent">Messages</span>
          </h1>
          <p className="app-body text-apple-blue-100 max-w-2xl mx-auto">
            Connect with instructors and get instant support
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        <div className="card-apple shadow-apple overflow-hidden">
          <div className="flex h-[80vh]">
            {/* Sidebar - User List */}
            <div className="w-1/4 border-r border-apple-gray-200 bg-apple-gray-50">
              {/* Header Section */}
              <div className="p-4 gradient-apple-primary text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <h2 className="app-body font-bold font-apple">Chats</h2>
                    {/* Connection Status Indicator */}
                    <div className={`ml-2 w-2 h-2 rounded-full ${socketConnected ? 'bg-apple-green' : 'bg-apple-red'} animate-apple-pulse`} 
                         title={socketConnected ? 'Connected' : 'Disconnected'}></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      className="p-2 hover:bg-white/20 rounded-apple transition-all duration-200 ease-apple hover-lift"
                    >
                      <FaSearch className="text-white" size={12} />
                    </button>

                    {/* Toggle Section */}
                    <button
                      onClick={handleToggleExpand}
                      className="p-2 hover:bg-white/20 rounded-apple transition-all duration-200 ease-apple hover-lift"
                    >
                      {isExpanded ? (
                        <FaMinus className="text-white" size={12} />
                      ) : (
                        <FaPlus className="text-white" size={12} />
                      )}
                    </button>
                  </div>
                </div>

                {isSearchOpen && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* User List */}
              {isExpanded ? (
                <div className="overflow-y-auto flex-1 p-3">
                  <div className="space-y-1">
                    {filteredUsers.map((user, index) => (
                      <div
                        key={user._id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          activeIndex === index 
                            ? "bg-white shadow-md border border-blue-200" 
                            : "hover:bg-white/50"
                        }`}
                        onClick={() => handleUserClick(index, user)}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <img
                              src={user.image || img2}
                              alt={user.userName}
                              className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#023d50] text-sm truncate">
                              {user.firstName || user.userType}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 p-2">
                  <div className="space-y-1">
                    {data.map((user, index) => (
                      <div
                        key={user._id}
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          activeIndex === index 
                            ? "bg-white shadow-md border border-blue-200" 
                            : "hover:bg-white/50"
                        }`}
                        onClick={() => handleUserClick(index, user)}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <img
                              src={user.image || img2}
                              alt={user.userName}
                              className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-medium text-[#023d50] truncate text-xs">
                                {user.firstName ? 
                                  (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : 
                                  (user.userType === 'ADMIN' ? 'AKJ Classes Admin' : user.userType)
                                }
                              </p>
                              <span className="text-xs text-gray-500 ml-1">
                                {formatTimeAgo(user.lastMessageTime)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-600 truncate">
                                <span className="mr-1">
                                  {user.unreadCount > 0 ? (
                                    <IoMdDoneAll
                                      className="text-gray-400"
                                      title="Unread"
                                      size={12}
                                    />
                                  ) : (
                                    <IoMdCheckbox
                                      className="text-[#0086b2]"
                                      title="Read"
                                      size={12}
                                    />
                                  )}
                                </span>
                                <span className="truncate">{user.lastMessage}</span>
                              </div>
                              {/* Unread Count Badge */}
                              {user.unreadCount > 0 && (
                                <span className="bg-gradient-to-r from-[#fc9721] to-[#ff953a] text-white text-xs rounded-full px-1 py-0.5 min-w-[14px] text-center font-medium ml-1">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="w-3/4 flex flex-col bg-white">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center p-6 border-b border-gray-200 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white">
                    <div className="relative">
                      <img
                        src={selectedUser.profileImage || img2}
                        alt={selectedUser.userName}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-bold">AKJ Classes</h3>
                      <p className="text-blue-200 text-xs">Online • Ready to help</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                    <div className="space-y-4">
                      {currentMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex items-end ${
                            msg.sender === userData.userId ? "justify-end" : "justify-start"
                          }`}
                        >
                          {msg.sender !== userData.userId && (
                            <div className="w-10 h-10 mr-3 flex-shrink-0">
                              <img
                                src={img2 || "https://placehold.jp/50x50.png"}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                              />
                            </div>
                          )}

                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              msg.sender === userData.userId
                                ? "bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white rounded-br-md"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                            }`}
                          >
                    {msg.attachments && msg.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {msg.attachments.map((file, i) => {
                          const isImage = file.mimeType?.startsWith("image/");
                          const isVideo = file.mimeType?.startsWith("video/");
                          const isPDF = file.mimeType === "application/pdf";
                          const isDocument = file.mimeType?.includes("document") || 
                                           file.mimeType?.includes("word") ||
                                           file.mimeType?.includes("excel") ||
                                           file.mimeType?.includes("powerpoint");
                          
                          return (
                            <div key={i} className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                              {isImage ? (
                                <div>
                                  <img
                                    src={file.url}
                                    alt={file.filename}
                                    className="w-40 rounded shadow-md cursor-pointer hover:opacity-80"
                                    crossOrigin="anonymous"
                                    onClick={() => window.open(file.url, '_blank')}
                                    onError={(e) => {
                                      console.error('Image failed to load:', file.url);
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.color = 'red';
                                      e.target.nextElementSibling.innerHTML = `❌ Failed to load: ${file.filename}`;
                                    }}
                                    onLoad={() => console.log('Image loaded successfully:', file.url)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{file.filename}</p>
                                </div>
                              ) : isVideo ? (
                                <div>
                                  <video
                                    src={file.url}
                                    controls
                                    className="w-48 h-auto rounded shadow-md"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{file.filename}</p>
                                </div>
                              ) : isPDF ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 p-2 bg-white rounded"
                                >
                                  <span className="text-2xl">📄</span>
                                  <div>
                                    <p className="font-medium">{file.filename}</p>
                                    <p className="text-xs text-gray-500">PDF Document • {(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </a>
                              ) : isDocument ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 p-2 bg-white rounded"
                                >
                                  <span className="text-2xl">📋</span>
                                  <div>
                                    <p className="font-medium">{file.filename}</p>
                                    <p className="text-xs text-gray-500">Document • {(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </a>
                              ) : (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-green-600 hover:text-green-700 p-2 bg-white rounded"
                                >
                                  <span className="text-2xl">📎</span>
                                  <div>
                                    <p className="font-medium">{file.filename}</p>
                                    <p className="text-xs text-gray-500">File • {(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : msg.content ? (
                      <p>{msg.content}</p>
                    ) : null}

                    <div className="text-xs text-gray-300 mt-2">
                      {msg.createdAt &&
                        format(
                          new Date(msg.createdAt),
                          "MMMM dd, yyyy hh:mm a"
                        )}
                    </div>
                  </div>
                </div>
              ))}
                    </div>
                  </div>

                  {/* Message Input Area */}
                  <div className="p-8 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-4">
                      {/* Input Field */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Type your message... (Press Enter to send)"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0086b2] focus:border-transparent shadow-sm text-gray-700 placeholder-gray-400"
                        />
                        {/* Emoji Button */}
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-[#0086b2] transition-colors duration-200"
                        >
                          <BsEmojiSmile size={20} />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-2 z-50">
                            <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-lg">Loading...</div>}>
                              <EmojiPicker onEmojiClick={onEmojiClick} />
                            </Suspense>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="fileUpload"
                          style={{ display: "none" }}
                          multiple
                          onChange={handleFileChange}
                        />

                        <label htmlFor="fileUpload" className="cursor-pointer">
                          <div className="p-3 text-gray-400 hover:text-[#0086b2] hover:bg-blue-50 rounded-full transition-all duration-200">
                            <IoLinkOutline size={20} />
                          </div>
                        </label>

                        {/* Send Button */}
                        <button
                          onClick={handleSendMessage}
                          className="p-3 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white rounded-full hover:from-[#1D0D76] hover:to-[#023d50] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <IoIosArrowForward size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#023d50] to-[#0086b2] rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl text-white">💬</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#023d50] mb-3">Start a Conversation</h3>
                    <p className="text-gray-600 text-lg">Select a user from the list to begin chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HOC(Messages);
