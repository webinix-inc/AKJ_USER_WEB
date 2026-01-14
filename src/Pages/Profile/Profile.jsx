import React, { useState, useEffect } from "react";
import "./Profile.css";
import HOC from "../../Components/HOC/HOC";
import { FiEdit } from "react-icons/fi";
import { FaUserTie } from "react-icons/fa";
import { useUser } from "../../Context/UserContext";
import { validateFileUpload } from "../../utils/security";
import {
  getOptimizedUserImage,
  handleImageError,
} from "../../utils/imageUtils";
import { toast } from "react-toastify";

const Profile = () => {
  const {
    profileData,
    updateUserProfile,
    uploadProfilePicture,
    fetchUserProfile,
  } = useUser();

  const [profile, setProfile] = useState(profileData || {});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(profileData?.image || null);

  // FIX: Remove fetchUserProfile() - UserContext handles this centrally
  // useEffect(() => {
  //   if (!profileData) {
  //     fetchUserProfile(); // REMOVED - causes excessive API calls
  //   }
  // }, [profileData]); // Remove function dependency to prevent infinite loop

  useEffect(() => {
    if (profileData) {
      setProfile(profileData);
      setImagePreview(profileData.image || null);
    }
  }, [profileData]);

  // FIX: Add cleanup useEffect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup blob URL on unmount to prevent memory leak
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      // FIX: Validate file before processing to prevent invalid uploads
      validateFileUpload(file);

      // FIX: Clean up previous blob URL to prevent memory leak
      if (selectedImage && imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      toast.error(error.message);
      e.target.value = ""; // Clear the input on validation error
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    try {
      await uploadProfilePicture(selectedImage);
      toast.success("Profile picture uploaded successfully!");
      setSelectedImage(null);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(
        error?.message || "Failed to upload profile picture. Please try again."
      );
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    try {
      await updateUserProfile(profile);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(
        error?.message || "Failed to update profile. Please try again."
      );
    }
  };

  return (
    <div className="w-full animate-apple-fade-in">
      {/* Hero Section - Compact */}
      <div className="relative overflow-hidden gradient-apple-primary text-white compact-hero rounded-apple-xl mb-4 shadow-apple mx-4">
        <div className="absolute inset-0 bg-black/10 rounded-apple-xl"></div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <h1 className="app-subtitle text-white mb-2 font-apple">
            👤 My{" "}
            <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">
              Profile
            </span>
          </h1>
          <p className="app-body text-apple-blue-100 max-w-2xl mx-auto font-apple">
            Manage your personal information and account settings
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        {/* Profile Card */}
        <div className="card-apple shadow-apple overflow-hidden">
          {/* Profile Header */}
          <div className="gradient-apple-primary px-8 py-8 text-white relative rounded-t-apple-xl">
            <div className="absolute inset-0 bg-black/10 rounded-t-apple-xl"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-apple-xl border-4 border-white shadow-apple overflow-hidden bg-white">
                  {imagePreview || profileData?.image ? (
                    <img
                      src={
                        selectedImage
                          ? imagePreview
                          : getOptimizedUserImage(profileData)
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-apple-gray-100 to-apple-gray-200">
                      <FaUserTie size={50} className="text-brand-primary" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <label className="cursor-pointer">
                      <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-apple hover:bg-teal-600 transition-colors duration-300 hover-lift">
                        <FiEdit size={18} color="white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="text-center md:text-left flex-1">
                <h2 className="app-title text-white mb-2 font-apple">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="app-body text-apple-blue-100 mb-4 font-apple">
                  {profile.email}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={handleEditToggle}
                    className={`px-6 py-3 rounded-apple-lg font-semibold transition-all duration-300 hover-lift shadow-apple font-apple ${
                      isEditing
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "glass-apple-dark text-white hover:bg-white/20"
                    }`}
                  >
                    {isEditing ? "❌ Cancel" : "✏️ Edit Profile"}
                  </button>
                  {selectedImage && isEditing && (
                    <button
                      onClick={handleImageUpload}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-apple-lg transition-all duration-300 hover-lift shadow-apple font-apple flex items-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload Image
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-teal-400/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-500/20 rounded-full blur-xl"></div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <h3 className="app-body font-bold text-brand-primary mb-6 font-apple">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="app-caption font-semibold text-brand-primary flex items-center gap-2 font-apple">
                  👤 First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`input-apple w-full p-4 font-medium transition-all duration-300 ${
                    !isEditing
                      ? "bg-apple-gray-50 text-apple-gray-600"
                      : "bg-white text-brand-primary focus:border-teal-500 focus:shadow-apple"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="app-caption font-semibold text-brand-primary flex items-center gap-2 font-apple">
                  👤 Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`input-apple w-full p-4 font-medium transition-all duration-300 ${
                    !isEditing
                      ? "bg-apple-gray-50 text-apple-gray-600"
                      : "bg-white text-brand-primary focus:border-teal-500 focus:shadow-apple"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="app-caption font-semibold text-brand-primary flex items-center gap-2 font-apple">
                  📧 Email Address
                </label>
                <input
                  type="text"
                  name="email"
                  value={profile.email || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`input-apple w-full p-4 font-medium transition-all duration-300 ${
                    !isEditing
                      ? "bg-apple-gray-50 text-apple-gray-600"
                      : "bg-white text-brand-primary focus:border-teal-500 focus:shadow-apple"
                  }`}
                />
              </div>

              <div className="space-y-2 opacity-50">
                <label className="app-caption font-semibold text-brand-primary flex items-center gap-2 font-apple">
                  📱 Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ""}
                  disabled={true}
                  readOnly={true}
                  className="input-apple w-full p-4 bg-apple-gray-50 text-apple-gray-600 font-medium cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSaveChanges}
                  className="px-10 py-4 bg-gradient-to-r from-brand-primary via-teal-500 to-teal-600 hover:from-brand-primary hover:via-teal-600 hover:to-teal-700 text-white text-lg font-bold rounded-apple-xl transition-all duration-300 hover-lift shadow-apple font-apple flex items-center gap-3 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Cards */}
        {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-apple p-6 shadow-apple hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 gradient-apple-primary rounded-apple-lg flex items-center justify-center shadow-apple">
                <span className="text-white text-xl">🎓</span>
              </div>
              <div>
                <h4 className="app-body font-bold text-brand-primary font-apple">
                  Learning Progress
                </h4>
                <p className="app-caption text-apple-gray-600 font-apple">
                  Track your course progress
                </p>
              </div>
            </div>
            <div className="bg-apple-gray-50 rounded-apple-lg p-4">
              <p className="app-body text-apple-gray-600 font-apple">
                Your learning journey continues...
              </p>
            </div>
          </div>

          <div className="card-apple p-6 shadow-apple hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-apple-lg flex items-center justify-center shadow-apple">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <div>
                <h4 className="app-body font-bold text-brand-primary font-apple">
                  Account Settings
                </h4>
                <p className="app-caption text-apple-gray-600 font-apple">
                  Manage your preferences
                </p>
              </div>
            </div>
            <div className="bg-apple-gray-50 rounded-apple-lg p-4">
              <p className="app-body text-apple-gray-600 font-apple">
                Customize your experience...
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default HOC(Profile);
