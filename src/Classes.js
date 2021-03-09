import L from "leaflet";
("use strict");
class WeatherMapStyle {
  constructor() {
    this.points = [];
    this.polandPolygon = [
      [14.063, 48.894],
      [24.302, 54.952],
    ];
    this.wSimpleRect =
      (this.polandPolygon[1][0] - this.polandPolygon[0][0]) / 10;
    this.hSimpleRect =
      (this.polandPolygon[1][1] - this.polandPolygon[0][1]) / 10;
  }
  styleRec(pointsInCell = null) {
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
        fillColor: this.hslToHex(this.hue(pointsInCell)),
      };
    }
  }
  hue(temp) {
    //Convert temperature to color
    return 150 + 1.875 * -this.tempReduce(temp);
  }
  tempReduce(temp) {
    //Prevent loop color
    let t = temp;
    t > 40 && (t = 40);
    t < -40 && (t = -40);
    return t;
  }
  hslToHex(h) {
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
}

class WeatherMapAlgorythms extends WeatherMapStyle {
  super() {}
  selectPoint(obj) {
    //select of all points request to Poland
    if (
      obj.components.country === "Poland" ||
      obj.components.country === "Slovakia" // Becouse API send Kasprowy Wierch as Slovakia
    ) {
      return obj;
    } else {
      return;
    }
  }
  pointInCell(startCords, endCords) {
    //Search marker inside Polygon
    const pointAtCell = this.points.filter(x => {
      if (
        x[1] > startCords[0] &&
        x[2] > startCords[1] &&
        x[1] < endCords[0] &&
        x[2] < endCords[1]
      ) {
        return x[0];
      } else return false;
    });
    if (pointAtCell[0]) {
      if (pointAtCell.length > 1) {
        const points = [];
        pointAtCell.forEach(x => {
          points.push(x[0]);
        });
        return this.averageTemperature(points);
      } else {
        return pointAtCell[0][0];
      }
    } else {
      return undefined;
    }
  }
  isTempForCell(startCords, endCords) {
    //find marker or average temperature of single cell
    const isPointInCell = this.pointInCell(startCords, endCords);
    if (isPointInCell) {
      return isPointInCell;
    } else {
      const nearPoints = this.getTempByNearMarkers(startCords, endCords);
      if (nearPoints !== null) {
        return this.averageTemperature(nearPoints);
      } else {
        return null;
      }
    }
  }
  averageTemperature(arr) {
    //average temperature
    return arr.reduce(function (acc, val) {
      return acc + val / arr.length;
    }, 0);
  }
  getTempByNearMarkers(startCords, endCords) {
    //Find approximate temperature
    const rightCornerPoints = [];
    const lefCornerPoints = [];
    lefCornerPoints.push(
      this.pointInCell(
        [startCords[0], startCords[1] - this.wSimpleRect],
        [endCords[0], endCords[1] - this.wSimpleRect]
      )
    );
    rightCornerPoints.push(
      this.pointInCell(
        [startCords[0], startCords[1] + this.wSimpleRect],
        [endCords[0], endCords[1] + this.wSimpleRect]
      )
    );
    rightCornerPoints.push(
      this.pointInCell(
        [startCords[0] - this.hSimpleRect, startCords[1]],
        [endCords[0] - this.hSimpleRect, endCords[1]]
      )
    );
    lefCornerPoints.push(
      this.pointInCell(
        [startCords[0] + this.hSimpleRect, startCords[1]],
        [endCords[0] + this.hSimpleRect, endCords[1]]
      )
    );
    rightCornerPoints.push(
      this.pointInCell(
        [startCords[0] + this.hSimpleRect, startCords[1] + this.wSimpleRect],
        [endCords[0] + this.hSimpleRect, endCords[1] + this.wSimpleRect]
      )
    );
    rightCornerPoints.push(
      this.pointInCell(
        [startCords[0] - this.hSimpleRect, startCords[1] + this.wSimpleRect],
        [endCords[0] - this.hSimpleRect, endCords[1] + this.wSimpleRect]
      )
    );
    lefCornerPoints.push(
      this.pointInCell(
        [startCords[0] + this.hSimpleRect, startCords[1] - this.wSimpleRect],
        [endCords[0] + this.hSimpleRect, endCords[1] - this.wSimpleRect]
      )
    );
    lefCornerPoints.push(
      this.pointInCell(
        [startCords[0] - this.hSimpleRect, startCords[1] - this.wSimpleRect],
        [endCords[0] - this.hSimpleRect, endCords[1] - this.wSimpleRect]
      )
    );
    return this.fitredTempOfClosePoints(lefCornerPoints, rightCornerPoints);
  }
  fitredTempOfClosePoints(lefCornerPoints, rightCornerPoints) {
    const arr = [lefCornerPoints, rightCornerPoints].map(arr => {
      arr.filter(x => {
        return x !== undefined;
      });
    });
    if (arr[0] === undefined || arr[1] === undefined) {
      return null;
    } else {
      return arr[0].concat(arr[1]);
    }
  }
}

