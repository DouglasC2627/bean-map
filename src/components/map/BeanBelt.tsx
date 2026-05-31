"use client";

import { Layer, Source } from "react-map-gl/mapbox";

// The Bean Belt is the equatorial band between the Tropic of Cancer and the
// Tropic of Capricorn (~23.4363°), where virtually all coffee is grown.
const TROPIC = 23.4363;

// Densify each parallel so the band edges hug the lines of latitude when the
// flat geometry is warped onto the globe (straight chords would bow inward).
function parallel(lat: number, step = 5): [number, number][] {
  const coords: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += step) coords.push([lng, lat]);
  return coords;
}

const NORTH = parallel(TROPIC);
const SOUTH = parallel(-TROPIC);

const BELT: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { kind: "band" },
      geometry: {
        type: "Polygon",
        // Top edge eastbound, bottom edge westbound, then close.
        coordinates: [[...NORTH, ...[...SOUTH].reverse(), NORTH[0]]],
      },
    },
    {
      type: "Feature",
      properties: { kind: "line", name: "Bean Belt" },
      geometry: { type: "LineString", coordinates: NORTH },
    },
    {
      type: "Feature",
      properties: { kind: "line", name: "Bean Belt" },
      geometry: { type: "LineString", coordinates: SOUTH },
    },
  ],
};

const LEAF_GREEN = "#4a7c59";

export function BeanBelt() {
  return (
    <Source id="bean-belt" type="geojson" data={BELT}>
      <Layer
        id="bean-belt-fill"
        type="fill"
        filter={["==", ["get", "kind"], "band"]}
        paint={{ "fill-color": LEAF_GREEN, "fill-opacity": 0.1 }}
      />
      <Layer
        id="bean-belt-lines"
        type="line"
        filter={["==", ["get", "kind"], "line"]}
        paint={{
          "line-color": LEAF_GREEN,
          "line-width": 1.5,
          "line-opacity": 0.7,
          "line-dasharray": [2, 2],
        }}
      />
      <Layer
        id="bean-belt-label"
        type="symbol"
        filter={["==", ["get", "kind"], "line"]}
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-letter-spacing": 0.15,
          "text-transform": "uppercase",
          "symbol-placement": "line",
          "symbol-spacing": 350,
        }}
        paint={{
          "text-color": LEAF_GREEN,
          "text-halo-color": "#faf6f1",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
}
