import React from "react";

const CustomIndicator = ({ index, isSelected, onClick }) => {
  return (
    <li
      style={{
        background: isSelected ? "#023d50" : "#ccc",
        width: 10,
        height: 10,
        borderRadius: "50%",
        display: "inline-block",
        margin: "20 8px",
        cursor: "pointer",
      }}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Slide ${index + 1}`}
    />
  );
};

export default CustomIndicator;
