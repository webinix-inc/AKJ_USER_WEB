import React, { useEffect, useState } from "react";
import "./Notification.css";
import HOC from "../../Components/HOC/HOC";
import api from "../../api/axios";
import { useUser } from "../../Context/UserContext";
import { useSocket } from "../../Context/SocketContext";

const Notification = () => {
  const { profileData, fetchUserProfile } = useUser();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/admin/broadcast");
        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError(
          err.response
            ? err.response.data.message
            : "Failed to fetch notifications"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

  useEffect(() => {
    // DEBUG: Log all notifications to see what we have
    console.log("📢 All Notifications:", notifications);
    console.log("👤 Profile Data:", profileData);

    // TEMPORARY DEBUG: Disable filtering to show EVERYTHING
    setFilteredNotifications(notifications);

    /* 
    if (profileData?.purchasedCourses && notifications.length > 0) {
      const purchasedCourses = profileData.purchasedCourses.map(
        (courseObj) => courseObj?.course?.toLowerCase() || ""
      );
      const filtered = notifications.filter((notification) => {
        // ALWAYS show 'NEW_COURSE_PURCHASE' notifications regardless of profile sync status
        if (notification.type === 'NEW_COURSE_PURCHASE') return true;

        if (
          notification.courses &&
          Array.isArray(notification.courses) &&
          notification.courses.length > 0
        ) {
          const matchedCourses = notification.courses.filter(
            (courseId) =>
              typeof courseId === "string" &&
              purchasedCourses.includes(courseId.toLowerCase())
          );
          return matchedCourses.length > 0;
        }
        return !notification.courses || notification.courses.length === 0;
      });
      setFilteredNotifications(filtered);
    } else {
      setFilteredNotifications(notifications);
    }
    */
  }, [profileData, notifications]);

  if (loading) {
    return (
      <div className="w-full animate-apple-fade-in">
        {/* Hero Section - Compact */}
        <div className="relative overflow-hidden gradient-apple-primary text-white compact-hero rounded-apple-xl mb-4 shadow-apple mx-4">
          <div className="absolute inset-0 bg-black/10 rounded-apple-xl"></div>
          <div className="relative compact-container text-center animate-apple-slide-up">
            <h1 className="app-subtitle text-white mb-2 font-apple">
              📢 <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">Notifications</span>
            </h1>
            <p className="app-body text-apple-blue-100 max-w-2xl mx-auto font-apple">
              Stay updated with the latest announcements and course updates
            </p>
          </div>
        </div>
        <div className="w-full px-6">
          <div className="card-apple p-12 text-center shadow-apple">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500 mx-auto mb-4"></div>
            <p className="app-body text-brand-primary font-semibold font-apple">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full animate-apple-fade-in">
        {/* Hero Section - Compact */}
        <div className="relative overflow-hidden gradient-apple-primary text-white compact-hero rounded-apple-xl mb-4 shadow-apple mx-4">
          <div className="absolute inset-0 bg-black/10 rounded-apple-xl"></div>
          <div className="relative compact-container text-center animate-apple-slide-up">
            <h1 className="app-subtitle text-white mb-2 font-apple">
              📢 <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">Notifications</span>
            </h1>
            <p className="app-body text-apple-blue-100 max-w-2xl mx-auto font-apple">
              Stay updated with the latest announcements and course updates
            </p>
          </div>
        </div>
        <div className="w-full px-6">
          <div className="card-apple p-8 text-center shadow-apple max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-apple-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="app-body font-bold text-red-600 mb-2 font-apple">Error Loading Notifications</h3>
            <p className="app-body text-apple-gray-600 font-apple">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-apple-fade-in">
      {/* Hero Section - Compact */}
      <div className="relative overflow-hidden gradient-apple-primary text-white compact-hero rounded-apple-xl mb-4 shadow-apple mx-4">
        <div className="absolute inset-0 bg-black/10 rounded-apple-xl"></div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <h1 className="app-subtitle text-white mb-2 font-apple">
            📢 <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">Notifications</span>
          </h1>
          <p className="app-body text-apple-blue-100 max-w-2xl mx-auto font-apple">
            Stay updated with the latest announcements and course updates
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification._id}
                className="card-apple p-6 shadow-apple hover:shadow-apple-lg transition-all duration-300 ease-apple hover-lift group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 gradient-apple-primary rounded-apple-lg flex items-center justify-center shadow-apple">
                      <span className="text-white text-xl">
                        {index === 0 ? '🔥' : index === 1 ? '📢' : index === 2 ? '⭐' : '📝'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="app-body font-bold text-brand-primary group-hover:text-apple-blue-600 transition-colors duration-300 font-apple">
                        {notification.title}
                      </h3>
                      <div className="flex-shrink-0 ml-4">
                        <span className="bg-apple-blue-50 text-apple-blue-600 px-3 py-1 rounded-apple-lg app-caption font-medium font-apple">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="app-body text-apple-gray-700 leading-relaxed mb-4 font-apple">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center app-caption text-apple-gray-500 font-apple">
                        <div className="w-2 h-2 bg-apple-green rounded-full mr-2"></div>
                        <span>New notification</span>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="text-apple-blue-600 hover:text-brand-primary font-medium app-caption hover-lift font-apple">
                          Mark as read →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="card-apple p-12 text-center shadow-apple">
            <div className="w-20 h-20 gradient-apple-primary rounded-apple-lg flex items-center justify-center mx-auto mb-6 shadow-apple">
              <span className="text-4xl text-white">📭</span>
            </div>
            <h3 className="app-body font-bold text-brand-primary mb-3 font-apple">No Notifications</h3>
            <p className="app-body text-apple-gray-600 max-w-md mx-auto font-apple">
              You're all caught up! New notifications will appear here when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HOC(Notification);