import { useEffect, useRef, useState } from 'react';
import { Move, Maximize2 } from 'lucide-react';

export const ARCalibration = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Box State (Pixels)
    // X/Y are offsets from the center of the screen
    const [xOffset, setXOffset] = useState(0);
    const [yOffset, setYOffset] = useState(0);
    const [boxW, setBoxW] = useState(250);
    const [boxH, setBoxH] = useState(350);

    // Touch Dragging State
    const dragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0, startXOffset: 0, startYOffset: 0 });

    useEffect(() => {
        // Access rear camera
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("No se pudo acceder a la cámara. Revisa permisos HTTPS.");
            }
        }
        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Touch Handlers for Dragging
    const handleTouchStart = (e: React.TouchEvent) => {
        // Only trigger if touching near the center or intended area, 
        // but for now allow dragging from anywhere in the container
        dragging.current = true;
        const touch = e.touches[0];
        startPos.current = {
            x: touch.clientX,
            y: touch.clientY,
            startXOffset: xOffset,
            startYOffset: yOffset
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragging.current) return;
        const touch = e.touches[0];

        const deltaX = touch.clientX - startPos.current.x;
        const deltaY = touch.clientY - startPos.current.y;

        setXOffset(startPos.current.startXOffset + deltaX);
        setYOffset(startPos.current.startYOffset + deltaY);
    };

    const handleTouchEnd = () => {
        dragging.current = false;
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col z-50">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/50 p-4 flex justify-between items-center z-20 backdrop-blur-sm">
                <h2 className="font-bold text-sm flex items-center gap-2">
                    <Move size={16} /> Ajuste Manual Táctil
                </h2>
                <div className='text-xs text-gray-300'>
                    Arrastra el cuadro • Usa los controles abajo
                </div>
            </div>

            {/* Content Area (Touch Zone) */}
            <div
                className="relative flex-1 overflow-hidden flex items-center justify-center bg-gray-900 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* 1. Camera Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-75"
                />

                {/* 2. Visual Center Guide (Static Screen Center) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                    <div className="w-full h-px bg-white/50 absolute" />
                    <div className="h-full w-px bg-white/50 absolute" />
                </div>

                {/* 3. The Interactive Box */}
                <div
                    className="absolute z-20 border-4 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.5)] flex items-center justify-center"
                    style={{
                        transform: `translate(${xOffset}px, ${yOffset}px)`,
                        width: `${boxW}px`,
                        height: `${boxH}px`,
                    }}
                >
                    {/* Handles for visual cue */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-500" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-500" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-500" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-500" />

                    <span className="text-green-500 font-bold text-xs bg-black/80 px-2 py-1 rounded absolute -top-8 whitespace-nowrap shadow-md border border-green-500/30">
                        X: {Math.round(xOffset / 5)}mm  Y: {Math.round(yOffset / 5)}mm
                    </span>
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="bg-black/95 p-6 z-20 border-t border-gray-700 flex flex-col gap-4 pb-8">

                {/* Resize Controls */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Width */}
                    <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-2 uppercase tracking-wider font-bold">
                            <Maximize2 size={12} className="rotate-90 text-green-500" /> Ancho
                        </label>
                        <input
                            type="range" min="50" max="400"
                            value={boxW}
                            onChange={e => setBoxW(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                    {/* Height */}
                    <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-2 uppercase tracking-wider font-bold">
                            <Maximize2 size={12} className="text-green-500" /> Alto
                        </label>
                        <input
                            type="range" min="50" max="600"
                            value={boxH}
                            onChange={e => setBoxH(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-800 mt-2">
                    <p className="text-gray-400 text-xs mb-1">
                        Copia estos valores en tu PC:
                    </p>
                    <div className="flex justify-center gap-8 text-3xl font-mono font-bold text-green-400">
                        <div className='flex flex-col items-center'>
                            <span className='text-[10px] text-gray-500'>OFFSET X</span>
                            {Math.round(xOffset / 5)}
                        </div>
                        <div className='flex flex-col items-center'>
                            <span className='text-[10px] text-gray-500'>OFFSET Y</span>
                            {Math.round(yOffset / 5)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
