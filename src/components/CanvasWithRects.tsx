import React, { useRef, useState, useEffect } from 'react';
import type { Instruction } from '../types';
import type { EditorMode } from '../types/EditorMode';

type Props = {
  mode: EditorMode;
  imageUrl: string;
  instructions: Instruction[] | any;
  setInstructions: (newInstructions: Instruction[]) => void;
  highlightedId?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  onRectClick?: (instructionId: string) => void;
};

const CanvasWithRects: React.FC<Props> = ({
  mode,
  imageUrl,
  instructions,
  setInstructions,
  highlightedId,
  onRectClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Instruction | null>(null);
  const [imgAreaSize, setImgAreaSize] = useState<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });

  useEffect(() => {
    const imgArea = containerRef.current;
    if (!imgArea) return;

    const updateSize = () => {
      setImgAreaSize({
        width: imgArea.clientWidth,
        height: imgArea.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(imgArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (highlightedId) {
      const target = document.getElementById(`rect-${highlightedId}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'view') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRect({
      id: 'temp',
      x,
      y,
      width: 0,
      height: 0,
      text: '',
      comments: [],
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'view') return;
    if (!isDrawing || !startPos) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const x = Math.min(startPos.x, endX);
    const y = Math.min(startPos.y, endY);
    const width = Math.abs(endX - startPos.x);
    const height = Math.abs(endY - startPos.y);
    setCurrentRect({
      id: 'temp',
      x,
      y,
      width,
      height,
      text: '',
      comments: [],
    });
  };

  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (
        currentRect &&
        currentRect.width > 10 &&
        currentRect.height > 10 &&
        containerRef.current
      ) {
        const newInstruction: Instruction = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          x: (currentRect.x / imgAreaSize.width) * 100,
          y: (currentRect.y / imgAreaSize.height) * 100,
          width: (currentRect.width / imgAreaSize.width) * 100,
          height: (currentRect.height / imgAreaSize.height) * 100,
          text: '',
          comments: [],
          is_fixed: false,
          is_ok: false,
        };
        const safeInstructions = Array.isArray(instructions) ? instructions : [];
        setInstructions([...safeInstructions, newInstruction]);
      }
      setIsDrawing(false);
      setStartPos(null);
      setCurrentRect(null);
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [currentRect, instructions, setInstructions]);

  const scaleRect = (ins: Instruction) => {
    return {
      id: ins.id,
      left: (ins.x / 100) * imgAreaSize.width,
      top: (ins.y / 100) * imgAreaSize.height,
      width: (ins.width / 100) * imgAreaSize.width,
      height: (ins.height / 100) * imgAreaSize.height,
      text: ins.text,
      comment: ins.comments,
    };
  };

  return (
    <div
      className="img-area relative inline-block cursor-crosshair text-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div className="img-wrap relative">
        <div className="h-full" ref={containerRef}>
          <img
            src={imageUrl}
            alt="Uploaded"
            ref={imageRef}
            className="uploaded-image"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.textContent = '画像が見つかりません。';
              fallback.className = 'h-full flex-center text-gray fsz-14';
              img.parentNode?.appendChild(fallback);
            }}
          />
        </div>
        {Array.isArray(instructions) &&
          instructions.map((ins, index) => {
            const scaled = scaleRect(ins);
            return (
              <div
                key={ins.id}
                id={`rect-${ins.id}`}
                className={`rect ${highlightedId === ins.id ? 'is-active' : ''}`}
                onClick={() => onRectClick?.(ins.id)}
                style={{
                  top: scaled.top,
                  left: scaled.left,
                  width: scaled.width,
                  height: scaled.height,
                }}
              >
                <span className="rect-num">{index + 1}</span>
              </div>
            );
          })}
          {currentRect && (
            <div
              className="rect"
              style={{
                top: currentRect.y,
                left: currentRect.x,
                width: currentRect.width,
                height: currentRect.height,
              }}
            />
          )}
      </div>
    </div>
  );
};

export default CanvasWithRects;
