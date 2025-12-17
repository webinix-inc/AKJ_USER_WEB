import React from "react";
import "./StudyStore.css";
import { useNavigate, useLocation } from "react-router-dom";

const TopTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <div className="toppart">
        <div className="toppart1">
          <p
            className={
              location.pathname === "/studystore/categories"
                ? "toppart2"
                : "toppart3"
            }
            onClick={() => navigate("/studystore/categories")}>
            Books
          </p>
          {/* <p
            className={
              location.pathname === "/studystore/my_orders"
                ? "toppart2"
                : "toppart3"
            }
            onClick={() => navigate("/studystore/my_orders")}>
            My Orders
          </p>
          <p
            className={
              location.pathname === "/studystore/my_cart"
                ? "toppart2"
                : "toppart3"
            }
            onClick={() => navigate("/studystore/my_cart")}>
            My Cart
          </p> */}
          {/* <p
            className={
              location.pathname === "/studystore/delivered"
                ? "toppart2"
                : "toppart3"
            }
            onClick={() => navigate("/studystore/delivered")}>
            Delivered
          </p> */}
        </div>
      </div>
    </>
  );
};

export default TopTab;
