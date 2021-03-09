import React, { useEffect } from "react";

import Tempscale from "./tempscale.js";
import WeatherMap from "./Classes.js";
function App() {
  useEffect(() => {
    //get data from weather stations and coordinates of markers and after it Make grid

    const weatherMap = new WeatherMap();
    weatherMap.printMap();
  }, []);

  return (
    <div className="root">
      <div id="mapid"></div>
      <div id="TempScale">{<Tempscale />}</div>
    </div>
  );
}

export default App;
