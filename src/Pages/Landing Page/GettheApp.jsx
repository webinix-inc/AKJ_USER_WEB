import React from "react";
import "./LandingPage.css";
import img from "../../Image2/img1.png";
import img1 from "../../Image2/img1.png";
import img2 from "../../Image2/img6.png";
import img3 from "../../Image2/img7.png";
import img4 from "../../Image2/img8.png";
import img5 from "../../Image2/img9.png";
import img6 from "../../Image2/img2.png";

const GettheApp = () => {
  return (
    <>
      <div className="landingpage51">
        <div className="landingpage52">
          <div className="landingpage53">
            <div className="landingpage54">
              <img src={img} alt="" />
            </div>
            <div className="landingpage55">
              <h6>
                Learn from anywhere <br />
                <span>
                  Get the App <img src={img6} alt="" />
                </span>
              </h6>
            </div>
            <div className="landingpage56">
              <img src={img2} alt="" />
            </div>
            <div className="landingpage57">
              <p>(Scan the QR code to download the app)</p>
              <p>(Available on Android, iOS and Website)</p>
            </div>
            <div className="landingpage58">
              <img src={img3} alt="" />
              <img src={img4} alt="" />
            </div>
          </div>
          <div className="landingpage59">
            <div className="landingpage60">
              <div className="landingpage61">
                <img src={img1} alt="" />
              </div>
              <div className="landingpage62">
                <img src={img} alt="" />
              </div>
            </div>

            <div className="landingpage63">
              <img src={img5} alt="" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GettheApp;
