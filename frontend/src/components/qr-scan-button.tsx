import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScanButtonProps {
  onScan: (value: string) => void;
  title?: string;
}

export function QrScanButton({ onScan, title = "Escanear QR de equipo" }: QrScanButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setScannerStarted(false);
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  async function startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedback("Este navegador no permite abrir la camara desde esta pagina.");
      return;
    }

    stopScanner();
    setLoading(true);
    setFeedback("Cuando el navegador lo pregunte, selecciona Permitir para usar la camara.");

    if (!videoRef.current) {
      setLoading(false);
      setFeedback("No fue posible inicializar la vista de camara.");
      return;
    }

    try {
      const stream = await openCameraStream();
      streamRef.current = stream;
      setScannerStarted(true);
      await nextFrame();

      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;
      controlsRef.current = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result) => {
          const value = normalizeEquipmentQr(result?.getText());
          if (!value) {
            return;
          }
          onScan(value);
          setOpen(false);
        }
      );
      setLoading(false);
      setFeedback("Camara activa. Acerca el QR al recuadro hasta que lo detecte.");
    } catch (error) {
      stopScanner();
      setLoading(false);
      setScannerStarted(false);
      setFeedback(cameraErrorMessage(error));
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      const stream = videoRef.current.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }

  function closeModal() {
    stopScanner();
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon" title={title} aria-label={title} onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Escanear QR</h2>
                <p className="text-sm text-muted-foreground">Usa la camara del equipo para leer el QR.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeModal} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              {!scannerStarted && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="mt-1 h-5 w-5 text-primary" />
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium">Permiso de camara requerido</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Al continuar, Chrome, Edge o Firefox debe mostrar la ventana nativa para permitir la camara.
                        </p>
                      </div>
                      <Button type="button" onClick={() => void startScanner()}>
                        <Camera className="h-4 w-4" />
                        Permitir camara y escanear
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className={`relative overflow-hidden rounded-md border bg-black ${scannerStarted ? "" : "hidden"}`}>
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="h-40 w-40 rounded-lg border-2 border-primary/80 shadow-[0_0_0_999px_rgba(0,0,0,0.18)]" />
                </div>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              {feedback && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {feedback}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function normalizeEquipmentQr(rawValue?: string) {
  const value = rawValue?.trim();
  if (!value) {
    return "";
  }
  const prefix = "SILAB-FCI:EQUIPO:";
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length).trim();
  }
  return value;
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

async function openCameraStream() {
  const preferredConstraints: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    if (error instanceof DOMException && error.name === "OverconstrainedError") {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw error;
  }
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "El navegador tiene bloqueada la camara para este sitio. En Chrome/Edge toca el candado o ajustes del sitio, entra a Permisos, cambia Camara a Permitir y vuelve a intentar.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No se encontro una camara disponible en este dispositivo.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "La camara esta ocupada por otra aplicacion o el sistema no la puede abrir.";
    }
    if (error.name === "OverconstrainedError") {
      return "La camara no acepta la configuracion solicitada. Intenta nuevamente o usa otra camara.";
    }
  }
  return "No fue posible abrir la camara. Revisa permisos del navegador o busca el equipo manualmente.";
}
