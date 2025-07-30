
import React from 'react';
import type { Seat } from '../types';
import Desk from './Desk';
import { CLASS_COLS } from '../constants';

interface SeatingChartProps {
  seats: Seat[];
  draggedSeatIndex: number | null;
  dragOverSeatIndex: number | null;
  onDragStart: (seatIndex: number) => void;
  onDrop: (seatIndex: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, seatIndex: number) => void;
  onDragEnd: () => void;
  onDragEnter: (seatIndex: number) => void;
}

const SeatingChart: React.FC<SeatingChartProps> = ({
  seats,
  draggedSeatIndex,
  dragOverSeatIndex,
  onDragStart,
  onDrop,
  onDragOver,
  onDragEnd,
  onDragEnter,
}) => {
  return (
    <div className="bg-white/50 p-6 rounded-xl shadow-inner backdrop-blur-sm">
      <div
        className={`grid gap-4 md:gap-6`}
        style={{ gridTemplateColumns: `repeat(${CLASS_COLS}, minmax(0, 1fr))` }}
        onDragLeave={() => onDragEnter(-1)}
      >
        {seats.map((seat, index) => (
          <Desk
            key={seat.id}
            seat={seat}
            seatIndex={index}
            isDragging={draggedSeatIndex === index}
            isDragOver={dragOverSeatIndex === index}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragEnter={onDragEnter}
          />
        ))}
      </div>
    </div>
  );
};

export default SeatingChart;
