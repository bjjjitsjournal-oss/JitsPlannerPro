import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useCanvasDrawing } from "@/lib/canvas-utils";

interface DrawingCanvasProps {
  color: string;
  brushSize: number;
  width: number;
  height: number;
}

const DrawingCanvas = forwardRef<any, DrawingCanvasProps>(
  ({ color, brushSize, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { 
      startDrawing, 
      draw, 
      stopDrawing, 
      clearCanvas, 
      undo, 
      redo, 
      getCanvasData, 
      loadCanvasData 
    } = useCanvasDrawing(canvasRef, color, brushSize);

    useImperativeHandle(ref, () => ({
      clearCanvas,
      undo,
      redo,
      getCanvasData,
      loadCanvasData,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set up canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);

      // Touch events for mobile
      canvas.addEventListener('touchstart', handleTouch);
      canvas.addEventListener('touchmove', handleTouch);
      canvas.addEventListener('touchend', stopDrawing);

      function handleTouch(e: TouchEvent) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent(
          e.type === 'touchstart' ? 'mousedown' : 
          e.type === 'touchmove' ? 'mousemove' : 'mouseup',
          {
            clientX: touch.clientX,
            clientY: touch.clientY,
          }
        );
        canvas.dispatchEvent(mouseEvent);
      }

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        canvas.removeEventListener('touchstart', handleTouch);
        canvas.removeEventListener('touchmove', handleTouch);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [startDrawing, draw, stopDrawing, width, height]);

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full bg-white rounded drawing-canvas"
          style={{ maxWidth: '100%', height: `${height}px` }}
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
