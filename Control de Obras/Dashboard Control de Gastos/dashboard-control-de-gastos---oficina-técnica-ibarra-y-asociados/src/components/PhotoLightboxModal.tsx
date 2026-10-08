import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface Props {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<Props> = ({
  photos,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotate] = useState(0);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setZoom(1);
    setRotate(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoom(1);
    setRotate(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Top Header */}
      <div
        className="flex items-center justify-between text-white z-10 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full">
            Evidencia Fotográfica {currentIndex + 1} de {photos.length}
          </span>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Oficina Técnica Ibarra y Asociados, C.A.
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotate((r) => (r + 90) % 360)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Rotar 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <a
            href={currentPhoto}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-emerald-800 hover:bg-emerald-700 rounded-lg text-white transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Ver imagen original en Google Drive"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Abrir Original</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-red-600 rounded-lg text-white transition-colors ml-2"
            title="Cerrar Visor Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden my-4 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-700 text-white transition-colors border border-white/20 shadow-xl"
            title="Anterior Imagen"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="max-w-full max-h-full flex items-center justify-center p-2">
          <img
            src={currentPhoto}
            alt={`Evidencia Fotográfica ${currentIndex + 1}`}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-2xl border border-white/10"
            onError={(e) => {
              // Handle broken Drive link fallback gracefully
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="text-center p-8 bg-slate-800 rounded-xl text-slate-300 max-w-md">
                    <p class="text-sm font-bold text-white mb-2">Vista previa de imagen de Drive</p>
                    <p class="text-xs text-slate-400 mb-4">No se pudo cargar la miniatura directa del enlace. Puedes abrir el archivo original directamente en Google Drive.</p>
                    <a href="${currentPhoto}" target="_blank" class="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
                      Abrir archivo en Google Drive
                    </a>
                  </div>
                `;
              }
            }}
          />
        </div>

        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-700 text-white transition-colors border border-white/20 shadow-xl"
            title="Siguiente Imagen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnails Footer Navigation Bar */}
      {photos.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 overflow-x-auto p-2 bg-slate-950/80 rounded-xl max-w-xl mx-auto z-10 border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoom(1);
                setRotate(0);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-400/50'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={p} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
