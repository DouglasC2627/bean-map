"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Source,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { useBeanMap, filterBeans } from "@/store";
import { RegionHighlight } from "./RegionHighlight";
import { BeanBelt } from "./BeanBelt";

const LIGHT_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT ??
  "mapbox://styles/mapbox/light-v11";
const DARK_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_DARK ??
  "mapbox://styles/mapbox/dark-v11";

const CLUSTER_LAYER: CircleLayerSpecification = {
  id: "bean-clusters",
  type: "circle",
  source: "beans",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#6f4e37",
    // Size by matching count (falls back to total when no filter is active).
    "circle-radius": [
      "step",
      ["get", "matching"],
      18,
      5,
      24,
      15,
      30,
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#faf6f1",
    "circle-opacity": [
      "case",
      [">", ["get", "matching"], 0],
      0.9,
      0.15,
    ],
    "circle-opacity-transition": { duration: 200, delay: 0 },
    "circle-stroke-opacity": [
      "case",
      [">", ["get", "matching"], 0],
      1,
      0.15,
    ],
    "circle-stroke-opacity-transition": { duration: 200, delay: 0 },
  },
};

const CLUSTER_COUNT_LAYER: SymbolLayerSpecification = {
  id: "bean-cluster-count",
  type: "symbol",
  source: "beans",
  filter: ["has", "point_count"],
  layout: {
    // Hide the count label when no beans in the cluster match the filters.
    "text-field": [
      "case",
      [">", ["get", "matching"], 0],
      ["to-string", ["get", "matching"]],
      "",
    ],
    "text-size": 12,
    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
  },
  paint: { "text-color": "#faf6f1" },
};

const POINT_LAYER: CircleLayerSpecification = {
  id: "bean-points",
  type: "circle",
  source: "beans",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      "#c1440e",
      "#a67c52",
    ],
    "circle-radius": 7,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#faf6f1",
    "circle-opacity": [
      "case",
      ["boolean", ["get", "filtered"], true],
      1,
      0.15,
    ],
    "circle-opacity-transition": { duration: 200, delay: 0 },
    "circle-stroke-opacity": [
      "case",
      ["boolean", ["get", "filtered"], true],
      1,
      0.15,
    ],
    "circle-stroke-opacity-transition": { duration: 200, delay: 0 },
  },
};

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
}

