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
import { useUser } from "../../Context/UserContext";

const My_Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userData, profileData } = useUser();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Hit backend "current user" endpoint; auth token is sent via axios interceptor
      const response = await api.get(`/orders/user`);
      const data = response.data;
      const list = data?.data || data?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching orders:", err?.response || err);
      const status = err?.response?.status;
      if (status === 404) {
        setOrders([]);
      } else if (status === 401) {
        setError("Authentication failed. Please login again.");
        toast.error("Session expired. Please login again.");
      } else {
        const msg =
          err?.response?.data?.message || "Failed to load orders. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full">
        <TopTab />
        <div className="mt-6 p-8 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-apple-blue-600"></div>
          </div>
          <p className="mt-4 text-apple-gray-600 font-apple">Loading orders...</p>
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

  if (!orders || orders.length === 0) {
    return (
      <div className="w-full">
        <TopTab />
        <div className="mt-6 flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-xl font-bold text-apple-gray-800 mb-2 font-apple">
              No Orders Found
            </h3>
            <p className="text-apple-gray-600 mb-4 font-apple">
              You haven't placed any orders yet
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
            My Orders
          </h2>
          <p className="text-apple-gray-600 font-apple">
            {orders.length} {orders.length === 1 ? "order" : "orders"} found
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            // Supports book orders (single item) and legacy cart orders (products)
            const isBookOrder = !!order.book;
            return (
              <div
                key={order._id || order.orderId}
                className="card-apple p-6 hover-glow"
              >
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-apple-gray-200">
                  <div>
                    <p className="text-sm text-apple-gray-600 font-apple">
                      Order ID:{" "}
                      <span className="font-semibold text-apple-gray-800">
                        {order.orderId?.slice(-8) || order._id?.slice(-8) || "N/A"}
                      </span>
                    </p>
                    {order.transactionId && (
                      <p className="text-xs text-apple-gray-500 mt-1 font-apple">
                        Transaction ID: {order.transactionId?.slice(-8) || "N/A"}
                      </p>
                    )}
                    <p className="text-xs text-apple-gray-500 mt-1 font-apple">
                      Placed on: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-semibold font-apple ${getStatusColor(
                      order.orderStatus || order.status
                    )}`}
                  >
                    {order.orderStatus || order.status || "Pending"}
                  </span>
                </div>

                {isBookOrder && (
                  <div className="flex items-center gap-4 mb-4 border-t border-apple-gray-100 pt-4">
                    <div className="w-20 h-20 flex-shrink-0 rounded-apple-lg overflow-hidden bg-apple-gray-100">
                      <img
                        src={getOptimizedBookImage(order.book)}
                        alt={order.book.name}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, order.book)}
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-base text-apple-gray-800 mb-1 font-apple line-clamp-2">
                        {order.book.name}
                      </h3>
                      {order.book.author && (
                        <p className="text-apple-gray-600 text-sm mb-1 font-apple">
                          by {order.book.author}
                        </p>
                      )}
                      <p className="text-apple-gray-500 text-sm font-apple">
                        Quantity: {order.quantity || 1}
                      </p>
                      <p className="text-apple-gray-500 text-sm font-apple">
                        Price per book: ₹{order.book.price || 0}
                      </p>
                    </div>
                  </div>
                )}

                {!isBookOrder && order.products && order.products.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {order.products.map((item, index) => {
                      const isBook = item.itemType === "book" || item.book;
                      const itemData = isBook ? item.book : item.product;

                      if (!itemData) return null;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 border-t border-apple-gray-100 pt-4"
                        >
                          <div className="w-20 h-20 flex-shrink-0 rounded-apple-lg overflow-hidden bg-apple-gray-100">
                            <img
                              src={
                                isBook ? getOptimizedBookImage(itemData) : itemData.image
                              }
                              alt={isBook ? itemData.name : itemData.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => isBook && handleImageError(e, itemData)}
                            />
                          </div>

                          <div className="flex-grow min-w-0">
                            <h3 className="font-semibold text-base text-apple-gray-800 mb-1 font-apple line-clamp-2">
                              {isBook ? itemData.name : itemData.productName}
                            </h3>
                            {isBook && itemData.author && (
                              <p className="text-apple-gray-600 text-sm mb-1 font-apple">
                                by {itemData.author}
                              </p>
                            )}
                            <p className="text-apple-gray-500 text-sm font-apple">
                              Quantity: {item.quantity || 1}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-base text-apple-gray-800 font-apple">
                              ₹{item.price || item.totalAmount || 0}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-apple-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    {order.user && (
                      <div>
                        <p className="text-xs text-apple-gray-500 font-apple mb-1">
                          Shipping Address:
                        </p>
                        <p className="text-sm text-apple-gray-700 font-apple">
                          {order.user.address}, {order.user.city}, {order.user.region},{" "}
                          {order.user.country} - {order.user.postCode}
                        </p>
                        <p className="text-xs text-apple-gray-500 mt-1 font-apple">
                          Contact: {order.user.phone}
                        </p>
                      </div>
                    )}

                    {order.shippingAddress && (
                      <div>
                        <p className="text-xs text-apple-gray-500 font-apple mb-1">
                          Shipping Address:
                        </p>
                        <p className="text-sm text-apple-gray-700 font-apple">
                          {order.shippingAddress.addressLine1},{" "}
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right sm:text-left flex-shrink-0">
                    <p className="text-sm text-apple-gray-600 font-apple mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-apple-blue-600 font-apple">
                      ₹{order.totalAmount || order.totalPaidAmount || 0}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HOC(My_Orders);
