
import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText() {
    try {
        const data = new Uint8Array(fs.readFileSync('./public/GuiaDespachoElectronica_23349.pdf'));
        const loadingTask = getDocument({ data });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const items = textContent.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5]
            }));

            // Sort by Y (descending) then X (ascending)
            // Note: PDF coordinates: (0,0) is bottom-left usually. top is high Y.
            let currentY = -1;
            let currentLine = [];
            let lines = [];

            for (const item of items) {
                if (currentY === -1 || Math.abs(item.y - currentY) < 4) {
                    currentLine.push(item.str);
                    currentY = item.y;
                } else {
                    lines.push(currentLine.join(' ')); // Join words in same line with space
                    currentLine = [item.str];
                    currentY = item.y;
                }
            }
            if (currentLine.length > 0) lines.push(currentLine.join(' '));

            const pageText = lines.join('\n');
            fullText += pageText + '\n';
        }

        console.log(fullText);
    } catch (error) {
        console.error("Error extracted PDF:", error);
    }
}

extractText();
