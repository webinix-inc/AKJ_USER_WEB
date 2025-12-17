import React, { useState, useEffect } from 'react'
import './Navbar.css'
import { IoSearch } from "react-icons/io5";
import { IoNotificationsOutline } from "react-icons/io5";
import { RiArrowDownSFill } from "react-icons/ri";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { TfiMarkerAlt } from "react-icons/tfi";
import { PiNotepad } from "react-icons/pi";
import { MdOutlineAssignment } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';

const Navbar = ({ toggleSidebar }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { profileData, isAuthenticated, loading } = useUser()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Trigger profile fetch when authenticated
    useEffect(() => {
        if (isAuthenticated && !profileData && !loading) {
            console.log('🔄 Triggering profile fetch for authenticated user');
            // The UserContext should automatically fetch profile data
        }
    }, [isAuthenticated, profileData, loading]);

    // Navigation items
    const navigationItems = [
        { text: "Courses", path: "/explorecourses" },
        { text: "Book Store", path: "/studystore/categories" },
        { text: "Contact Us", path: "/contact" },
        { text: "Free Test", path: "/free-test" }
    ]

    const isActivePath = (path) => {
        return location.pathname === path || location.pathname.startsWith(path)
    }

    const dropdownItems = [
        {
            icon: <MdOutlineRemoveRedEye size={18} />,
            text: "View Profile",
            onClick: () => navigate('/profile')
        },
        {
            icon: <TfiMarkerAlt size={18} />,
            text: "Attendance",
            onClick: () => navigate('/attendanceoverview')
        },
        {
            icon: <PiNotepad size={18} />,
            text: "Notice",
            onClick: () => navigate('/noticeoverview')
        },
        {
            icon: <MdOutlineAssignment size={18} />,
            text: "Assignment",
            onClick: () => navigate('/assignment')
        },
        {
            icon: <HiOutlineDocumentText size={18} />,
            text: "Results",
            onClick: () => navigate('/results')
        },
        {
            icon: <IoIosInformationCircleOutline size={18} />,
            text: "About Us",
            onClick: () => navigate('/profile')
        }
    ]

    const handleDropdownItemClick = (item) => {
        item.onClick()
        setIsDropdownOpen(false)
    }

    return (
        <nav className="nav-apple px-6 py-4 animate-apple-slide-up">
            <div className="flex items-center justify-between w-full">
                {/* Left Section - Sidebar Toggle + Search */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Sidebar Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-apple bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift"
                        aria-label="Toggle sidebar"
                    >
                        <HiMenuAlt3 className="text-xl text-apple-gray-700" />
                    </button>

                    {/* Search Section */}
                    <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search courses, assignments..."
                            className="input-apple pl-12 pr-4 py-3 text-sm rounded-full border-apple-gray-200 focus:ring-apple-blue-500 focus:border-apple-blue-500 shadow-apple-sm"
                            aria-label="Search"
                        />
                        <IoSearch 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-400" 
                            size={20} 
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-apple-gray-400 hover:text-apple-gray-600 transition-colors duration-200"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Center Section - Navigation Links */}
                <div className="hidden lg:flex items-center gap-1 mx-6">
                    {navigationItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
                            className={`px-4 py-2 rounded-apple text-sm font-medium transition-all duration-200 ease-apple hover-lift relative ${
                                isActivePath(item.path)
                                    ? 'text-apple-blue-600 bg-apple-blue-50 font-semibold'
                                    : 'text-apple-gray-700 hover:text-apple-blue-600 hover:bg-apple-gray-50'
                            }`}
                        >
                            {item.text}
                            {isActivePath(item.path) && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-apple-blue-500 rounded-full animate-apple-pulse"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Right Section - Notifications and Profile Menu */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button
                        onClick={() => navigate('/notification')}
                        className="relative p-3 rounded-full bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift group"
                        aria-label="Notifications"
                    >
                        <IoNotificationsOutline 
                            className="text-apple-gray-600 group-hover:text-apple-gray-800 transition-colors duration-200" 
                            size={20} 
                        />
                        {/* Notification badge */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-apple-red rounded-full border-2 border-white animate-apple-pulse"></div>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 p-2 rounded-apple-lg bg-apple-gray-50 hover:bg-apple-gray-100 transition-all duration-200 ease-apple hover-lift group"
                            aria-label="Profile menu"
                            aria-expanded={isDropdownOpen}
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
                            <RiArrowDownSFill 
                                className={`text-apple-gray-500 group-hover:text-apple-gray-700 transition-all duration-200 ${
                                    isDropdownOpen ? 'rotate-180' : ''
                                }`} 
                                size={16} 
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsDropdownOpen(false)}
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
                                        {dropdownItems.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleDropdownItemClick(item)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 hover:text-apple-gray-900 transition-colors duration-200 ease-apple font-apple"
                                            >
                                                <span className="text-apple-gray-500">
                                                    {item.icon}
                                                </span>
                                                {item.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar