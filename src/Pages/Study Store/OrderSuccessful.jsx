import React from "react";
import HOC from "../../Components/HOC/HOC";
import "./StudyStore.css";

import img from "../../Image2/img41.jpeg";
import { useNavigate } from "react-router-dom";

const OrderSuccessful = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="ordersuccess">
        <div className="ordersuccess1">
          <img src={img} alt="" />
          <h6>Your Order Placed Successfully</h6>
        </div>

        <div className="ordersuccess2">
          <div className="ordersuccess3">
            <h6>Expected Delivery Time</h6>
            <p>April 6, 2024 | 8:00 AM</p>
          </div>
          <div className="ordersuccess3">
            <div className="ordersuccess4">
              <h6>Need Our Help !</h6>
              <div className="ordersuccess5">
                <p>+919872450..</p>
              </div>
            </div>
            <p>For any query call on this number</p>
          </div>
        </div>

        <div className="ordersuccess6">
          <div className="ordersuccess7">
            <h6>Return Policy</h6>
          </div>
          <div className="ordersuccess8">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>

        <div className="ordersuccess9">
          <button onClick={() => navigate("/home")}>Back To Home</button>
        </div>
      </div>
    </>
  );
};

export default OrderSuccessful;
