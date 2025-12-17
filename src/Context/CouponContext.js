import React, { createContext, useContext, useState, useEffect } from "react";
import { message } from "antd";
import api from "../api/axios";

// Create the context
const CouponContext = createContext();

// Custom hook to use the CouponContext
export const useCoupon = () => {
  return useContext(CouponContext);
};

// CouponProvider component to wrap around your app
export const CouponProvider = ({ children }) => {
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiRequest = async (apiFunc) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An unexpected error occurred";
      //   message.error(errorMessage); // Use message for global error
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (couponCode, userId, courseId, orderAmount) => {
    const response = await apiRequest(() =>
      api.post("/coupons/validate", {
        couponCode,
        userId,
        courseId,
        orderAmount,
      })
    );

    if (response.success) {
      //   message.success("Coupon validated successfully.");
      return { success: true, ...response.data };
    } else {
      return { success: false, error: response.error };
    }
  };

  const fetchAvailableCoupons = async (courseId) => {
    if (!courseId) return;
    // const response = await apiRequest(() => api.get("/coupons/available"));
    const response = await apiRequest(() =>
      api.get(`/coupons/available?courseId=${courseId}`)
    );

    if (response.success) {
      setAvailableCoupons(response.data);
    }
  };

  const applyCoupon = async (couponCode, userId, courseId, orderAmount) => {
    const response = await apiRequest(() =>
      api.post("/coupons/apply", { couponCode, userId, courseId, orderAmount })
    );

    if (response.success) {
      //   message.success("Coupon applied successfully.");
      return { success: true, ...response.data };
    } else {
      return { success: false, error: response.error };
    }
  };

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  const value = {
    availableCoupons,
    loading,
    error,
    validateCoupon,
    fetchAvailableCoupons,
    applyCoupon,
  };

  return (
    <CouponContext.Provider value={value}>{children}</CouponContext.Provider>
  );
};
