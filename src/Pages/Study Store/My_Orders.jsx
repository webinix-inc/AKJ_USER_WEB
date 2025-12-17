import React from "react";
import "./StudyStore.css";

import HOC from "../../Components/HOC/HOC";
import TopTab from "./TopTab";

import { IoMdStar } from "react-icons/io";

import img from "../../Image2/img35.jpeg";
import img1 from "../../Image2/img37.jpeg";

const My_Orders = () => {
  return (
    <>
      <div className="studystore">
        <div className="studystore1">
          <TopTab />
        </div>
        <div className="studystore2">
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

export default My_Orders;
