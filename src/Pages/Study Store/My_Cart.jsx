import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyStore.css";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import TopTab from "./TopTab";
import { getOptimizedBookImage, handleImageError } from "../../utils/imageUtils";
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

  const updateQuantity = async (itemId, newQuantity, itemType) => {
    if (newQuantity < 1) return;
    
    try {
      const payload = itemType === 'book' 
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
        state: { cart, isMultipleItems: true }
      });
    }
  };

  if (loading) {
    return (
      <div className="studystore">
        <div className="studystore1">
          <TopTab />
        </div>
        <div className="p-8 text-center">
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="studystore">
        <div className="studystore1">
          <TopTab />
        </div>
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className="studystore">
        <div className="studystore1">
          <TopTab />
        </div>
        <div className="studystor13">
          <div className="studystor14">
            <div className="studystor15">
              <img src={img} alt="" />
            </div>
            <div className="studystor16">
              <button>Cart Is Empty</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studystore">
      <div className="studystore1">
        <TopTab />
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">My Cart ({cart.products.length} items)</h2>
        
        <div className="grid gap-3">
          {cart.products.map((item) => {
            const isBook = item.itemType === 'book';
            const itemData = isBook ? item.book : item.product;
            
            if (!itemData) return null;
            
            return (
              <div key={item._id} className="bg-white rounded-lg p-3 shadow-md flex items-center gap-3">
                <div className="w-16 h-16 flex-shrink-0">
                  <img
                    src={isBook ? getOptimizedBookImage(itemData) : itemData.image}
                    alt={isBook ? itemData.name : itemData.productName}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => isBook && handleImageError(e, itemData)}
                  />
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-medium text-base">
                    {isBook ? itemData.name : itemData.productName}
                  </h3>
                  {isBook && itemData.author && (
                    <p className="text-gray-600 text-sm">by {itemData.author}</p>
                  )}
                  <p className="text-green-600 font-bold text-sm">₹{item.price}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(
                      isBook ? itemData._id : itemData._id,
                      item.quantity - 1,
                      item.itemType
                    )}
                    className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(
                      isBook ? itemData._id : itemData._id,
                      item.quantity + 1,
                      item.itemType
                    )}
                    className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
                  >
                    +
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-sm">₹{item.totalAmount}</p>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-red-500 hover:text-red-700 text-xs mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 bg-white rounded-lg p-3 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold">Total: ₹{cart.totalPaidAmount}</span>
          </div>
          <button
            onClick={proceedToCheckout}
            className="w-full bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white py-2.5 rounded-lg hover:from-[#1D0D76] hover:to-[#023d50] transition duration-300 font-medium text-sm"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default My_Cart;
