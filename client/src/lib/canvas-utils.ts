import { useRef, useCallback } from "react";

export const useCanvasDrawing = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  color: string,
  brushSize: number
) => {
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Remove future history if we're not at the end
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }

    // Add current state to history
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.push(imageData);
    historyIndex.current++;

    // Limit history size
    if (history.current.length > 50) {
      history.current.shift();
      historyIndex.current--;
    }
  }, [canvasRef]);

  const startDrawing = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing.current = true;
    lastX.current = x;
    lastY.current = y;

    // Save state before drawing
    saveState();

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [canvasRef, saveState]);

  const draw = useCallback((e: MouseEvent) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    lastX.current = x;
    lastY.current = y;
  }, [canvasRef, color, brushSize]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  }, [canvasRef]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before clearing
    saveState();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef, saveState]);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndex.current--;
    const imageData = history.current[historyIndex.current];
    ctx.putImageData(imageData, 0, 0);
  }, [canvasRef]);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndex.current++;
    const imageData = history.current[historyIndex.current];
    ctx.putImageData(imageData, 0, 0);
  }, [canvasRef]);

  const getCanvasData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return canvas.toDataURL();
  }, [canvasRef]);

  const loadCanvasData = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveState();
    };
    img.src = dataUrl;
  }, [canvasRef, saveState]);

  return {
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    undo,
    redo,
    getCanvasData,
    loadCanvasData,
  };
};
