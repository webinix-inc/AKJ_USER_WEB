import React, { useState } from 'react';
import { FaClock, FaEnvelope, FaFacebookSquare, FaLinkedin, FaMapMarkerAlt, FaPaperPlane, FaPhone, FaTelegram, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import HOC from '../../Components/HOC/HOC';
import { useUser } from '../../Context/UserContext';
import NavbarLanding from '../Landing Page/NavbarLanding';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    let formErrors = {};
    if (!formData.name) formErrors.name = 'Name is required.';
    if (!formData.email) formErrors.email = 'Email is required.';
    if (
      !formData.email.match(
        /^([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})$/
      )
    ) {
      formErrors.email = 'Please enter a valid email.';
    }
    if (!formData.message) formErrors.message = 'Message cannot be empty.';

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setFormStatus(
        'Thank you for your message. We will get back to you soon!'
      );
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } else {
      setFormStatus(null);
    }
  };

  return (
    <div className="min-h-screen font-apple" style={{background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)'}}>
      {/* Hero Section - Light Theme */}
      <div className="relative overflow-hidden gradient-apple-primary compact-hero rounded-apple-xl mb-4 shadow-apple mx-4 mt-4 border border-apple-gray-200">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <div className="inline-flex items-center gap-3 bg-apple-blue-50 rounded-apple px-4 py-2 border border-apple-blue-200 mb-3">
            <FaEnvelope className="text-apple-blue-600 text-sm" />
            <span className="text-apple-blue-700 font-semibold app-caption">Get In Touch</span>
          </div>
          
          <h1 className="app-subtitle text-apple-gray-800 mb-2 font-apple">
            Contact <span className="text-apple-blue-600">Us</span>
          </h1>
          <p className="app-body text-apple-gray-600 max-w-2xl mx-auto">
            Have questions about our courses? We're here to help you succeed.
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        {/* Contact Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-4 compact-section animate-apple-fade-in">
          {/* Phone Card */}
          <div className="card-apple-interactive compact-container">
            <div className="w-12 h-12 gradient-apple-primary rounded-apple-lg flex items-center justify-center mb-4 shadow-apple">
              <FaPhone className="text-white text-lg" />
            </div>
            <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">Call Us</h3>
            <p className="app-small text-apple-gray-600 mb-3">Speak directly with our academic counselors</p>
            <div className="space-y-2">
              <p className="text-apple-blue-600 font-semibold">+91-82918 21247</p>
              <p className="text-apple-blue-600 font-semibold">+91-82918 21248</p>
            </div>
          </div>

          {/* Email Card */}
          <div className="card-apple-interactive compact-container">
            <div className="w-12 h-12 gradient-apple-accent rounded-apple-lg flex items-center justify-center mb-4 shadow-apple">
              <FaEnvelope className="text-white text-lg" />
            </div>
            <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">Email Us</h3>
            <p className="app-small text-apple-gray-600 mb-3">Send us your queries anytime</p>
            <p className="text-apple-blue-600 font-semibold app-small">contact@akjclasses.com</p>
          </div>

          {/* Location Card */}
          <div className="card-apple-interactive compact-container">
            <div className="w-12 h-12 gradient-apple-primary rounded-apple-lg flex items-center justify-center mb-4 shadow-apple">
              <FaMapMarkerAlt className="text-white text-lg" />
            </div>
            <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">Visit Us</h3>
            <p className="app-small text-apple-gray-600 mb-3">Come to our campus for guidance</p>
            <p className="text-apple-gray-700 leading-relaxed app-small">
              Green Lawns Apts, E, C 101/102, Aarey Rd, opp. St. Pius College, 
              Jay Prakash Nagar, Goregaon, Mumbai, Maharashtra 400063
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 compact-section">
          {/* Contact Form Section */}
          <div className="card-apple compact-container shadow-apple">
            <div className="mb-4">
              <h2 className="app-subtitle text-brand-primary mb-2 font-apple">
                Send Us a <span className="text-brand-accent">Message</span>
              </h2>
              <div className="w-12 h-1 gradient-apple-accent mb-3 rounded-full"></div>
              <p className="app-body text-apple-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
            </div>

            {formStatus && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-green-700 font-medium">{formStatus}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#023d50] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#fc9721] hover:border-[#fc9721] transition-colors duration-300 text-gray-700"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#023d50] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#fc9721] hover:border-[#fc9721] transition-colors duration-300 text-gray-700"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-[#023d50] mb-2">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#fc9721] hover:border-[#fc9721] transition-colors duration-300 text-gray-700 resize-none"
                  placeholder="Tell us about your query or how we can help you..."
                  rows="5"
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </span>
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#023d50] to-[#0086b2] hover:from-[#fc9721] hover:to-[#ff953a] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <FaPaperPlane className="text-lg" />
                Send Message
              </button>
            </form>
          </div>

          {/* Additional Info Section */}
          <div className="space-y-8">
            {/* Office Hours */}
            <div className="bg-gradient-to-br from-[#023d50] to-[#0086b2] rounded-2xl p-8 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FaClock className="text-[#fc9721] text-xl" />
                </div>
                <h3 className="text-2xl font-bold">Office Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="font-medium">Monday - Friday</span>
                  <span className="text-[#fc9721]">11:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="font-medium">Saturday</span>
                  <span className="text-[#fc9721]">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Sunday</span>
                  <span className="text-red-300">Closed</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="card-apple compact-container shadow-apple">
              <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">
                Connect With <span className="text-brand-accent">Us</span>
              </h3>
              <div className="w-12 h-1 gradient-apple-accent mb-3 rounded-full"></div>
              <p className="app-small text-apple-gray-600 mb-4">Follow us on social media for updates, tips, and success stories.</p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 rounded-apple flex items-center justify-center text-white hover:bg-blue-700 transition-all duration-200 ease-apple hover-lift"
                >
                  <FaFacebookSquare className="text-sm" />
                </a>
                <a
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-400 rounded-apple flex items-center justify-center text-white hover:bg-blue-500 transition-all duration-200 ease-apple hover-lift"
                >
                  <FaTwitter className="text-sm" />
                </a>
                <a
                  href="https://www.linkedin.com/company/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-700 rounded-apple flex items-center justify-center text-white hover:bg-blue-800 transition-all duration-200 ease-apple hover-lift"
                >
                  <FaLinkedin className="text-sm" />
                </a>
                <a
                  href="https://telegram.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-500 rounded-apple flex items-center justify-center text-white hover:bg-blue-600 transition-all duration-200 ease-apple hover-lift"
                >
                  <FaTelegram className="text-sm" />
                </a>
                <a
                  href="https://wa.me/918291821247"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-green-500 rounded-apple flex items-center justify-center text-white hover:bg-green-600 transition-all duration-200 ease-apple hover-lift"
                >
                  <FaWhatsapp className="text-sm" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#023d50] mb-4">
              Find Our <span className="text-[#fc9721]">Campus</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Visit us at our modern campus equipped with state-of-the-art facilities for the best learning experience.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
            <div className="relative w-full h-96 lg:h-[500px] rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.8479469757!2d72.8499825!3d19.1644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7b0b0b0b0b0%3A0x1234567890abcdef!2sGreen%20Lawns%20Apartments%2C%20Goregaon%20East%2C%20Mumbai!5e0!3m2!1sen!2sin!4v1672113567894"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactWithHOC = HOC(Contact);

const ConditionalContact = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <ContactWithHOC />;
  } else {
    return (
      <div className="w-full min-h-screen">
        <NavbarLanding />
        <Contact />
      </div>
    );
  }
};

export default ConditionalContact;