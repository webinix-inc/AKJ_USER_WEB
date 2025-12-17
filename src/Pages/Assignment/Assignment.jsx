import React from "react";
import "./Assignment.css";
import HOC from "../../Components/HOC/HOC";

import img from "../../Image2/img41.jpeg";
import { HiDownload } from "react-icons/hi";

const Assignment = () => {
  return (
    <>
      <div className="noticeoverview">
        <div className="home5">
          <h6>Assignment</h6>
        </div>

        <div className="noticeoverview1">
          <div className="noticeoverview2">
            <div className="noticeoverview3">
              <img src={img} alt="" />
            </div>
            <div className="noticeoverview4">
              <h6>English Book Assignment</h6>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                <br />
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                <br /> dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur.
              </p>
              <h6>Due Date: April 29, 2024</h6>
            </div>
            <div className="noticeoverview5">
              <p>3:20 PM</p>
              <div className="noticeoverview6">
                <HiDownload color="#FFFFFF" size={25} />
              </div>
            </div>
          </div>
          <div className="noticeoverview2">
            <div className="noticeoverview3">
              <img src={img} alt="" />
            </div>
            <div className="noticeoverview4">
              <h6>English Book Assignment</h6>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                <br />
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                <br /> dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur.
              </p>
              <h6>Due Date: April 29, 2024</h6>
            </div>
            <div className="noticeoverview5">
              <p>3:20 PM</p>
              <div className="noticeoverview6">
                <HiDownload color="#FFFFFF" size={25} />
              </div>
            </div>
          </div>
          <div className="noticeoverview2">
            <div className="noticeoverview3">
              <img src={img} alt="" />
            </div>
            <div className="noticeoverview4">
              <h6>English Book Assignment</h6>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                <br />
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                <br /> dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur.
              </p>
              <h6>Due Date: April 29, 2024</h6>
            </div>
            <div className="noticeoverview5">
              <p>3:20 PM</p>
              <div className="noticeoverview6">
                <HiDownload color="#FFFFFF" size={25} />
              </div>
            </div>
          </div>
          <div className="noticeoverview2">
            <div className="noticeoverview3">
              <img src={img} alt="" />
            </div>
            <div className="noticeoverview4">
              <h6>English Book Assignment</h6>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                <br />
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                <br /> dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur.
              </p>
              <h6>Due Date: April 29, 2024</h6>
            </div>
            <div className="noticeoverview5">
              <p>3:20 PM</p>
              <div className="noticeoverview6">
                <HiDownload color="#FFFFFF" size={25} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HOC(Assignment);
