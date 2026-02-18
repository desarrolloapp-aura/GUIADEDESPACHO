import { Document, Page, pdfjs } from 'react-pdf';


// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfBackground = () => {
    return (
        <div className="w-full h-full overflow-hidden flex items-center justify-center opacity-50 relative pointer-events-none">
            <Document file="/PLANTILLA.pdf" loading="Cargando plantilla...">
                <Page
                    pageNumber={1}
                    width={816} // approx Letter width in px at 96dpi (8.5 * 96 = 816)
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                />
            </Document>
        </div>
    );
};
