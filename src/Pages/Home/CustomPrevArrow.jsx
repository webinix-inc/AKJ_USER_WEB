import React from 'react';
import img from "../../Image2/img15.jpeg"
import img1 from "../../Image2/img16.jpeg"

const CustomPrevArrow = ({ onClickHandler, hasPrev }) => {
  return (
    hasPrev && (
      <div
        type="button"
        onClick={onClickHandler}
        className="custom-arrow custom-prev-arrow"
        aria-label="Previous Slide"
      >
        <img src={img1} alt="" />
      </div>
    )
  );
};

const CustomNextArrow = ({ onClickHandler, hasNext }) => {
  return (
    hasNext && (
      <div
        type="button"
        onClick={onClickHandler}
        className="custom-arrow custom-next-arrow"
        aria-label="Next Slide"
      >
        <img src={img} alt="" />
      </div>
    )
  );
};

export { CustomPrevArrow, CustomNextArrow };
