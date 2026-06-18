import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BarcodeDetectorResult = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

interface QrScanButtonProps {
  onScan: (value: string) => void;
  title?: string;
}

export function QrScanButton({ onScan, title = "Escanear QR de equipo" }: QrScanButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startScanner() {
      setLoading(true);
      setFeedback(null);
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
        .BarcodeDetector;

      if (!BarcodeDetectorClass) {
        setLoading(false);
        setFeedback("Este navegador no soporta escaneo QR con camara. Escribe o pega el codigo en la busqueda.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
        setLoading(false);

        const scan = async () => {
          if (!videoRef.current || cancelled) {
            return;
          }
          try {
            const results = await detector.detect(videoRef.current);
            const rawValue = results[0]?.rawValue;
            const value = normalizeEquipmentQr(rawValue);
            if (value) {
              onScan(value);
              setOpen(false);
              return;
            }
          } catch {
            // Continue scanning; single-frame failures are common while the camera focuses.
          }
          frameRef.current = window.requestAnimationFrame(scan);
        };

        frameRef.current = window.requestAnimationFrame(scan);
      } catch {
        setLoading(false);
        setFeedback("No fue posible abrir la camara. Revisa permisos del navegador o busca el equipo manualmente.");
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, onScan]);

  function stopCamera() {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
                <p className="text-sm text-muted-foreground">Apunta la camara al QR del equipo.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              <div className="relative overflow-hidden rounded-md border bg-black">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
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
