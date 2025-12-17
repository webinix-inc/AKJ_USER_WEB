import React, { useState } from "react";
import "./StudyStore.css";

import HOC from "../../Components/HOC/HOC";
import TopTab from "./TopTab";

import { IoMdStar } from "react-icons/io";

import img from "../../Image2/img35.jpeg";
import img1 from "../../Image2/img37.jpeg";

const Delivered = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleClick = (index) => {
    setActiveIndex(index);
  };
  return (
    <>
      <div className="studystore">
        <div className="studystore1">
          <TopTab />
        </div>
        <div className="studystore2">
          <div className="studystor17">
            <p>
              Select
              Months:---------------------------------------------------------
            </p>
            <div className="studystor18">
              {["Last 12 Months", "Last 6 Months", "This Week"].map(
                (text, index) => (
                  <div
                    key={index}
                    className={`studystor19 ${
                      activeIndex === index ? "active" : ""
                    }`}
                    onClick={() => handleClick(index)}>
                    <p>{text}</p>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="studystore4">
            <div className="studystore5">
              <div className="studystore6">
                <img src={img} alt="" />
              </div>
              <div className="studystore7">
                <h6>A Book Of Hope</h6>
                <div className="studystore8">
                  <div className="studystore9">
                    <img src={img1} alt="" />
                  </div>
                  <p>Leonardo</p>
                </div>
                <div className="studystor10">
                  <p>Rs. 499/- </p>
                </div>
                <div className="studystor11">
                  <p>
                    Lorem Ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </div>
              <div className="studystor12">
                <IoMdStar color="#FC9721" size={25} />
                <p>4.5</p>
              </div>
            </div>
            <div className="studystore5">
              <div className="studystore6">
                <img src={img} alt="" />
              </div>
              <div className="studystore7">
                <h6>A Book Of Hope</h6>
                <div className="studystore8">
                  <div className="studystore9">
                    <img src={img1} alt="" />
                  </div>
                  <p>Leonardo</p>
                </div>
                <div className="studystor10">
                  <p>Rs. 499/- </p>
                </div>
                <div className="studystor11">
                  <p>
                    Lorem Ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </div>
              <div className="studystor12">
                <IoMdStar color="#FC9721" size={25} />
                <p>4.5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Delivered;
