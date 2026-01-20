import { Button, Modal } from "antd";
import axios from "axios";
import { City, Country, State } from "country-state-city";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import CountryFlag from "react-country-flag";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import HOC from "../../Components/HOC/HOC";
import PaymentReceipt from "../../Components/Course/PaymentReceipt";
import api from "../../api/axios";
import { getOptimizedBookImage, handleImageError } from "../../utils/imageUtils";
import "./Checkout.css";
import "./StudyStore.css";

function Checkout({ bookId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  console.log("Current state is this :", state);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "IN",
    region: "",
    address: "",
    city: "",
    postCode: "",
    paymentMethod: "Razorpay",
    book: state?.book || null,
    quantity: state?.count || 1,
    cart: state?.cart || null,
    isMultipleItems: state?.isMultipleItems || false,
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (formData.country) {
      const fetchedStates = State.getStatesOfCountry(formData.country);
      setStates(fetchedStates);
      setCities([]);
      updateFormData({ region: "", city: "" });
    }
  }, [formData.country]);

  // useEffect(() => {
  //   const script = document.createElement("script");
  //   script.src = "https://checkout.razorpay.com/v1/checkout.js";
  //   script.async = true;
  //   script.onload = () => console.log("Razorpay script loaded successfully.");
  //   script.onerror = () =>
  //     setError("Failed to load Razorpay script. Please refresh and try again.");
  //   document.body.appendChild(script);

  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, []);

  const updateFormData = (updates) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  const handleCountryChange = (selected) =>
    updateFormData({ country: selected.value });

  const handleStateChange = (selected) => {
    updateFormData({ region: selected.value });
    setCities(City.getCitiesOfState(formData.country, selected.value));
  };

  const handleCityChange = (selected) =>
    updateFormData({ city: selected.value });

  const handleInputChange = ({ target: { name, value } }) =>
    updateFormData({ [name]: value });

  const fetchPostalCodeData = async (postalCode) => {
    if (formData.country !== "IN") return; // Adjust this condition if needed for other countries
    try {
      const { data } = await axios.get(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
      const place = data[0]?.PostOffice[0];
      if (place) {
        updateFormData({
          city: place.Name,
          region: place.District,
          address: `${place.Name}, ${place.District}, ${place.State}`,
          country: place.State === "Delhi" ? "IN" : formData.country, // Adjust as necessary
        });
        setError("");
      } else setError("No data found for this postal code.");
    } catch (err) {
      console.error("Postal code data fetch failed:", err);
      setError("Failed to fetch postal code data.");
    }
  };

  const handlePostalCodeSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchPostalCodeData(formData.postCode);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "country",
      "region",
      "city",
      "address",
      "postCode",
    ];
    const missingField = requiredFields.find((field) => !formData[field]);
    return missingField ? `Please fill in the ${missingField}.` : "";
  };

  const generateReceiptPDF = async (receiptData) => {
    const receiptContainer = document.createElement("div");
    receiptContainer.style.position = "fixed";
    receiptContainer.style.left = "-9999px";
    receiptContainer.style.top = "0";
    receiptContainer.style.width = "210mm";
    receiptContainer.style.backgroundColor = "#ffffff";
    document.body.appendChild(receiptContainer);

    const root = createRoot(receiptContainer);
    root.render(<PaymentReceipt receiptData={receiptData} />);

    setTimeout(async () => {
      try {
        const receiptElement = receiptContainer.querySelector(".payment-receipt");
        if (!receiptElement) {
          throw new Error("Receipt element not found");
        }

        const html2canvas = (await import("html2canvas")).default;
        const jsPDF = (await import("jspdf")).default;

        const canvas = await html2canvas(receiptElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: receiptElement.scrollWidth,
          height: receiptElement.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        const filename = `Payment_Receipt_Book_Order_${new Date().getTime()}.pdf`;
        pdf.save(filename);
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        try {
          root.unmount();
          if (document.body.contains(receiptContainer)) {
            document.body.removeChild(receiptContainer);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    }, 600);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => console.log("Razorpay script loaded successfully.");
    script.onerror = () => setError("Failed to load Razorpay script.");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async () => {
    console.log("@"); // Debugging logs
    const validationError = validateForm();
    console.log("this is validation error : ", validationError);
    if (validationError) {
      console.log("@1");
      setError(validationError);
      alert(`${error}`);
      return;
    }
    setError("");

    console.log("@1");

    console.log("here is this formData at checkout on submit :", formData);

    try {
      let amount;
      
      if (formData.isMultipleItems && formData.cart) {
        // Calculate total from cart
        amount = Math.round(Number(formData.cart.totalPaidAmount));
      } else {
        // Single book calculation
        amount = Math.round(
          Number(formData.book.price) * Number(formData.quantity)
        );
      }

      console.log("@2 - Calling backend to create order");

      const { data } = await api.post("/razorpay/createOrder", {
        amount,
        currency: "INR",
      });

      console.log("data to be sent to razorpay is this :", data);

      if (!data || !data.data || !data.data.id) {
        console.error("❌ Invalid order response:", data);
        setError("Order creation failed. Try again.");
        return;
      }

      console.log("✅ Order received from backend:", data.data);

      const paymentOptions = {
        // key: "rzp_test_t0cV6ZJjCw55mZ",
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "AKJ Classes",
        description: "Order Payment",
        order_id: data.data.id,
        // handler: async (response) => {
        //   console.log("✅ Payment Successful:", response);
        //   await handleOrderPlacement(response);
        // },
        handler: async (response) => {
          console.log("✅ Payment Successful:", response);

          // Set order details for the popup
          let orderDetails;
          
          if (formData.isMultipleItems && formData.cart) {
            orderDetails = {
              transactionId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: formData.cart.totalPaidAmount.toFixed(2),
              itemCount: formData.cart.products.length,
              isMultiple: true,
            };
          } else {
            orderDetails = {
              transactionId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: (formData.book.price * formData.quantity).toFixed(2),
              bookName: formData.book.name,
              quantity: formData.quantity,
              isMultiple: false,
            };
          }
          
          setOrderDetails(orderDetails);

          setIsSuccessModalVisible(true); // Show the success popup

          await handleOrderPlacement(response);

          try {
            const totalAmount =
              formData.isMultipleItems && formData.cart
                ? Number(formData.cart.totalPaidAmount)
                : Number(formData.book.price) * Number(formData.quantity);

            const receiptData = {
              courseTitle: orderDetails.isMultiple
                ? "Book Store Order"
                : orderDetails.bookName || "Book Purchase",
              installmentNumber: 1,
              totalInstallments: 1,
              amount: totalAmount || 0,
              paymentDate: new Date(),
              transactionId: response.razorpay_payment_id || "N/A",
              orderId: response.razorpay_order_id || "N/A",
              trackingNumber: "N/A",
              paymentMode: "book",
              studentName:
                `${formData.firstName} ${formData.lastName}`.trim() || "N/A",
              studentEmail: formData.email || "N/A",
              studentPhone: formData.phone || "N/A",
              planType: orderDetails.isMultiple ? "Multi Item" : "Book Purchase",
              coursePrice: totalAmount || 0,
              amountPaid: totalAmount || 0,
              remainingAmount: 0,
            };

            await generateReceiptPDF(receiptData);
          } catch (receiptError) {
            console.error("❌ Error auto-downloading book receipt:", receiptError);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}.trim()`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#3399cc",
        },
      };

      console.log("🛠 Initializing Razorpay with options:", paymentOptions);

      const rzp = new window.Razorpay(paymentOptions);
      rzp.open();
    } catch (err) {
      console.error("❌ Error during Razorpay integration:", err);
      setError("Failed to initialize payment gateway. Please try again later.");
    }
  };

  // const handleSubmit = async () => {
  //   console.log("@");
  //   const validationError = validateForm();
  //   if (validationError) {
  //     setError(validationError);
  //     return;
  //   }
  //   setError("");

  //   try {
  //     const amount = Math.round(
  //       Number(formData.book.price) * 100 * Number(formData.quantity)
  //     );

  //     const orderData = {
  //       amount,
  //       currency: "INR",
  //       receipt: order_rcpt_${Date.now()},
  //     };

  //     const orderResponse = await axios.post(
  //       "https://api.razorpay.com/v1/orders",
  //       orderData,
  //       {
  //         auth: {
  //           username: "rzp_test_veR0KdRw0EVwKc",
  //           password: "ZWsFIRlncGjhqQaYZtjK3IZI",
  //         },
  //       }
  //     );

  //     const order = orderResponse.data;
  //     const paymentOptions = {
  //       key: "rzp_test_JzFYOynKH405V4",
  //       amount: order.amount,
  //       currency: order.currency,
  //       name: "AKJ Classes",
  //       description: "Order payment",
  //       order_id: order.id,
  //       handler: async (response) => {
  //         console.log("Payment Successful:", response);
  //         await handleOrderPlacement(response);
  //       },
  //       prefill: {
  //         name: ${formData.firstName} ${formData.lastName}.trim(),
  //         email: formData.email,
  //         contact: formData.phone,
  //       },
  //       theme: {
  //         color: "#3399cc",
  //       },
  //     };

  //     const rzp = new window.Razorpay(paymentOptions);
  //     rzp.on("payment.failed", (response) => {
  //       console.error("Payment Failed:", response);
  //       setError("Payment failed. Please try again.");
  //     });

  //     rzp.open();
  //   } catch (err) {
  //     console.error("Error during Razorpay integration:", err);
  //     setError("Failed to initialize payment gateway. Please try again later.");
  //   }
  // };

  // const handleOrderPlacement = async (paymentResponse) => {
  //   try {
  //     const { data } = await api.post("/admin/bookorder", {
  //       paymentId: paymentResponse.razorpay_payment_id,
  //       ...formData,
  //     });
  //     if (data.success) {
  //       console.log("Payment successful");
  //     } else setError("Order placement failed. Please try again.");
  //   } catch (err) {
  //     console.error("Order placement error:", err);
  //     setError("Order placement failed. Please try again.");
  //   }
  // };
  const handleOrderPlacement = async (paymentResponse) => {
    try {
      let orderData;

      if (formData.isMultipleItems && formData.cart) {
        // Multiple items from cart
        orderData = {
          transactionId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            country: formData.country,
            region: formData.region,
            city: formData.city,
            postCode: formData.postCode,
          },
          items: formData.cart.products.map(item => {
            const isBook = item.itemType === 'book';
            const itemData = isBook ? item.book : item.product;
            
            return {
              id: itemData._id,
              name: isBook ? itemData.name : itemData.productName,
              author: isBook ? itemData.author : null,
              price: item.price,
              quantity: item.quantity,
              totalAmount: item.totalAmount,
              itemType: item.itemType,
              imageUrl: isBook ? itemData.imageUrl : itemData.image,
            };
          }),
          totalAmount: formData.cart.totalPaidAmount.toFixed(2),
          isMultipleItems: true,
        };
      } else {
        // Single book order
        orderData = {
          transactionId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            country: formData.country,
            region: formData.region,
            city: formData.city,
            postCode: formData.postCode,
          },
          book: {
            name: formData.book.name,
            author: formData.book.author,
            price: formData.book.price,
            imageUrl: formData.book.imageUrl || "",
          },
          quantity: formData.quantity,
          totalAmount: (formData.book.price * formData.quantity).toFixed(2),
          isMultipleItems: false,
        };
      }

      const { data } = await api.post("/orders", orderData);

      if (data.success) {
        console.log("✅ Order successfully saved in the database.");
        
        // Clear cart if multiple items were purchased
        if (formData.isMultipleItems && formData.cart) {
          try {
            await api.delete("/user/cart/delete");
            console.log("✅ Cart cleared successfully.");
          } catch (cartError) {
            console.error("❌ Error clearing cart:", cartError);
          }
        }
        
        setIsSuccessModalVisible(true); // Show success modal
      } else {
        setError("Failed to save order. Please try again.");
      }
    } catch (err) {
      console.error("❌ Order saving error:", err);
      setError("Order placement failed. Please try again.");
    }
  };

  const mockPaymentProcessing = (method) => ({ success: true });

  const countryOptions = (Country?.getAllCountries ? Country.getAllCountries() : []).map((country) => ({
    value: country.isoCode,
    label: (
      <div>
        <CountryFlag
          countryCode={country.isoCode}
          svg
          style={{ width: "20px", marginRight: "8px" }}
        />
        {country.name}
      </div>
    ),
  }));

  const getCurrentLocation = () => {
    if (!navigator.geolocation)
      return setError("Geolocation not supported by browser.");
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (data.display_name) updateFormData({ address: data.display_name });
        } catch (err) {
          console.error("Location fetch failed:", err);
          setError("Failed to fetch location. Try manually entering address.");
        }
      },
      (err) =>
        setError("Location access denied. Please enter address manually.")
    );
  };

  // Fetch Saved Locations
  useEffect(() => {
    const fetchSavedLocations = async () => {
      try {
        const { data } = await api.get("/location/list");
        if (data.success) {
          setSavedLocations(data.locations);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchSavedLocations();
  }, []);

  // Handle Saved Location Select
  const handleSavedLocationSelect = (selectedOption) => {
    if (!selectedOption) return;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      country,
      region,
      city,
      postCode,
    } = selectedOption.value;

    updateFormData({
      firstName,
      lastName,
      email,
      phone,
      address,
      country,
      region,
      city,
      postCode,
    });
  };

  // Save Current Address
  const saveCurrentLocation = async () => {
    try {
      const locationData = {
        name: "Saved Address", // Default name
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        postCode: formData.postCode,
      };

      const { data } = await api.post("/location/save", locationData);

      if (data.success) {
        alert("Location saved successfully!");
        setSavedLocations([
          ...savedLocations,
          { ...locationData, id: data.location._id },
        ]);
      } else {
        setError("Failed to save location.");
      }
    } catch (error) {
      console.error("Error saving location:", error);
      setError("Failed to save location.");
    }
  };

  const handleModalClose = () => {
    setIsSuccessModalVisible(false);
    navigate("/studystore/categories"); // Redirect to orders page
  }

  return (
    <div className="checkout">
      <div className="checkout1 mt-9">
        <h6>Checkout</h6>
        <p>Already Registered? Click here to Login</p>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="checkout-container ">
        <div className="checkout2 checkout-form">
          <div className="checkout3">
            <div className="checkout4">
              <p>1</p>
            </div>
            <h6>Personal Information</h6>
          </div>

          <div>
            {/* Styled Dropdown with "View Details" button */}
            <div className="checkout6 mt-4">
              <label>Select a saved location</label>
              <Select
                options={savedLocations.map((loc) => ({
                  value: loc,
                  label: (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {loc.name} - {loc.city}, {loc.region}, {loc.country} (
                        {loc.postCode})
                      </span>

                      <Button
                        type="primary"
                        size="small"
                        style={{ marginLeft: 10, color: "#fff" }}
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Prevent Select from closing
                          setSelectedLocation(loc); // Ensure 'loc' is defined in scope
                          setIsModalVisible(true); // ✅ Fix: Open modal correctly
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ),
                }))}
                onChange={handleSavedLocationSelect}
                placeholder="Select a saved location"
              />
            </div>

            {/* Modal to Show Full Location Details */}
            {selectedLocation && (
              <Modal
                title="Saved Location Details"
                open={isModalVisible} // ✅ Fix: Use open instead of isOpen
                onCancel={() => setIsModalVisible(false)}
                footer={[
                  <Button key="close" onClick={() => setIsModalVisible(false)}>
                    Close
                  </Button>,
                ]}
              >
                {selectedLocation && (
                  <div>
                    <p>
                      <strong>Name:</strong> {selectedLocation.name}
                    </p>
                    <p>
                      <strong>First Name:</strong> {selectedLocation.firstName}
                    </p>
                    <p>
                      <strong>Last Name:</strong> {selectedLocation.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedLocation.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedLocation.phone}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedLocation.address}
                    </p>
                    <p>
                      <strong>City:</strong> {selectedLocation.city}
                    </p>
                    <p>
                      <strong>Region:</strong> {selectedLocation.region}
                    </p>
                    <p>
                      <strong>Country:</strong> {selectedLocation.country}
                    </p>
                    <p>
                      <strong>Postal Code:</strong> {selectedLocation.postCode}
                    </p>
                  </div>
                )}
              </Modal>
            )}
          </div>

          <div className="checkout5">
            {["firstName", "lastName", "email", "phone"].map((field) => (
              <div className="checkout6" key={field}>
                <label>{field.replace(/([A-Z])/g, " $1").trim()}</label>
                <input
                  type="text"
                  name={field}
                  placeholder={`Enter Your ${field}`}
                  value={formData[field]}
                  onChange={handleInputChange}
                />
              </div>
            ))}

            <div className="checkout10">
              <div className="checkout9 input-container">
                <label>Pin Code</label>
                <input
                  type="text"
                  name="postCode"
                  placeholder="Enter Post Code"
                  value={formData.postCode}
                  onChange={handleInputChange}
                  onKeyDown={handlePostalCodeSubmit}
                />
              </div>
            </div>

            <div className="checkout6">
              <label>Country</label>
              <Select
                options={countryOptions}
                onChange={handleCountryChange}
                defaultValue={countryOptions.find((opt) => opt.value === "IN")}
              />
            </div>

            <div className="checkout6">
              <label>Region (State)</label>
              <Select
                options={states.map((state) => ({
                  value: state.isoCode,
                  label: state.name,
                }))}
                onChange={handleStateChange}
                isDisabled={!states.length}
              />
            </div>

            <div className="checkout6">
              <label>City</label>
              <Select
                options={cities.map((city) => ({
                  value: city.name,
                  label: city.name,
                }))}
                onChange={handleCityChange}
                isDisabled={!cities.length}
              />
            </div>
          </div>

          <div className="checkout7">
            <div className="checkout6">
              <label>Enter Location</label>
              <input
                type="text"
                name="address"
                placeholder="Enter Your Shipping Address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="checkout16">
            <button onClick={handleSubmit}>Place Your Order</button>
            <button onClick={saveCurrentLocation}>Save This Location</button>
          </div>
        </div>
        {formData.isMultipleItems && formData.cart ? (
          <div className="checkout-book-details checkout2">
            <h6>Order Summary ({formData.cart.products.length} items)</h6>
            {formData.cart.products.map((item, index) => {
              const isBook = item.itemType === 'book';
              const itemData = isBook ? item.book : item.product;
              
              return (
                <div key={index} className="book-card mb-4 border-b pb-4">
                  <img
                    src={isBook ? getOptimizedBookImage(itemData) : itemData.image}
                    alt={isBook ? itemData.name : itemData.productName}
                    className="book-image"
                    crossOrigin="anonymous"
                    onError={(e) => isBook && handleImageError(e, itemData)}
                  />
                  <div className="book-info">
                    <h6>{isBook ? itemData.name : itemData.productName}</h6>
                    {isBook && itemData.author && (
                      <p><strong>Author:</strong> {itemData.author}</p>
                    )}
                    <p><strong>Price:</strong> ₹{item.price}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Subtotal:</strong> ₹{item.totalAmount}</p>
                  </div>
                </div>
              );
            })}
            <div className="checkout-total">
              <div className="checkout-total-details">
                <p className="checkout-total-amount">
                  <strong>Total Amount: ₹{formData.cart.totalPaidAmount.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : formData.book && (
          <div className="checkout-book-details checkout2">
            <div className="book-card">
              <img
                src={getOptimizedBookImage(formData.book)}
                alt={formData.book.name}
                className="book-image"
                crossOrigin="anonymous"
                onError={(e) => handleImageError(e, formData.book)}
              />
              <div className="book-info">
                <h6>{formData.book.name}</h6>
                <p>
                  <strong>Author:</strong> {formData.book.author}
                </p>
                <p>
                  <strong>Price:</strong> ₹{formData.book.price}
                </p>
                <p>
                  <strong>Quantity:</strong> {formData.quantity}
                </p>
                <p className="description">
                  <strong>Description:</strong> {formData.book.description}
                </p>
              </div>
            </div>
            <div className="checkout-total">
              <h6>Order Summary</h6>
              <div className="checkout-total-details">
                <p>
                  <strong>Price per Book:</strong> ₹{formData.book.price}
                </p>
                <p>
                  <strong>Quantity:</strong> {formData.quantity}
                </p>
                <p className="checkout-total-amount">
                  <strong>Total Amount:</strong> ₹
                  {(formData.book.price * formData.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="🎉 Payment Successful!"
        open={isSuccessModalVisible}
        onCancel={() => setIsSuccessModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={handleModalClose}
          >
            OK
          </Button>,
        ]}
      >
        {orderDetails && (
          <div>
            <p>
              <strong>Transaction ID:</strong> {orderDetails.transactionId}
            </p>
            <p>
              <strong>Order ID:</strong> {orderDetails.orderId}
            </p>
            {orderDetails.isMultiple ? (
              <>
                <p>
                  <strong>Items:</strong> {orderDetails.itemCount} items
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{orderDetails.amount}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Book:</strong> {orderDetails.bookName}
                </p>
                <p>
                  <strong>Quantity:</strong> {orderDetails.quantity}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{orderDetails.amount}
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HOC(Checkout);
