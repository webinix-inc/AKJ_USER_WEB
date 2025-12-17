

import React, { createContext, useContext, useState } from "react";
import api from "../api/axios";

const PaymentContext = createContext();

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Create Razorpay order (installment or full)
  const createOrder = async ({
    amount,
    courseId,
    userId,
    planType,
    installmentPlanId, // 🔥 NEW: Selected plan ID
    paymentMode,
    installmentIndex = null,
    totalInstallments = null,
    currency = "INR",
  }) => {
    try {
      setLoading(true);
      const payload = {
        amount,
        currency,
        courseId,
        planType,
        installmentPlanId, // 🔥 NEW: Pass selected plan ID
        userId,
        paymentMode,
        ...(paymentMode === "installment" && {
          installmentIndex,
          totalInstallments,
        }),
      };

      const { data } = await api.post("/payments/order", payload);
      setLoading(false);
      return data.order; // Contains orderId, amount, currency, etc.
    } catch (error) {
      setLoading(false);
      console.error("❌ Error creating order:", error);
      throw error;
    }
  };

  // Razorpay frontend-only payment handler
  const initiatePayment = async (order) => {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Please refresh the page.");
        return reject(new Error("Razorpay SDK not loaded"));
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        handler: (response) => {
          console.log("✅ Payment Success:", {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });

          resolve({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            console.warn("❌ Payment cancelled by user");
            reject(new Error("Payment cancelled"));
          },
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  // Verify payment signature with backend
  const verifyPaymentSignature = async (paymentData) => {
    try {
      setLoading(true);
      const { data } = await api.post("/payments/verify", {
        razorpay_order_id: paymentData.orderId,
        razorpay_payment_id: paymentData.paymentId,
        razorpay_signature: paymentData.signature,
      });
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      console.error("❌ Error verifying payment signature:", error);
      throw error;
    }
  };

  // Fetch outstanding balance and installment info
  const getOutstandingBalance = async (courseId, userId) => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/installments/${courseId}/balance/${userId}`
      );
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      console.error("❌ Error fetching outstanding balance:", error);
      throw error;
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        createOrder,
        initiatePayment,
        verifyPaymentSignature,
        getOutstandingBalance,
        loading,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
