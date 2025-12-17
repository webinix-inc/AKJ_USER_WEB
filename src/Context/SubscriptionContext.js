import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

// Create the context
const SubscriptionContext = createContext();

// Custom hook to use the SubscriptionContext
export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

// SubscriptionProvider component to wrap around your app
export const SubscriptionProvider = ({ children }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [installments, setInstallments] = useState([]); // New state for installments
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper function to handle API requests with error handling
    const apiRequest = async (apiFunc, context = 'API Request') => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            console.log(`🛒 ${context}: Starting request...`);
            const response = await apiFunc();
            console.log(`✅ ${context}: Success`, response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
            console.error(`❌ ${context}: Error`, {
                message: errorMessage,
                status: err.response?.status,
                data: err.response?.data,
                fullError: err
            });
            setError(errorMessage);
            return null; // Return null instead of undefined for better handling
        } finally {
            setLoading(false);
        }
    };

    // Fetch all subscriptions
    const fetchSubscriptions = async () => {
        const data = await apiRequest(() => api.get('/admin/subscriptions'), 'Fetch Subscriptions');
        if (data && data.data) {
            setSubscriptions(data.data);
            console.log(`🛒 Subscriptions loaded: ${data.data.length} items`);
        } else {
            console.warn('🛒 No subscription data received');
            setSubscriptions([]);
        }
    };

    // Fetch a subscription by ID
    const fetchSubscriptionById = async (id) => {
        return await apiRequest(() => api.get(`/admin/subscriptions/${id}`));
    };

    // Fetch installment plans by courseId
    // 🔥 NEW: Accept optional planType, userId, and installmentPlanId to filter plans
    const fetchInstallments = async (courseId, options = {}) => {
        if (!courseId) {
            console.error('❌ fetchInstallments: No courseId provided');
            setError('Course ID is required to fetch installments');
            return;
        }
        
        // Build query string with optional filters
        const { planType, userId, installmentPlanId } = options; // 🔥 NEW: Support installmentPlanId
        let queryString = '';
        if (planType || userId || installmentPlanId) {
            const params = new URLSearchParams();
            if (planType) params.append('planType', planType);
            if (userId) params.append('userId', userId);
            if (installmentPlanId) params.append('installmentPlanId', installmentPlanId); // 🔥 NEW
            queryString = `?${params.toString()}`;
        }
        
        const data = await apiRequest(
            () => api.get(`/admin/installments/${courseId}${queryString}`), 
            `Fetch Installments for Course ${courseId}${planType ? ` (planType: ${planType})` : ''}${userId ? ` (userId: ${userId})` : ''}`
        );
        
        if (data && data.data) {
            setInstallments(data.data);
            console.log(`🛒 Installments loaded for course ${courseId}: ${data.data.length} items${planType ? ` (filtered by planType: ${planType})` : ''}`);
        } else {
            console.warn(`🛒 No installment data received for course ${courseId}`);
            setInstallments([]);
        }
    };

    // Create a new subscription
    const createSubscription = async (newSubscription) => {
        const data = await apiRequest(() =>
            api.post('/api/v1/admin/subscriptions', newSubscription)
        );
        if (data) setSubscriptions((prev) => [...prev, data.data]);
    };

    // Update a subscription by ID
    const updateSubscription = async (id, updatedSubscription) => {
        const data = await apiRequest(() =>
            api.put(`/admin/subscriptions/${id}`, updatedSubscription)
        );
        if (data) {
            setSubscriptions((prev) =>
                prev.map((subscription) =>
                    subscription._id === id ? data.data : subscription
                )
            );
        }
    };

    // Delete a subscription by ID
    const deleteSubscription = async (id) => {
        const data = await apiRequest(() =>
            api.delete(`/admin/subscriptions/${id}`)
        );
        if (data) {
            setSubscriptions((prev) =>
                prev.filter((subscription) => subscription._id !== id)
            );
        }
    };

    // Fetch all subscriptions on initial render
    useEffect(() => {
        fetchSubscriptions();
    }, []);

    // Context value to provide
    const value = {
        subscriptions,
        installments, // expose installments to the context
        loading,
        error,
        fetchSubscriptions,
        fetchSubscriptionById,
        fetchInstallments, // expose fetchInstallments function
        createSubscription,
        updateSubscription,
        deleteSubscription,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
