import React, { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Drawing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawings, setDrawings] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
  }, [currentColor, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setDrawings(prev => [...prev, dataURL]);
    
    toast({
      title: 'Drawing Saved!',
      description: 'Your technique diagram has been saved.',
    });

    clearCanvas();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Drawing</h2>
        <p className="text-gray-600">Draw technique diagrams and positions</p>
      </div>

      {/* Drawing Tools */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colors
          </label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  currentColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={saveDrawing}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full border border-gray-300 rounded-lg cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Saved Drawings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Saved Drawings ({drawings.length})
        </h3>
        
        {drawings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {drawings.map((drawing, index) => (
              <div key={index} className="bg-white p-2 rounded-lg shadow-md">
                <img
                  src={drawing}
                  alt={`Drawing ${index + 1}`}
                  className="w-full rounded border"
                />
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">Drawing {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No drawings saved yet.</p>
            <p className="text-sm">Create your first technique diagram!</p>
          </div>
        )}
      </div>
    </div>
  );
}