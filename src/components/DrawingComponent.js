import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './canvas.css'; // Ensure this path is correct

const DrawingComponent = forwardRef((_, ref) => {
  // References and state variables
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [tool, setTool] = useState('draw');
  const [currentShape, setCurrentShape] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [redoList, setRedoList] = useState([]);
  const [brushColor, setBrushColor] = useState('black');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // Set up the canvas context and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    resizeCanvas(canvas);
    const ctx = canvas.getContext('2d');
    setContext(ctx);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    window.addEventListener('resize', () => resizeCanvas(canvas));

    const savedImage = localStorage.getItem('savedCanvasImage');
    if (savedImage) restoreCanvas(savedImage);

    saveHistory(); // Save the initial blank state to history

    return () => {
      window.removeEventListener('resize', () => resizeCanvas(canvas));
    };
  }, []);

  // Add a white background to the canvas
  const addWhiteBackground = (canvas) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill the temp canvas with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas on top of the white background
    tempCtx.drawImage(canvas, 0, 0);

    return tempCanvas;
  };

  // Get the current drawing image in PNG format
  const getCanvasImageBase64 = () => {
    let canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0);

    if (isEmpty) {
      return null;
    }

    canvas = addWhiteBackground(canvas);
    const dataURL = canvas.toDataURL('image/png');
    const base64Image = dataURL.split(',')[1]; // Extracts the base64 part
    return base64Image;
  };

  // Make getCanvasImageBase64 available to parent components
  useImperativeHandle(ref, () => ({
    getCanvasImageBase64,
  }));

  // Resize the canvas
  const resizeCanvas = (canvas) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    // Resize the canvas to 50% of the screen width and height
    canvas.width = window.innerWidth * 0.5;
    canvas.height = window.innerHeight * 0.6;

    if (context) context.drawImage(tempCanvas, 0, 0);
  };

  // Start drawing on the canvas
  const startDrawing = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    setIsDrawing(true);
    setStartPos({ x: offsetX, y: offsetY });

    if (tool === 'text') {
      setTextPos({ x: offsetX, y: offsetY });
      setShowTextInput(true);
    } else if (tool === 'shape') {
      setCurrentShape({ x: offsetX, y: offsetY, width: 0, height: 0 });
    } else {
      context.beginPath();
      context.moveTo(offsetX, offsetY);
    }
  };

  // Draw on the canvas
  const draw = (event) => {
    if (!isDrawing || tool === 'text' || !context) return; // Check if context is available

    const { offsetX, offsetY } = event.nativeEvent;

    if (tool === 'draw') {
      context.strokeStyle = brushColor;
      context.globalCompositeOperation = 'source-over';
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else if (tool === 'erase') {
      context.globalCompositeOperation = 'destination-out';
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else if (tool === 'shape') {
      const { x, y } = startPos;
      clearCanvas(); // Clear before re-drawing shapes
      restoreCanvas(history[history.length - 1]); // Restore the last history state before drawing
      const shape = { ...currentShape, width: offsetX - x, height: offsetY - y };
      setCurrentShape(shape);

      if (currentShape?.type === 'rectangle') {
        context.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (currentShape?.type === 'circle') {
        context.beginPath();
        const radius = Math.sqrt(Math.pow(shape.width, 2) + Math.pow(shape.height, 2)) / 2;
        context.arc(shape.x, shape.y, radius, 0, 2 * Math.PI);
        context.stroke();
      }
    }
  };

  // Stop drawing on the canvas
  const stopDrawing = () => {
    setIsDrawing(false);
    if (tool !== 'text') {
      saveHistory(); // Save the new shape or drawing state to history
      saveCanvasToLocalStorage(); // Save to localStorage when done
    }
  };

  // Save the current state to history
  const saveHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.concat(canvas.toDataURL());
    setHistory(newHistory);
    setRedoList([]); // Clear the redo list after new history
  };

  // Undo the last action
  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const lastState = newHistory.pop();
    setRedoList([lastState, ...redoList]);
    setHistory(newHistory);
    restoreCanvas(newHistory[newHistory.length - 1]); // Restore the last valid state
  };

  // Restore the canvas from an image data URL
  const restoreCanvas = (imageData) => {
    if (!context) return; // Ensure context is available
    const img = new Image();
    img.src = imageData;
    img.onload = () => context.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    img.onerror = () => console.error('Failed to load image from history.');
  };

  // Set the tool to draw a rectangle
  const drawRectangle = () => {
    setTool('shape');
    setCurrentShape({ type: 'rectangle' });
  };

  // Set the tool to draw a circle
  const drawCircle = () => {
    setTool('shape');
    setCurrentShape({ type: 'circle' });
  };

  // Erase all content on the canvas
  const eraseAll = () => {
    clearCanvas();
    saveHistory(); // Save after clearing the canvas
    saveCanvasToLocalStorage(); // Clear canvas in localStorage as well
  };

  // Clear the canvas
  const clearCanvas = () => {
    if (context) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Save the canvas to localStorage
  const saveCanvasToLocalStorage = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    localStorage.setItem('savedCanvasImage', imageData);
  };

  // Download the canvas as an image
  const downloadCanvas = () => {
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL();
    link.download = 'canvas-image.png';
    link.click();
  };

  // Handle text input change
  const handleTextChange = (e) => {
    setTextInput(e.target.value);
  };

  // Submit the text input
  const submitText = () => {
    if (!context) return; // Ensure context is available
    context.font = '20px Arial';
    context.fillStyle = brushColor;
    context.fillText(textInput, textPos.x, textPos.y);
    setTextInput('');
    setShowTextInput(false);
    saveHistory();
    saveCanvasToLocalStorage();
  };
  return (
    <div className="drawing-container">
      <div className="toolbar">
        <button className="tool-button" onClick={() => setTool('draw')}>Draw</button>
        <button className="tool-button" onClick={() => setTool('erase')}>Erase</button>
        <button className="tool-button" onClick={eraseAll}>Erase All</button>
        <button className="tool-button" onClick={undo}>Undo</button>
        <button className="tool-button" onClick={() => setTool('text')}>Add Text</button>
        <button className="tool-button" onClick={downloadCanvas}>Download</button>
        <label>
          Brush Color:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
          />
        </label>
      </div>

      {showTextInput && (
        <div className="text-input">
          <input
            type="text"
            value={textInput}
            onChange={handleTextChange}
            onBlur={submitText}
            placeholder="Enter text"
          />
          <button onClick={submitText}>Submit</button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
});

export default DrawingComponent;
