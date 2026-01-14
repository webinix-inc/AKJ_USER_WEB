import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chatting } from "../Chatting/Chatting";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./HOC.css";

const HOC = (WrappedComponent) => {
  const Component = () => {
    const navigate = useNavigate();
    const [show, setShow] = useState(true);
    const [modalShow, setModalShow] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
      setShow(!show);
      setSidebarOpen(!sidebarOpen);
    };

    return (
      <div
        className="min-h-screen font-apple"
        style={{
          background:
            "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)",
        }}
      >
        {/* Main Layout - No Landing Navbar for authenticated pages */}
        <div className="flex h-screen">
          {/* Sidebar - Desktop: static in wrapper, Mobile: fixed overlay */}
          <div
            className={`transition-all duration-300 ease-apple ${
              show ? "w-72" : "w-0"
            } overflow-hidden flex-shrink-0 hidden md:block`}
          >
            <Sidebar
              isOpen={true}
              setIsOpen={setSidebarOpen}
              showDesktop={show}
            />
          </div>

          {/* Mobile Sidebar - Fixed overlay */}
          <Sidebar
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            showDesktop={false}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
            {/* Top Navigation */}
            <Navbar show={show} toggleSidebar={toggleSidebar} />

            {/* Content */}
            <main
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)",
              }}
            >
              <div className="p-3 sm:p-4 md:p-6 animate-apple-fade-in w-full max-w-full overflow-x-hidden">
                <WrappedComponent />
              </div>

              {/* Chat Button */}
              {/* <button
                onClick={() => setModalShow(true)}
                className="fixed bottom-8 right-6 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-brand-accent to-brand-accent-light rounded-full shadow-apple-lg hover:shadow-apple-xl transition-all duration-300 ease-apple hover-lift z-40 group "
                aria-label="Open chat"
              >
                <IoChatbubbleEllipsesSharp 
                  className="text-white group-hover:scale-110 transition-transform duration-200" 
                  size={24} 
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-apple-green rounded-full border-2 border-white animate-apple-pulse"></div>
              </button> */}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-apple-gray-200 py-0 flex-shrink-0">
              <div className="px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between text-apple-caption text-apple-gray-500 mt-2">
                  <p className="font-apple">
                    © 2024 AKJ Classes. All rights reserved.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      className="hover:text-apple-gray-700 transition-colors duration-200"
                      onClick={() => navigate("/terms")}
                    >
                      Terms & Policy
                    </button>
                    <button
                      className="hover:text-apple-gray-700 transition-colors duration-200"
                      onClick={() => navigate("/privacy")}
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Chat Modal */}
        {modalShow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setModalShow(false)}
            />
            <div className="relative w-full max-w-md mx-4 app-modal animate-apple-slide-up">
              <Chatting onClose={() => setModalShow(false)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return Component;
};

export default HOC;
