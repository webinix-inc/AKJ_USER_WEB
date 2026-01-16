import React from "react";
import "./StudyStore.css";
import { useNavigate, useLocation } from "react-router-dom";

const TopTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-6 border-b border-apple-gray-200">
        <button
          className={`px-4 py-3 font-semibold text-base font-apple transition-colors duration-200 ${
            location.pathname === "/studystore/categories" || 
            location.pathname.startsWith("/studystore/categories") ||
            location.pathname.startsWith("/studystore/books/")
              ? "text-apple-blue-600 border-b-2 border-apple-blue-600"
              : "text-apple-gray-600 hover:text-apple-gray-800"
          }`}
          onClick={() => navigate("/studystore/categories")}
        >
          Books
        </button>
        <button
          className={`px-4 py-3 font-semibold text-base font-apple transition-colors duration-200 ${
            location.pathname === "/orders" || location.pathname === "/studystore/my_orders"
              ? "text-apple-blue-600 border-b-2 border-apple-blue-600"
              : "text-apple-gray-600 hover:text-apple-gray-800"
          }`}
          onClick={() => navigate("/orders")}
        >
          My Orders
        </button>
        <button
          className={`px-4 py-3 font-semibold text-base font-apple transition-colors duration-200 ${
            location.pathname === "/cart" || location.pathname === "/studystore/my_cart"
              ? "text-apple-blue-600 border-b-2 border-apple-blue-600"
              : "text-apple-gray-600 hover:text-apple-gray-800"
          }`}
          onClick={() => navigate("/cart")}
        >
          My Cart
        </button>
      </div>
    </div>
  );
};

export default TopTab;
