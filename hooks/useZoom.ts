import { useState, useEffect } from 'react';

export function useZoom() {
    const [zoomLevel, setZoomLevel] = useState(100);

    useEffect(() => {
        document.documentElement.style.fontSize = `${zoomLevel}%`;
    }, [zoomLevel]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 80));
    const handleZoomReset = () => setZoomLevel(100);

    return { zoomLevel, handleZoomIn, handleZoomOut, handleZoomReset };
}
