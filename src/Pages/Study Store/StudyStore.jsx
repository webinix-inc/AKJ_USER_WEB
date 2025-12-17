import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import defaultImg from "../../Image2/img38.jpeg";
import NavbarLanding from "../Landing Page/NavbarLanding";
import { useUser } from "../../Context/UserContext";
import HOC from "../../Components/HOC/HOC";
import { getOptimizedBookImage, handleImageError } from "../../utils/imageUtils";
import { toast } from "react-toastify";

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
        console.log("📚 First book courseNames:", response.data[0]?.courseNames);
        
        const labeledBooks = response.data
          .filter((book) => {
            // More flexible filtering - show books that either:
            // 1. Have "Book Store" in courseNames, OR
            // 2. Have empty courseNames array (show all books if no specific category)
            const hasBookStore = book.courseNames && book.courseNames.includes("Book Store");
            const hasEmptyCourseNames = !book.courseNames || book.courseNames.length === 0;
            
            console.log(`📚 Book "${book.name}": courseNames=${JSON.stringify(book.courseNames)}, hasBookStore=${hasBookStore}, hasEmptyCourseNames=${hasEmptyCourseNames}`);
            
            return hasBookStore || hasEmptyCourseNames;
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
      setFilteredBooks(books.filter((book) => book.label.text === selectedFilter));
    } else {
      setFilteredBooks(books);
    }
  };

  const handleAddToCart = async (book) => {
    try {
      const response = await api.post("/user/cart/add-book", {
        bookId: book._id,
        quantity: 1
      });
      
      if (response.data.status === 201) {
        toast.success(`${book.name} added to cart successfully!`);
      }
    } catch (error) {
      console.error("Error adding book to cart:", error);
      toast.error("Failed to add book to cart. Please try again.");
    }
  };

  if (loading) return <p className="text-center text-gray-600 mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="min-h-screen font-apple" style={{background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)'}}>
      {/* Hero Section - Light Theme */}
      <div className="relative overflow-hidden gradient-apple-primary py-6 rounded-apple-xl mb-6 shadow-apple mx-4 mt-4 border border-apple-gray-200">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
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
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Filter Section - Simplified */}
        <div className="mb-6 animate-apple-fade-in">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white rounded-apple-lg p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-brand-primary font-apple">Browse Books</h2>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-apple-fade-in">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div
                key={book._id}
                className="group card-apple-interactive h-full flex flex-col"
              >
                <div className="relative overflow-hidden rounded-t-apple-lg flex-shrink-0">
                  <img
                    src={getOptimizedBookImage(book)}
                    alt={book.name}
                    className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-apple"
                    crossOrigin="anonymous"
                    onError={(e) => handleImageError(e, book)}
                    loading="lazy"
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    style={{ 
                      opacity: '0', 
                      transition: 'opacity 0.3s ease-in-out',
                      backgroundColor: '#f3f4f6'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {labels.map(
                    ({ text, emoji, color }) =>
                      book.label.text === text && (
                        <span
                          key={text}
                          className={`absolute top-3 left-3 app-caption font-medium text-white py-1.5 px-3 rounded-apple-lg flex items-center shadow-apple ${
                            text === 'Trending' ? 'bg-gradient-to-r from-apple-red to-red-600' :
                            text === 'Bestselling' ? 'bg-gradient-to-r from-brand-accent to-brand-accent-dark' :
                            'bg-gradient-to-r from-apple-blue-500 to-apple-blue-600'
                          }`}
                        >
                          <span className="mr-1">{emoji}</span>
                          {text}
                        </span>
                      )
                  )}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="glass-apple-light rounded-full p-2 shadow-apple">
                      <span className="text-brand-primary text-xs">👁️</span>
                    </div>
                  </div>
                </div>

                {/* Book Info & Actions */}
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div className="flex-1">
                    <h6 className="app-body font-bold text-brand-primary mb-2 line-clamp-2 group-hover:text-apple-blue-600 transition-colors duration-300">
                      {book.name}
                    </h6>
                    <p className="app-caption text-apple-gray-600 mb-3 font-medium">📝 by {book.author}</p>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-apple-blue-600">₹{book.price}</span>
                        <span className="app-caption text-apple-gray-500 line-through">₹{book.stock}</span>
                      </div>
                      <div className="bg-apple-green/10 text-apple-green px-3 py-1 rounded-apple-lg app-caption font-medium inline-block">
                        🎉 {Math.round(((book.stock - book.price) / book.stock) * 100)}% OFF
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        window.location.href = `/studystore/books/${book._id}`;
                      }}
                      className="btn-apple-secondary w-full py-2.5 app-caption font-medium hover-lift"
                    >
                      🔍 Explore Details
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(book)}
                        className="btn-apple-success flex-1 py-2.5 app-caption font-medium hover-lift"
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        onClick={() =>
                          navigate("/checkout", {
                            state: { book, count: 1 },
                          })
                        }
                        className="btn-apple-primary flex-1 py-2.5 app-caption font-medium hover-lift relative overflow-hidden group"
                      >
                        <span className="relative z-10">⚡ Buy Now</span>
                        <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              <h3 className="text-apple-title font-bold text-brand-primary mb-3 font-apple">No Books Found</h3>
              <p className="app-body text-apple-gray-600 text-center max-w-md mb-6">
                We couldn't find any books matching your selected category. Try browsing all categories or check back later for new arrivals.
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
                  Ready to Start <span className="gradient-apple-accent bg-clip-text text-transparent">Learning</span>?
                </h2>
                <p className="app-body text-apple-blue-100 max-w-xl mx-auto mb-6">
                  Get the best study materials and accelerate your learning journey with our curated collection
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
