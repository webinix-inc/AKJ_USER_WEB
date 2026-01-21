import { message } from "antd";
import React, { lazy, Suspense, useEffect, useState, useRef, useCallback } from "react";
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

// Lazy load heavy components (defensive default export handling)
const EmojiPicker = lazy(() =>
  import("emoji-picker-react").then((mod) => ({
    default: mod?.default || mod?.EmojiPicker || mod,
  }))
);

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
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const storedNotifications = localStorage.getItem("unreadNotifications");
    return storedNotifications ? JSON.parse(storedNotifications) : {};
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Refs for scroll management
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const lastMessageCountRef = useRef(0);
  const isScrollingToBottomRef = useRef(false);
  
  // Ref to cancel ongoing fetch requests (prevents race conditions)
  const abortControllerRef = useRef(null);
  // Track the currently loading user to prevent duplicate calls
  const currentlyLoadingUserRef = useRef(null);
  // Guard auto-select to avoid double run in StrictMode
  const hasAutoSelectedRef = useRef(false);
  // Track last request to prevent identical duplicate fetches
  const lastFetchKeyRef = useRef("");

  // ============= ALL UTILITY FUNCTIONS (DEFINED BEFORE EFFECTS) =============
  
  // Helper function to limit message array size and prevent memory leaks
  const limitMessageArray = (messages, maxSize = MAX_MESSAGES_PER_CHAT) => {
    if (messages.length > maxSize) {
      return messages.slice(-maxSize);
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

  // Deduplicate messages by _id
  const deduplicateMessages = (msgs) => {
    const seen = new Set();
    return msgs.filter((msg) => {
      if (seen.has(msg._id)) return false;
      seen.add(msg._id);
      return true;
    });
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (isScrollingToBottomRef.current) return;
    
    isScrollingToBottomRef.current = true;
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
      setTimeout(() => {
        isScrollingToBottomRef.current = false;
      }, 100);
    });
  }, []);

  // Check if user is at bottom of scroll
  const isUserAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Fetch messages with proper pagination and scroll management
  const fetchMessages = useCallback(async (receiverId, cursorParam = null, isLoadingMore = false) => {
    const fetchKey = `${receiverId || "none"}|${cursorParam || "null"}|${isLoadingMore ? "more" : "initial"}`;
    // Prevent duplicate requests for the same user
    if (!isLoadingMore && currentlyLoadingUserRef.current === receiverId) {
      console.log('⚠️ Already loading messages for this user, skipping duplicate request');
      return;
    }
    // Prevent identical request from firing twice
    if (lastFetchKeyRef.current === fetchKey) {
      console.log('⚠️ Duplicate fetch key detected, skipping:', fetchKey);
      return;
    }
    lastFetchKeyRef.current = fetchKey;

    // Cancel any ongoing request to prevent race conditions
    if (abortControllerRef.current) {
      console.log('🚫 Cancelling previous fetch request');
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    if (!isLoadingMore) {
      currentlyLoadingUserRef.current = receiverId;
    }

    if (isLoadingMore) {
      setLoadingOlderMessages(true);
    } else {
      setLoadingMessages(true);
    }

    try {
      const response = await api.get(`/chat/${receiverId}`, {
        signal: controller.signal, // Add abort signal
        params: {
          cursor: cursorParam,
          limit: UI_CONSTANTS.MESSAGE_FETCH_LIMIT
        },
      });
      
      const {
        data: { data: fetchedMessages, nextCursor },
      } = response;

      console.log(`📥 Fetched ${fetchedMessages.length} messages, nextCursor: ${nextCursor}`);

      const normalized = normalizeMessages(fetchedMessages);
      
      setCurrentMessages((prevMessages) => {
        let newMessages;
        
        if (isLoadingMore) {
          const reversedFetched = [...normalized].reverse();
          newMessages = sortMessages([...reversedFetched, ...prevMessages]);
        } else {
          newMessages = sortMessages([...normalized].reverse());
        }

        const deduplicated = deduplicateMessages(newMessages);
        return limitMessageArray(deduplicated, MAX_MESSAGES_PER_CHAT);
      });
      
      setCursor(nextCursor);
      setHasMoreMessages(!!nextCursor && fetchedMessages.length === UI_CONSTANTS.MESSAGE_FETCH_LIMIT);
      
      if (!isLoadingMore) {
        isInitialLoad.current = true;
        setTimeout(() => scrollToBottom('auto'), 100);
      }
      
    } catch (error) {
      // Ignore abort errors (they're expected when cancelling)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🚫 Fetch request was cancelled');
        return;
      }
      
      console.error("Error fetching messages:", error);
      message.error("Failed to load messages");
      
      if (error.response?.status === 401) {
        console.warn("Authentication error in chat");
      } else if (error.response?.status >= 500) {
        console.error("Server error in chat");
      }
    } finally {
      // Clear the abort controller and loading user ref
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (!isLoadingMore && currentlyLoadingUserRef.current === receiverId) {
        currentlyLoadingUserRef.current = null;
      }
      if (lastFetchKeyRef.current === fetchKey) {
        lastFetchKeyRef.current = "";
      }
      
      setLoadingMessages(false);
      setLoadingOlderMessages(false);
    }
  }, [scrollToBottom]);

  // Load more older messages
  const loadMoreMessages = useCallback(async () => {
    if (!selectedUser || !cursor || loadingOlderMessages || !hasMoreMessages) {
      return;
    }

    console.log('📜 Loading more messages with cursor:', cursor);
    
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const previousScrollHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;

    await fetchMessages(selectedUser._id, cursor, true);

    requestAnimationFrame(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollHeightDifference = newScrollHeight - previousScrollHeight;
        container.scrollTop = previousScrollTop + scrollHeightDifference;
      }
    });
  }, [selectedUser, cursor, loadingOlderMessages, hasMoreMessages, fetchMessages]);

  // Handle user selection and fetch their messages
  const handleUserClick = useCallback(async (index, user) => {
    if (!user) return;

    console.log('👤 Selected user:', user);

    // Cancel any ongoing fetch for previous user
    if (abortControllerRef.current) {
      console.log('🚫 User switched - cancelling previous fetch');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentlyLoadingUserRef.current = null;

    setActiveIndex(index);
    setSelectedUser(user);
    setMessageInput("");
    setCurrentMessages([]);
    setCursor(null);
    setHasMoreMessages(true);
    isInitialLoad.current = true;
    lastMessageCountRef.current = 0;
    
    setUnreadNotifications((prev) => ({
      ...prev,
      [user._id]: 0,
    }));

    try {
      await api.get(`/chat/markAsRead/${user._id}`);
      setData(prevData =>
        prevData.map(u =>
          u._id === user._id
            ? { ...u, unreadCount: 0 }
            : u
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    await fetchMessages(user._id);
  }, [fetchMessages]);

  // ============= EFFECTS =============
  
  // Save notifications to local storage when they change
  useEffect(() => {
    localStorage.setItem(
      "unreadNotifications",
      JSON.stringify(unreadNotifications)
    );
  }, [unreadNotifications]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (currentMessages.length > 0) {
      const messageCountChanged = currentMessages.length !== lastMessageCountRef.current;
      const isNewMessage = currentMessages.length > lastMessageCountRef.current;
      
      lastMessageCountRef.current = currentMessages.length;

      if (isInitialLoad.current) {
        // Initial load - always scroll to bottom
        setTimeout(() => scrollToBottom('auto'), 200);
        isInitialLoad.current = false;
      } else if (isNewMessage && messageCountChanged) {
        // New message arrived - scroll if user is already at bottom
        if (isUserAtBottom()) {
          scrollToBottom('smooth');
        }
      }
    }
  }, [currentMessages, scrollToBottom, isUserAtBottom]);

  // Infinite scroll handler with scroll button visibility
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if scrolled to top - load more messages
      if (container.scrollTop < 100 && !loadingOlderMessages && hasMoreMessages) {
        loadMoreMessages();
      }

      // Show/hide scroll to bottom button
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreMessages, loadingOlderMessages, hasMoreMessages]);

  useEffect(() => {
    setActiveIndex(1);

    // Join user's own room to receive real-time messages
    if (userData?.userId) {
      socket.emit("join", userData.userId);
      console.log("User joined socket room:", userData.userId);
    }
  }, [userData]);

  // ============= SOCKET MANAGEMENT =============
  
  useEffect(() => {
    // Setup socket connection with cleanup
    const handleMessage = (message) => {
      console.log('📨 Received socket message:', message);
      const normalized = normalizeMessages([message]);

      if (
        selectedUser &&
        (message.receiver === selectedUser._id ||
          message.sender === selectedUser._id)
      ) {
        // Message is for current chat - add it and scroll if at bottom
        const wasAtBottom = isUserAtBottom();
        
        setCurrentMessages((prevMessages) => {
          const newMessages = sortMessages([...prevMessages, ...normalized]);
          const deduplicated = deduplicateMessages(newMessages);
          return limitMessageArray(deduplicated);
        });
        
        setUnreadNotifications((prev) => ({
          ...prev,
          [selectedUser._id]: 0,
        }));

        // Scroll to bottom if user was at bottom
        if (wasAtBottom) {
          setTimeout(() => scrollToBottom('smooth'), 100);
        }

        // Move user to top and update last message
        setData((prevData) => {
          const userIndex = prevData.findIndex(u => u._id === selectedUser._id);
          if (userIndex !== -1) {
            const user = {
              ...prevData[userIndex],
              lastMessage: message.content || '📎 Attachment',
              lastMessageTime: message.createdAt || new Date().toISOString()
            };
            return [user, ...prevData.filter(u => u._id !== selectedUser._id)];
          }
          return prevData;
        });
      } else {
        // Message from a user that is NOT currently selected
        // Increment their unread count
        const senderId = message.sender?.toString() || message.sender;

        setUnreadNotifications((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

        // Update data state to show unread count badge and move user to top
        setData((prevData) => {
          const userIndex = prevData.findIndex(u =>
            u._id === senderId || u._id?.toString() === senderId
          );

          if (userIndex !== -1) {
            const user = {
              ...prevData[userIndex],
              unreadCount: (prevData[userIndex].unreadCount || 0) + 1,
              lastMessage: message.content || '📎 Attachment',
              lastMessageTime: message.createdAt || new Date().toISOString()
            };
            return [user, ...prevData.filter(u => u._id !== senderId && u._id?.toString() !== senderId)];
          }
          return prevData;
        });
      }
    };

    // Connection event handlers for better reliability
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('⚠️ Socket connection error:', error);
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
  }, [selectedUser, scrollToBottom, isUserAtBottom]); // Re-run when selectedUser changes

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

  // Fetch users on mount
  useEffect(() => {
    if (hasAutoSelectedRef.current) {
      return;
    }
    // Mark immediately to avoid StrictMode double-invocation
    hasAutoSelectedRef.current = true;

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
        // FIX: Don't call handleUserClick to avoid stale closure and duplicate API calls
        // Instead, directly set state and call fetchMessages
        if (response.data.users.length > 0) {
          const firstUser = response.data.users[0];
          console.log('🎯 Auto-selecting first user on mount:', firstUser);
          
          setActiveIndex(0);
          setSelectedUser(firstUser);
          setMessageInput("");
          setCurrentMessages([]);
          setCursor(null);
          setHasMoreMessages(true);
          isInitialLoad.current = true;
          lastMessageCountRef.current = 0;
          
          // Mark as read
          api.get(`/chat/markAsRead/${firstUser._id}`).catch(err => 
            console.error('Error marking messages as read:', err)
          );
          
          // Fetch messages directly (prevents duplicate call)
          fetchMessages(firstUser._id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
    
    // Cleanup: Cancel any ongoing requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 Cleaning up: Aborting ongoing requests');
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount; guarded for StrictMode

  const isRead = data.isRead;

  const { logout, profileData } = useUser();

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !userData || !selectedUser) return;

    const tempId = `temp-${Date.now()}`;
    const messageToSend = {
      _id: tempId,
      content: messageInput.trim(),
      sender: userData.userId,
      receiver: selectedUser._id,
      status: "sending",
      createdAt: new Date().toISOString(),
      attachments: [],
    };

    // Optimistic update
    setCurrentMessages((prev) => {
      const newMessages = sortMessages([...prev, normalizeMessages([messageToSend])[0]]);
      return limitMessageArray(deduplicateMessages(newMessages));
    });

    // Scroll to bottom
    setTimeout(() => scrollToBottom('smooth'), 100);

    const messageContent = messageInput;
    setMessageInput("");

    try {
      const response = await api.post("/chat/send", {
        receiverId: selectedUser._id,
        message: messageContent,
      });

      const { data: sentMessage } = response.data;

      // Replace temp message with real one
      setCurrentMessages((prevMessages) => {
        const filtered = prevMessages.filter((msg) => msg._id !== tempId);
        const newMessages = sortMessages([...filtered, normalizeMessages([sentMessage])[0]]);
        return limitMessageArray(deduplicateMessages(newMessages));
      });

      // Emit to socket for real-time delivery
      socket.emit("message", {
        ...sentMessage,
        receiverId: selectedUser._id,
      });

      // Update user list with last message
      setData((prevData) => {
        const userIndex = prevData.findIndex(u => u._id === selectedUser._id);
        if (userIndex !== -1) {
          const user = {
            ...prevData[userIndex],
            lastMessage: messageContent,
            lastMessageTime: sentMessage.createdAt || new Date().toISOString()
          };
          return [user, ...prevData.filter(u => u._id !== selectedUser._id)];
        }
        return prevData;
      });

    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Failed to send message");
      
      // Remove failed message
      setCurrentMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== tempId)
      );
      
      // Restore message input
      setMessageInput(messageContent);
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

    // Show uploading message
    const tempId = `temp-upload-${Date.now()}`;
    const uploadingMessage = {
      _id: tempId,
      content: "",
      sender: userData.userId,
      receiver: selectedUser._id,
      status: "uploading",
      createdAt: new Date().toISOString(),
      attachments: Array.from(files).map((file) => ({
        filename: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
        uploading: true,
      })),
    };

    setCurrentMessages((prev) => {
      const newMessages = sortMessages([...prev, uploadingMessage]);
      return limitMessageArray(deduplicateMessages(newMessages));
    });

    setTimeout(() => scrollToBottom('smooth'), 100);

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
      
      // Replace uploading message with actual message
      setCurrentMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== tempId);
        const newMessages = sortMessages([...filtered, ...normalizeMessages([sentMessage])]);
        return limitMessageArray(deduplicateMessages(newMessages));
      });

      socket.emit("message", {
        ...sentMessage,
        receiverId: selectedUser._id,
      });

      setTimeout(() => scrollToBottom('smooth'), 100);

      // Update user list
      setData((prevData) => {
        const userIndex = prevData.findIndex(u => u._id === selectedUser._id);
        if (userIndex !== -1) {
          const user = {
            ...prevData[userIndex],
            lastMessage: '📎 Attachment',
            lastMessageTime: sentMessage.createdAt || new Date().toISOString()
          };
          return [user, ...prevData.filter(u => u._id !== selectedUser._id)];
        }
        return prevData;
      });

    } catch (err) {
      console.error("File upload failed:", err);
      message.error("File upload failed");
      
      // Remove uploading message
      setCurrentMessages((prev) => prev.filter((msg) => msg._id !== tempId));
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
      <div className="bg-white border border-gray-200 rounded-lg mb-4 mx-4 px-6 py-5">
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Messages
          </h1>
          <p className="text-sm text-gray-600">
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
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${activeIndex === index
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
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeIndex === index
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
                                {/* Only show tick indicator for messages YOU sent */}
                                {user.isLastMessageSentByMe && (
                                  <span className="mr-1">
                                    <IoMdDoneAll
                                      className={user.unreadCount > 0 ? "text-gray-400" : "text-[#0086b2]"}
                                      title={user.unreadCount > 0 ? "Delivered" : "Read"}
                                      size={12}
                                    />
                                  </span>
                                )}
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
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white relative"
                  >
                    {/* Scroll to Bottom Button */}
                    {showScrollButton && (
                      <button
                        onClick={() => scrollToBottom('smooth')}
                        className="fixed bottom-28 right-8 bg-[#0086b2] text-white rounded-full p-3 shadow-lg hover:bg-[#023d50] transition-all duration-200 z-10 animate-bounce"
                        title="Scroll to bottom"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </button>
                    )}
                    {/* Loading older messages indicator */}
                    {loadingOlderMessages && (
                      <div className="flex justify-center py-4">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0086b2]"></div>
                          <span className="text-sm">Loading older messages...</span>
                        </div>
                      </div>
                    )}

                    {/* No more messages indicator */}
                    {!hasMoreMessages && currentMessages.length > 0 && (
                      <div className="flex justify-center py-4">
                        <span className="text-xs text-gray-400">Beginning of conversation</span>
                      </div>
                    )}

                    {/* Initial loading */}
                    {loadingMessages && currentMessages.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0086b2]"></div>
                          <span className="text-sm text-gray-500">Loading messages...</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {currentMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex items-end ${msg.sender === userData.userId ? "justify-end" : "justify-start"
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
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${msg.sender === userData.userId
                              ? "bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white rounded-br-md"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                              }`}
                          >
                            {/* Show uploading state */}
                            {msg.status === "uploading" && (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="text-sm">Uploading...</span>
                              </div>
                            )}

                            {msg.attachments && msg.attachments.length > 0 ? (
                              <div className="space-y-2">
                                {msg.attachments.map((file, i) => {
                                  // Handle uploading state
                                  if (file.uploading) {
                                    return (
                                      <div key={i} className="border border-gray-300 rounded-lg p-3 bg-gray-100">
                                        <div className="flex items-center space-x-2">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0086b2]"></div>
                                          <span className="text-sm text-gray-600">Uploading {file.filename}...</span>
                                        </div>
                                      </div>
                                    );
                                  }

                                  const isImage = file.mimeType?.startsWith("image/") || file.type === "image";
                                  const isVideo = file.mimeType?.startsWith("video/");
                                  const isPDF = file.mimeType === "application/pdf";
                                  const isDocument = file.mimeType?.includes("document") ||
                                    file.mimeType?.includes("word") ||
                                    file.mimeType?.includes("excel") ||
                                    file.mimeType?.includes("powerpoint") ||
                                    file.type === "document";

                                  return (
                                    <div key={i} className={`border border-gray-300 rounded-lg p-2 ${
                                      msg.sender === userData.userId ? 'bg-white/20' : 'bg-gray-50'
                                    }`}>
                                      {isImage ? (
                                        <div className="relative group">
                                          <img
                                            src={file.url}
                                            alt={file.filename || 'Image'}
                                            className="max-w-xs rounded shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                            loading="lazy"
                                            onClick={() => window.open(file.url, '_blank')}
                                            onError={(e) => {
                                              console.error('❌ Image failed to load:', file.url);
                                              e.target.style.display = 'none';
                                              const parent = e.target.parentElement;
                                              if (parent) {
                                                parent.innerHTML = `
                                                  <div class="flex items-center space-x-2 text-red-500 p-3 bg-red-50 rounded">
                                                    <span>❌</span>
                                                    <div>
                                                      <p class="font-medium text-sm">Failed to load image</p>
                                                      <p class="text-xs">${file.filename || 'Unknown'}</p>
                                                      <a href="${file.url}" target="_blank" class="text-xs underline">Try opening directly</a>
                                                    </div>
                                                  </div>
                                                `;
                                              }
                                            }}
                                            onLoad={() => console.log('✅ Image loaded:', file.filename)}
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <span className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">Click to enlarge</span>
                                          </div>
                                          {file.filename && (
                                            <p className={`text-xs mt-1 ${
                                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>{file.filename}</p>
                                          )}
                                        </div>
                                      ) : isVideo ? (
                                        <div>
                                          <video
                                            src={file.url}
                                            controls
                                            className="max-w-sm rounded shadow-md"
                                            onError={(e) => {
                                              console.error('❌ Video failed to load:', file.url);
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                          {file.filename && (
                                            <p className={`text-xs mt-1 ${
                                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>{file.filename}</p>
                                          )}
                                        </div>
                                      ) : isPDF ? (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center space-x-3 p-2 rounded hover:bg-opacity-80 transition-all ${
                                            msg.sender === userData.userId ? 'hover:bg-white/30' : 'bg-white hover:bg-gray-50'
                                          }`}
                                        >
                                          <span className="text-3xl">📄</span>
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm truncate ${
                                              msg.sender === userData.userId ? 'text-white' : 'text-gray-800'
                                            }`}>{file.filename || 'Document.pdf'}</p>
                                            <p className={`text-xs ${
                                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              PDF Document {file.size ? `• ${(file.size / 1024).toFixed(1)} KB` : ''}
                                            </p>
                                          </div>
                                        </a>
                                      ) : isDocument ? (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center space-x-3 p-2 rounded hover:bg-opacity-80 transition-all ${
                                            msg.sender === userData.userId ? 'hover:bg-white/30' : 'bg-white hover:bg-gray-50'
                                          }`}
                                        >
                                          <span className="text-3xl">📋</span>
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm truncate ${
                                              msg.sender === userData.userId ? 'text-white' : 'text-gray-800'
                                            }`}>{file.filename || 'Document'}</p>
                                            <p className={`text-xs ${
                                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              Document {file.size ? `• ${(file.size / 1024).toFixed(1)} KB` : ''}
                                            </p>
                                          </div>
                                        </a>
                                      ) : (
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center space-x-3 p-2 rounded hover:bg-opacity-80 transition-all ${
                                            msg.sender === userData.userId ? 'hover:bg-white/30' : 'bg-white hover:bg-gray-50'
                                          }`}
                                        >
                                          <span className="text-3xl">📎</span>
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm truncate ${
                                              msg.sender === userData.userId ? 'text-white' : 'text-gray-800'
                                            }`}>{file.filename || 'Attachment'}</p>
                                            <p className={`text-xs ${
                                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                              File {file.size ? `• ${(file.size / 1024).toFixed(1)} KB` : ''}
                                            </p>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            
                            {/* Show content if exists */}
                            {msg.content && msg.content.trim() && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}

                            <div className={`text-xs mt-2 flex items-center space-x-1 ${
                              msg.sender === userData.userId ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                              <span>
                                {msg.createdAt &&
                                  format(
                                    new Date(msg.createdAt),
                                    "MMMM dd, yyyy hh:mm a"
                                  )}
                              </span>
                              {msg.status === "sending" && (
                                <span className="ml-1">⏳</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
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
