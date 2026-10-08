import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, CheckSquare, Square, Upload, RefreshCw, ExternalLink, X } from 'lucide-react';
import { AttachedPhoto } from '../types';

interface PhotoSectionProps {
  tieneFotos: boolean;
  onToggleTieneFotos: (val: boolean) => void;
  photos: AttachedPhoto[];
  onPhotosChange: (photos: AttachedPhoto[]) => void;
  fechaFactura: string;
  nOrden: string;
}

function formatDateForFilename(dateStr: string): string {
  if (!dateStr) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  }
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}-${m}-${y}`;
    }
  }
  return dateStr.replace(/[/:]/g, '-');
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({
  tieneFotos,
  onToggleTieneFotos,
  photos,
  onPhotosChange,
  fechaFactura,
  nOrden,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const datePart = formatDateForFilename(fechaFactura);
  const ordenPart = (nOrden || 'GTO-0000001').replace(/[/\\?%*:|"<>]/g, '-');

  // Re-index photo names based on current order & date
  const getStandardizedName = (index: number, originalName?: string) => {
    let ext = 'jpg';
    if (originalName && originalName.includes('.')) {
      ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    }
    if (ext === 'jpeg') ext = 'jpg';
    return `${datePart}_${ordenPart}_${index + 1}.${ext}`;
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: AttachedPhoto[] = [...photos];
    const startIndex = photos.length;

    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          const index = startIndex + idx;
          const name = getStandardizedName(index, file.name);
          newPhotos.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name,
            base64,
            mimeType: file.type || 'image/jpeg',
          });
          
          // Re-update names sequentially
          const updated = newPhotos.map((p, i) => ({
            ...p,
            name: getStandardizedName(i, p.name),
          }));

          onPhotosChange(updated);
          onToggleTieneFotos(true);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    const filtered = photos.filter((p) => p.id !== id);
    const reindexed = filtered.map((p, i) => ({
      ...p,
      name: getStandardizedName(i, p.name),
    }));
    onPhotosChange(reindexed);
    if (reindexed.length === 0) {
      onToggleTieneFotos(false);
    }
  };

  // Web Camera Stream Modal
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setCameraError('No se pudo acceder a la cámara del dispositivo. Puedes usar el botón de subir fotos o la cámara nativa.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      const index = photos.length;
      const name = getStandardizedName(index, 'capture.jpg');
      const newPhoto: AttachedPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        base64,
        mimeType: 'image/jpeg',
      };

      const updated = [...photos, newPhoto].map((p, i) => ({
        ...p,
        name: getStandardizedName(i, p.name),
      }));

      onPhotosChange(updated);
      onToggleTieneFotos(true);
      stopCamera();
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Fotos y Comprobantes Adjuntos
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-medium">
            Carpeta: Facturas_Gastos_Adjuntos
          </span>
        </div>

        {/* Checkbox para activar/desactivar FOTOS */}
        <button
          type="button"
          onClick={() => onToggleTieneFotos(!tieneFotos)}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
            tieneFotos
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
          }`}
        >
          {tieneFotos ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          <span>{tieneFotos ? '✓ FOTOS Adjuntas (FOTOS: TRUE)' : 'Sin fotos (FOTOS: FALSE)'}</span>
        </button>
      </div>

      {/* Inputs ocultos para adjuntar o cámara */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesAdded(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesAdded(e.target.files)}
      />

      {/* Botones de acción */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Adjuntar Fotos</span>
        </button>

        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Tomar Foto</span>
        </button>

        {/* Fallback botón nativo cámara móvil */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-300"
          title="Abrir cámara del teléfono directamente"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Cámara Nativa Móvil</span>
        </button>
      </div>

      {/* Lista de Fotos Adjuntas */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo, index) => {
            const currentStandardName = getStandardizedName(index, photo.name);
            return (
              <div
                key={photo.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
                  <img
                    src={photo.base64}
                    alt={currentStandardName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md shadow-xs opacity-90 hover:opacity-100 transition-opacity"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={currentStandardName}>
                    {currentStandardName}
                  </p>
                  {photo.driveUrl ? (
                    <a
                      href={photo.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      <span>Subida a Drive</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 italic">
                      Se subirá al guardar
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5 border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl bg-white/50 dark:bg-slate-800/30">
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No se han adjuntado fotos todavía
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Nomenclatura automática: <code className="font-mono text-indigo-600 dark:text-indigo-400">{datePart}_{ordenPart}_1.jpg</code>
          </p>
        </div>
      )}

      {/* Modal para Tomar Foto en tiempo real con WebCam / Cámara */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-lg w-full text-white shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold">Tomar Foto con Cámara</h4>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs space-y-3 mb-3">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                >
                  Usar Cámara Nativa del Dispositivo
                </button>
              </div>
            ) : (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-4/3 mb-4 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancelar
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhotoFromStream}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Foto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
