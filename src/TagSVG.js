import React from 'react';

export default function TagSVG({ emoji, text, onDelete, style = {}, darkMode, selected }) {
  const width = 125;
  const height = 32;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ ...style, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* 白い縁取り（strokeWidthを4にして少し太く） */}
      <polygon
        points="4,16 24,2 121,2 121,30 24,30"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* 矢印本体（選択中は白、通常は黒）を少し大きめに */}
      <polygon
        points="3,16 23,1 122,1 122,31 23,31"
        fill={selected ? "#fff" : "#000"}
        stroke="none"
      />
      {/* 絵文字の丸（選択中は黒、通常は白） */}
      <circle cx="32" cy="16" r="11" fill={selected ? "#000" : "#fff"} />
      {/* 絵文字（2px上げる） */}
      <text x="32" y="18" textAnchor="middle" fontSize="18" dominantBaseline="middle">
        {emoji}
      </text>
      {/* テキスト（色も切り替え） */}
      <text x="46" y="18" fontSize="15" fill={selected ? "#000" : "#fff"} fontWeight="bold" dominantBaseline="middle">
        {text}
      </text>
      {/* ×ボタン（色も切り替えた方が良ければここも） */}
      <text
        x={width - 24}
        y="20"
        fontSize="16"
        fill={selected ? "#000" : "#fff"}
        fontWeight="bold"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onDelete}
      >×</text>
    </svg>
  );
} 