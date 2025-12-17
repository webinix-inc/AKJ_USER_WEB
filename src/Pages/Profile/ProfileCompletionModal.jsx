import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useUser } from "../../Context/UserContext"; // Use UserContext for backend logic
import "./ProfileCompletionModal.css";

const ProfileCompletionModal = ({ userId, onClose }) => {
  const { userData,updateUserProfile } = useUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialProfile, setInitialProfile] = useState(null);
  console.log(initialProfile)

  // Fetch initial profile data when the modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setInitialProfile(userData); // Set initial profile state
        form.setFieldsValue(userData); // Populate the form with existing data
      } catch (error) {
        message.error("Failed to fetch profile data: " + error.message);
      }
    };
    fetchProfile();
  }, []);

  // Handle form submission
  const handleSave = async (values) => {
    try {
      setLoading(true);

      // Convert form values to FormData for API call
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key === "image" && values.image?.file) {
          formData.append("image", values.image.file.originFileObj); // Handle file upload
        } else {
          formData.append(key, values[key]);
        }
      });
      formData.append("userId", userId); // Include userId

      await updateUserProfile(formData); // Call backend API
      message.success("Profile updated successfully!");
      onClose(); // Close the modal
    } catch (error) {
      message.error("Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={true}
      title="Complete Your Profile"
      onCancel={() => message.warning("You must complete your profile to proceed.")}
      footer={null}
      closable={false} // Disable the close button
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={initialProfile} // Bind existing profile data
      >
        <Form.Item
          label="First Name"
          name="firstName"
          rules={[{ required: true, message: "Please enter your first name" }]}
        >
          <Input placeholder="Enter your first name" />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[{ required: true, message: "Please enter your last name" }]}
        >
          <Input placeholder="Enter your last name" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone"
          rules={[{ required: true, message: "Please enter your phone number" }]}
        >
          <Input placeholder="Enter your phone number" disabled/>
        </Form.Item>

        {/* <Form.Item
          label="College"
          name="college"
          rules={[{ message: "Please enter your college" }]}
        >
          <Input placeholder="Enter your college name" />
        </Form.Item> */}

        <Form.Item label="Profile Photo" name="image">
          <Upload
            listType="picture"
            maxCount={1}
            beforeUpload={() => false} // Prevent auto upload
          >
            <Button icon={<UploadOutlined />}>Upload Photo</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button disabled onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProfileCompletionModal;
