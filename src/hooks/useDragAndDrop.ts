import { useState, useRef, useEffect } from 'react';

interface UseDragAndDropOptions<T> {
  items: T[];
  onReorder: (reorderedItems: T[]) => void;
  getItemId: (item: T) => string;
  disabled?: boolean;
}

export const useDragAndDrop = <T>({
  items,
  onReorder,
  getItemId,
  disabled = false,
}: UseDragAndDropOptions<T>) => {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  const handleDragStart = (index: number, item: T) => {
    if (disabled) return;
    dragStartIndexRef.current = index;
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    if (disabled || dragStartIndexRef.current === null || draggedOverIndex === null) {
      setDraggedItem(null);
      setDraggedOverIndex(null);
      dragStartIndexRef.current = null;
      return;
    }

    const startIndex = dragStartIndexRef.current;
    const endIndex = draggedOverIndex;

    if (startIndex !== endIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(startIndex, 1);
      newItems.splice(endIndex, 0, removed);
      onReorder(newItems);
    }

    setDraggedItem(null);
    setDraggedOverIndex(null);
    dragStartIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    if (dragStartIndexRef.current !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const getDragProps = (index: number, item: T) => ({
    draggable: !disabled,
    onDragStart: () => handleDragStart(index, item),
    onDragEnd: handleDragEnd,
    onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
    onDragLeave: handleDragLeave,
  });

  return {
    draggedItem,
    draggedOverIndex,
    isDragging: draggedItem !== null,
    getDragProps,
  };
};

