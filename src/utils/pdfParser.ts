import { pdfjs } from 'react-pdf';
import type { GuideData, GuideItem } from '../types';

// Initialize worker
// Use local worker file copied to public folder
// Ensure absolute path for Electron environment
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
}

interface TextItem {
    str: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export const parseGuidePdf = async (file: File): Promise<Partial<GuideData>> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        const items: TextItem[] = textContent.items.map((item: any) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            w: item.width,
            h: item.height
        }));

        // Sort items: Top to Bottom, Left to Right
        items.sort((a, b) => {
            const yDiff = b.y - a.y;
            if (Math.abs(yDiff) > 4) return yDiff;
            return a.x - b.x;
        });

        const fullText = items.map(i => i.str).join(' ');

        // --- GLOBAL DATE & PATENTE ---
        const dateMatch = fullText.match(/(\d{2}[-/]\d{2}[-/]\d{4})/);
        const fecha = dateMatch ? dateMatch[0].replace(/\//g, '-') : '';

        const patenteMatch = fullText.match(/\b([A-Z]{4}\-?\d{2}|[A-Z]{2}\-?\d{4})\b/);
        const patente = patenteMatch ? patenteMatch[0].replace(/-/g, '') : '';

        // --- GEOMETRIC HELPERS ---
        const findValueAfterLabel = (labelPattern: RegExp, xOffsetMax = 300): string => {
            const labelIndex = items.findIndex(i => labelPattern.test(i.str));
            if (labelIndex === -1) return '';

            const labelItem = items[labelIndex];

            // 1. Same Line Check (Right side)
            let candidates = items.filter(i =>
                Math.abs(i.y - labelItem.y) < 5 &&
                i.x > labelItem.x &&
                (i.x - labelItem.x) < xOffsetMax
            );

            if (candidates.length > 0) {
                return candidates.map(c => c.str).join(' ').trim();
            }

            // 2. Next Line Check (Below)
            const belowCandidates = items.filter(i =>
                i.y < labelItem.y &&
                (labelItem.y - i.y) < 20 &&
                Math.abs(i.x - labelItem.x) < 100
            );

            if (belowCandidates.length > 0) {
                return belowCandidates.map(c => c.str).join(' ').trim();
            }

            return '';
        };

        // --- ADDRESS LOGIC ---
        let direccionDestino = findValueAfterLabel(/Direcci.n Destino/i) ||
            findValueAfterLabel(/Lugar de Destino/i);

        let lugar = '';
        const allDirLabels = items.filter(i => /DIRECCI.N/i.test(i.str));
        const originLabel = allDirLabels.find(i => !/DESTINO/i.test(i.str));

        if (originLabel) {
            let candidates = items.filter(i =>
                Math.abs(i.y - originLabel.y) < 5 &&
                i.x > originLabel.x &&
                (i.x - originLabel.x) < 300
            );

            if (candidates.length > 0) {
                lugar = candidates.map(c => c.str).join(' ').trim();
            } else {
                const belowCandidates = items.filter(i =>
                    i.y < originLabel.y &&
                    (originLabel.y - i.y) < 20 &&
                    Math.abs(i.x - originLabel.x) < 100
                );
                if (belowCandidates.length > 0) {
                    lugar = belowCandidates.map(c => c.str).join(' ').trim();
                }
            }
        }

        if (!lugar) {
            lugar = findValueAfterLabel(/Se.or\s*\(es\)/i);
        }



        // Extract Folio Number (Nº)
        // Strict match for "Nº:" to avoid "Nº Contrato"
        // Also captures only significant digits (skips leading zeros)
        let numero = '';
        const numeroMatch = fullText.match(/N[º°]\s*:\s*0*(\d+)/i);
        if (numeroMatch) {
            numero = numeroMatch[1];
        }

        let conductor = findValueAfterLabel(/Nombre Chofer/i) || findValueAfterLabel(/Chofer/i);
        let coordinador = findValueAfterLabel(/Nombre Coordinador/i);


        // --- RUN LOGIC ---
        let run = '';
        const runRegexLoose = /(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/; // Optional dots
        const runRegexGlobal = /(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/g;

        // 1. Explicit Labels: "RUT Chofer" OR "RUT Transportista"
        // In the screenshot: "RUT Transportista" is explicitly visible.
        const runLabels = [/RUT Chofer/i, /RUT Transportista/i, /RUT\s*Transport/i];

        for (const pattern of runLabels) {
            if (run) break;
            const labelItem = items.find(i => pattern.test(i.str));
            if (labelItem) {
                // Check strict right first
                const near = items.find(i =>
                    Math.abs(i.y - labelItem.y) < 5 &&
                    i.x > labelItem.x &&
                    (i.x - labelItem.x) < 200 &&
                    runRegexLoose.test(i.str)
                );
                if (near) {
                    const m = near.str.match(runRegexLoose);
                    if (m) run = m[0];
                }
            }
        }

        // 2. Fallback: Filter all RUTs in document
        if (!run) {
            const allRuns = fullText.match(runRegexGlobal) || [];

            // Filter: Prefer runs < 50 million (Human) over > 50 million (Company)
            const humanRuns = allRuns.filter(r => {
                const clean = r.replace(/\./g, ''); // 12.345.678-k -> 12345678-k

                // Check if starts with digits indicating < 50M
                // A simpler check: 78.xxx.xxx is company. 15.xxx.xxx is person.
                const firstPart = parseInt(clean.split('.')[0] || clean.substring(0, 2));
                return firstPart < 50;
            });

            if (humanRuns.length > 0) {
                // If multiple humans, take the LAST one (usually signature block)
                run = humanRuns[humanRuns.length - 1];
            } else if (allRuns.length > 0) {
                // If only company RUTs found, take the last one hoping it's something else,
                // but usually better to leave empty if we are aiming for driver.
                // Let's take the last one found in text as a fallback.
                run = allRuns[allRuns.length - 1];
            }
        }


        // --- CLEAN UP ---
        if (lugar) lugar = lugar.replace(/^:\s*/, '').replace(/N. DOC. INTERNO.*$/i, '').trim();
        if (direccionDestino) direccionDestino = direccionDestino.replace(/^:\s*/, '').replace(/Comuna Destino.*$/i, '').trim();
        if (conductor) conductor = conductor.replace(/^:\s*/, '').replace(/RUT Chofer.*$/i, '').trim();

        // --- ITEM EXTRACTION LOGIC ---
        // Strategy:
        // 1. Find the "CANTIDAD" and "DESCRIPCION" headers to define columns.
        // 2. Iterate items below the headers.
        // 3. Detect new rows by looking for numbers in the "CANTIDAD" column.

        const extractedItems: GuideItem[] = [];

        // Find headers
        const cantidadHeader = items.find(i => /CANTIDAD/i.test(i.str));
        const descripcionHeader = items.find(i => /DESCRIPCI.N/i.test(i.str));
        // Find Price/Total headers to set right boundary
        // Look for "P.UNIT", "PRECIO", "VALOR TOTAL", "TOTAL"
        const precioHeader = items.find(i => /P\.?\s*UNIT|PRECIO/i.test(i.str));
        const totalHeader = items.find(i => /VALOR\s*TOTAL|TOTAL/i.test(i.str));

        if (cantidadHeader && descripcionHeader) {
            const cantidadX = cantidadHeader.x;

            // Define thresholds (fuzzy X matching)
            const quantityThreshold = 50; // +/- range for quantity column

            // Define right limit for description
            let descriptionMaxX = 1000; // Default: No limit
            if (precioHeader && Math.abs(precioHeader.y - cantidadHeader.y) < 20) {
                // Use Price column Start X as limit
                descriptionMaxX = precioHeader.x - 10;
            } else if (totalHeader && Math.abs(totalHeader.y - cantidadHeader.y) < 20) {
                // Output fallback: Use Total column Start X as limit
                descriptionMaxX = totalHeader.x - 10;
            }

            // Filter items that are BELOW the headers
            // We use a small buffer (e.g., 20) to skip the header line itself
            const tableItems = items.filter(i => i.y < (cantidadHeader.y - 10));

            let currentItem: GuideItem | null = null;
            let currentItemY: number | null = null;
            let currentItemIndex = 1;

            // Sort table items by Y (descending) then X (ascending) to process line by line
            tableItems.sort((a, b) => {
                const yDiff = b.y - a.y;
                if (Math.abs(yDiff) > 4) return yDiff; // Same line tolerance
                return a.x - b.x;
            });

            for (const item of tableItems) {
                // Stop if we hit a footer (e.g., "TOTAL", "OBSERVACIONES", "RECIBIDO")
                // Added specific stop words from user screenshot (RUT Transportista, etc.)
                if (/TOTAL|OBSERVACIONES|RECIBIDO|FIRMA|RUT Transportista|Tipo Traslado|Comuna Destino/i.test(item.str)) {
                    break;
                }

                // Check if this item is in the CANTIDAD column
                // It must be a number (1, 1.0, 1,00, etc.)
                const isQuantityCol = Math.abs(item.x - cantidadX) < quantityThreshold;
                const isNumber = /^[\d.,]+$/.test(item.str.trim());

                if (isQuantityCol && isNumber) {
                    // It's a Quantity -> START NEW ITEM
                    if (currentItem) {
                        extractedItems.push(currentItem);
                    }

                    currentItem = {
                        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                        itemStr: currentItemIndex.toString(),
                        cantidad: item.str,
                        descripcion: '',
                        codigo: '', // No explicit code column in screenshot
                    };
                    currentItemY = item.y;
                    currentItemIndex++;
                    continue;
                }

                // Check if this item is in the DESCRIPTION column
                // Usually to the right of Cantidad
                // AND must be to the left of Price/Total column
                const isDescCol = item.x > (cantidadX + quantityThreshold) && item.x < descriptionMaxX;

                if (isDescCol && currentItem && currentItemY !== null) {
                    // Only append if it's on the SAME LINE (approx same Y) as the item start
                    // This filters out secondary lines like "SEGEPP..." or "OC:..."
                    if (Math.abs(item.y - currentItemY) < 5) {
                        // Append text to current item description
                        const text = item.str.trim();
                        if (text) {
                            currentItem.descripcion = (currentItem.descripcion ? currentItem.descripcion + ' ' : '') + text;
                        }
                    }
                }
            }

            // Push the last item
            if (currentItem) {
                extractedItems.push(currentItem);
            }

            // Clean up descriptions (sometimes extra spaces)
            extractedItems.forEach(i => i.descripcion = i.descripcion.trim());
        }

        return {
            fecha: fecha.toUpperCase(),
            patente: patente.toUpperCase(),
            lugar: lugar.toUpperCase(),
            direccionDestino: direccionDestino.toUpperCase(),
            conductor: conductor.toUpperCase(),
            run: run.toUpperCase(),
            numero: numero.toUpperCase(),
            coordinador: coordinador.toUpperCase(),
            items: extractedItems.map(i => ({
                ...i,
                itemStr: i.itemStr.toUpperCase(),
                cantidad: (() => {
                    // Format Quantity: Remove decimals, pad single digits
                    // "43,00" -> 43 -> "43"
                    // "2,00" -> 2 -> "02"
                    try {
                        const clean = i.cantidad.replace(',', '.');
                        const num = parseInt(clean); // integers only
                        if (isNaN(num)) return i.cantidad.toUpperCase();
                        return num.toString().padStart(2, '0');
                    } catch {
                        return i.cantidad.toUpperCase();
                    }
                })(),
                descripcion: i.descripcion.toUpperCase(),
                codigo: i.codigo.toUpperCase()
            })),
        };

    } catch (err: any) {
        console.error("PDF Parse Error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Detalle del Error: ${msg}`);
    }
};
