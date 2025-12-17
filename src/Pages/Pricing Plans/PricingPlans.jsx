import React, { useState } from "react";
import "./PricingPlans.css";

import HOC from "../../Components/HOC/HOC";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaCheck, FaCrown, FaStar, FaRocket } from "react-icons/fa";

import img from "../../Image2/img28.png";
import img1 from "../../Image2/img29.png";
import img2 from "../../Image2/img33.jpeg";
import img3 from "../../Image2/img30.png";
import img4 from "../../Image2/img31.jpeg";
import img5 from "../../Image2/img32.jpeg";
import img6 from "../../Image2/img34.jpeg";

const PricingPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState('24months');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const plans = [
    {
      id: '24months',
      title: '24 Months Validity',
      duration: '24 months',
      monthlyPrice: 2250,
      totalPrice: 54000,
      installmentPrice: 13500,
      originalPrice: 70000,
      discount: 23,
      popular: true,
      features: [
        'Complete Course Access',
        'Live Classes & Recordings',
        'Study Materials & Notes',
        'Mock Tests & Assessments',
        'Doubt Resolution',
        'Performance Analytics',
        'Mobile App Access',
        'Certificate of Completion'
      ]
    },
    {
      id: '12months',
      title: '12 Months Validity',
      duration: '12 months',
      monthlyPrice: 2250,
      totalPrice: 27000,
      installmentPrice: 13500,
      originalPrice: 35000,
      discount: 23,
      popular: false,
      features: [
        'Complete Course Access',
        'Live Classes & Recordings',
        'Study Materials & Notes',
        'Mock Tests & Assessments',
        'Doubt Resolution',
        'Performance Analytics',
        'Mobile App Access'
      ]
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#023d50]/10 to-[#0086b2]/10 backdrop-blur-sm rounded-full px-6 py-3 border border-[#023d50]/20 mb-6">
            <FaCrown className="text-[#fc9721] text-lg" />
            <span className="text-[#023d50] font-semibold">Premium Plans</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-[#023d50] mb-6">
            Choose Your <span className="text-[#fc9721]">Plan</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Select the perfect subscription plan for your learning needs
          </p>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Debug Info:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
            <div>
              <p><strong>Subscription exists:</strong> Yes</p>
              <p><strong>Validities count:</strong> 2</p>
              <p><strong>Loading:</strong> No</p>
            </div>
            <div>
              <p><strong>Plan Type:</strong> 24 months</p>
              <p><strong>Validities:</strong> [24,12]</p>
            </div>
          </div>
        </div>

        {/* Available Plans Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#023d50] mb-8 text-center">Available Plans</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-8 border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                  selectedPlan === plan.id
                    ? 'border-[#0086b2] bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-[#fc9721] shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#fc9721] to-[#ff953a] text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <FaStar className="text-xs" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#023d50] mb-2">{plan.title}</h3>
                  <div className="flex justify-center items-baseline gap-2 mb-4">
                    <span className="text-lg text-gray-600">Starts from</span>
                    <span className="text-3xl font-bold text-[#0086b2]">₹{plan.installmentPrice.toLocaleString()}</span>
                    <span className="text-gray-500">/installment</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg text-gray-600">Total Price (including all taxes)</span>
                    <div className="flex justify-center items-center gap-3 mt-2">
                      <span className="text-2xl font-bold text-[#023d50]">₹{plan.totalPrice.toLocaleString()}</span>
                      <span className="text-lg text-gray-500 line-through">₹{plan.originalPrice.toLocaleString()}</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        {plan.discount}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <FaCheck className="text-white text-xs" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-r from-[#0086b2] to-[#023d50] text-white'
                      : 'bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white hover:from-[#fc9721] hover:to-[#ff953a]'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-4xl mx-auto mb-12">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#023d50] mb-2">
                  ₹{selectedPlanData.monthlyPrice} <span className="text-lg font-normal text-gray-600">/mo</span>
                </h3>
                <p className="text-gray-600">Selected: {selectedPlanData.title}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#023d50]">Total ₹{selectedPlanData.totalPrice.toLocaleString()}</p>
                <p className="text-gray-500 line-through">₹{selectedPlanData.originalPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="bg-gray-50 rounded-xl p-4 flex-1">
                  <p className="text-sm text-gray-600 mb-2">No Coupon Applied</p>
                  <button className="bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-[#fc9721] hover:to-[#ff953a] transition-all duration-300">
                    View Coupons
                  </button>
                </div>
                <button className="bg-gradient-to-r from-[#fc9721] to-[#ff953a] hover:from-[#023d50] hover:to-[#0086b2] text-white font-bold px-12 py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
                  <FaRocket className="text-lg" />
                  Proceed to Pay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Services Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Discuss Your Doubts */}
          <div className="bg-gradient-to-br from-[#023d50] to-[#0086b2] rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Discuss Your Doubts</h3>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Clarify Your Doubts, Master Your Subjects: Join the Discussion for Academic Excellence
              </p>
              <button className="bg-gradient-to-r from-[#fc9721] to-[#ff953a] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Discuss Doubt
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10">
              <img src={img} alt="" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          {/* Refer & Earn */}
          <div className="bg-gradient-to-br from-[#fc9721] to-[#ff953a] rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Refer & Earn</h3>
              <p className="text-orange-100 mb-6 leading-relaxed">
                Refer friends to win Amazon Vouchers and Plus Subscription. For Every Successful referral win up to Rs. 2,500.
              </p>
              <button className="bg-white text-[#fc9721] px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Refer & Earn
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10">
              <img src={img1} alt="" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </div>

        {/* Survey and Social Media Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Survey */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-[#023d50] mb-4">Student Satisfaction Survey</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              It takes no compromising to give people their rights. It takes no money to respect the individual.
            </p>
            <div className="flex items-center justify-between">
              <button className="bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Start Survey
              </button>
              <div className="w-20 h-20">
                <img src={img2} alt="" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
            <h3 className="text-2xl font-bold text-[#023d50] mb-4">Follow Us On</h3>
            <p className="text-gray-600 mb-6">Follow for more updates and many more</p>
            <div className="flex gap-4 justify-center">
              <img src={img5} alt="" className="w-12 h-12 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer" />
              <img src={img6} alt="" className="w-12 h-12 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer" />
              <img src={img3} alt="" className="w-12 h-12 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer" />
              <img src={img4} alt="" className="w-12 h-12 rounded-full hover:scale-110 transition-transform duration-300 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HOC(PricingPlans);
