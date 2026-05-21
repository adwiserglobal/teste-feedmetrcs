import React from "react";
import { ComposableMap, Geographies, Geography, Sphere } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Region {
  country: string;
  weight: number;
}

interface WorldMapProps {
  highlightedRegions?: Region[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ highlightedRegions = [] }) => {
  return (
    <div className="w-full relative bg-slate-50 dark:bg-slate-900 rounded-xl border border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-slate-800/20 pointer-events-none" />
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 140,
          center: [0, 0]
        }}
        width={800}
        height={450}
        style={{ width: "100%", height: "auto" }}
      >
        <Sphere stroke="#cbd5e1" strokeWidth={0.5} id="sphere" fill="transparent" />
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Try to find if this country is highlighted
              const isHighlighted = highlightedRegions.some(
                (r) =>
                  r.country.toLowerCase() === geo.id?.toLowerCase() ||
                  r.country.toLowerCase() === geo.properties.name?.toLowerCase() ||
                  geo.properties.name?.toLowerCase().includes(r.country.toLowerCase())
              );

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHighlighted ? "#10b981" : "#e2e8f0"}
                  stroke="#f8fafc"
                  strokeWidth={0.5}
                  className="transition-colors duration-300 dark:stroke-slate-950"
                  style={{
                    default: {
                      fill: isHighlighted ? "#10b981" : "var(--map-fill, #e2e8f0)",
                      outline: "none",
                    },
                    hover: {
                      fill: isHighlighted ? "#059669" : "#cbd5e1",
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: {
                      fill: isHighlighted ? "#047857" : "#94a3b8",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};
