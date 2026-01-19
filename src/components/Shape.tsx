import React from 'react';
import { ShapeType, ShapeSize, ColorType, COLORS } from '../types/game';

interface ShapeProps {
  type: ShapeType;
  size: ShapeSize;
  color: ColorType;
  className?: string;
}

const Shape: React.FC<ShapeProps> = ({ type, size, color, className = '' }) => {
  const fillColor = COLORS[color];
  const isSmall = size === 'small';
  const dimension = isSmall ? 20 : 54;
  const viewBox = `0 0 ${dimension} ${dimension}`;

  const renderPath = () => {
    switch (type) {
      case 'circle':
        const radius = isSmall ? 10 : 27;
        const center = isSmall ? 10 : 27;
        return <circle cx={center} cy={center} r={radius} fill={fillColor} />;

      case 'rect':
        if (isSmall) {
          return (
            <path
              d="M0 5.55556C0 2.48731 2.48731 0 5.55556 0H14.4444C17.5127 0 20 2.48731 20 5.55556V14.4444C20 17.5127 17.5127 20 14.4444 20H5.55556C2.48731 20 0 17.5127 0 14.4444V5.55556Z"
              fill={fillColor}
            />
          );
        }
        return (
          <path
            d="M0 15C0 6.71573 6.71573 0 15 0H39C47.2843 0 54 6.71573 54 15V39C54 47.2843 47.2843 54 39 54H15C6.71573 54 0 47.2843 0 39V15Z"
            fill={fillColor}
          />
        );

      case 'hex':
        if (isSmall) {
          return (
            <path
              d="M9.81503 0L18.5187 5V15L9.81503 20L1.11133 15V5L9.81503 0Z"
              fill={fillColor}
            />
          );
        }
        return (
          <path
            d="M26.5 0L50 13.5V40.5L26.5 54L3 40.5V13.5L26.5 0Z"
            fill={fillColor}
          />
        );

      case 'diamond':
        if (isSmall) {
          return (
            <path
              d="M10 0L20 10L10 20L0 10L10 0Z"
              fill={fillColor}
            />
          );
        }
        return (
          <path
            d="M27 0L54 27L27 54L0 27L27 0Z"
            fill={fillColor}
          />
        );
    }
  };

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {renderPath()}
    </svg>
  );
};

export default Shape;
