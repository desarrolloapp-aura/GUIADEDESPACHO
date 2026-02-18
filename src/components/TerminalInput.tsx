import React, { useState, useRef } from 'react';
import type { GuideData, GuideItem } from '../types';
import { ArrowRight, Upload, Trash2 } from 'lucide-react';
import { parseGuidePdf } from '../utils/pdfParser';

interface TerminalInputProps {
    onComplete: (data: GuideData) => void;
    initialData?: GuideData | null;
}

const INITIAL_DATA: GuideData = {
    lugar: '',
    direccionDestino: '',
    tipoVehiculo: '',
    conductor: '',
    nContrato: '',
    fecha: new Date().toLocaleDateString('es-CL'),
    patente: '',
    run: '',
    ingreso: true,
    empresa: 'AURA INGENIERIA S.A.',
    items: []
};

export const TerminalInput: React.FC<TerminalInputProps> = ({ onComplete, initialData }) => {
    const fields: { key: keyof GuideData; label: string }[] = [
        { key: 'lugar', label: 'Ingrese LUGAR (ORIGEN)' },
        { key: 'direccionDestino', label: 'Ingrese DIRECCION DESTINO' },
        { key: 'tipoVehiculo', label: 'Ingrese TIPO DE VEHICULO' },
        { key: 'conductor', label: 'Ingrese CONDUCTOR' },
        { key: 'coordinador', label: 'Ingrese COORDINADOR' },
        { key: 'nContrato', label: 'Ingrese Nº CONTRATO' },
        { key: 'numero', label: 'Ingrese NÚMERO GUIA DESPACHO ICONSTRUYE' },
        { key: 'fecha', label: 'Ingrese FECHA (dd/mm/aaaa)' },
        { key: 'patente', label: 'Ingrese PATENTE' },
        { key: 'run', label: 'Ingrese RUN' },
    ];

    const [data, setData] = useState<GuideData>(initialData || INITIAL_DATA);
    const [step, setStep] = useState(initialData ? fields.length : 0);
    const [newItem, setNewItem] = useState<Partial<GuideItem>>({});
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            const parsed = await parseGuidePdf(file);

            setData(prev => ({
                ...prev,
                lugar: parsed.lugar || prev.lugar,
                direccionDestino: parsed.direccionDestino || prev.direccionDestino,
                fecha: parsed.fecha || prev.fecha,
                patente: parsed.patente || prev.patente,
                conductor: parsed.conductor || prev.conductor,
                run: parsed.run || prev.run,
                numero: parsed.numero || prev.numero,
                items: parsed.items || prev.items // Missing piece!
            }));

            // Reveal all fields so user can see the imported data
            setStep(fields.length);

            // alert("PDF Procesado. Datos cargados."); // Removed as requested
        } catch (err) {
            console.error(err);
            alert("Error al leer el PDF.");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (step < fields.length - 1) {
                setStep(step + 1);
            } else {
                setStep(fields.length); // Finished headers, move to items
            }
        }
    };

    const updateField = (val: string, field: keyof GuideData) => {
        setData(prev => ({ ...prev, [field]: val.toUpperCase() }));
    };

    const addItem = () => {
        if (!newItem.descripcion) return; // minimal requirement

        // Auto-fill Item number if empty
        const nextItemNum = data.items.length + 1;
        const itemStr = newItem.itemStr || nextItemNum.toString();

        const item: GuideItem = {
            id: crypto.randomUUID(),
            itemStr: itemStr,
            cantidad: newItem.cantidad || '',
            descripcion: newItem.descripcion || '',
            codigo: newItem.codigo || '',
        };

        setData(prev => ({ ...prev, items: [...prev.items, item] }));

        // Reset inputs but keep Item incremented for convenience?
        // User might want to type it, so let's clear it or auto-set next
        setNewItem({ itemStr: (data.items.length + 2).toString() });

        // Focus back on first input (Item)
        document.getElementById('input-item')?.focus();
    };

    return (
        <div className="bg-black text-green-400 min-h-screen p-8 font-mono text-xl">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold border-b-2 border-green-600 pb-2 mb-8 flex justify-between items-center">
                    <span>&gt; SISTEMA DE GESTIÓN DE GUÍAS v1.1</span>

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isParsing}
                            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded flex items-center gap-2 transition-colors border border-green-500/30"
                        >
                            {isParsing ? 'LEYENDO...' : (
                                <>
                                    <Upload size={16} /> IMPORTAR PDF
                                </>
                            )}
                        </button>
                    </div>
                </h1>

                <div className="space-y-4">
                    {fields.map((field, index) => {
                        if (index > step) return null;
                        const isCurrent = index === step;
                        return (
                            <div key={field.key} className={`flex flex-col ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                                <label className="mb-1">&gt; {field.label}:</label>
                                <input
                                    type="text"
                                    className="bg-gray-900 border-none outline-none text-white p-2 w-full focus:ring-2 focus:ring-green-500"
                                    value={data[field.key] as string}
                                    onChange={(e) => updateField(e.target.value, field.key)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus={isCurrent}
                                    disabled={false} // Always allow editing
                                />
                            </div>
                        );
                    })}
                </div>

                {step >= fields.length && (
                    <div className="mt-8 border-t border-green-800 pt-4">
                        <h2 className="text-2xl mb-4">&gt; ITEMS DEL DOCUMENTO (4 COLUMNAS)</h2>

                        {/* TABLE DISPLAY */}
                        {data.items.length > 0 && (
                            <table className="w-full text-left mb-6 text-sm border-collapse border border-green-900">
                                <thead>
                                    <tr className="bg-green-900 text-black">
                                        <th className="p-2 w-16">ITEM</th>
                                        <th className="p-2 w-24">CANT</th>
                                        <th className="p-2">DESCRIPCION</th>
                                        <th className="p-2 w-64">FOLIO/REF</th>
                                        <th className="p-2 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map(item => (
                                        <tr key={item.id} className="border-b border-green-900 hover:bg-green-900/20">
                                            <td className="p-2">{item.itemStr}</td>
                                            <td className="p-2">
                                                <input
                                                    className="bg-transparent text-white w-full outline-none focus:text-green-400"
                                                    value={item.cantidad}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        setData(prev => ({
                                                            ...prev,
                                                            items: prev.items.map(i => i.id === item.id ? { ...i, cantidad: val } : i)
                                                        }));
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <textarea
                                                    className="bg-transparent text-white w-full outline-none focus:text-green-400 resize-y min-h-[4rem]"
                                                    rows={3}
                                                    value={item.descripcion}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        setData(prev => ({
                                                            ...prev,
                                                            items: prev.items.map(i => i.id === item.id ? { ...i, descripcion: val } : i)
                                                        }));
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    className="bg-transparent text-white w-full outline-none focus:text-green-400"
                                                    placeholder="Ingrese Folio..."
                                                    value={item.codigo}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        setData(prev => ({
                                                            ...prev,
                                                            items: prev.items.map(i => i.id === item.id ? { ...i, codigo: val } : i)
                                                        }));
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <button
                                                    onClick={() => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }))}
                                                    className="text-red-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* INPUTS ROW */}
                        <div className="grid grid-cols-12 gap-2 bg-gray-900 p-4 rounded items-end">

                            <div className="col-span-2">
                                <label className="text-xs block mb-1 text-gray-400">ITEM</label>
                                <input
                                    id="input-item"
                                    placeholder="#"
                                    className="w-full bg-black text-white p-2 border border-green-700 focus:border-green-400 outline-none"
                                    value={newItem.itemStr || ''}
                                    onChange={e => setNewItem({ ...newItem, itemStr: e.target.value.toUpperCase() })}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('input-cant')?.focus()}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs block mb-1 text-gray-400">CANTIDAD</label>
                                <input
                                    id="input-cant"
                                    placeholder="0"
                                    className="w-full bg-black text-white p-2 border border-green-700 focus:border-green-400 outline-none"
                                    value={newItem.cantidad || ''}
                                    onChange={e => setNewItem({ ...newItem, cantidad: e.target.value.toUpperCase() })}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('input-desc')?.focus()}
                                />
                            </div>

                            <div className="col-span-5">
                                <label className="text-xs block mb-1 text-gray-400">DESCRIPCION</label>
                                <input
                                    id="input-desc"
                                    placeholder="Descripción del bien..."
                                    className="w-full bg-black text-white p-2 border border-green-700 focus:border-green-400 outline-none"
                                    value={newItem.descripcion || ''}
                                    onChange={e => setNewItem({ ...newItem, descripcion: e.target.value.toUpperCase() })}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('input-code')?.focus()}
                                />
                            </div>

                            <div className="col-span-3">
                                <label className="text-xs block mb-1 text-gray-400">FOLIO.ITEM-REF</label>
                                <input
                                    id="input-code"
                                    placeholder="Ej: 100.1-A"
                                    className="w-full bg-black text-white p-2 border border-green-700 focus:border-green-400 outline-none"
                                    value={newItem.codigo || ''}
                                    onChange={e => setNewItem({ ...newItem, codigo: e.target.value.toUpperCase() })}
                                    onKeyDown={e => e.key === 'Enter' && addItem()}
                                />
                            </div>

                        </div>

                        <div className="mt-4 flex justify-between items-center text-sm">
                            <p className="text-gray-400">
                                <span className="font-bold text-white">4 Columnas:</span> Item &rarr; Cantidad &rarr; Descripción &rarr; Folio/Ref.
                            </p>
                            <button
                                onClick={() => {
                                    // Auto-add pending item if it has data
                                    let finalItems = [...data.items];
                                    if (newItem.descripcion) {
                                        const nextItemNum = finalItems.length + 1;
                                        const itemStr = newItem.itemStr || nextItemNum.toString();
                                        const item: GuideItem = {
                                            id: crypto.randomUUID(),
                                            itemStr: itemStr,
                                            cantidad: newItem.cantidad || '',
                                            descripcion: newItem.descripcion || '',
                                            codigo: newItem.codigo || '',
                                        };
                                        finalItems.push(item);
                                    }

                                    onComplete({ ...data, items: finalItems });
                                }}
                                className="bg-green-600 text-black px-6 py-3 font-bold hover:bg-green-500 uppercase flex items-center gap-2"
                            >
                                Finalizar e Imprimir <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
