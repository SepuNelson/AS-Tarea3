import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  borderRadius = "4px",
  style,
  className,
  ...props
}) => {
  return (
    <div
      className={`skeleton ${className || ""}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "rgba(0,0,0,0.1)",
        animation: "skeleton-pulse 1.5s infinite ease-in-out",
        ...style,
      }}
      {...props}
    />
  );
};



