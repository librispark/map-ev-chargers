import React from "react";

export const MapChargerIcon = ({
  fillColor = "#3498db", 
  strokeColor = "#2980b9", 
  boltFillColor = "#f1c40f", 
  boltStrokeColor = "#f39c12", 
  size = 40 
}) => {
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
          r="25" 
          fill="white" 
          stroke={strokeColor} 
          strokeWidth="2" 
        />
        
        {/* Lightning Bolt - Enlarged */}
        <path 
          d="M50,20 L37,45 L47,45 L35,65 L52,40 L42,40 L50,20" 
          fill={boltFillColor} 
          stroke={boltStrokeColor} 
          strokeWidth="1.5" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
};

// Create SVG data URI for icon
export const MapChargerIconDataUri = (fillColor = "#3498db", strokeColor = "#2980b9", boltFillColor = "#f1c40f", boltStrokeColor = "#f39c12") => {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="40" height="40">
    <path d="M50,0 C27.91,0 10,17.91 10,40 C10,68.5 50,150 50,150 C50,150 90,68.5 90,40 C90,17.91 72.09,0 50,0 Z" 
          fill="${fillColor}" 
          stroke="${strokeColor}" 
          stroke-width="3" />
    <circle cx="50" cy="40" r="25" 
            fill="white" 
            stroke="${strokeColor}" 
            stroke-width="2" />
    <path d="M50,20 L37,45 L47,45 L35,65 L52,40 L42,40 L50,20" 
          fill="${boltFillColor}" 
          stroke="${boltStrokeColor}" 
          stroke-width="1.5" 
          stroke-linejoin="round" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svgStr)}`;
};
