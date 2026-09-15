(function () {
  "use strict";

  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  function setStatus(container, message) {
    var status = container.parentElement.querySelector("[data-terminal-map-status]");
    if (!status) return;
    if (message) {
      status.textContent = message;
      status.hidden = false;
      container.dataset.mapState = "error";
      return;
    }
    status.hidden = true;
    container.dataset.mapState = "ready";
  }

  function buildPopup(name, lat, lng) {
    var wrapper = document.createElement("div");
    var title = document.createElement("strong");
    var coordinates = document.createElement("span");
    title.textContent = name;
    coordinates.textContent = lat.toFixed(4) + ", " + lng.toFixed(4);
    wrapper.append(title, coordinates);
    return wrapper;
  }

  function initializeMap(container) {
    if (!window.L) {
      setStatus(container, "Map temporarily unavailable");
      return;
    }

    var lat = Number(container.dataset.lat);
    var lng = Number(container.dataset.lng);
    var name = container.dataset.locationName || "Terminal location";
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus(container, "Map temporarily unavailable");
      return;
    }

    var loadedTile = false;
    var tileErrors = 0;
    var map = window.L.map(container, {
      attributionControl: true,
      boxZoom: true,
      doubleClickZoom: true,
      keyboard: true,
      scrollWheelZoom: true,
      touchZoom: true,
      zoomControl: false
    }).setView([lat, lng], 15);

    window.L.control.zoom({ position: "topright" }).addTo(map);

    var tiles = window.L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 19
    });

    tiles.on("tileload", function () {
      loadedTile = true;
      setStatus(container, "");
    });
    tiles.on("tileerror", function () {
      tileErrors += 1;
      if (!loadedTile && tileErrors >= 3) setStatus(container, "Map temporarily unavailable");
    });
    tiles.addTo(map);

    window.L.marker([lat, lng], {
      alt: name + " terminal location",
      keyboard: true,
      title: name
    }).addTo(map).bindPopup(buildPopup(name, lat, lng), { maxWidth: 220 });

    window.setTimeout(function () {
      if (!loadedTile) setStatus(container, "Map temporarily unavailable");
    }, 8000);

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(function () {
        map.invalidateSize({ pan: false });
      });
      observer.observe(container);
    }

    container.terminalLocationMap = map;
  }

  function initializeAll() {
    document.querySelectorAll("[data-terminal-location-map]").forEach(initializeMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAll, { once: true });
  } else {
    initializeAll();
  }
})();
