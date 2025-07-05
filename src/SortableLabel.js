import React, { useRef } from 'react';
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableLabel({
  label,
  filterLabelId,
  setFilterLabelId,
  labelEditId,
  setLabelEditValue,
  handleEditLabelSave,
  handleDeleteLabel,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: label.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto' };

  const clickedDuringDrag = useRef(false);

  const handleMouseDown = () => {
    clickedDuringDrag.current = false;
  };

  const handleMouseUp = () => {
    if (!isDragging && !clickedDuringDrag.current) {
      console.log('MouseUp click detected:', label.id);
      console.log('MouseUp Current filterLabelId:', filterLabelId);
      console.log('MouseUp Is currently selected:', filterLabelId === label.id);

      if (filterLabelId === label.id) {
        console.log('MouseUp Deselecting label');
        setFilterLabelId(null);
      } else {
        console.log('MouseUp Selecting label');
        setFilterLabelId(label.id);
      }
    }
    if (isDragging) {
        clickedDuringDrag.current = true;
        console.log('MouseUp during drag detected');
    }
  };

  const handleDoubleClick = (e) => {
      if (isDragging) return;
      e.stopPropagation();
      handleEditLabelSave(label.id);
  };

  return (
    <span
      key={label.id}
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: filterLabelId === label.id ? "#e0e0e0" : "#f5f5f5",
        borderRadius: 8,
        padding: "2px 10px",
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        flexShrink: 0
      }}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {labelEditId === label.id ? (
        <input
          value={labelEditValue}
          onChange={e => setLabelEditValue(e.target.value)}
          onBlur={() => handleEditLabelSave(label.id)}
          onKeyDown={e => { if (e.key === "Enter") handleEditLabelSave(label.id); }}
          autoFocus
          style={{ width: 60 }}
        />
      ) : (
        <span style={{ flex: 1, cursor: "pointer" }}>
          🚩{label.name}
        </span>
      )}
      <span
        style={{ fontSize: 16, color: "#888", cursor: "pointer", marginLeft: 8, lineHeight: 1 }}
        onClick={e => { e.stopPropagation(); handleDeleteLabel(label.id); }}
      >×</span>
    </span>
  );
}

export default SortableLabel; 