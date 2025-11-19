import React, { useRef, useState, useEffect } from 'react';

interface ImageZoomProps {
  imageUrl: string;
  className?: string;
  magnifierSize?: number; // in px
  zoomScale?: number; // e.g., 2 for 200%
}

export const ImageZoom: React.FC<ImageZoomProps> = ({ 
  imageUrl, 
  className = '', 
  magnifierSize = 300, 
  zoomScale = 2.5 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [imageBox, setImageBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [transformOrigin, setTransformOrigin] = useState<string>('50% 50%');

  // Measure actual displayed image box within the container (object-contain)
  const measureImageBox = () => {
    if (!containerRef.current || !imgRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const naturalWidth = imgRef.current.naturalWidth || 1;
    const naturalHeight = imgRef.current.naturalHeight || 1;
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let displayWidth = 0;
    let displayHeight = 0;
    if (imageRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageRatio;
    }
    const left = (containerWidth - displayWidth) / 2;
    const top = (containerHeight - displayHeight) / 2;
    setImageBox({ left, top, width: displayWidth, height: displayHeight });
  };

  useEffect(() => {
    measureImageBox();
    window.addEventListener('resize', measureImageBox);
    return () => window.removeEventListener('resize', measureImageBox);
  }, [imageUrl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clamp to the actual image area
    const minX = imageBox.left;
    const maxX = imageBox.left + imageBox.width;
    const minY = imageBox.top;
    const maxY = imageBox.top + imageBox.height;
    const clampedX = Math.max(minX, Math.min(x, maxX));
    const clampedY = Math.max(minY, Math.min(y, maxY));
    setLensPosition({ x: clampedX, y: clampedY });

    // Compute transform origin relative to displayed image (percentages)
    const relX = ((clampedX - imageBox.left) / Math.max(imageBox.width, 1)) * 100;
    const relY = ((clampedY - imageBox.top) / Math.max(imageBox.height, 1)) * 100;
    setTransformOrigin(`${relX}% ${relY}%`);
  };

  // Styles for full-image zoom (scale with transform-origin)
  const zoomedImgStyle: React.CSSProperties = {
    transform: isHovering ? `scale(${zoomScale})` : 'scale(1)',
    transformOrigin: transformOrigin,
    transition: 'transform 120ms ease-out',
    willChange: 'transform',
    cursor: isHovering ? 'zoom-out' : 'zoom-in',
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-lg border border-gray-300 shadow-lg ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      style={{ minHeight: 600 }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Facture"
        className="absolute inset-0 w-full h-full object-contain select-none"
        style={zoomedImgStyle}
        draggable={false}
        onLoad={measureImageBox}
      />
    </div>
  );
};