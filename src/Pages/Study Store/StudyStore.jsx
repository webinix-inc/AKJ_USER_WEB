import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import defaultImg from "../../Image2/img38.jpeg";
import NavbarLanding from "../Landing Page/NavbarLanding";
import { useUser } from "../../Context/UserContext";
import HOC from "../../Components/HOC/HOC";
import {
  getOptimizedBookImage,
  handleImageError,
} from "../../utils/imageUtils";
import { toast } from "react-toastify";

// Lazy load TopTab component
const TopTab = lazy(() => import("./TopTab"));

const labels = [
  { text: "Trending", emoji: "🔥", color: "bg-red-200" },
  { text: "Bestselling", emoji: "🌟", color: "bg-yellow-200" },
  { text: "Teacher's Pick", emoji: "👩‍🏫", color: "bg-blue-200" },
];

const StudyStore = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/books");
        console.log("📚 Raw books data:", response.data);
        console.log(
          "📚 First book courseNames:",
          response.data[0]?.courseNames
        );

        const labeledBooks = response.data
          .filter((book) => {
            // Show all books that either belong to Book Store OR are marked to show everywhere.
            const hasBookStore =
              Array.isArray(book.courseNames) &&
              book.courseNames.includes("Book Store");
            const hasEmptyCourseNames =
              !book.courseNames || book.courseNames.length === 0;
            const shouldShowEverywhere =
              typeof book.showUnder === "string" &&
              book.showUnder.toLowerCase() === "both";

            if (
              !(hasBookStore || hasEmptyCourseNames || shouldShowEverywhere)
            ) {
              console.warn(
                `🚫 Skipping book "${book.name}" — courseNames=${JSON.stringify(
                  book.courseNames
                )}, showUnder=${book.showUnder}`
              );
            }

            return hasBookStore || hasEmptyCourseNames || shouldShowEverywhere;
          })
          .map((book) => ({
            ...book,
            label: getRandomLabel(),
          }));
        setBooks(labeledBooks);
        setFilteredBooks(labeledBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
        setError("Failed to load books.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const getRandomLabel = () => {
    const randomIndex = Math.floor(Math.random() * labels.length);
    return labels[randomIndex];
  };

  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;
    setFilter(selectedFilter);
    if (selectedFilter) {
      setFilteredBooks(
        books.filter((book) => book.label.text === selectedFilter)
      );
    } else {
      setFilteredBooks(books);
    }
  };

  const handleAddToCart = async (book) => {
    try {
      const response = await api.post("/user/cart/add-book", {
        bookId: book._id,
        quantity: 1,
      });

      if (response.data.status === 201) {
        toast.success(`${book.name} added to cart successfully!`);
      }
    } catch (error) {
      console.error("Error adding book to cart:", error);
      toast.error("Failed to add book to cart. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="w-full">
        <Suspense fallback={
          <div className="mb-6">
            <div className="flex items-center gap-6 border-b border-apple-gray-200">
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        }>
          <TopTab />
        </Suspense>
        <div className="mt-6 text-center text-gray-600">
          <p className="font-apple">Loading...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="w-full">
        <Suspense fallback={
          <div className="mb-6">
            <div className="flex items-center gap-6 border-b border-apple-gray-200">
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        }>
          <TopTab />
        </Suspense>
        <div className="mt-6 text-center text-red-500">
          <p className="font-apple">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="w-full">
      <Suspense fallback={
        <div className="mb-6">
          <div className="flex items-center gap-6 border-b border-apple-gray-200">
            <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      }>
        <TopTab />
      </Suspense>
      <div className="mt-6">
        {/* Hero Section - Light Theme */}
        {/* <div className="relative overflow-hidden gradient-apple-primary py-6 rounded-apple-xl mb-6 shadow-apple border border-apple-gray-200">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            ></div>
          </div>
          <div className="relative px-6 py-4 text-center animate-apple-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-apple-gray-800 mb-2 font-apple">
              📚 Book <span className="text-apple-blue-600">Store</span>
            </h1>
            <p className="text-sm text-apple-gray-600 max-w-xl mx-auto mb-4">
              Find the perfect study materials for your learning journey
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/cart")}
                className="btn-apple-accent px-4 py-2 text-sm font-semibold hover-lift"
              >
                🛒 Cart
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="glass-apple-dark px-4 py-2 text-sm font-semibold text-white rounded-apple hover:bg-white/20 transition-all duration-300 ease-apple hover-lift"
              >
                📦 Orders
              </button>
            </div>
          </div>
        </div> */}

        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          {/* Filter Section - Simplified */}
          <div className="mb-6 animate-apple-fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white rounded-apple-lg p-4 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-brand-primary font-apple">
                  Browse Books
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filter}
                  onChange={handleFilterChange}
                  className="input-apple px-3 py-2 text-sm min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {labels.map((label) => (
                    <option key={label.text} value={label.text}>
                      {label.text}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-apple-fade-in">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <div
                  key={book._id}
                  className="group h-full flex flex-col rounded-2xl border border-apple-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="relative overflow-hidden rounded-t-2xl bg-apple-gray-50">
                    {labels.map(
                      ({ text, emoji }) =>
                        book.label.text === text && (
                          <span
                            key={text}
                            className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-apple-gray-800 shadow-sm backdrop-blur"
                          >
                            <span className="text-sm">{emoji}</span>
                            {text}
                          </span>
                        )
                    )}
                    <img
                      src={getOptimizedBookImage(book)}
                      alt={book.name}
                      className="w-full aspect-[4/3] object-contain p-4 transition-transform duration-400 ease-apple group-hover:scale-[1.02]"
                      crossOrigin="anonymous"
                      onError={(e) => handleImageError(e, book)}
                      loading="lazy"
                      onLoad={(e) => {
                        e.target.style.opacity = "1";
                      }}
                      style={{
                        opacity: "0",
                        transition: "opacity 0.25s ease-in-out",
                        backgroundColor: "#f8fafc",
                      }}
                    />
                  </div>

                  {/* Book Info & Actions */}
                  <div className="p-4 flex flex-col justify-between flex-grow gap-4">
                    <div className="space-y-2">
                      <h6 className="text-base font-semibold text-brand-primary leading-snug line-clamp-2">
                        {book.name}
                      </h6>
                      <p className="text-sm text-apple-gray-600 font-medium">
                        {book.author}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-apple-blue-600 tracking-tight">
                          ₹{book.price}
                        </span>
                        <span className="text-sm text-apple-gray-400 line-through">
                          ₹{book.stock}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-apple-green/15 px-3 py-1 text-xs font-semibold text-apple-green">
                          {Math.round(
                            ((book.stock - book.price) / book.stock) * 100
                          )}
                          % OFF
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          window.location.href = `/studystore/books/${book._id}`;
                        }}
                        className="w-full rounded-xl border border-apple-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:border-apple-blue-500 hover:text-apple-blue-600"
                      >
                        Explore Details
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(book)}
                          className="flex-1 rounded-xl border border-apple-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:border-apple-blue-500 hover:text-apple-blue-600"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() =>
                            navigate("/checkout", {
                              state: { book, count: 1 },
                            })
                          }
                          className="flex-1 rounded-xl bg-apple-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-apple-blue-700"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 animate-apple-fade-in">
                <div className="w-24 h-24 gradient-apple-primary rounded-full flex items-center justify-center mb-6 shadow-apple">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-apple-title font-bold text-brand-primary mb-3 font-apple">
                  No Books Found
                </h3>
                <p className="app-body text-apple-gray-600 text-center max-w-md mb-6">
                  We couldn't find any books matching your selected category.
                  Try browsing all categories or check back later for new
                  arrivals.
                </p>
                <button
                  onClick={() => {
                    setFilter("");
                    setFilteredBooks(books);
                  }}
                  className="btn-apple-primary px-6 py-3 text-base font-semibold hover-lift"
                >
                  🎯 Browse All Books
                </button>
              </div>
            )}
          </div>

          {/* Call to Action Section */}
          {filteredBooks.length > 0 && (
            <div className="mt-12 animate-apple-slide-up">
              <div className="gradient-apple-primary rounded-apple-2xl p-8 text-center text-white relative overflow-hidden shadow-apple-lg">
                <div className="absolute inset-0 bg-black/10 rounded-apple-2xl"></div>
                <div className="relative z-10">
                  <h2 className="app-title text-white mb-4 font-apple">
                    Ready to Start{" "}
                    <span className="gradient-apple-accent bg-clip-text text-transparent">
                      Learning
                    </span>
                    ?
                  </h2>
                  <p className="app-body text-apple-blue-100 max-w-xl mx-auto mb-6">
                    Get the best study materials and accelerate your learning
                    journey with our curated collection
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate("/cart")}
                      className="btn-apple-accent px-6 py-3 text-base font-semibold hover-lift"
                    >
                      🛒 View My Cart
                    </button>
                    <button
                      onClick={() => navigate("/orders")}
                      className="glass-apple-dark px-6 py-3 text-base font-semibold text-white rounded-apple hover:bg-white/20 transition-all duration-300 ease-apple hover-lift"
                    >
                      📦 Track Orders
                    </button>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-accent/20 rounded-full"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-brand-accent-light/20 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudyStoreWithHOC = HOC(StudyStore);

const ConditionalStudyStore = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <StudyStoreWithHOC />;
  } else {
    return (
      <div>
        <NavbarLanding />
        <StudyStore />
      </div>
    );
  }
};

export default ConditionalStudyStore;