export function CoffeeMap({ beans, flavorNotes }: Props) {
  const t = useTranslations("map");
  const mapRef = useRef<MapRef | null>(null);
  const { resolvedTheme } = useTheme();
  const [cursor, setCursor] = useState<string>("grab");
  const [mapLoaded, setMapLoaded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const {
    viewport,
    setViewport,
    selectBean,
    filters,
    setHoveredRegion,
    fitBoundsRequestId,
    flyToRequest,
  } = useBeanMap();

  const matchingBeans = useMemo(
    () => filterBeans(beans, filters, flavorNotes),
    [beans, filters, flavorNotes],
  );
  const matchingIds = useMemo(
    () => new Set(matchingBeans.map((b) => b.id)),
    [matchingBeans],
  );

  // Refs let the request effects read the latest beans without re-firing
  // when filters change.
  const matchingBeansRef = useRef(matchingBeans);
  useEffect(() => {
    matchingBeansRef.current = matchingBeans;
  }, [matchingBeans]);

  // Fly to coords on demand (similar-bean clicks, search selection).
  useEffect(() => {
    if (!flyToRequest || !mapLoaded) return;
    mapRef.current?.flyTo({
      center: flyToRequest.coords,
      zoom: flyToRequest.zoom,
      duration: 900,
    });
  }, [flyToRequest, mapLoaded]);

  // Fit map to filtered results when a fit-bounds request is dispatched.
  useEffect(() => {
    if (fitBoundsRequestId === 0 || !mapLoaded) return;
    const map = mapRef.current;
    const targets = matchingBeansRef.current;
    if (!map || targets.length === 0) return;

    if (targets.length === 1) {
      map.flyTo({
        center: targets[0].coordinates,
        zoom: 5,
        duration: 900,
      });
      return;
    }

    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    for (const b of targets) {
      const [lng, lat] = b.coordinates;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 80, duration: 900, maxZoom: 6 },
    );
  }, [fitBoundsRequestId, mapLoaded]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: beans.map((b) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: b.coordinates },
        properties: {
          id: b.id,
          slug: b.slug,
          name: b.name,
          country: b.country,
          filtered: matchingIds.has(b.id),
        },
      })),
    }),
    [beans, matchingIds],
  );

  const onClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as
        | { id?: string; cluster?: boolean; cluster_id?: number }
        | undefined;

      if (feature.geometry.type !== "Point") return;
      const coords = feature.geometry.coordinates as [number, number];

      if (props?.cluster) {
        const source = mapRef.current
          ?.getMap()
          .getSource("beans") as
          | {
              getClusterLeaves: (
                id: number,
                limit: number,
                offset: number,
                callback: (
                  err: unknown,
                  features: GeoJSON.Feature[] | null,
                ) => void,
              ) => void;
            }
          | undefined;
        if (!source || props.cluster_id == null) return;
        source.getClusterLeaves(
          props.cluster_id,
          Infinity,
          0,
          (err, features) => {
            if (err || !features) return;
            const points = features
              .map((f) =>
                f.geometry.type === "Point"
                  ? (f.geometry.coordinates as [number, number])
                  : null,
              )
              .filter((p): p is [number, number] => Boolean(p));
            if (points.length === 0) return;

            if (points.length === 1) {
              mapRef.current?.flyTo({
                center: points[0],
                zoom: 7,
                duration: 600,
              });
              return;
            }

            let minLng = Infinity,
              minLat = Infinity,
              maxLng = -Infinity,
              maxLat = -Infinity;
            for (const [lng, lat] of points) {
              if (lng < minLng) minLng = lng;
              if (lat < minLat) minLat = lat;
              if (lng > maxLng) maxLng = lng;
              if (lat > maxLat) maxLat = lat;
            }
            mapRef.current?.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 80, duration: 600, maxZoom: 7 },
            );
          },
        );
        return;
      }

      if (props?.id) {
        mapRef.current?.flyTo({ center: coords, zoom: 5, duration: 900 });
        selectBean(props.id);
      }
    },
    [selectBean],
  );

  if (!token) {
    return (
      <div className="flex h-full min-h-[60vh] flex-1 items-center justify-center bg-parchment p-8 text-center dark:bg-roast-dark">
        <div className="max-w-md space-y-2">
          <h2 className="font-display text-2xl">{t("tokenMissingTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t.rich("tokenMissingBody", {
              code: (chunks) => <code className="mono">{chunks}</code>,
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[70vh] flex-1">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle={resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE}
        projection={{ name: "globe" }}
        initialViewState={viewport}
        onMove={(e) => setViewport(e.viewState)}
        onClick={onClick}
        onMouseMove={(e) => {
          const feature = e.features?.[0];
          const props = feature?.properties as
            | { id?: string; cluster?: boolean }
            | undefined;
          if (props?.id && !props.cluster) {
            setCursor("pointer");
            setHoveredRegion(props.id);
          } else if (props?.cluster) {
            setCursor("pointer");
            setHoveredRegion(null);
          } else {
            setCursor("grab");
            setHoveredRegion(null);
          }
        }}
        onMouseLeave={() => {
          setCursor("grab");
          setHoveredRegion(null);
        }}
        onLoad={() => setMapLoaded(true)}
        cursor={cursor}
        interactiveLayerIds={["bean-clusters", "bean-points"]}
        fog={{
          color: "rgb(220, 210, 195)",
          "high-color": "rgb(180, 160, 140)",
          "horizon-blend": 0.1,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {mapLoaded && (
          <>
            <BeanBelt />
            <RegionHighlight />
            <Source
              id="beans"
              type="geojson"
              data={geojson}
              cluster
              clusterMaxZoom={6}
              clusterRadius={45}
              clusterProperties={{
                matching: ["+", ["case", ["get", "filtered"], 1, 0]],
              }}
            >
              <Layer {...CLUSTER_LAYER} />
              <Layer {...CLUSTER_COUNT_LAYER} />
              <Layer {...POINT_LAYER} />
            </Source>
          </>
        )}
      </Map>
    </div>
  );
}
