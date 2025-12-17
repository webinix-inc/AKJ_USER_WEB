import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { UI_CONSTANTS } from '../utils/constants';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

//Environment-based socket URL configuration
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://lms-backend-724799456037.europe-west1.run.app'; 
const MAX_CONTEXT_MESSAGES = UI_CONSTANTS.MAX_CONTEXT_MESSAGES; // Use centralized constant

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  // FIX: Helper function to limit message array size and prevent memory leaks
  const limitMessages = (msgs) => {
    if (msgs.length > MAX_CONTEXT_MESSAGES) {
      return msgs.slice(-MAX_CONTEXT_MESSAGES); // Keep only the latest messages
    }
    return msgs;
  };

  useEffect(() => {
    // Only initialize socket if user is likely to use messaging
    // Delay socket connection to improve initial page load performance
    const socketTimer = setTimeout(() => {
      const socketConnection = io(SOCKET_URL, {
        // Optimized socket configuration for better performance
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 2000, // Increased delay to reduce server load
        reconnectionAttempts: 3, // Reduced attempts
        timeout: 15000, // Reduced timeout
        forceNew: false, // Reuse existing connections
      });

      const handleMessage = (message) => {
        setMessages((prevMessages) => {
          // FIX: Prevent memory leak by limiting message array size
          const newMessages = [...prevMessages, message];
          return limitMessages(newMessages);
        });
      };

      socketConnection.on('message', handleMessage);
      setSocket(socketConnection);
      
      return () => {
        socketConnection.off('message', handleMessage);
        socketConnection.disconnect();
      };
    }, 2000); // Delay socket connection by 2 seconds to improve initial load

    return () => clearTimeout(socketTimer);
  }, []);

  const sendMessage = async (receiverId, message) => {
    try {
      const response = await fetch('', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId, message }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prevMessages) => {
          // FIX: Prevent memory leak by limiting message array size
          const newMessages = [...prevMessages, data.data];
          return limitMessages(newMessages);
        });
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <MessageContext.Provider value={{ messages, sendMessage }}>
      {children}
    </MessageContext.Provider>
  );
};
