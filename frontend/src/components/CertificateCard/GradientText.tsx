import React from "react";

interface GradientStop {
  offset: number;
  color: string;
}

interface GradientTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  className?: string;
  gradientStops?: GradientStop[];
}

const GradientText: React.FC<GradientTextProps> = ({
  text = "",
  fontSize = 24,
  fontWeight = 700,
  className = "",
  gradientStops = [
    { offset: 0, color: "#ffffff" },
    { offset: 1, color: "#4a4ac0" },
  ],
}) => {
  const gradientString = gradientStops
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => `${stop.color} ${stop.offset * 100}%`)
    .join(", ");

  return (
    <span
      className={`inline-block ${className}`}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        background: `linear-gradient(to right, ${gradientString})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        lineHeight: "1.2",
      }}
    >
      {text}
    </span>
  );
};

export default GradientText;