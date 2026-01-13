import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useUser } from './UserContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

// Singleton socket instance
let socketInstance = null;

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { profileData } = useUser();

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8890'; // Use env or default

    useEffect(() => {
        // Only connect if user is logged in
        if (profileData && profileData._id) {
            if (!socketInstance) {
                console.log("Initializing Global Socket Connection...");
                socketInstance = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                socketInstance.on('connect', () => {
                    console.log('✅ Socket connected:', socketInstance.id);
                    setIsConnected(true);

                    // Join user-specific room
                    console.log('Joining notification room for user:', profileData._id);
                    socketInstance.emit('joinNotificationRoom', profileData._id);

                    // Join course rooms
                    if (profileData.purchasedCourses && profileData.purchasedCourses.length > 0) {
                        const courseIds = profileData.purchasedCourses
                            .map(pc => pc.course?._id || pc.course)
                            .filter(id => id); // Filter out nulls

                        if (courseIds.length > 0) {
                            console.log('Joining course rooms:', courseIds);
                            socketInstance.emit('joinCourseRooms', courseIds);
                        }
                    }
                });

                socketInstance.on('disconnect', () => {
                    console.log('❌ Socket disconnected');
                    setIsConnected(false);
                });

                socketInstance.on('connect_error', (err) => {
                    console.error('Socket connection error:', err);
                    setIsConnected(false);
                });
            }

            setSocket(socketInstance);

            // Cleanup logic: Only disconnect if specifically desired (e.g. logout)
            // For now, we keep it persistent across routes
        } else {
            // If user logs out, we might want to disconnect
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
                setSocket(null);
                setIsConnected(false);
            }
        }

        return () => {
            // Cleanup listener if needed? 
            // Usually we want the socket to stay open while the app is active
        };
    }, [profileData, SOCKET_URL]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
