import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyStore.css";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import TopTab from "./TopTab";
import {
  getOptimizedBookImage,
  handleImageError,
} from "../../utils/imageUtils";
import { toast } from "react-toastify";
import img from "../../Image2/img36.jpeg";

const My_Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get("/user/cart/get");
      setCart(response.data.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response?.status === 404) {
        setCart(null); // Cart is empty
      } else {
        setError("Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity, itemType, cartItemId) => {
    // If quantity reaches 0, automatically remove the item from cart
    if (newQuantity < 1) {
      if (cartItemId) {
        await removeItem(cartItemId);
      }
      return;
    }

    try {
      const payload =
        itemType === "book"
          ? { bookId: itemId, quantity: newQuantity }
          : { productId: itemId, quantity: newQuantity };

      await api.put("/user/cart/updateQuantity", payload);
      fetchCart(); // Refresh cart
      toast.success("Cart updated successfully!");
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/user/cart/products/${itemId}`);
      fetchCart(); // Refresh cart
      toast.success("Item removed from cart!");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const proceedToCheckout = () => {
    if (cart && cart.products.length > 0) {
      navigate("/checkout", {
        state: { cart, isMultipleItems: true },
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <TopTab />
        <div className="mt-6 p-8 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-apple-blue-600"></div>
          </div>
          <p className="mt-4 text-apple-gray-600 font-apple">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TopTab />
        <div className="mt-6 p-8 text-center text-red-500">
          <p className="font-apple">{error}</p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className="w-full">
        <TopTab />
        <div className="mt-6 flex flex-col items-center justify-center py-12">
          {/* <div className="w-48 h-48 mb-6">
            <img
              src={img}
              alt="Empty cart"
              className="w-full h-full object-contain"
            />
          </div> */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-apple-gray-800 mb-2 font-apple">
              Cart Is Empty
            </h3>
            <p className="text-apple-gray-600 mb-4 font-apple">
              Add some items to your cart to get started
            </p>
            <button
              onClick={() => navigate("/studystore/categories")}
              className="btn-apple-primary px-6 py-3 font-semibold hover-lift"
            >
              Browse Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TopTab />
      <div className="mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-apple-gray-800 mb-2 font-apple">
            My Cart
          </h2>
          <p className="text-apple-gray-600 font-apple">
            {cart.products.length}{" "}
            {cart.products.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="space-y-4">
          {cart.products.map((item) => {
            const isBook = item.itemType === "book";
            const itemData = isBook ? item.book : item.product;

            if (!itemData) return null;

            return (
              <div key={item._id} className="card-apple p-4 sm:p-5 hover-glow">
                {/* Mobile Layout: Image and Info Row */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  {/* Image Section - Wider on mobile */}
                  <div className="w-full sm:w-32 sm:flex-shrink-0 rounded-apple-lg overflow-hidden bg-apple-gray-100 self-start">
                    <img
                      src={
                        isBook
                          ? getOptimizedBookImage(itemData)
                          : itemData.image
                      }
                      alt={isBook ? itemData.name : itemData.productName}
                      className="w-full h-auto sm:h-32 object-cover"
                      crossOrigin="anonymous"
                      loading="lazy"
                      onError={(e) => {
                        if (isBook) {
                          handleImageError(e, itemData);
                        } else {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE4NVYxMzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2NSAxNDVIMjM1VjE1NUgxNjVWMTQ1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTg1IDEzNUgxOTVWMTQ1SDE4NVYxMzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xOTUgMTI1SDIwNVYxMzVIMTk1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwNSAxMzVIMjE1VjE0NUgyMDVWMTM1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjE1IDEyNUgyMjVWMTM1SDIxNVYxMjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5XYWthZGUgQ2xhc3NlczwvdGV4dD4KPC9zdmc+";
                          e.target.onerror = null;
                        }
                      }}
                    />
                  </div>

                  {/* Content Section */}
                  <div className="flex-grow min-w-0 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Book/Product Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-lg sm:text-base text-apple-gray-800 mb-1 font-apple line-clamp-2">
                        {isBook ? itemData.name : itemData.productName}
                      </h3>
                      {isBook && itemData.author && (
                        <p className="text-apple-gray-600 text-sm mb-2 font-apple">
                          by {itemData.author}
                        </p>
                      )}
                      <p className="text-apple-blue-600 font-bold text-xl sm:text-lg font-apple">
                        ₹{item.price}
                      </p>
                    </div>

                    {/* Controls Section - Better mobile layout */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 border border-apple-gray-200 rounded-apple-lg p-1.5 bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(
                              isBook ? itemData._id : itemData._id,
                              item.quantity - 1,
                              item.itemType,
                              item._id
                            )
                          }
                          className="w-9 h-9 sm:w-8 sm:h-8 bg-apple-gray-100 rounded-apple flex items-center justify-center hover:bg-apple-gray-200 active:bg-apple-gray-300 transition-colors duration-200 text-apple-gray-700 font-apple text-base sm:text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-12 sm:w-10 text-center text-base sm:text-sm font-semibold text-apple-gray-800 font-apple">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              isBook ? itemData._id : itemData._id,
                              item.quantity + 1,
                              item.itemType,
                              item._id
                            )
                          }
                          className="w-9 h-9 sm:w-8 sm:h-8 bg-apple-gray-100 rounded-apple flex items-center justify-center hover:bg-apple-gray-200 active:bg-apple-gray-300 transition-colors duration-200 text-apple-gray-700 font-apple text-base sm:text-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price and Remove */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg sm:text-base text-apple-gray-800 font-apple mb-1">
                          ₹{item.totalAmount}
                        </p>
                        {/* <button
                          onClick={() => removeItem(item._id)}
                          className="text-apple-red hover:text-apple-red-dark active:text-apple-red-dark text-sm font-apple transition-colors duration-200 underline"
                        >
                          Remove
                        </button> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 card-apple p-6 sticky bottom-0">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-apple-gray-200">
            <span className="text-lg font-semibold text-apple-gray-700 font-apple">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-apple-blue-600 font-apple">
              ₹
              {cart.totalPaidAmount ||
                cart.products.reduce(
                  (sum, item) => sum + (item.totalAmount || 0),
                  0
                )}
            </span>
          </div>
          <button
            onClick={proceedToCheckout}
            className="btn-apple-primary w-full py-3 text-base font-semibold hover-lift"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HOC(My_Cart);