class WeatherMap extends WeatherMapAlgorythms {
  super() {}

  printMap() {
    this.map = L.map("mapid").setView([52.133, 19.841], 7);
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
    ).addTo(this.map);
    const weatherPoints = this.fetchWeather();
    this.getCoordinatesOfPoints(weatherPoints);
  }
  async fetchWeather() {
    //fetch data from API
    const responseW = await fetch(
      "https://danepubliczne.imgw.pl/api/data/synop"
    );
    return responseW;
  }
  getCoordinatesOfPoints(pointsOfWeather) {
    pointsOfWeather
      .then(response => response.json())
      .then(data => {
        const waitForMakePointOnMap = async () => {
          const promises = data.map(async station => {
            const point = await this.getCoordinatesOfPoint(station);
            return point;
          });
          await Promise.all(promises);
          alert(
            "Aby zobaczyć temperaturę dla danego obszaru kliknij w znacznik termometru"
          );
          this.makeGrid();
        };
        waitForMakePointOnMap();
      });
  }
  async getCoordinatesOfPoint(station) {
    //get coords of one marker by name of the station and then make Marker on map
    const translated =
      "https://api.opencagedata.com/geocode/v1/json?q=" +
      station.stacja.split(" ").join("%20") +
      "&key=78fab1d01e3e414084228a7c8f27fb2a&language=en&pretty=1";
    await fetch(translated)
      .then(response => response.json())
      .then(data => this.makeMarker(station, data));
  }
  makeMarker(station, dataMarker) {
    //Place market on the map with additional color and popup
    const myIcon = L.divIcon({
      className: "leaflet-pane leaflet-marker-pane",
      html: `<i class="fas fa-thermometer-half temperature" style="color:hsl(${this.hue(
        station.temperatura
      )}, 100%, 25%)"></i>`,
    });
    const filtredArr = dataMarker.results.filter(this.selectPoint);
    try {
      this.points.push([
        station.temperatura,
        filtredArr[0].geometry.lat,
        filtredArr[0].geometry.lng,
      ]);
      const marker = L.marker(
        [filtredArr[0].geometry.lat, filtredArr[0].geometry.lng],
        {
          icon: myIcon,
        }
      ).addTo(this.map);
      L.circle([filtredArr[0].geometry.lat, filtredArr[0].geometry.lng], {
        radius: 5000,
        fill: true,
        fillColor: this.hslToHex(this.hue(station.temperatura)),
        stroke: false,
        fillOpacity: 0.6,
      }).addTo(this.map);
      marker.bindPopup(`stacja: ${station.stacja}</br>temperatura: ${station.temperatura}</br>
        prędkość wiatru: ${station.predkosc_wiatru} km/h`);
      marker.on("mouseover", function () {
        this.openPopup();
      });
      marker.on("mouseout", function () {
        this.closePopup();
      });
    } catch {
      if (station.stacja) {
        console.log(
          `Miasto ${station.stacja} nie zostało odnalezione w bazie danych w Polsce`
        );
      }
    }
  }
  makeGrid() {
    for (let i = 0; i < 10; i++) {
      for (let i1 = 0; i1 < 10; i1++) {
        L.rectangle(
          [
            [
              this.polandPolygon[0][1] + this.hSimpleRect * i1,
              this.polandPolygon[0][0] + this.wSimpleRect * i,
            ],
            [
              this.polandPolygon[0][1] +
                this.hSimpleRect * i1 +
                this.hSimpleRect,
              this.polandPolygon[0][0] +
                this.wSimpleRect * i +
                this.wSimpleRect,
            ],
          ],
          this.styleRec(
            this.isTempForCell(
              [
                this.polandPolygon[0][1] + this.hSimpleRect * i1,
                this.polandPolygon[0][0] + this.wSimpleRect * i,
              ],
              [
                this.polandPolygon[0][1] +
                  this.hSimpleRect * i1 +
                  this.hSimpleRect,
                this.polandPolygon[0][0] +
                  this.wSimpleRect * i +
                  this.wSimpleRect,
              ]
            )
          )
        ).addTo(this.map);
      }
    }
  }
}
export default WeatherMap;
