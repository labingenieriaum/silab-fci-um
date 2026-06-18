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
  const [scannerStarted, setScannerStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannerStarted(false);
    }
  }, [open]);

  async function startScanner() {
    setScannerStarted(true);
    setLoading(true);
    setFeedback(null);
    scanningRef.current = true;
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;

    if (!BarcodeDetectorClass) {
      setLoading(false);
      setFeedback("Este navegador no soporta escaneo QR con camara. Escribe o pega el codigo en la busqueda.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setLoading(false);
      setFeedback("Este navegador no permite abrir la camara desde esta pagina. Busca el equipo manualmente.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      if (!scanningRef.current) {
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
        if (!videoRef.current || !scanningRef.current) {
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
      setScannerStarted(false);
      setFeedback("No fue posible abrir la camara. Si el navegador pregunta por permisos, selecciona Permitir.");
    }
  }

  function stopCamera() {
    scanningRef.current = false;
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
              {!scannerStarted ? (
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="mt-1 h-5 w-5 text-primary" />
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium">Permiso de camara requerido</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Para escanear el QR, el navegador debe pedir permiso para usar la camara de este equipo.
                        </p>
                      </div>
                      <Button type="button" onClick={() => void startScanner()}>
                        <Camera className="h-4 w-4" />
                        Permitir camara
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-md border bg-black">
                  <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              )}
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
