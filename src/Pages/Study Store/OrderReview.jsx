import React, { useState } from "react";
import PropTypes from "prop-types";
import HOC from "../../Components/HOC/HOC";
import "./StudyStore.css";
import { IoMdCloseCircle } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const OrderReview = ({
  books = [],
  subtotal = 0,
  discount = 0,
  shipping = 0,
  cod = 0,
  vat = 0,
}) => {
  const [promoCode, setPromoCode] = useState("");
  const navigate = useNavigate();

  const [bookList, setBookList] = useState(books);

  const total = () => {
    const totalSubtotal = bookList.reduce((acc, book) => acc + book.price * book.quantity, 0);
    return totalSubtotal - discount + shipping + cod + vat;
  };

  const handleAddBook = () => {
    const newBook = {
      image: "https://placehold.co/400",
      name: "New Book Title",
      detail: "Description of the new book.",
      quantity: 1,
      price: 100,
    };
    setBookList([...bookList, newBook]);
  };

  return (
    <div className="orderreview">
      <div className="orderreview1">
        <div className="orderreview2">
          <div className="orderreview4">
            <h6>Order Review</h6>
          </div>
          <div className="orderreview5">
            {bookList.map((book, index) => (
              <div className="orderreview6" key={index}>
                <div className="orderreview7">
                  <img src={book.image} alt={book.name} />
                </div>
                <div className="orderreview8">
                  <p>{book.name}</p>
                  <h6>{book.detail}</h6>
                  <div className="orderreview9">
                    <span>{book.quantity} x</span>
                    <h5>₹ {book.price.toFixed(2)}</h5>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleAddBook}>Add Book</button>
          </div>

          {/* <div className="orderreview44">
            <h6>Promo Code</h6>
          </div> */}

          <div className="orderreview10">
            <div className="orderreview11">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="code"
              />
            </div>
            <div className="orderreview12">
              <button>Apply</button>
            </div>
          </div>

          <div className="orderreview44">
            <h6>Order Summary</h6>
          </div>

          <div className="orderreview13">
            <div className="orderreview14">
              <p>Subtotal</p>
              <span>₹ {bookList.reduce((acc, book) => acc + book.price * book.quantity, 0).toFixed(2)}</span>
            </div>
            <div className="orderreview14">
              <p>Discount</p>
              <span>-₹ {discount.toFixed(2)}</span>
            </div>
            <div className="orderreview14">
              <p>Delivery / Shipping</p>
              <span>₹ {shipping.toFixed(2)}</span>
            </div>
            <div className="orderreview14">
              <p>Cash on Delivery</p>
              <span>₹ {cod.toFixed(2)}</span>
            </div>
            <div className="orderreview14">
              <p>VAT</p>
              <span>₹ {vat.toFixed(2)}</span>
            </div>
            <div className="orderreview14">
              <p style={{ fontWeight: "800", fontSize: "18px" }}>Total</p>
              <span style={{ fontWeight: "800", fontSize: "18px" }}>
                ₹ {total().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="orderreview15">
            <p>Create an account with the provided information.</p>
          </div>
          <div className="orderreview16">
            <div className="orderreview17">
              <input type="checkbox" id="terms" />
              <label htmlFor="terms">
                I have read and agree to the website terms and conditions
              </label>
            </div>

            <div className="orderreview18">
              <p>
                Your personal data will be used to process your order, support
                your experience throughout this website, and for other purposes
                described in our <span>privacy policy.</span>
              </p>
            </div>

            <div className="orderreview19">
              <button
                onClick={() =>
                  navigate(
                    "/studystore/categories/buynow/overviewbill/ordersuccessful"
                  )
                }
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
        <div className="orderreview3">
          <IoMdCloseCircle
            color="#023D50"
            size={25}
            onClick={() => navigate("/studystore/categories/buynow")}
          />
        </div>
      </div>
    </div>
  );
};

// Adding PropTypes for validation
OrderReview.propTypes = {
  books: PropTypes.array,
  subtotal: PropTypes.number,
  discount: PropTypes.number,
  shipping: PropTypes.number,
  cod: PropTypes.number,
  vat: PropTypes.number,
};

export default OrderReview;
