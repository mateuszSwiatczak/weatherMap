import React, { useEffect } from "react";
import L from "leaflet";
import Tempscale from "./tempscale.js";
function App() {
  let map;
  let points = [];
  const polandPolygon = [
    [14.063, 48.894],
    [24.302, 54.952],
  ];

  useEffect(() => {
    //initialize map
    map = L.map("mapid").setView([52.133, 19.841], 7);
    L.tileLayer(
      "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWF0ZXVzenN3aSIsImEiOiJja2tpZTF6NHYxbThiMnZtbjl5Mzg5cTVjIn0.Sxs-1oPYuv7QqC045wwxKw",
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "mapbox/streets-v11",
        tileSize: 512,
        zoomOffset: -1,
        accessToken:
          "pk.eyJ1IjoibWF0ZXVzenN3aSIsImEiOiJja2tpZTF6NHYxbThiMnZtbjl5Mzg5cTVjIn0.Sxs-1oPYuv7QqC045wwxKw",
      }
    ).addTo(map);
  }, []);

  useEffect(() => {
    //get data from weather stations and coordinates of markers and after it Make grid
    weatherfetch()
      .then(response => response.json())
      .then(data => {
        const waitForMakePointOnMap = async _ => {
          /*  const promises = await getCoordinates(data[0]); */
          const promises = data.map(async x => {
            const point = await getCoordinates(x);
            return point;
          });
          await Promise.all(promises);
          makeGrid();
        };
        waitForMakePointOnMap();
      });
  }, []);
  async function weatherfetch() {
    //fetch data from API
    const responseW = await fetch(
      "https://danepubliczne.imgw.pl/api/data/synop"
    );
    return responseW;
  }
  async function getCoordinates(dataofstation) {
    //get coords of each marker by name of the station
    const translated =
      "https://api.opencagedata.com/geocode/v1/json?q=" +
      dataofstation.stacja.split(" ").join("%20") +
      "&key=78fab1d01e3e414084228a7c8f27fb2a&language=en&pretty=1";
    await fetch(translated)
      .then(response => response.json())
      .then(data => makeMarker(dataofstation, data));
  }
  const makeMarker = (station, dataMarker) => {
    //Place market on the map with additional color and popup
    const myIcon = L.divIcon({
      className: "leaflet-pane leaflet-marker-pane",
      html: `<i class="fas fa-thermometer-half temperature" style="color:hsl(${hue(
        station.temperatura
      )}, 100%, 25%)"></i>`,
    });
    const filtredArr = dataMarker.results.filter(filterArr);
    try {
      points.push([
        station.temperatura,
        filtredArr[0].geometry.lat,
        filtredArr[0].geometry.lng,
      ]);
      const marker = L.marker(
        [filtredArr[0].geometry.lat, filtredArr[0].geometry.lng],
        {
          icon: myIcon,
        }
      ).addTo(map);
      L.circle([filtredArr[0].geometry.lat, filtredArr[0].geometry.lng], {
        radius: 5000,
        fill: true,
        fillColor: hslToHex(hue(station.temperatura)),
        stroke: false,
        fillOpacity: 0.6,
      }).addTo(map);
      marker.bindPopup(`stacja: ${station.stacja}</br>temperatura: ${station.temperatura}</br>
      prędkość wiatru: ${station.predkosc_wiatru} km/h`);
      marker.on("mouseover", function (e) {
        this.openPopup();
      });
      marker.on("mouseout", function (e) {
        this.closePopup();
      });
    } catch {
      if (station.stacja) {
        console.log(
          `Miasto ${station.stacja} nie zostało odnalezione w bazie danych w Polsce`
        );
      }
    }
  };
  /* additional functions to this */
  const filterArr = obj => {
    if (
      obj.components.country === "Poland" ||
      obj.components.country === "Slovakia" // Becouse API send Kasprowy Wierch as Slovakia
    ) {
      return obj;
    } else {
      return;
    }
  };
  /* end */
  const makeGrid = () => {
    const wSimpleRect = (polandPolygon[1][0] - polandPolygon[0][0]) / 10;
    const hSimpleRect = (polandPolygon[1][1] - polandPolygon[0][1]) / 10;
    for (let i = 0; i < 10; i++) {
      for (let i1 = 0; i1 < 10; i1++) {
        L.rectangle(
          [
            [
              polandPolygon[0][1] + hSimpleRect * i1,
              polandPolygon[0][0] + wSimpleRect * i,
            ],
            [
              polandPolygon[0][1] + hSimpleRect * i1 + hSimpleRect,
              polandPolygon[0][0] + wSimpleRect * i + wSimpleRect,
            ],
          ],
          styleRec(
            isPointInCell(
              [
                polandPolygon[0][1] + hSimpleRect * i1,
                polandPolygon[0][0] + wSimpleRect * i,
              ],
              [
                polandPolygon[0][1] + hSimpleRect * i1 + hSimpleRect,
                polandPolygon[0][0] + wSimpleRect * i + wSimpleRect,
              ],
              wSimpleRect,
              hSimpleRect
            )
          )
        ).addTo(map);
      }
    }
  };
  /* additional functions to this */
  const styleRec = (pointsInCell = null) => {
    //Style polygon
    if (pointsInCell === null) {
      return {
        stroke: false,
        fillOpacity: 0,
      };
    } else {
      return {
        stroke: false,
        fillOpacity: 0.5,
        fillColor: hslToHex(hue(pointsInCell)),
      };
    }
  };
  const isPointInCell = (startCords, endCords, WSR = 0, HSR = 0) => {
    //Search marker inside Polygon and if theres no marker-find approximate temperature
    const pointAtCell = points.filter(x => {
      if (
        x[1] > startCords[0] &&
        x[2] > startCords[1] &&
        x[1] < endCords[0] &&
        x[2] < endCords[1]
      ) {
        return x[0];
      } else return false;
    });
    if (pointAtCell[0] !== undefined) {
      if (pointAtCell.length > 1) {
        const aveTemp = [];
        pointAtCell.forEach(x => {
          aveTemp.push(x[0]);
        });
        return aveTemp.reduce(function (acc, val) {
          return acc + val / aveTemp.length;
        }, 0);
      } else {
        return pointAtCell[0][0];
      }
    } else {
      if (WSR) {
        const NearPointAvg = getTempByNearMarkers(
          startCords,
          endCords,
          WSR,
          HSR
        );
        if (NearPointAvg.length > 1) {
          return NearPointAvg.reduce(function (acc, val) {
            return acc + val / NearPointAvg.length;
          }, 0);
        } else {
          return null;
        }
      }
    }
  };

  const getTempByNearMarkers = (
    //Find approximate temperature
    startCords,
    endCords,
    widthSimpleRectangle,
    heightSimpleRectangle
  ) => {
    const tempOfClosePoints = [];
    tempOfClosePoints.push(
      isPointInCell(
        [startCords[0], startCords[1] - widthSimpleRectangle],
        [endCords[0], endCords[1] - widthSimpleRectangle]
      )
    );
    tempOfClosePoints.push(
      isPointInCell(
        [startCords[0], startCords[1] + widthSimpleRectangle],
        [endCords[0], endCords[1] + widthSimpleRectangle]
      )
    );
    tempOfClosePoints.push(
      isPointInCell(
        [startCords[0] - heightSimpleRectangle, startCords[1]],
        [endCords[0] - heightSimpleRectangle, endCords[1]]
      )
    );
    tempOfClosePoints.push(
      isPointInCell(
        [startCords[0] + heightSimpleRectangle, startCords[1]],
        [endCords[0] + heightSimpleRectangle, endCords[1]]
      )
    );
    const fitredTempOfClosePoints = tempOfClosePoints.filter(x => {
      return x !== undefined;
    });
    return fitredTempOfClosePoints;
  };
  /* end */

  /* Styling of elements */

  const hue = temp => {
    //Convert temperature to color
    return 150 + 1.875 * -tempReduce(temp);
  };
  /* additional functions to this */
  const tempReduce = x => {
    //Prevent loop color
    let t = x;
    t > 40 && (t = 40);
    t < -40 && (t = -40);
    return t;
  };
  /* end */
  function hslToHex(h) {
    //Convert hsl to hex color - leaflet support only hex
    const l = 0.5;
    const a = (100 * Math.min(l, 1 - l)) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  return (
    <div className="root">
      <div id="mapid"></div>
      <div id="TempScale">{<Tempscale />}</div>
    </div>
  );
}

export default App;
