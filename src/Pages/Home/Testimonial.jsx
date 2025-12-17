import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Card, Alert, Typography, Spin } from "antd";
import { useUser } from "../../Context/UserContext";
import api from "../../api/axios";

const { Text, Title } = Typography;

const Testimonial = () => {
  const [form] = Form.useForm();
  const { profileData, userData, fetchUserProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingTestimonial, setExistingTestimonial] = useState(null);

  const userId = userData?.userId;

  useEffect(() => {
    if (!profileData) fetchUserProfile();
  }, [profileData, fetchUserProfile]);

  useEffect(() => {
    if (profileData?.firstName && profileData?.lastName) {
      form.setFieldsValue({ name: `${profileData.firstName} ${profileData.lastName}` });
    }
  }, [profileData, form]);

  useEffect(() => {
    const fetchUserTestimonial = async () => {
      if (!userId) return;
      try {
        const response = await api.get(`/admin/testimonial/user/${userId}`);
        setExistingTestimonial(response.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          message.error("Error fetching testimonial data.");
        }
      } finally {
        setFetching(false);
      }
    };

    fetchUserTestimonial();
  }, [userId]);

  const onFinish = async (values) => {

    if (!userId) {
      message.error("User ID is missing. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const formData = {
        userId, // ✅ Send userId to the backend
        name: values.name,
        text: values.text,
        imageUrl: profileData.image,
      };

      await api.post("/admin/testimonial", formData);
      message.success("Your testimonial has been submitted successfully!");
      setExistingTestimonial(formData);
    } catch (error) {
      message.warning(error.response?.data?.message || "Failed to submit testimonial.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0086b2]"></div>
          <span className="ml-2 text-sm text-[#023d50] font-medium">Loading testimonials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 animate-apple-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-apple-title font-bold text-brand-primary mb-2 font-apple">
          {existingTestimonial ? (
            <>Your <span className="text-brand-accent">Testimonial</span></>
          ) : (
            <>Share Your <span className="text-brand-accent">Experience</span></>
          )}
        </h2>
        <p className="app-body text-apple-gray-600 max-w-lg mx-auto">
          {existingTestimonial ? "Thank you for sharing your experience with us!" : "Help others discover the value of our courses"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card-apple p-6 hover-glow">
          {existingTestimonial ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-apple-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-apple">
                <span className="text-2xl text-white">✅</span>
              </div>
              <h3 className="app-body font-bold text-brand-primary mb-3 font-apple">Thank You!</h3>
              <p className="app-caption text-apple-gray-600 mb-6">Your feedback means a lot to us. We appreciate your support!</p>
              
              <div className="card-apple-info p-4 text-left">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-brand-primary app-caption">Name:</span>
                    <span className="ml-2 text-apple-gray-700 app-caption">{existingTestimonial?.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-brand-primary app-caption">Testimonial:</span>
                    <p className="mt-2 text-apple-gray-700 leading-relaxed app-caption">{existingTestimonial?.text}</p>
                  </div>
                  <div>
                    <span className="font-medium text-brand-primary app-caption">Submitted On:</span>
                    <span className="ml-2 text-apple-gray-700 app-caption">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-apple-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-apple">
                  <span className="text-2xl text-white">💬</span>
                </div>
                <h3 className="app-body font-bold text-brand-primary mb-3 font-apple">We'd Love to Hear From You!</h3>
                <p className="app-caption text-apple-gray-600">Share your experience with us—it only takes a minute!</p>
              </div>

              <div className="card-apple-info p-4">
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Form.Item name="name" label={<span className="font-medium text-[#023d50] text-xs">Your Name</span>}>
                    <Input 
                      disabled 
                      className="bg-gray-100 border-gray-200 rounded-lg py-1.5 px-2 text-xs"
                      style={{ backgroundColor: "#f3f4f6" }} 
                    />
                  </Form.Item>

                  <Form.Item 
                    name="text" 
                    label={<span className="font-medium text-[#023d50] text-xs">Your Testimonial</span>}
                    rules={[{ required: true, message: "Please enter your testimonial" }]}
                  >
                    <Input.TextArea 
                      rows={2} 
                      placeholder="Share your experience with our courses..." 
                      className="border-gray-200 rounded-lg text-xs"
                    />
                  </Form.Item>

                  <Form.Item className="text-center mb-0">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      className="px-4 py-2 h-auto bg-gradient-to-r from-[#023d50] to-[#0086b2] border-none rounded-full font-medium text-xs hover:from-[#1D0D76] hover:to-[#023d50] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      {loading ? "Submitting..." : "Submit Testimonial"}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonial;