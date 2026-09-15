(function () {
  "use strict";

  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  var INITIAL_ZOOM = 15;

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

  function addLocationControl(map, lat, lng) {
    var LocationControl = window.L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        var wrapper = window.L.DomUtil.create("div", "leaflet-bar leaflet-control terminal-location-control");
        var button = document.createElement("button");
        var icon = document.createElement("span");

        button.type = "button";
        button.title = "Return to terminal location";
        button.setAttribute("aria-label", "Return to terminal location");
        icon.className = "material-symbols-rounded";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "my_location";
        button.appendChild(icon);
        wrapper.appendChild(button);

        window.L.DomEvent.disableClickPropagation(wrapper);
        window.L.DomEvent.disableScrollPropagation(wrapper);
        window.L.DomEvent.on(button, "click", function (event) {
          window.L.DomEvent.stop(event);
          map.setView([lat, lng], INITIAL_ZOOM, { animate: false });
        });

        return wrapper;
      }
    });

    return new LocationControl().addTo(map);
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
    }).setView([lat, lng], INITIAL_ZOOM);

    window.L.control.zoom({ position: "topright" }).addTo(map);
    addLocationControl(map, lat, lng);

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
