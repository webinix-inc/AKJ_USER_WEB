import React, { Suspense, useEffect, useMemo, useState } from "react";
import LazyLoad from "react-lazyload";
import Skeleton from "react-loading-skeleton";
import { useCourseContext } from "../../Context/CourseContext.js";
import { useUser } from "../../Context/UserContext.js";
import { preloadImages } from "../../utils/imageUtils.js";
import { useSubscription } from "../../Context/SubscriptionContext.js";

const BatchCard = React.lazy(() => import("./BatchCard.js"));

const Batches = () => {
  const { courses, categories, loading, error, fetchCourses, fetchPublicCourses, fetchCategories } =
    useCourseContext();
  const { reloadProfile, fetchUserProfile } = useUser();
  const { subscriptions } = useSubscription();

  const [selectedClassId, setSelectedClassId] = useState(0);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    // Optimized data fetching - only fetch if absolutely necessary
    const shouldFetchCourses = !courses || courses.length === 0;
    const shouldFetchCategories = !categories || categories.length === 0;
    
    // Skip if data is already available or currently loading
    if (loading || (!shouldFetchCourses && !shouldFetchCategories)) {
      return;
    }
    
    // Use a single timer to batch requests and prevent rapid successive calls
    const timer = setTimeout(() => {
      const fetchPromises = [];
      
      if (shouldFetchCourses) {
        fetchPromises.push(
          fetchPublicCourses(false).catch(err => {
            console.error('❌ Batches: Failed to fetch courses:', err);
          })
        );
      }
      
      if (shouldFetchCategories) {
        fetchPromises.push(
          fetchCategories().catch(err => {
            console.error('❌ Batches: Failed to fetch categories:', err);
          })
        );
      }
      
      // Execute all fetches concurrently but with minimal delay
      Promise.all(fetchPromises);
    }, 50); // Reduced delay for better perceived performance
    
    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []); // Keep empty dependency array to prevent infinite loops

    // FIX: Remove excessive event listeners that cause cascading API calls
  // Components should rely on profileData from context, not trigger additional fetches
  // useEffect(() => {
  //   const handleProfileUpdate = (event) => {
  //     console.log('🔄 Batches: Received profile update event:', event.detail);
  //     reloadProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('profileUpdated', handleProfileUpdate);
  //   const handleFocus = () => {
  //     console.log('🔄 Batches: Page focused, refreshing profile...');
  //     reloadProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => {
  //     window.removeEventListener('profileUpdated', handleProfileUpdate);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [reloadProfile]);

  const handleClassChange = (id, subId) => {
    setSelectedClassId(id);
    setSelectedSubCategoryId(subId);
    setShowAll(false);
  };

  const handleSubCategoryChange = (id) => {
    setSelectedSubCategoryId(id);
    setShowAll(false);
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  const handleBuyNow = (course) => {
    setSelectedCourse(course);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCourse(null);
  };

  const filteredCourses = useMemo(() => {
    return courses?.filter((course) => {
      const matchesCategory =
        selectedClassId === 0 || course?.category === selectedClassId;
      const matchesSubCategory =
        !selectedSubCategoryId || course?.subCategory === selectedSubCategoryId;
      return matchesCategory && matchesSubCategory;
    });
  }, [courses, selectedClassId, selectedSubCategoryId]);

  const courseMinPriceMap = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return {};

    return subscriptions.reduce((map, subscription) => {
      const courseId = subscription?.course?._id;
      const validities = subscription?.validities;

      if (!courseId || !Array.isArray(validities) || validities.length === 0) {
        return map;
      }

      const minPlanPrice = validities.reduce((min, validity) => {
        const basePrice = Number(validity?.price);
        if (!Number.isFinite(basePrice) || basePrice <= 0) {
          return min;
        }

        const discountPercent = Number(validity?.discount) || 0;
        const discountedAmount = (basePrice * discountPercent) / 100;
        const effectivePrice = Math.round(basePrice - discountedAmount);

        if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
          return min;
        }

        if (min === null || effectivePrice < min) {
          return effectivePrice;
        }
        return min;
      }, null);

      if (minPlanPrice !== null) {
        if (
          map[courseId] === undefined ||
          minPlanPrice < map[courseId]
        ) {
          map[courseId] = minPlanPrice;
        }
      }

      return map;
    }, {});
  }, [subscriptions]);

  const getCoursePricing = (course) => {
    const baseCoursePrice = Number(course?.price);
    const minPlanPrice = courseMinPriceMap[course?._id];

    if (typeof minPlanPrice === "number") {
      const derivedOldPrice =
        Number.isFinite(baseCoursePrice) && baseCoursePrice > minPlanPrice
          ? baseCoursePrice
          : Number(course?.oldPrice);

      return {
        price: minPlanPrice,
        oldPrice:
          Number.isFinite(derivedOldPrice) && derivedOldPrice > minPlanPrice
            ? Math.round(derivedOldPrice)
            : undefined,
      };
    }

    return {
      price: Number.isFinite(baseCoursePrice)
        ? Math.round(baseCoursePrice)
        : course?.price,
      oldPrice: course?.oldPrice,
    };
  };

  const displayedBatches = useMemo(() => {
    return showAll ? filteredCourses : filteredCourses?.slice(0, 6);
  }, [filteredCourses, showAll]);

  // Separate effect for image preloading to avoid side effects in useMemo
  useEffect(() => {
    if (displayedBatches && displayedBatches.length > 0) {
      const imageUrls = displayedBatches
        .map(batch => batch.courseImage)
        .filter(Boolean)
        .slice(0, 6); // Only preload first 6 images
      
      if (imageUrls.length > 0) {
        // Use requestIdleCallback for better performance
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => preloadImages(imageUrls));
        } else {
          setTimeout(() => preloadImages(imageUrls), 100);
        }
      }
    }
  }, [displayedBatches]);

  const renderLoadingSkeletons = () => {
    return Array(6)
      .fill()
      .map((_, index) => (
        <div
          key={index}
          className="card-apple p-4 shadow-apple animate-apple-pulse"
        >
          <Skeleton height={200} />
          <Skeleton height={30} width="80%" className="mt-4" />
          <Skeleton count={2} className="mt-2" />
          <Skeleton height={30} width="60%" className="mt-4" />
          <Skeleton height={40} width="90%" className="mt-4" />
        </div>
      ));
  };

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center px-4">
        {renderLoadingSkeletons()}
      </div>
    );
  }
  
  if (error) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  return (
    <div className="w-full animate-apple-fade-in">
      {/* Hero Section - Light Theme */}
      <div className="relative overflow-hidden gradient-apple-primary compact-hero rounded-apple-xl mb-4 shadow-apple mx-4 mt-1 border border-apple-gray-200" style={{ padding: '1rem 1.5rem' }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '10px 10px'
          }}></div>
        </div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <h1 className="app-subtitle text-apple-gray-800 mb-1 font-apple" style={{ fontSize: '1.25rem', lineHeight: '1.5' }}>
            Explore Our <span className="text-apple-blue-600">Courses</span>
          </h1>
          <p className="app-body text-apple-gray-600 max-w-2xl mx-auto" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Discover the perfect course to advance your career and achieve your goals
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        {/* Categories */}
        <div className="compact-section" style={{ paddingTop: '0.5rem' }}>
          <h2 className="app-caption font-bold text-brand-primary text-center mb-4 font-apple">Choose Your Learning Path</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              key={0}
              onClick={() => handleClassChange(0)}
              className={`px-4 py-1 text-sm sm:text-base rounded-apple-sm font-semibold transition-all duration-300 ease-apple hover-lift ${
                selectedClassId === 0
                  ? "btn-apple-primary shadow-apple"
                  : "card-apple text-brand-primary hover:bg-apple-gray-50 border-2 border-apple-gray-200 hover:border-apple-blue-300"
              }`}
            >
              🎯 All Courses
            </button>
            {categories?.map((category) => (
              <button
                key={category._id}
                onClick={() =>
                  handleClassChange(category._id, category.subCategories?.[0]?._id || null)
                }
                className={`px-4 py-1 text-sm sm:text-base rounded-apple-sm font-semibold transition-all duration-300 ease-apple hover-lift ${
                  selectedClassId === category._id
                    ? "btn-apple-primary shadow-apple"
                    : "card-apple text-brand-primary hover:bg-apple-gray-50 border-2 border-apple-gray-200 hover:border-apple-blue-300"
                }`}
              >
                📚 {category?.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        {selectedClassId !== 0 && (
          <div className="mb-6">
            <div className="card-apple p-6 shadow-apple">
              <h3 className="app-caption font-semibold text-brand-primary mb-4 text-center font-apple">Specializations</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {categories
                  .find((category) => category._id === selectedClassId)
                  ?.subCategories?.map((subCategory) => (
                    <button
                      key={subCategory?._id}
                      onClick={() => handleSubCategoryChange(subCategory._id)}
                      className={`px-4 py-2 text-sm rounded-apple-lg font-medium transition-all duration-300 ease-apple hover-lift ${
                        selectedSubCategoryId === subCategory?._id
                          ? "btn-apple-accent shadow-apple"
                          : "bg-apple-gray-100 text-brand-primary hover:bg-apple-gray-200 border border-apple-gray-300"
                      }`}
                    >
                      {subCategory?.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Display Courses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="app-body font-bold text-brand-primary font-apple">
              {selectedClassId === 0 ? 'All Courses' : 
               categories?.find(cat => cat._id === selectedClassId)?.name || 'Courses'}
            </h2>
            <div className="app-caption text-apple-gray-600 card-apple px-4 py-2 rounded-apple-lg shadow-apple">
              {displayedBatches?.length || 0} courses
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {displayedBatches?.length ? (
              displayedBatches?.map((batch) => {
                const pricing = getCoursePricing(batch);
                return (
                <LazyLoad key={batch._id} height={200} offset={100} once>
                  <Suspense fallback={renderLoadingSkeletons()}>
                    <div className="transition-all duration-300 ease-apple">
                        <BatchCard
                          {...batch}
                          price={pricing.price}
                          oldPrice={pricing.oldPrice}
                          onBuyNow={() => handleBuyNow(batch)}
                        />
                    </div>
                  </Suspense>
                </LazyLoad>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 gradient-apple-primary rounded-full flex items-center justify-center mb-6 shadow-apple border border-apple-gray-200">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="app-body font-bold text-apple-gray-800 mb-3 font-apple">No Courses Found</h3>
                <p className="app-caption text-apple-gray-600 text-center max-w-md">
                  No courses are available for the selected category or subcategory. Try selecting a different category.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Show All Button */}
        {!showAll && filteredCourses?.length > 6 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleShowAll}
              className="btn-apple-primary px-8 py-4 text-base font-bold hover-lift shadow-apple"
            >
              View All {filteredCourses?.length} Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;
