'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,

} from '@/components/ui/dialog';
import { PDFViewer } from '@/components/ui/pdf-viewer';
import { fixCloudinaryPdfUrl } from '@/lib/cloudinary';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  alt?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, alt = 'Image', title }: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Détecter si c'est un PDF (détection améliorée pour Cloudinary et autres)
  const isPdf = imageUrl.toLowerCase().endsWith('.pdf') || 
                imageUrl.toLowerCase().includes('.pdf?') ||
                imageUrl.toLowerCase().includes('/raw/') ||
                imageUrl.toLowerCase().includes('format=pdf') ||
                imageUrl.toLowerCase().includes('application/pdf') ||
                // Cloudinary : détecter les PDF qui sont dans /image/upload/ mais devraient être dans /raw/upload/
                (imageUrl.toLowerCase().includes('cloudinary.com') && imageUrl.toLowerCase().includes('.pdf'));

  // URL corrigée pour l'affichage (corrige les URLs Cloudinary PDF mal formatées)
  const displayUrl = isPdf ? fixCloudinaryPdfUrl(imageUrl) : imageUrl;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const extension = isPdf ? 'pdf' : 'jpg';
    link.download = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.${extension}` : `document-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
        {isPdf ? (
          // Affichage PDF
          <div className="w-full h-[95vh] flex flex-col bg-gray-900">
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {title && (
                  <span className="text-white bg-black/50 px-3 py-1 rounded text-sm font-medium">
                    {title}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  className="bg-white/90 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 pt-12">
              <PDFViewer 
                url={displayUrl}
              />
            </div>
          </div>
        ) : (
          // Affichage image
          <>
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="bg-white/90 hover:bg-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 4}
                  className="bg-white/90 hover:bg-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRotate}
                  className="bg-white/90 hover:bg-white"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="bg-white/90 hover:bg-white"
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-white bg-black/50 px-2 py-1 rounded text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  className="bg-white/90 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Container de l'image */}
            <div 
              className="w-full h-[95vh] flex items-center justify-center overflow-hidden bg-gray-900"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                src={imageUrl}
                alt={alt}
                className="max-w-none select-none shadow-2xl"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  maxHeight: zoom === 1 ? '90vh' : 'none',
                  maxWidth: zoom === 1 ? '90vw' : 'none',
                }}
                draggable={false}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}