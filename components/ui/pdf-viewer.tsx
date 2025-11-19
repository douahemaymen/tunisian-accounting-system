'use client';

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return (
    <div className="w-full h-full">
      <iframe
        src={url}
        className="w-full h-[600px] border rounded-lg"
        title="PDF Viewer"
      />
    </div>
  );
}
