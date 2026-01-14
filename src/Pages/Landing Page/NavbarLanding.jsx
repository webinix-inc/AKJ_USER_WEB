import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaUserCircle,
  FaChevronDown,
  FaBell,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useUser } from "../../Context/UserContext";

const NavbarLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Using logo from public folder for better reliability
  const Image1 = "/logo.png";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    console.log("Token", token);
  }, []);

  const { profileData, isAuthenticated, loading } = useUser();
  
  // Trigger profile fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && !profileData && !loading) {
      console.log('🔄 Triggering profile fetch for authenticated user');
      // The UserContext should automatically fetch profile data
    }
  }, [isAuthenticated, profileData, loading]);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path);
    return isActive
      ? "text-apple-blue-600 bg-apple-blue-50 font-semibold"
      : "text-apple-gray-700 hover:text-apple-blue-600 hover:bg-apple-gray-50";
  };

  return (
    <div className="nav-apple px-6 py-4 fixed top-0 left-0 w-full z-50 animate-apple-slide-up">
      <div className="flex justify-between items-center w-full">
        {/* Logo */}
        <div className="flex items-center">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <img
              src={Image1}
              alt="AKJ Classes Logo"
              className="w-10 h-10 rounded-apple shadow-apple hover:scale-105 transition-all duration-300 ease-apple"
            />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1 mx-6">
          {!isLoggedIn && (
            <button 
              className={`${getLinkClass("/")} px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative`} 
              onClick={() => navigate("/")}
            >
              Home
              {location.pathname === "/" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
              )}
            </button>
          )}
          <button
            className={`${getLinkClass("/explorecourses")} px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative`}
            onClick={() => navigate("/explorecourses")}
          >
            Courses
            {(location.pathname === "/explorecourses" || location.pathname.startsWith("/explorecourses")) && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
            )}
          </button>
          <button
            className={`${getLinkClass("/studystore/categories")} px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative`}
            onClick={() => navigate("/studystore/categories")}
          >
            Book Store
            {(location.pathname === "/studystore/categories" || location.pathname.startsWith("/studystore")) && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
            )}
          </button>
          <button
            className={`${getLinkClass("/contact")} px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative`}
            onClick={() => navigate("/contact")}
          >
            Contact Us
            {(location.pathname === "/contact" || location.pathname.startsWith("/contact")) && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
            )}
          </button>
          <button
            className={`${getLinkClass("/free-test")} px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative`}
            onClick={() => navigate("/free-test")}
          >
            Free Test
            {(location.pathname === "/free-test" || location.pathname.startsWith("/free-test")) && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
            )}
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate("/notification")}
                className="relative p-3 rounded-full bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift group"
                aria-label="Notifications"
              >
                <FaBell className="text-apple-gray-600 group-hover:text-apple-gray-800 transition-colors duration-200" size={20} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-apple-red rounded-full border-2 border-white animate-apple-pulse"></div>
              </button>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-2 rounded-apple-lg bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift group"
                  aria-label="Profile menu"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-apple-gray-200 group-hover:border-apple-blue-300 transition-colors duration-200">
                    <img
                      src={profileData?.image || '/default-avatar.png'}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTE2IDEwQzEzLjc5IDEwIDEyIDExLjc5IDEyIDE0QzEyIDE2LjIxIDEzLjc5IDE4IDE2IDE4QzE4LjIxIDE4IDIwIDE2LjIxIDIwIDE0QzIwIDExLjc5IDE4LjIxIDEwIDE2IDEwWk0xNiAyMEM5LjMzIDIwIDQgMjIuNjcgNCAyNlYyOEgyOFYyNkMyOCAyMi42NyAyMi42NyAyMCAxNiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg=='
                      }}
                    />
                  </div>
                  <FaChevronDown 
                    className={`text-apple-gray-500 group-hover:text-apple-gray-700 transition-all duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`} 
                    size={16} 
                  />
                </button>
                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-apple-lg shadow-apple-lg border border-apple-gray-200 py-2 z-20 animate-apple-slide-up">
                      {/* Profile Header */}
                      <div className="px-4 py-3 border-b border-apple-gray-100">
                        {profileData ? (
                          <>
                            <p className="text-sm font-semibold text-apple-gray-900 font-apple">
                              {profileData.name || profileData.firstName || 'User'}
                            </p>
                            <p className="text-xs text-apple-gray-500 font-apple">
                              {profileData.email || profileData.phone || 'No contact info'}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="h-4 bg-apple-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-apple-gray-200 rounded animate-pulse w-3/4"></div>
                          </>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 hover:text-apple-gray-900 transition-colors duration-200 ease-apple font-apple"
                        >
                          <FaUser className="text-apple-gray-500" size={16} />
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/attendanceoverview");
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 hover:text-apple-gray-900 transition-colors duration-200 ease-apple font-apple"
                        >
                          <FaUserCircle className="text-apple-gray-500" size={16} />
                          Attendance
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop Login Button - Hidden on mobile */}
              <button
                onClick={() => {
                  navigate("/login");
                }}
                className="hidden lg:flex btn-apple-primary py-2 px-4 text-sm font-medium hover-lift"
              >
                Login / Register
              </button>
            </>
          )}
          
          {/* Hamburger Icon - Moved to right end */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-apple bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? 
                <FaTimes className="text-lg text-apple-gray-700" /> : 
                <FaBars className="text-lg text-apple-gray-700" />
              }
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pb-6 pt-2 space-y-3 text-base font-medium bg-white shadow-apple border-t border-apple-gray-200">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-2">
            {!isLoggedIn && (
              <button
                className={`${getLinkClass("/")} text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 transition-all duration-200 ease-apple text-sm font-apple`}
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
              >
                Home
              </button>
            )}
            <button
              className={`${getLinkClass("/explorecourses")} text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 transition-all duration-200 ease-apple text-sm font-apple`}
              onClick={() => {
                navigate("/explorecourses");
                setMobileMenuOpen(false);
              }}
            >
              Courses
            </button>
            <button
              className={`${getLinkClass("/studystore/categories")} text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 transition-all duration-200 ease-apple text-sm font-apple`}
              onClick={() => {
                navigate("/studystore/categories");
                setMobileMenuOpen(false);
              }}
            >
              Book Store
            </button>
            <button
              className={`${getLinkClass("/contact")} text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 transition-all duration-200 ease-apple text-sm font-apple`}
              onClick={() => {
                navigate("/contact");
                setMobileMenuOpen(false);
              }}
            >
              Contact Us
            </button>
            <button
              className={`${getLinkClass("/free-test")} text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 transition-all duration-200 ease-apple text-sm font-apple`}
              onClick={() => {
                navigate("/free-test");
                setMobileMenuOpen(false);
              }}
            >
              Free Test
            </button>
          </div>

          {/* Auth Actions */}
          <div className="pt-3 border-t border-apple-gray-200">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 text-apple-gray-700 transition-all duration-200 ease-apple text-sm font-apple"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate("/attendanceoverview");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-apple hover:bg-apple-gray-50 text-apple-gray-700 transition-all duration-200 ease-apple text-sm font-apple"
                >
                  Attendance
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="btn-apple-primary w-full mt-2 py-2 px-3 text-center text-sm font-medium hover-lift"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarLanding;
