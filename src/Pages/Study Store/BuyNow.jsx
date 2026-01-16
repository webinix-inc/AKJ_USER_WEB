import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { IoMdStar, IoMdCloseCircle } from "react-icons/io";
import { FaShareFromSquare } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "./StudyStore.css";
import api from "../../api/axios";
import img from "../../Image2/img38.jpeg";
import HOC from "../../Components/HOC/HOC";
import { getOptimizedCourseImage, getOptimizedBookImage, handleImageError } from "../../utils/imageUtils";
import { toast } from "react-toastify";
import TopTab from "./TopTab";

const BuyNow = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [count, setCount] = useState(1);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [suggestedCourses, setSuggestedCourses] = useState([]);
  const [loadingSuggestedCourses, setLoadingSuggestedCourses] = useState(true);
  const [errorSuggestedCourses, setErrorSuggestedCourses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/admin/books/${id}`);
        setBook(response.data);
      } catch (error) {
        console.error("Failed to fetch book data:", error);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    const fetchSimilarBooks = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/books");
        const filteredBooks = response.data.filter(
          (book) => {
            // More flexible filtering - show books that either:
            // 1. Have "Book Store" in courseNames, OR  
            // 2. Have empty courseNames array (show all books if no specific category)
            const hasBookStore = book.courseNames && book.courseNames.includes("Book Store");
            const hasEmptyCourseNames = !book.courseNames || book.courseNames.length === 0;
            const isNotCurrentBook = book._id !== id;
            
            return (hasBookStore || hasEmptyCourseNames) && isNotCurrentBook;
          }
        );
        setSimilarBooks(filteredBooks);
      } catch (error) {
        console.error("Error fetching similar books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarBooks();
  }, [id]);

  useEffect(() => {
    const fetchSuggestedCourses = async () => {
      setLoadingSuggestedCourses(true);
      try {
        const response = await api.get("/user/courses");
        setSuggestedCourses(response.data.data);
      } catch (error) {
        console.error("Failed to fetch suggested courses:", error);
        setErrorSuggestedCourses("Failed to fetch suggested courses.");
      } finally {
        setLoadingSuggestedCourses(false);
      }
    };

    fetchSuggestedCourses();
  }, []);

  const increaseCount = () => setCount((prev) => prev + 1);

  const decrement = () => setCount((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    try {
      const response = await api.post("/user/cart/add-book", {
        bookId: book._id,
        quantity: count
      });
      
      if (response.data.status === 201) {
        toast.success(`${count} x ${book.name} added to cart successfully!`);
      }
    } catch (error) {
      console.error("Error adding book to cart:", error);
      toast.error("Failed to add book to cart. Please try again.");
    }
  };

  if (!book) return <div>Loading...</div>;

  return (
    <div className="buynow">
      <TopTab />
      <div className="buynow1 mt-8">
        <p>
          <span onClick={() => navigate("/studystore/categories")}>
            Categories
          </span>{" "}
          / Buy Now
        </p>
      </div>

      <div className="buynow2">
        <div className="buynow3">
          <img
            src={getOptimizedBookImage(book)}
            alt="Book Cover"
            className="w-[80px] h-[400px]"
            crossOrigin="anonymous"
            onError={(e) => handleImageError(e, book)}
          />
        </div>

        <div className="buynow4">
          <h6>{book.name}</h6>
          <div className="buynow6">
            {[...Array(5)].map((_, index) => (
              <IoMdStar key={index} color="#FF8C05" size={25} />
            ))}
          </div>
          <h6>₹{book.price}</h6>
          <p>Author: {book.author}</p>
          <p>Availability: {book.stock > 0 ? "In Stock" : "Out of Stock"}</p>
          <p className="w-[750px]">
            <span>Description:</span> {book.description}
          </p>

          <div className="buynow10">
            <p>Qty:</p>
            <div className="buynow11">
              <div className="buynow12" onClick={decrement}>
                -
              </div>
              <div className="buynow12">{count}</div>
              <div className="buynow12" onClick={increaseCount}>
                +
              </div>
            </div>
          </div>

          <div className="buynow13 flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={count === 0}
              className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition duration-300"
            >
              Add to Cart
            </button>
            <button
              onClick={() =>
                navigate("/checkout", {
                  state: { count, book },
                })
              }
              disabled={count === 0}
              className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-300"
            >
              Buy Now
            </button>
          </div>
        </div>

        <div className="buynow14">
          <IoMdCloseCircle
            color="#023D50"
            size={30}
            onClick={() => navigate("/studystore/categories")}
          />
          <FaShareFromSquare color="#023D50" size={25} />
        </div>
      </div>

      <div className="mt-4">
        <h6 className="text-lg font-bold mb-4">Similar Books</h6>
        {similarBooks.length === 0 ? (
          <div>No similar books available.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {similarBooks.map((book) => (
              <Link
                key={book._id}
                to={`/studystore/books/${book._id}`}
                className="text-black no-underline"
              >
                <div className="bg-white rounded-lg p-1 h-[470px] flex flex-col border border-gray-200 hover:border-blue-500 transition-all duration-200 ease-in-out">
                  <div className="relative flex justify-center items-center h-[250px]">
                    <img
                      src={getOptimizedBookImage(book)}
                      alt={book.name}
                      className="h-full w-full object-cover rounded-md"
                      crossOrigin="anonymous"
                      onError={(e) => handleImageError(e, book)}
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h6 className="text-base font-medium">{book.name}</h6>
                      <p className="text-sm text-gray-500">{book.author}</p>
                      <p className="text-sm text-gray-700 font-semibold">
                        <span className="line-through text-gray-500">
                          MRP: ₹ {book.stock}/-
                        </span>
                        <span className="text-sm ml-2">
                          Price: ₹ {book.price}/-
                        </span>
                      </p>
                      <p className="text-sm text-green-600 font-semibold">
                        Discount:{" "}
                        {Math.round(
                          ((book.stock - book.price) / book.stock) * 100
                        )}
                        % Off
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        window.location.href = `/studystore/books/${book._id}`;
                      }}
                      className="py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-500 mt-auto"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* <div className="home4 mb-7">
        <h6 className="text-lg font-bold">Suggested Courses</h6>
        <div className="">
          <Swiper
            spaceBetween={30}
            slidesPerView={3}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            modules={[Autoplay]}>
            {loadingSuggestedCourses ? (
              <div>Loading suggested courses...</div>
            ) : errorSuggestedCourses ? (
              <div>{errorSuggestedCourses}</div>
            ) : suggestedCourses.length > 0 ? (
              suggestedCourses.map((course) => (
                <SwiperSlide key={course._id}>
                  <Link
                    to={`/explorecourses`}
                    className="w-[100%] h-[370px] bg-white border border-gray-300 rounded-lg p-4 flex flex-col no-underline">
                    <div className="relative flex-grow">
                      <img
                        src={getOptimizedCourseImage(course) || "https://via.placeholder.com/300"}
                        alt={course.title}
                        className="rounded-t-lg h-[200px] object-cover w-full"
                        onError={(e) => handleImageError(e, course)}
                      />
                      <span className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded">
                        New
                      </span>
                    </div>

                    <h6 className="text-md text-black font-bold mt-4 ">
                      {course.title}
                    </h6>

                    <div className="text-sm text-gray-500 mt-2 ">
                      <p>{course.startDate || "Start Date"}</p>
                      <p className="text-md font-bold text-green-600">
                        ₹{course.price || "Price"}
                      </p>
                    </div>
                  </Link>
                </SwiperSlide>
              ))
            ) : (
              <div>No suggested courses available.</div>
            )}
          </Swiper>
        </div>
      </div> */}

      <div className="home4 mb-7">
        <h6 className="text-lg font-bold mb-4">Suggested Courses</h6>
        <div className="grid gap-6 sm:grid-rows-2 md:grid-cols-3 xl:grid-cols-4">
          {loadingSuggestedCourses ? (
            <div>Loading suggested courses...</div>
          ) : errorSuggestedCourses ? (
            <div>{errorSuggestedCourses}</div>
          ) : suggestedCourses.length > 0 ? (
            suggestedCourses.map((course) => (
              <Link
                key={course._id}
                to={`/explorecourses`}
                className="w-full h-[370px] bg-white border border-gray-300 rounded-lg p-4 flex flex-col no-underline"
              >
                <div className="relative flex-grow">
                  <img
                    src={getOptimizedCourseImage(course)}
                    alt={course.title}
                    className="rounded-t-lg h-[200px] object-cover w-full"
                    crossOrigin="anonymous"
                    onError={(e) => handleImageError(e, course)}
                  />
                  <span className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded">
                    New
                  </span>
                </div>

                <h6 className="text-md text-black font-bold mt-4 ">
                  {course.title}
                </h6>

                <div className="text-sm text-gray-500 mt-2 ">
                  <p>{course.startDate || "Start Date"}</p>
                  <p className="text-md font-bold text-green-600">
                    ₹{course.price || "Price"}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div>No suggested courses available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HOC(BuyNow);
