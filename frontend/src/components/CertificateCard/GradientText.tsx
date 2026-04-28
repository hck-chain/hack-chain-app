import React from "react";

interface GradientTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  className?: string;
  // gradientStops kept for API compatibility — CSS clip-path gradient is not supported by html2canvas
  gradientStops?: { offset: number; color: string }[];
}

const GradientText: React.FC<GradientTextProps> = ({
  text = "",
  fontSize = 24,
  fontWeight = 700,
  className = "",
}) => {
  return (
    <span
      className={`inline-block ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        color: "#ffffff",
        lineHeight: "1.2",
      }}
    >
      {text}
    </span>
  );
};

export default GradientText;
