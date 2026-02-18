import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Settings, Printer, ArrowLeft, QrCode, X } from 'lucide-react';
import { TerminalInput } from './components/TerminalInput';
import { PrintTemplate } from './components/PrintTemplate';
import { CalibrationSettings } from './components/CalibrationSettings';
import type { GuideData } from './types';
import { QRCodeSVG } from 'qrcode.react';

function App() {
  const [mode, setMode] = useState<'input' | 'preview'>('input');
  const [data, setData] = useState<GuideData | null>(null);

  // Calibration State (mm) - Persisted in localStorage
  const [xOffset, setXOffset] = useState(() => parseFloat(localStorage.getItem('printer_x') || '0'));
  const [yOffset, setYOffset] = useState(() => parseFloat(localStorage.getItem('printer_y') || '0'));

  // Field Offsets (Individual)
  const [fieldOffsets, setFieldOffsets] = useState<Record<string, { x: number, y: number }>>(() => {
    try {
      const stored = localStorage.getItem('printer_fields');
      if (stored) return JSON.parse(stored);
    } catch { }

    const saved = localStorage.getItem('printer_fields');
    return saved ? JSON.parse(saved) : {
      lugar: { x: 0, y: -0.9, scale: 1 },
      direccionDestino: { x: 0, y: -0.5, scale: 1 },
      tipoVehiculo: { x: 0, y: -0.5, scale: 1 },
      conductor: { x: 0, y: -0.5, scale: 1 },
      nContrato: { x: 0, y: -0.7, scale: 1 },
      fecha: { x: 0, y: -0.5, scale: 1 },
      patente: { x: 0, y: -0.5, scale: 1 },
      run: { x: 0, y: -0.5, scale: 1 },
      numero: { x: 147, y: -28.5, scale: 1 },
      itemsTable: { x: 3, y: -9.7, scale: 1 },
      total: { x: 5, y: 240, scale: 1 }, // Estimated position
      coordinador: { x: 20.2, y: -15.4, scale: 1 }
    };
  });

  const [showCalibration, setShowCalibration] = useState(false);

  // Save offsets when they change
  const updateOffsets = (x: number, y: number) => {
    setXOffset(x);
    setYOffset(y);
    localStorage.setItem('printer_x', x.toString());
    localStorage.setItem('printer_y', y.toString());
  };

  const updateFieldOffset = (key: string, axis: 'x' | 'y' | 'scale', value: number) => {
    setFieldOffsets(prev => {
      const newOffsets = { ...prev };
      if (!newOffsets[key]) newOffsets[key] = { x: 0, y: 0 };
      newOffsets[key] = { ...newOffsets[key], [axis]: value };
      localStorage.setItem('printer_fields', JSON.stringify(newOffsets));
      return newOffsets;
    });
  };

  const resetFieldOffsets = () => {
    setFieldOffsets({});
    localStorage.removeItem('printer_fields');
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleComplete = (inputData: GuideData) => {
    setData(inputData);
    setMode('preview');
  };

  // Test Pattern Data
  const testData: GuideData = {
    lugar: 'SANTIAGO',
    direccionDestino: 'RANCAGUA',
    fecha: '17-02-2026',
    nContrato: '20000',
    tipoVehiculo: 'MAZDA',
    patente: 'ABCD12',
    conductor: 'JUAN PEREZ',
    run: '12.345.678-9',
    ingreso: true,
    empresa: 'AURA INGENIERIA S.A.',
    items: [
      { id: '1', itemStr: '1', cantidad: '10', descripcion: 'EJEMPLO ITEM 1', codigo: '100' },
      { id: '2', itemStr: '2', cantidad: '5', descripcion: 'EJEMPLO ITEM 2', codigo: '200' },
      { id: '3', itemStr: '3', cantidad: '1', descripcion: 'PRUEBA ALINEACION 3', codigo: '300' },
      { id: '4', itemStr: '4', cantidad: '20', descripcion: 'ITEM LARGO DE PRUEBA DE TEXTO', codigo: '400' },
    ]
  };

  // Custom Background State (Removed)
  const [showQR, setShowQR] = useState(false);

  // Construct Calibration URL - Force HTTPS for camera access
  const calibrationUrl = `https://${window.location.hostname}:${window.location.port}/calibration.html`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {mode === 'input' ? (
        <TerminalInput onComplete={handleComplete} initialData={data} />
      ) : (
        <div className="flex flex-col h-screen">
          {/* Toolbar */}
          <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between z-10 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMode('input')}
                className="flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft /> Volver
              </button>

              {/* AR Calibration Button */}
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs text-gray-300 border border-gray-600"
              >
                <QrCode size={16} />
                <span className="font-bold">📱 Calibrar con Celular</span>
              </button>
            </div>

            <div className="flex items-center gap-6">
              {/* Calibration Controls */}
              <div className="flex items-center gap-2 bg-gray-700 p-2 rounded border border-gray-600">
                <button
                  onClick={() => setShowCalibration(true)}
                  className="flex items-center gap-1 hover:bg-black/20 p-1 rounded"
                  title="Ajuste Fino Individual"
                >
                  <Settings size={16} className="text-yellow-400" />
                </button>
                <span className="text-xs font-bold uppercase text-gray-300">Global (mm):</span>
                <label className="flex items-center gap-1 text-sm bg-black px-2 py-1 rounded">
                  X: <input
                    type="number"
                    value={xOffset}
                    onChange={e => updateOffsets(Number(e.target.value), yOffset)}
                    className="w-12 bg-transparent text-white text-right outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 text-sm bg-black px-2 py-1 rounded">
                  Y: <input
                    type="number"
                    value={yOffset}
                    onChange={e => updateOffsets(xOffset, Number(e.target.value))}
                    className="w-12 bg-transparent text-white text-right outline-none"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setData(testData); setTimeout(handlePrint, 100); }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold text-sm"
                >
                  Probando
                </button>
                <button
                  onClick={() => handlePrint()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/50 transition-all"
                >
                  <Printer /> IMPRIMIR
                </button>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-gray-800 flex justify-center p-8 relative">
            <div className="shadow-2xl print:shadow-none" style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
              {data && (
                <PrintTemplate
                  ref={printRef}
                  data={data}
                  xOffset={xOffset}
                  yOffset={yOffset + 15} // BASE OFFSET: User's calibrated "0" is actually 15mm down
                  fieldOffsets={fieldOffsets}
                  showBackground={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Calibration Modal */}
      <CalibrationSettings
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        offsets={fieldOffsets}
        onUpdate={updateFieldOffset}
        onReset={resetFieldOffsets}
      />
      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black p-6 rounded-lg max-w-sm w-full relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold mb-2 text-center">Calibración AR</h3>

            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-4 text-xs">
              <p className="font-bold">¡IMPORTANTE!</p>
              <p>Al abrir en el celular, verás una advertencia de seguridad ("No es seguro").</p>
              <p>Debes pulsar en <span className="font-bold">Configuración Avanzada &gt; Continuar</span> para permitir el acceso a la cámara.</p>
            </div>

            <p className="text-sm text-gray-600 mb-4 text-center">
              Escanea este código con la cámara de tu celular.
              <br />
              <span className="text-xs text-red-500 font-bold">Ambos dispositivos deben estar en la misma WiFi</span>
            </p>

            <div className="flex justify-center p-4 bg-white border-2 border-dashed border-gray-300 rounded mb-4">
              <QRCodeSVG value={calibrationUrl} size={200} />
            </div>

            <div className="text-center">
              <a href={calibrationUrl} target="_blank" className="text-blue-600 underline text-sm break-all">
                {calibrationUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
