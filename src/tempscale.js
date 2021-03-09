import React, { useEffect } from "react";

export default function Tempscale() {
  useEffect;
  const ulList = document.querySelector(".tempscale__ul");
  for (let index = 0; index < 360; index++) {
    const liElement = document.createElement("li");
    liElement.style.backgroundColor = `hsl(${index},100%,50%)`;
    // ulList.appendChild(liElement);
    console.log(ulList);
  }
  return (
    <div className="tempscale">
      <ul className="tempscale__ul">
        <p>
          <span>40°</span>
          <span>20°</span>
          <span>0°</span>
          <span>-20°</span>
          <span>-40°</span>
        </p>
      </ul>
    </div>
  );
}
