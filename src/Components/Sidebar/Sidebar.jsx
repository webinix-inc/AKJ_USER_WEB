import { IconBook, IconMessage } from "@tabler/icons-react";
import React from "react";
import { HiX } from "react-icons/hi";
import { IoMdHome, IoMdLogOut } from "react-icons/io";
import { MdDashboard } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

const Sidebar = ({
  isOpen = false,
  setIsOpen = () => {},
  showDesktop = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();

  // Using logo from public folder for better reliability
  const Image1 = "/logo.png";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const sidebarItems = [
    {
      text: "Dashboard",
      link: "/home",
      icon: <IoMdHome size={20} />,
    },
    {
      text: "My Courses",
      link: "/mycourses",
      icon: <MdDashboard size={20} />,
    },
    {
      text: "Book Store",
      link: "/studystore/categories",
      icon: <IconBook size={20} />,
    },
    {
      text: "Messages",
      link: "/Messages",
      icon: <IconMessage size={20} />,
    },
    {
      text: "Logout",
      link: "#",
      icon: <IoMdLogOut size={20} />,
      onClick: handleLogout,
      isLogout: true,
    },
  ];

  const isActiveLink = (link) => {
    if (link === "/home")
      return location.pathname === "/home" || location.pathname === "/";
    return location.pathname.startsWith(link);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-full w-72 sidebar-apple transform transition-all duration-300 ease-apple animate-apple-slide-in
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          fixed top-0 left-0 z-50 
          md:translate-x-0 md:static md:z-auto
          ${showDesktop ? "md:block" : "md:hidden"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-apple-gray-100">
          <div className="flex items-center justify-center relative">
            {/* Logo centered and clickable */}
            <button
              onClick={() => {
                navigate("/home");
                setIsOpen(false);
              }}
              className="group hover-lift transition-all duration-300 ease-apple"
              aria-label="Go to Dashboard"
            >
              <div className="w-14 h-14 bg-gradient-apple-primary rounded-apple-lg flex items-center justify-center shadow-apple group-hover:shadow-apple-lg group-hover:scale-105 transition-all duration-300">
                <img
                  src={Image1}
                  alt="AKJ Classes"
                  className="w-12 h-12 rounded-apple object-contain group-hover:scale-110 transition-transform duration-300"
                  style={{ filter: "brightness(1.1)" }}
                  onError={(e) => {
                    // Fallback to a simple text logo if image fails to load
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
                {/* Fallback text logo */}
                <div
                  className="w-12 h-12 bg-white rounded-apple flex items-center justify-center text-brand-primary font-bold text-lg shadow-inner"
                  style={{ display: "none" }}
                >
                  A
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-semibold text-apple-gray-700 group-hover:text-apple-blue-600 transition-colors duration-300 font-apple">
                  AKJ Classes
                </p>
              </div>
            </button>

            {/* Close button only on mobile - positioned absolutely */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden absolute right-0 btn-apple-secondary p-2 rounded-apple hover-lift"
              aria-label="Close sidebar"
            >
              <HiX className="text-lg text-apple-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item, index) => {
            const isActive = !item.isLogout && isActiveLink(item.link);
            const isLogout = item.isLogout;

            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick ? item.onClick() : navigate(item.link);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-apple-lg font-apple text-left
                  transition-all duration-200 ease-apple group hover-lift
                  ${
                    isActive
                      ? "bg-gradient-to-r from-apple-blue-50 to-apple-blue-100 text-apple-blue-700 shadow-apple-sm border border-apple-blue-200"
                      : isLogout
                      ? "text-apple-red hover:bg-red-50 hover:text-apple-red"
                      : "text-apple-gray-700 hover:bg-apple-gray-50 hover:text-apple-gray-900"
                  }
                  ${isActive ? "font-semibold" : "font-medium"}
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`
                  transition-colors duration-200 ease-apple
                  ${
                    isActive
                      ? "text-apple-blue-600"
                      : isLogout
                      ? "text-apple-red group-hover:text-apple-red"
                      : "text-apple-gray-500 group-hover:text-apple-gray-700"
                  }
                `}
                >
                  {React.cloneElement(item.icon, {
                    size: 20,
                    className:
                      "transition-transform duration-200 ease-apple group-hover:scale-110",
                  })}
                </span>

                <span className="text-sm tracking-wide">{item.text}</span>

                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-apple-blue-500 rounded-full animate-apple-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-apple-gray-100">
          <div className="text-center">
            <p className="text-apple-caption text-apple-gray-500 font-apple">
              © 2024 AKJ Classes
            </p>
            <p className="text-xs text-apple-gray-400 mt-1 font-apple">
              Version 2.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
