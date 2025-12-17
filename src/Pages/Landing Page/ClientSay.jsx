import React, { useState, useEffect } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import imgPlaceholder from "../../Image2/img1.png";
import api from "../../api/axios";
import "./ClientSay.css";

const ClientSay = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testimonialResponse = await api.get("/admin/testimonial");
        const visibleTestimonials = testimonialResponse.data.filter(
          (item) => item.isVisible
        );
        setTestimonials(visibleTestimonials);

        const bannerResponse = await api.get("/achievers");
        setBanners(bannerResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const chunkTestimonials = (array, size) =>
    array.reduce((acc, _, i) => {
      if (i % size === 0) acc.push(array.slice(i, i + size));
      return acc;
    }, []);

  const testimonialChunks = chunkTestimonials(testimonials, 3);

  return (
    <div className="py-12 px-4 animate-apple-fade-in">
      {/* Banner Carousel */}
      <div className="w-full max-w-6xl mx-auto mb-12">
        <Carousel
          autoPlay
          interval={5000}
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          showIndicators={false}
          showArrows={true}
          className="banner-carousel"
        >
          {banners.map((banner, index) => (
            <div key={index} className="banner-slide">
              <img
                src={banner.photos}
                alt={banner.altText}
                className="w-full h-auto rounded-apple-2xl object-cover shadow-apple-lg"
                style={{
                  height: "auto",
                  maxHeight: "365px",
                }}
                loading="lazy"
              />
            </div>
          ))}
        </Carousel>
      </div>

      <div className="text-center mb-8">
        <h2 className="app-title text-brand-primary mb-4 font-apple">
          What Our <span className="text-brand-accent">Students</span> Say
        </h2>
        <p className="app-body text-apple-gray-600 max-w-2xl mx-auto">
          Hear from our successful students about their learning journey with us
        </p>
      </div>

      {/* Testimonial Carousel */}
      <div className="w-full max-w-6xl mx-auto">
        <Carousel
          autoPlay
          interval={4000}
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          showIndicators={false}
          showArrows={true}
          className="testimonial-carousel"
        >
          {testimonialChunks.map((chunk, index) => (
            <div
  key={index}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4"
>

              {chunk.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="card-apple-interactive p-6 text-center w-full max-w-sm mx-auto"
                >
                  <div className="relative mb-4">
                    <img
                      src={testimonial.imageUrl || imgPlaceholder}
                      alt={testimonial.name}
                      className="mx-auto object-cover shadow-apple border-4 border-white"
                      style={{
                        height: "90px",
                        width: "90px",
                        borderRadius: "50%",
                      }}
                      loading="lazy"
                    />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-apple-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💬</span>
                    </div>
                  </div>
                  <h3 className="app-body font-semibold text-brand-primary mb-2 font-apple">
                    {testimonial.name}
                  </h3>
                  <p className="app-caption text-apple-gray-500 mb-4">
                    {testimonial.role}
                  </p>
                  <p className="app-caption text-apple-gray-700 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                </div>
              ))}
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default ClientSay;
