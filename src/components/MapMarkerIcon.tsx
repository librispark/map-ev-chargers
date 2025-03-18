import React from "react";

export const MapMarkerIcon = ({ fillColor = "#FF4136", strokeColor = "#900000", size = 40 }) => {
  return (
    <div className="relative" style={{ width: size, height: size * 1.5 }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 150" 
        className="w-full h-full"
      >
        {/* Map Pin Shape */}
        <path 
          d="M50,0 C27.91,0 10,17.91 10,40 C10,68.5 50,150 50,150 C50,150 90,68.5 90,40 C90,17.91 72.09,0 50,0 Z" 
          fill={fillColor} 
          stroke={strokeColor} 
          strokeWidth="3" 
        />
        
        {/* Inner Circle */}
        <circle 
          cx="50" 
          cy="40" 
          r="20" 
          fill="white" 
          stroke={strokeColor} 
          strokeWidth="2" 
        />
      </svg>
    </div>
  );
};

// Create SVG data URI for icon
export const MapMarkerIconDataUri = (fillColor = "#FF4136", strokeColor = "#900000") => {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="40" height="40">
    <path d="M50,0 C27.91,0 10,17.91 10,40 C10,68.5 50,150 50,150 C50,150 90,68.5 90,40 C90,17.91 72.09,0 50,0 Z" 
          fill="${fillColor}" 
          stroke="${strokeColor}" 
          stroke-width="3" />
    <circle cx="50" cy="40" r="20" 
            fill="white" 
            stroke="${strokeColor}" 
            stroke-width="2" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svgStr)}`;
};
