import { forwardRef } from 'react';
import type { GuideData, CalibrationConfig } from '../types';
import { PdfBackground } from './PdfBackground';

interface PrintTemplateProps {
    data: GuideData;
    xOffset: number; // in mm
    yOffset: number; // in mm
    fieldOffsets?: CalibrationConfig; // Per-field offsets
    showBackground?: boolean;
    customBackgroundImage?: string | null;
}

export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(
    ({ data, xOffset, yOffset, fieldOffsets = {}, showBackground, customBackgroundImage }, ref) => {

        // Helper for absolute positioning with optional scale
        const style = (topMm: number, leftMm: number, key?: string): React.CSSProperties => {
            let x = xOffset;
            let y = yOffset;
            let s = 1;

            if (key && fieldOffsets[key]) {
                x += fieldOffsets[key].x;
                y += fieldOffsets[key].y;
                s = fieldOffsets[key].scale || 1;
            }

            return {
                position: 'absolute',
                top: `${topMm + y}mm`,
                left: `${leftMm + x}mm`,
                transform: `scale(${s})`,
                transformOrigin: 'top left', // Scale from top-left corner
                whiteSpace: 'nowrap' // Prevent wrapping changes when scaling? Maybe not.
            };
        };

        // Font style for Dot Matrix: Monospace, Bold, Black
        const textStyle = "font-mono font-bold text-black uppercase tracking-wider";

        return (
            <div
                ref={ref}
                className="relative bg-white overflow-hidden print:overflow-visible"
                style={{ width: '215.9mm', height: '279.4mm' }} // Letter size
            >
                {/* Background for calibration (not printed) */}
                {showBackground && (
                    <div className="absolute inset-0 z-0 print:hidden pointer-events-none overflow-hidden flex justify-center items-start">
                        {/* Centering wrapper in case of scale issues */}
                        {customBackgroundImage ? (
                            <img
                                src={customBackgroundImage}
                                className="w-full h-full object-contain opacity-50"
                                alt="Fondo personalizado"
                            />
                        ) : (
                            <div style={{ paddingTop: '0mm' }}>
                                <PdfBackground />
                            </div>
                        )}
                    </div>
                )}

                {/** HEADING FIELDS - Adjusted based on standard forms **/}
                {/* Font size 12px approx */}

                {/* Ingreso/Salida checkboxes */}


                {/* Lugar (Left side) - Shifted UP 2.6mm (35 -> 32.4) */}
                <div className={textStyle} style={style(32.4, 35, 'lugar')}>{data.lugar.toUpperCase()}</div>

                {/* Direccion Destino (Below Lugar) - Estimated ~38mm */}
                <div className={textStyle} style={style(38.0, 35, 'direccionDestino')}>{data.direccionDestino.toUpperCase()}</div>

                {/* Tipo Vehiculo - Shifted UP 2.6mm (48.4 -> 45.8) */}
                <div className={textStyle} style={style(45.8, 45, 'tipoVehiculo')}>{data.tipoVehiculo.toUpperCase()}</div>

                {/* Conductor - Shifted UP 2.6mm (55.2 -> 52.6) */}
                <div className={textStyle} style={style(52.6, 35, 'conductor')}>{data.conductor.toUpperCase()}</div>


                {/* RIGHT SIDE FIELDS */}

                {/* N Contrato - Shifted UP 2.5mm (28.4 -> 25.9) */}
                <div className={textStyle} style={style(25.9, 140, 'nContrato')}>{data.nContrato.toUpperCase()}</div>

                {/* Fecha - Shifted UP 2.5mm (34.4 -> 31.9) */}
                <div className={textStyle} style={style(31.9, 140, 'fecha')}>{data.fecha.toUpperCase()}</div>

                {/* Patente - Shifted UP 2.5mm (48.4 -> 45.9) */}
                <div className={textStyle} style={style(45.9, 140, 'patente')}>{data.patente.toUpperCase()}</div>

                {/* RUN - Shifted UP 2.5mm (55.2 -> 52.7) */}
                <div className={textStyle} style={style(52.7, 140, 'run')}>{data.run.toUpperCase()}</div>


                {/** ITEMS TABLE (4 COLUMNS) **/}
                {/* 
            Vertical Start: ~100mm (Moved DOWN to separate from header)
            Row spacing: ~7.5mm
            
            Horizontal Positions (approx):
            Item: Moved LEFT (8 -> 3)
            Cantidad: Moved LEFT (24 -> 18)
            Descripcion: 45mm
            Folio/Ref: 175mm (Moved RIGHT)
        */}
                {data.items.map((item, index) => {
                    // Refactored to relative flex layout to allow text wrapping
                    // Base offsets
                    const startY = 84 + yOffset;

                    return (
                        <div
                            key={item.id}
                            style={{
                                position: 'absolute',
                                top: index === 0 ? `${startY}mm` : undefined, // Only first item absolute? No, this won't stack.
                                // Wait, we need a parent container if we want them to stack relative to each other.
                                // Let's reimplement properly below, outside this map if possible?
                                // Actually, we can just use a single parent div for all items.
                            }}
                        >
                        </div>
                    );
                })}

                {/* ITEMS TABLE CONTAINER - REPLACEMENT */}
                <div style={{
                    position: 'absolute',
                    top: `${84 + yOffset + (fieldOffsets['itemsTable']?.y || 0)}mm`,
                    left: `${xOffset + (fieldOffsets['itemsTable']?.x || 0)}mm`,
                    width: '215.9mm', // Full width to contain children
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2mm', // vertical spacing between rows
                }}>
                    {data.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', minHeight: '7.5mm' }}>

                            {/* 1. Item - Starts at 3mm, Width 15mm */}
                            {/* Spacer to 3mm */}
                            <div style={{ width: '3mm', flexShrink: 0 }}></div>
                            <div className={textStyle} style={{ width: '15mm', textAlign: 'center', wordWrap: 'break-word' }}>
                                {item.itemStr.toUpperCase()}
                            </div>

                            {/* 2. Cantidad - Starts at 18mm, Width 20mm */}
                            {/* Current X = 3+15 = 18mm. Perfect. No spacer needed. */}
                            <div className={textStyle} style={{ width: '20mm', textAlign: 'center', wordWrap: 'break-word' }}>
                                {(() => {
                                    try {
                                        const clean = item.cantidad.replace(',', '.');
                                        const num = parseInt(clean);
                                        if (isNaN(num)) return item.cantidad.toUpperCase();
                                        return num.toString().padStart(2, '0');
                                    } catch {
                                        return item.cantidad.toUpperCase();
                                    }
                                })()}
                            </div>

                            {/* 3. Descripcion - Starts at 46mm, Width 110mm */}
                            {/* Current X = 18+20 = 38mm. Target 46. Gap = 8mm. */}
                            <div style={{ width: '8mm', flexShrink: 0 }}></div>
                            <div className={textStyle} style={{
                                width: '110mm',
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word', // Ensure long words break
                                wordWrap: 'break-word'      // Legacy support
                            }}>
                                {item.descripcion.toUpperCase()}
                            </div>

                            {/* 4. Folio - Starts at 175mm, Width 50mm */}
                            {/* Current X = 46+110 = 156mm. Target 175. Gap = 19mm. */}
                            <div style={{ width: '19mm', flexShrink: 0 }}></div>
                            <div className={textStyle} style={{ width: '50mm', wordWrap: 'break-word' }}>
                                {item.codigo.toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* NUMERO (Folio) - Requested "Above Note" - Approx 240mm down, 20mm left */}
                {data.numero && (
                    <div className={textStyle} style={style(240, 20, 'numero')}>
                        {/* Label requested is "Nº" or just number? User said "EL CAMPO DE NUMERO" */}
                        {/* Usually printed as "Nº 12345" */}
                        GD N° {data.numero}
                    </div>
                )}

                {/* COORDINADOR - Requested "Al Final" - Approx 260mm down */}
                {data.coordinador && (
                    <div className={textStyle} style={style(260, 20, 'coordinador')}>
                        {data.coordinador}
                    </div>
                )}

                {/* TOTAL QUANTITIES - Calculated on the fly */}
                {(() => {
                    const totalQty = data.items.reduce((sum, item) => {
                        const val = parseInt(item.cantidad) || 0;
                        return sum + val;
                    }, 0);

                    // Position needs to be calibrated. Estimating bottom of quantity column.
                    // Assuming items start around 100mm and go down. 
                    // Let's look at the image, it seems to be below the last item or at the bottom of the table.
                    // The user said "FIJATE EN EN LA IMAGEN AHI DEBE IR EL TOAL EN TATAL".
                    // It looks like a fixed footer in the table.
                    return (
                        <div className={textStyle} style={style(240, 5, 'total')}>
                            {totalQty}
                        </div>
                    );
                })()}

            </div>
        );
    }
);

PrintTemplate.displayName = 'PrintTemplate';
