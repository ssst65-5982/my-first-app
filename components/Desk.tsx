
import React from 'react';
import type { Seat } from '../types';

interface DeskProps {
  seat: Seat;
  seatIndex: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (seatIndex: number) => void;
  onDrop: (seatIndex: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, seatIndex: number) => void;
  onDragEnd: () => void;
  onDragEnter: (seatIndex: number) => void;
}

const Desk: React.FC<DeskProps> = ({
  seat,
  seatIndex,
  isDragging,
  isDragOver,
  onDragStart,
  onDrop,
  onDragOver,
  onDragEnd,
  onDragEnter,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!seat.student) {
      e.preventDefault();
      return;
    }
    // Set data to be dragged (optional but good practice)
    e.dataTransfer.setData('text/plain', seat.student.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(seatIndex);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    onDragOver(e, seatIndex);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(seatIndex);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragEnter(seatIndex);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      className={`relative flex items-center justify-center bg-amber-200 border-2 border-amber-400/50 rounded-lg shadow-md aspect-[4/3] sm:aspect-video transition-all duration-200
        ${isDragOver ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'border-dashed border-slate-400 bg-amber-100' : ''}
      `}
    >
      {seat.student && (
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          className={`w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-opacity duration-200 cursor-grab active:cursor-grabbing
            ${isDragging ? 'opacity-30' : 'opacity-100'}
          `}
        >
          <span className="text-base sm:text-lg font-bold text-slate-800 text-center">{seat.student.name}</span>
          <span className="text-xs text-slate-500 hidden sm:inline">#{seat.student.id}</span>
        </div>
      )}
      {!seat.student && (
         <div className="text-slate-400 text-sm">빈자리</div>
      )}
    </div>
  );
};

export default Desk;
