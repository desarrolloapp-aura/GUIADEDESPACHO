import { X, Save, RotateCcw } from 'lucide-react';
import type { CalibrationConfig } from '../types';

interface CalibrationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    offsets: CalibrationConfig;
    onUpdate: (key: string, axis: 'x' | 'y' | 'scale', value: number) => void;
    onReset: () => void;
}

const FIELDS = [
    { key: 'lugar', label: 'Lugar (Origen)' },
    { key: 'direccionDestino', label: 'Lugar (Destino)' },
    { key: 'tipoVehiculo', label: 'Tipo Vehículo' },
    { key: 'conductor', label: 'Conductor' },
    { key: 'nContrato', label: 'N° Contrato' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'patente', label: 'Patente' },
    { key: 'run', label: 'RUN / RUT' },
    { key: 'run', label: 'RUN / RUT' },
    { key: 'numero', label: 'Nº (Sobre Nota)' },
    { key: 'coordinador', label: 'Coordinador' },
    { key: 'total', label: 'Total Cantidades' },
    { key: 'itemsTable', label: 'Tabla de Items' },
];

export const CalibrationSettings = ({ isOpen, onClose, offsets, onUpdate, onReset }: CalibrationSettingsProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-24 right-4 z-50 w-80 bg-gray-800/95 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-gray-600 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800/95 py-2 -mt-2 border-b border-gray-700">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    🔧 Ajuste Fino (mm)
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 rounded-full p-1">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-800">
                    Ajusta cada campo individuamente y mira el resultado en tiempo real.
                </p>

                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Campo</span>
                    <span className="w-14 text-center">X</span>
                    <span className="w-14 text-center">Y</span>
                    <span className="w-10 text-center">TAMAÑO</span>
                </div>

                {FIELDS.map((field) => {
                    const valX = offsets[field.key]?.x || 0;
                    const valY = offsets[field.key]?.y || 0;

                    return (
                        <div key={field.key} className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center bg-gray-700/30 p-1.5 rounded hover:bg-gray-700 transition-colors">
                            <span className="font-medium text-xs text-white truncate" title={field.label}>{field.label}</span>

                            <input
                                type="number"
                                step="0.1"
                                value={valX}
                                onChange={(e) => onUpdate(field.key, 'x', parseFloat(e.target.value) || 0)}
                                className="w-14 bg-black/50 border border-gray-600 rounded px-1 py-0.5 text-right text-yellow-400 font-mono text-xs focus:border-yellow-500 outline-none"
                            />

                            <input
                                type="number"
                                step="0.1"
                                value={valY}
                                onChange={(e) => onUpdate(field.key, 'y', parseFloat(e.target.value) || 0)}
                                className="w-14 bg-black/50 border border-gray-600 rounded px-1 py-0.5 text-right text-green-400 font-mono text-xs focus:border-green-500 outline-none"
                            />

                            <input
                                type="number"
                                step="0.1"
                                min="0.5"
                                max="3.0"
                                value={offsets[field.key]?.scale || 1}
                                onChange={(e) => onUpdate(field.key, 'scale', parseFloat(e.target.value) || 1)}
                                className="w-10 bg-black/50 border border-gray-600 rounded px-1 py-0.5 text-right text-blue-400 font-mono text-xs focus:border-blue-500 outline-none"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex justify-between gap-2 pt-3 border-t border-gray-700 sticky bottom-0 bg-gray-800/95 py-2 -mb-2">
                <button
                    onClick={() => {
                        if (confirm('¿Restablecer a 0?')) onReset();
                    }}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs px-2 py-1"
                >
                    <RotateCcw size={12} /> Reset
                </button>

                <button
                    onClick={onClose}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded font-bold text-xs shadow-lg"
                >
                    <Save size={14} /> Listo
                </button>
            </div>
        </div>
    );
};
