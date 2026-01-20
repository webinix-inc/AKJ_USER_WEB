import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useNavigate } from "react-router-dom";
import "./StudyStore.css";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import TopTab from "./TopTab";
import PaymentReceipt from "../../Components/Course/PaymentReceipt";
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

  const generateReceiptPDF = async (receiptData, fallbackName) => {
    const receiptContainer = document.createElement("div");
    receiptContainer.style.position = "fixed";
    receiptContainer.style.left = "-9999px";
    receiptContainer.style.top = "0";
    receiptContainer.style.width = "210mm";
    receiptContainer.style.backgroundColor = "#ffffff";
    document.body.appendChild(receiptContainer);

    const root = createRoot(receiptContainer);
    root.render(<PaymentReceipt receiptData={receiptData} />);

    setTimeout(async () => {
      try {
        const receiptElement = receiptContainer.querySelector(".payment-receipt");
        if (!receiptElement) {
          throw new Error("Receipt element not found");
        }

        const html2canvas = (await import("html2canvas")).default;
        const jsPDF = (await import("jspdf")).default;

        const canvas = await html2canvas(receiptElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: receiptElement.scrollWidth,
          height: receiptElement.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        const safeName = (fallbackName || "Book_Order")
          .toString()
          .replace(/\s+/g, "_");
        const filename = `Payment_Receipt_${safeName}_${new Date().getTime()}.pdf`;
        pdf.save(filename);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate receipt. Please try again.");
      } finally {
        try {
          root.unmount();
          if (document.body.contains(receiptContainer)) {
            document.body.removeChild(receiptContainer);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    }, 600);
  };

  const handleDownloadReceipt = async (order) => {
    try {
      const user = order.user || {};
      const book = order.book || {};
      const totalAmount = Number(order.totalAmount) || Number(order.totalPaidAmount) || 0;
      const quantity = Number(order.quantity) || 1;

      const receiptData = {
        courseTitle: book.name || "Book Purchase",
        installmentNumber: 1,
        totalInstallments: 1,
        amount: totalAmount || (Number(book.price) * quantity) || 0,
        paymentDate: order.createdAt || new Date(),
        transactionId: order.transactionId || "N/A",
        orderId: order.orderId || order._id || "N/A",
        trackingNumber: "N/A",
        paymentMode: "book",
        studentName:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || "N/A",
        studentEmail: user.email || "N/A",
        studentPhone: user.phone || "N/A",
        planType: "Book Purchase",
        coursePrice: (Number(book.price) * quantity) || totalAmount || 0,
        amountPaid: totalAmount || 0,
        remainingAmount: 0,
      };

      await generateReceiptPDF(receiptData, book.name || "Book_Order");
    } catch (error) {
      console.error("❌ Error downloading receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
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
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDownloadReceipt(order)}
                    className="btn-apple-primary px-5 py-2 text-sm font-semibold hover-lift"
                  >
                    Download Invoice
                  </button>
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
