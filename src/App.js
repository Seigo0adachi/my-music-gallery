import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Dock from "./Dock";
import { VscHome, VscAccount, VscSettingsGear } from "react-icons/vsc";
import { FiMessageCircle, FiSearch } from "react-icons/fi";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

let nextId = 1;

// emoji-mart日本語化用i18nデータ
const i18n_ja = {
  search: '検索',
  clear: 'クリア',
  notfound: '絵文字が見つかりません',
  skintext: '肌の色を選択',
  categories: {
    search: '検索結果',
    recent: 'よく使う',
    people: 'スマイル＆人',
    nature: '動物＆自然',
    foods: '食べ物＆飲み物',
    activity: 'アクティビティ',
    places: '旅行＆場所',
    objects: 'オブジェクト',
    symbols: '記号',
    flags: '旗',
    custom: 'カスタム'
  },
  categorieslabel: 'カテゴリ一覧',
  skintones: {
    1: 'デフォルト',
    2: '明るい',
    3: 'やや明るい',
    4: '中間',
    5: 'やや濃い',
    6: '濃い'
  }
};

function SortableCard({ card, visibleMemos, toggleMemo, handleMemoChange, handlePlay, handleDelete, listView, labels = [], toggleCardLabel, setLabelMenuCardId, setModalMemoCardId, darkMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const cardLabels = card.labels || [];
  const [isHovered, setIsHovered] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const titleRef = useRef();
  const artistRef = useRef();
  const [isTitleEllipsis, setIsTitleEllipsis] = useState(false);
  const [isArtistEllipsis, setIsArtistEllipsis] = useState(false);

  // ホバー解除時に全文表示をリセット
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowFullText(false);
  };

  useEffect(() => {
    if (titleRef.current) {
      const el = titleRef.current;
      setIsTitleEllipsis(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    }
    if (artistRef.current) {
      const el = artistRef.current;
      setIsArtistEllipsis(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    }
  }, [card.title, card.artist, showFullText, isHovered]);

  return (
    <div ref={setNodeRef} style={style} className={`music-card-container ${isDragging ? "dragging" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes} {...listeners}
    >
        {listView ? (
          <div className="music-list-row">
            <div className="music-index">{card.index !== undefined ? card.index + 1 : ''}</div>
            <div className="music-drag-handle" {...listeners} style={{ cursor: "grab", width: 18, height: 18, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>≡</div>
            <img className="music-img" src={card.image} alt={card.title} />
            <div className="music-title">{card.title || "（タイトルなし）"}</div>
            <div className="music-labels">
            {cardLabels.map((lid, idx) => {
                const label = labels.find(l => l.id === lid);
                return label ? (
                <span key={lid} style={{ fontSize: '1.5em', background: 'none', padding: 0, minWidth: 0, maxWidth: 'none', flexShrink: 0, marginLeft: idx === 0 ? '8px' : 0, display: 'inline-flex', alignItems: 'center' }}>
                  <span>{label.emoji || '🏷'}</span>
                  <span style={{ color: darkMode ? '#fff' : '#222', fontSize: '0.7em', marginLeft: 2 }}>{label.name}</span>
                  </span>
                ) : null;
              })}
            </div>
            <div className="music-memo">
              <div style={{ position: "relative", display: "inline-block" }}>
              <button className="memo-toggle" onClick={e => { e.stopPropagation(); setModalMemoCardId(card.id); }}>
                <i className="bi bi-chat-dots"></i>
              </button>
                <span className="memo-tooltip">秘密のメモ</span>
              </div>
              {card.memo && <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>{card.memo}</span>}
            </div>
            <div className="music-actions" style={{ pointerEvents: 'auto' }}>
              <button onClick={e => { e.stopPropagation(); handlePlay(card); }}>▶</button>
              <button onClick={e => { e.stopPropagation(); handleDelete(card.id); }}>❌</button>
              <button className="label-toggle" onClick={e => { e.stopPropagation(); setLabelMenuCardId(card.id); }} style={{ fontSize: 16, padding: "2px 10px", borderRadius: 8, cursor: "pointer", zIndex: 21 }}>
              <i className="bi bi-flag"></i>
              </button>
            </div>
          </div>
        ) : (
        <div 
          className={`music-card`} 
          style={{ 
            position: 'relative', 
            background: '#fff',
            cursor: 'grab',
            overflow: 'hidden'
          }} 
          onClick={() => { if (showFullText) setShowFullText(false); }}
        >
          <img
            src={card.image}
            alt={card.title}
            style={{
              display: "block",
              pointerEvents: 'none',
              draggable: false,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          {/* ホバー時のタグ絵文字（左上） */}
          {isHovered && cardLabels.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                zIndex: 20,
                display: 'flex',
                gap: '4px',
                pointerEvents: 'none',
              }}
            >
              {cardLabels.map((lid) => {
                const label = labels.find(l => l.id === lid);
                return label ? (
                  <span
                    key={lid}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid #fff',
                      color: '#222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2em',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      userSelect: 'none',
                    }}
                  >
                    {label.emoji || '🏷'}
                  </span>
                ) : null;
              })}
            </div>
          )}
          {/* ホバー時のオーバーレイ（黒背景＋情報） */}
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              {/* タイトルとアーティスト名 */}
              <div style={{ 
                textAlign: 'center', 
                color: 'white', 
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                lineHeight: '1.3',
                marginTop: 'auto',
                maxWidth: '100%',
                position: 'relative',
                cursor: showFullText ? 'pointer' : 'default',
                display: showFullText ? 'flex' : undefined,
                flexDirection: showFullText ? 'column' : undefined,
                justifyContent: showFullText ? 'center' : undefined,
                alignItems: showFullText ? 'center' : undefined,
                minHeight: showFullText ? '100%' : undefined,
              }}>
                <div
                  ref={titleRef}
                  style={showFullText ? {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-all',
                    maxHeight: 'none',
                    overflow: 'visible',
                    cursor: isTitleEllipsis ? 'pointer' : 'default',
                  } : {
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    wordBreak: 'break-all',
                    maxHeight: '2.8em',
                    position: 'relative',
                    cursor: isTitleEllipsis ? 'pointer' : 'default',
                  }}
                  onClick={e => {
                    if (!showFullText && isTitleEllipsis) setShowFullText(true);
                    }}
                  >
                    {card.title || "（タイトルなし）"}
                  </div>
                {card.artist && (
                  <div
                    ref={artistRef}
                    style={showFullText ? {
                      fontSize: '0.9rem',
                      fontWeight: 'normal',
                      opacity: 0.9,
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-all',
                      maxHeight: 'none',
                      overflow: 'visible',
                      cursor: isArtistEllipsis ? 'pointer' : 'default',
                    } : {
                      fontSize: '0.9rem',
                      fontWeight: 'normal',
                      opacity: 0.9,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'normal',
                      wordBreak: 'break-all',
                      maxHeight: '2.8em',
                      position: 'relative',
                      cursor: isArtistEllipsis ? 'pointer' : 'default',
                    }}
                    onClick={e => {
                      if (!showFullText && isArtistEllipsis) setShowFullText(true);
                    }}
                  >
                    {card.artist}
                  </div>
                )}
              </div>
              {/* ボタン群 */}
              {!showFullText && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {/* 再生ボタン */}
                  <button
                  style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(card);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    ▶
                  </button>
                  {/* 削除ボタン */}
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(card.id);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    ✕
                  </button>
                  {/* メモボタン */}
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalMemoCardId(card.id);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    <i className="bi bi-chat-dots"></i>
                  </button>
                  {/* ラベルボタン */}
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLabelMenuCardId(card.id);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    <i className="bi bi-flag"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableLabel({ label, filterLabelId, setFilterLabelId, handleDeleteLabel, darkMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: label.id,
    data: {
      type: 'label',
      label
    }
  });

  const isSelected = filterLabelId === label.id;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`music-label-btn${isSelected ? " selected" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: (transition || '') + ', box-shadow 0.18s cubic-bezier(.4,2,.6,1)',
        zIndex: isDragging ? 100 : 'auto',
        userSelect: 'none',
        flexShrink: 0,
      }}
      {...attributes}
      {...listeners}
      onClick={() => setFilterLabelId(isSelected ? null : label.id)}
    >
      <span className="tag-emoji">{label.emoji || "🏷"}</span>
      <span>{label.name}</span>
      <span
        style={{
          marginLeft: 8,
          fontWeight: "normal",
          color: isSelected ? (darkMode ? "#222" : "#fff") : (darkMode ? "#fff" : "#333"),
          fontSize: "1.1em",
          cursor: "pointer",
          background: "none",
        }}
        onClick={e => {
          e.stopPropagation();
          handleDeleteLabel(label.id);
        }}
        title="タグを削除"
      >×</span>
    </button>
  );
}

function App() {
  const [cards, setCards] = useState([]);
  const [input, setInput] = useState("");
  const [selectedHtml, setSelectedHtml] = useState(null);
  const [visibleMemos, setVisibleMemos] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [listView, setListView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileText, setProfileText] = useState(localStorage.getItem("my-music-profile") || "これは自分の好きな音楽をまとめるための作品です！");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 20, left: window.innerWidth - 400 });
  const popupRef = useRef();
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const [labels, setLabels] = useState(() => {
    const saved = localStorage.getItem("my-music-labels");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "お気に入り", emoji: "⭐" },
      { id: 2, name: "J-POP", emoji: "🎵" },
      { id: 3, name: "ロック", emoji: "🎸" },
    ];
  });
  const [filterLabelId, setFilterLabelId] = useState(null);
  const [labelEditId, setLabelEditId] = useState(null);
  const [labelEditValue, setLabelEditValue] = useState("");
  const [labelEditEmoji, setLabelEditEmoji] = useState("");
  const [labelMenuCardId, setLabelMenuCardId] = useState(null);
  const [modalMemoCardId, setModalMemoCardId] = useState(null);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [addLabelEmoji, setAddLabelEmoji] = useState('⭐');
  const [addLabelName, setAddLabelName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMaxLabelMsg, setShowMaxLabelMsg] = useState(true);

  // シンプルなDnD設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // カードドラッグ終了ハンドラー
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      setCards((prevCards) => {
        const oldIndex = prevCards.findIndex((card) => card.id === active.id);
        const newIndex = prevCards.findIndex((card) => card.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prevCards, oldIndex, newIndex);
        }
        return prevCards;
      });
    }
  };

  // ラベルドラッグ終了ハンドラー
  const handleLabelDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setLabels((prevLabels) => {
        const oldIndex = prevLabels.findIndex((label) => label.id === active.id);
        const newIndex = prevLabels.findIndex((label) => label.id === over.id);
        // 追加ボタンの右側（labels.length）には移動できないようにする
        if (oldIndex !== -1 && newIndex !== -1 && newIndex < prevLabels.length) {
          return arrayMove(prevLabels, oldIndex, newIndex);
        }
        return prevLabels;
      });
    }
  };

  // ラベルの状態が変更されたときにローカルストレージに保存
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("my-music-labels", JSON.stringify(labels));
    }, 300);
    return () => clearTimeout(timeout);
  }, [labels]);

  useEffect(() => {
    const saved = localStorage.getItem("my-music-gallery");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCards(parsed);
      nextId = parsed.length > 0 ? Math.max(...parsed.map((c) => c.id)) + 1 : 1;
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("my-music-gallery", JSON.stringify(cards));
    }, 300);
    return () => clearTimeout(timeout);
  }, [cards]);

  useEffect(() => {
    localStorage.setItem("my-music-profile", profileText);
  }, [profileText]);

  useEffect(() => {
    if (labels.length < 5) {
      setShowMaxLabelMsg(true);
    }
  }, [labels.length]);

  // Spotify埋め込みiframeからアーティスト名を抽出する関数
  const extractArtistFromIframe = (html) => {
    try {
      const div = document.createElement("div");
      div.innerHTML = html;
      const iframe = div.firstChild;
      
      if (iframe && iframe.tagName === 'IFRAME') {
        // title属性から抽出を試みる
        const title = iframe.getAttribute('title');
        console.log("iframe title:", title);
        if (title && title.includes('Spotify Embed:')) {
          // "Spotify Embed: 曲名" の形式から抽出
          const titleMatch = title.match(/Spotify Embed: (.+)/);
          if (titleMatch) {
            const fullTitle = titleMatch[1];
            console.log("fullTitle:", fullTitle);
            // 曲名とアーティスト名が分かれている場合
            if (fullTitle.includes(' - ')) {
              const parts = fullTitle.split(' - ');
              const artist = parts[1]; // アーティスト名
              console.log("titleからアーティスト名を抽出:", artist);
              return artist;
            }
          }
        }
        
        // src属性からトラックIDを取得
        const src = iframe.getAttribute('src');
        console.log("iframe src:", src);
        if (src) {
          const trackMatch = src.match(/track\/([a-zA-Z0-9]+)/);
          if (trackMatch) {
            const trackId = trackMatch[1];
            console.log("Track ID found:", trackId);
            // トラックIDを保存して後で使用
            return `TRACK_ID:${trackId}`;
          }
        }
      }
    } catch (error) {
      console.error("iframe解析エラー:", error);
    }
    return "";
  };

  // Spotify Web APIを使用してトラック情報を取得する関数
  const getTrackInfoFromWebAPI = async (trackId) => {
    try {
      // Spotify Web APIの公開エンドポイントを使用
      const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': 'Bearer ' // 認証が必要なため、この方法は制限があります
        }
      });
      return response.data.artists[0].name;
    } catch (error) {
      console.error("Spotify Web API エラー:", error);
      return "";
    }
  };

  // 代替方法: 埋め込みURLから直接情報を取得
  const getArtistFromEmbedUrl = async (embedUrl) => {
    try {
      console.log("埋め込みURLにアクセス:", embedUrl);
      // 埋め込みURLにアクセスしてHTMLを取得
      const response = await axios.get(embedUrl);
      const html = response.data;
      console.log("HTML取得完了、サイズ:", html.length);
      
      // __NEXT_DATA__スクリプトタグからJSONデータを抽出
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (nextDataMatch) {
        console.log("__NEXT_DATA__スクリプトタグを発見");
        const jsonData = JSON.parse(nextDataMatch[1]);
        console.log("Next.js data:", jsonData);
        // いろんなパスを試す
        const candidates = [
          jsonData?.props?.pageProps?.state?.data?.entity?.artists,
          jsonData?.props?.pageProps?.state?.data?.entity?.artist,
          jsonData?.props?.pageProps?.state?.data?.entity,
        ];
        for (const c of candidates) {
          if (Array.isArray(c) && c.length > 0 && c[0].name) return c[0].name;
          if (c && c.name) return c.name;
        }
      }
      // Fallback: HTML内の"artist":"アーティスト名"を探す
      const artistTextMatch = html.match(/\"artist\":\"([^\"]+)\"/);
      if (artistTextMatch) {
        return artistTextMatch[1];
      }
      // さらに日本語の「アーティスト」表記も探す
      const jpArtistMatch = html.match(/アーティスト[\s:：]*([\w\u3000-\u9FFF]+)/);
      if (jpArtistMatch) {
        return jpArtistMatch[1];
      }
      return "";
    } catch (error) {
      console.error("Embed URL取得エラー:", error);
      return "";
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log("=== handleAdd開始 ===");
    console.log("入力値:", input);
    console.log("input.includes('open.spotify.com'):", input.includes("open.spotify.com"));

    let newCard = {
      id: nextId++,
      title: input,
      artist: "",
      image: "https://via.placeholder.com/300",
      html: null,
      memo: "",
      labels: [],
    };

    if (input.includes("open.spotify.com")) {
      console.log("Spotifyリンクを検出しました");
      try {
        console.log("oEmbed APIを呼び出し中...");
        const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(input)}`;
        console.log("API URL:", url);
        
        const res = await axios.get(url);
        console.log("oEmbed API呼び出し成功");
        console.log("Spotify oEmbed response:", res.data); // デバッグ用
        
        // titleに「曲名 · アーティスト名」形式が含まれている場合
        let title = res.data.title;
        let artist = "";
        
        console.log("取得したtitle:", title);
        console.log("author_name:", res.data.author_name);
        
        if (title.includes("·")) {
          const parts = title.split("·");
          title = parts[0].trim();
          artist = parts[1].trim();
          console.log("アーティスト名をtitleから取得:", artist);
        } else if (res.data.author_name) {
          artist = res.data.author_name;
          console.log("アーティスト名をauthor_nameから取得:", artist);
        } else {
          console.log("iframe解析を開始");
          // iframeからアーティスト名を抽出を試みる
          artist = extractArtistFromIframe(res.data.html);
          console.log("iframeからアーティスト名を取得:", artist);
          // トラックIDが取得できた場合の処理
          if (artist.startsWith('TRACK_ID:')) {
            const trackId = artist.replace('TRACK_ID:', '');
            console.log("トラックIDを使用してアーティスト名を取得:", trackId);
            // ここでAPI経由でアーティスト名を取得
            try {
              const apiRes = await axios.get(`/api/spotify-artist?trackId=${trackId}`);
              if (apiRes.data && apiRes.data.artist) {
                artist = apiRes.data.artist;
                console.log("APIからアーティスト名取得成功:", artist);
              } else {
                artist = "Unknown Artist";
                console.log("APIからアーティスト名取得失敗、Unknown Artistに設定");
              }
            } catch (apiErr) {
              artist = "Unknown Artist";
              console.error("APIからアーティスト名取得エラー:", apiErr);
            }
          }
        }
        // アーティスト名が取得できない場合はデフォルト値を設定
        if (!artist) {
          artist = "Unknown Artist";
          console.log("アーティスト名が取得できませんでした。デフォルト値を設定:", artist);
        }
        newCard.title = title;
        newCard.artist = artist;
        newCard.image = res.data.thumbnail_url;
        newCard.html = res.data.html;
        console.log("カード情報を設定完了:", newCard);
      } catch (err) {
        console.error("Spotify情報の取得失敗:", err);
        console.error("エラーの詳細:", err.message);
        console.error("エラーのスタック:", err.stack);
        if (err.response) {
          // サーバーからのレスポンスがある場合
          console.error("レスポンスステータス:", err.response.status);
          console.error("レスポンスデータ:", err.response.data);
        } else if (err.request) {
          // リクエストは送信されたがレスポンスがない場合
          console.error("リクエストエラー:", err.request);
        } else {
          // その他のエラー
          console.error("その他のエラー:", err.message);
        }
      }
    } else {
      console.log("Spotifyリンクではありません");
    }

    setCards((prev) => [...prev, newCard]);
    setInput("");

    // --- 追加: アーティスト名がUnknown Artistまたは空の場合は埋め込みURLから再取得 ---
    if (input.includes("open.spotify.com")) {
      setTimeout(async () => {
        const lastCardId = newCard.id;
        const card = { ...newCard };
        if (!card.artist || card.artist === "Unknown Artist") {
          // oEmbedのhtmlからsrcを取得
          let embedUrl = "";
          if (card.html) {
            const div = document.createElement("div");
            div.innerHTML = card.html;
            const iframe = div.firstChild;
            if (iframe && iframe.tagName === 'IFRAME') {
              embedUrl = iframe.getAttribute('src');
            }
          }
          if (embedUrl) {
            const artistName = await getArtistFromEmbedUrl(embedUrl);
            if (artistName && artistName !== "Unknown Artist") {
              setCards(prev => prev.map(c => c.id === lastCardId ? { ...c, artist: artistName } : c));
            }
          }
        }
      }, 100);
    }
  };

  const handlePlay = (card) => {
    const idx = cards.findIndex((c) => c.id === card.id);
    setCurrentIndex(idx);
    setSelectedHtml(card.html);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };
  const handleNext = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const current = currentIndex !== null ? cards[currentIndex] : null;

  const handleDelete = (id) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    setVisibleMemos((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleMemoChange = (id, value) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, memo: value } : card)));
  };

  const toggleMemo = (id) => {
    setVisibleMemos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 全カード削除
  const handleDeleteAllCards = () => {
    setCards([]);
    setVisibleMemos({});
    setCurrentIndex(null);
    setSelectedHtml(null);
  };

  const dockItems = [
    { icon: <VscHome size={18} />, label: "Home", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { icon: <VscAccount size={18} />, label: "Profile", onClick: () => setShowProfile(true) },
    { icon: <VscSettingsGear size={18} />, label: "Settings", onClick: () => setShowSettings(true) },
  ];

  // ポップアップドラッグ開始
  const handlePopupDragStart = (e) => {
    dragging.current = true;
    const rect = popupRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handlePopupDragEnd);
  };

  // ドラッグ中
  const handleDragMove = (e) => {
    if (!dragging.current) return;
    setPopupPosition({
      top: Math.max(0, e.clientY - dragOffset.current.y),
      left: Math.max(0, e.clientX - dragOffset.current.x),
    });
  };
  // ドラッグ終了
  const handlePopupDragEnd = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handlePopupDragEnd);
  };

  // Spotify埋め込みiframeをuseMemoで生成
  const spotifyIframe = useMemo(() => {
    if (!selectedHtml) return null;
    const div = document.createElement("div");
    div.innerHTML = selectedHtml;
    return div.firstChild;
  }, [selectedHtml]);

  // カードへのラベル付与/削除
  const toggleCardLabel = (cardId, labelId) => {
    setCards((prev) => prev.map(card => {
      if (card.id !== cardId) return card;
      const hasLabel = card.labels.includes(labelId);
      // 3つ以上は付与できない
      if (!hasLabel && card.labels.length >= 3) return card;
      return {
        ...card,
        labels: hasLabel
          ? card.labels.filter(lid => lid !== labelId)
          : [...card.labels, labelId]
      };
    }));
  };

  // ラベル追加
  const handleAddLabel = () => {
    setAddLabelEmoji('⭐');
    setAddLabelName('');
    setShowAddLabelModal(true);
    setShowMaxLabelMsg(true);
  };
  const handleAddLabelSubmit = () => {
    if (!addLabelName.trim() || !addLabelEmoji) return;
    if (labels.length >= 5) return; // 5個まで制限
    setLabels(prev => [...prev, { id: Date.now(), name: addLabelName.trim(), emoji: addLabelEmoji }]);
    setShowAddLabelModal(false);
  };
  // ラベル編集
  const handleEditLabel = (id, name) => {
    setLabelEditId(id);
    setLabelEditValue(name);
    setLabelEditEmoji(labels.find(l => l.id === id)?.emoji || "");
  };
  const handleEditLabelSave = (id) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, name: labelEditValue, emoji: labelEditEmoji } : l));
    setLabelEditId(null);
    setLabelEditValue("");
    setLabelEditEmoji("");
  };
  // ラベル削除
  const handleDeleteLabel = (id) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    setCards(prev => prev.map(card => ({ ...card, labels: card.labels.filter(lid => lid !== id) })));
    if (filterLabelId === id) setFilterLabelId(null);
  };

  // ラベルで絞り込み
  const filteredCards = filterLabelId
    ? cards.filter(card => card.labels && card.labels.includes(filterLabelId))
    : cards;

  return (
    <div className={`app ${darkMode ? "dark" : ""}`} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100vw", maxWidth: "100vw", margin: 0, padding: listView ? 0 : 20, boxSizing: "border-box" }}>
      <header className="header">MY MUSIC GALLERY</header>

      {/* フォーム */}
      <form onSubmit={handleAdd} className="form">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Spotifyの共有リンクを貼ってね 🎵" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <button type="submit">追加</button>
          {/* 全カード削除ボタンを曲追加ボタンの右側に配置 */}
          {cards.length > 0 && (
            <button
              type="button"
              className="delete-all-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >全カード削除</button>
          )}
        </div>
      </form>
      {/* 全カード削除確認モーダルをフォーム直後に復活 */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 4000, background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-content" style={{
            minWidth: 320,
            maxWidth: 400,
            textAlign: 'center',
            background: darkMode ? '#000' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            padding: 32,
            border: darkMode ? '1px solid #fff' : 'none',
          }}>
            <h2 style={{ marginBottom: 16, color: darkMode ? '#fff' : '#000' }}>本当に全カードを削除しますか？</h2>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
              <button
                style={{
                  padding: '10px 28px',
                  backgroundColor: 'rgb(255, 68, 68)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onClick={() => {
                  handleDeleteAllCards();
                  setShowDeleteConfirm(false);
                }}
              >削除する</button>
              <button
                style={{
                  padding: '10px 28px',
                  backgroundColor: darkMode ? '#222' : '#eee',
                  color: darkMode ? '#fff' : '#333',
                  border: darkMode ? '1px solid #fff' : 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onClick={() => setShowDeleteConfirm(false)}
              >キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ラベル管理UI */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleLabelDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext items={labels.map(label => label.id)} strategy={horizontalListSortingStrategy}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18, overflowX: 'auto', padding: '0 20px 8px 20px', justifyContent: 'flex-start' }}> {/* タグリストのコンテナ */}
            {labels.map((label, idx) => (
              <SortableLabel
                key={label.id}
                label={label}
                filterLabelId={filterLabelId}
                setFilterLabelId={setFilterLabelId}
                handleDeleteLabel={handleDeleteLabel}
                darkMode={darkMode}
              />
            ))}
            {/* タグ追加ボタン（右端に戻す） */}
            <button 
              onClick={() => {
                if (labels.length >= 5) {
                  setShowMaxLabelMsg(true); // 5個のときは赤文字だけ再表示
                  return;
                }
                setAddLabelEmoji('⭐');
                setAddLabelName('');
                setShowAddLabelModal(true);
                setShowMaxLabelMsg(true);
              }}
              style={{ 
                flexShrink: 0, 
                height: 36, 
                minWidth: 80, 
                borderRadius: 8, 
                border: darkMode ? '1px solid #fff' : '1px solid #222',
                background: darkMode ? '#111' : '#fff',
                color: darkMode ? '#fff' : '#222',
                fontSize: '1em',
                fontWeight: 500,
                marginLeft: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'background 0.15s, color 0.15s, border 0.15s',
                opacity: labels.length >= 5 ? 0.5 : 1
              }}
              onMouseEnter={e => {
                e.target.style.background = darkMode ? '#222' : '#f5f5f5';
              }}
              onMouseLeave={e => {
                e.target.style.background = darkMode ? '#111' : '#fff';
              }}
            >タグ作成</button>
          </div>
        </SortableContext>
      </DndContext>

      <div style={{ flex: 1 }}>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCards.map((card) => card.id)} strategy={rectSortingStrategy}>
            <div className={`card-list ${listView ? "list" : ""}`} style={listView ? { width: "100%", maxWidth: "100%", margin: 0, background: "#eee" } : { padding: 0 }}>
              {filteredCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  visibleMemos={visibleMemos}
                  toggleMemo={toggleMemo}
                  handleMemoChange={handleMemoChange}
                  handlePlay={handlePlay}
                  handleDelete={handleDelete}
                  listView={listView}
                  labels={labels}
                  toggleCardLabel={toggleCardLabel}
                  setLabelMenuCardId={setLabelMenuCardId}
                  setModalMemoCardId={setModalMemoCardId}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {showProfile && (
          <div className="modal-overlay" onClick={() => setShowProfile(false)}>
            <div className="modal-content" style={{ width: "520px" }} onClick={(e) => e.stopPropagation()}>
              <h2>制作者プロフィール</h2>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={6}
                style={{ width: "calc(100% - 40px)", padding: "12px", borderRadius: "8px", fontSize: "0.95rem", resize: "none", overflow: "hidden" }}
              />
              <button onClick={() => setShowProfile(false)}>閉じる</button>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-content" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
              <h2>設定</h2>
              <div className="setting-row">
                <span>リスト表示</span>
                <label className="switch">
                  <input type="checkbox" checked={listView} onChange={() => setListView((prev) => !prev)} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="setting-row">
                <span>ダークモード</span>
                <label className="switch">
                  <input type="checkbox" checked={darkMode} onChange={() => setDarkMode((prev) => !prev)} />
                  <span className="slider"></span>
                </label>
              </div>
              <button onClick={() => setShowSettings(false)}>閉じる</button>
            </div>
          </div>
        )}

        {/* ラベル選択モーダル（モックアップ） */}
        {labelMenuCardId !== null && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.18)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setLabelMenuCardId(null)}>
            <div style={{ background: "#000", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.18)", padding: 24, minWidth: 240, minHeight: 80, zIndex: 4001, border: "1px solid #fff", color: "#fff" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: "bold", marginBottom: 12, color: "#fff" }}>タグを選択</div>
              {labels.length === 0 && <div style={{ padding: 8, fontSize: 12, color: "#aaa" }}>タグがありません</div>}
              {labels.map(label => {
                const card = cards.find(c => c.id === labelMenuCardId);
                const checked = card && card.labels.includes(label.id);
                return (
                  <div key={label.id} style={{ padding: "6px 12px", fontSize: 15, cursor: "pointer", background: checked ? "#333" : "#111", borderRadius: 6, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #333" }}>
                    <span onClick={() => { toggleCardLabel(labelMenuCardId, label.id); }} style={{ flex: 1, color: "#fff" }}>
                      {checked ? "✓ " : ""}<span style={{ fontSize: '1.2em', marginRight: '8px' }}>{label.emoji || "🏷"}</span>{label.name}
                    </span>
                    <span style={{ fontSize: 16, color: "#aaa", cursor: "pointer", marginLeft: 8 }} onClick={() => handleDeleteLabel(label.id)}>×</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%', marginTop: 8, justifyContent: 'center' }}>
                <button
                  style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: "1px solid #fff", background: "#000", cursor: labels.length >= 5 ? 'not-allowed' : 'pointer', color: '#fff', opacity: labels.length >= 5 ? 0.5 : 1 }}
                  onClick={() => {
                    if (labels.length >= 5) return; // 5個のときは何もしない
                    setAddLabelEmoji('⭐');
                    setAddLabelName('');
                    setShowAddLabelModal(true);
                    setLabelMenuCardId(null);
                  }}
                  disabled={labels.length >= 5}
                >タグ作成</button>
                <button style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: "1px solid #fff", background: "#000", cursor: "pointer", color: "#fff" }} onClick={() => setLabelMenuCardId(null)}>閉じる</button>
              </div>
              {labels.length >= 5 && (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12, color: '#ff8888', fontWeight: 500, fontSize: '1em', whiteSpace: 'nowrap', gap: 8 }}>
                  作成できるタグは5個までです。
                </span>
              )}
            </div>
          </div>
        )}

        {modalMemoCardId !== null && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.18)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalMemoCardId(null)}>
            <div style={{ background: "#000", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.18)", padding: 24, minWidth: 320, minHeight: 80, zIndex: 4001, border: "1px solid #fff", color: "#fff" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: "bold", marginBottom: 12, color: "#fff" }}>メモを編集</div>
              <input type="text" className="memo-input" placeholder="メモを書く..." value={cards.find(c => c.id === modalMemoCardId)?.memo || ""} onChange={e => handleMemoChange(modalMemoCardId, e.target.value)} style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 12 }} />
              <button style={{ padding: "4px 18px", borderRadius: 8, border: "1px solid #fff", background: "#000", cursor: "pointer", color: "#fff" }} onClick={() => setModalMemoCardId(null)}>閉じる</button>
            </div>
          </div>
        )}

        {/* ラベル追加モーダル */}
        {showAddLabelModal && (
          <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={() => setShowAddLabelModal(false)}>
            <div className="modal-content" style={{ 
              minWidth: 320, 
              maxWidth: 360, 
              zIndex: 4001,
              background: darkMode ? "#000" : "#fff",
              border: darkMode ? "1px solid #fff" : "none",
              color: darkMode ? "#fff" : "#000"
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: "bold", marginBottom: 12, color: darkMode ? "#fff" : "#000" }}>タグを追加</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Picker
                  onSelect={emoji => setAddLabelEmoji(emoji.native)}
                  title="絵文字を選択"
                  emoji="point_up"
                  showPreview={false}
                  showSkinTones={false}
                  i18n={i18n_ja}
                  theme={darkMode ? "dark" : "light"}
                />
                {/* 選択中の絵文字を強調表示 */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, width: '80%' }}>
                  <div style={{
                    fontSize: '1.7em',
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    minHeight: 40,
                    maxWidth: 40,
                    maxHeight: 40,
                    border: darkMode ? '1.5px solid #fff' : '1.5px solid #ccc',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: darkMode ? '#111' : '#fff',
                    margin: 0,
                    padding: 0
                  }}>
                    {addLabelEmoji}
                  </div>
                  <input
                    type="text"
                    placeholder="タグ名"
                    value={addLabelName}
                    onChange={e => setAddLabelName(e.target.value)}
                    style={{ 
                      flex: 1, 
                      fontSize: '1.1em', 
                      padding: 8, 
                      borderRadius: 8, 
                      border: darkMode ? '1px solid #fff' : '1px solid #ccc',
                      background: darkMode ? '#111' : '#fff',
                      color: darkMode ? '#fff' : '#000'
                    }}
                    maxLength={16}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, width: '80%', marginTop: 8 }}>
                  <button
                    style={{ 
                      flex: 1, 
                      padding: '6px 24px', 
                      borderRadius: 8, 
                      border: darkMode ? '1px solid #fff' : '1.5px solid #ccc', 
                      background: darkMode ? '#000' : '#fafafa', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '1em', 
                      color: darkMode ? '#fff' : '#444' 
                    }}
                    onClick={handleAddLabelSubmit}
                    disabled={!addLabelName.trim() || !addLabelEmoji}
                  >追加</button>
                  <button
                    style={{ 
                      flex: 1, 
                      padding: '6px 24px', 
                      borderRadius: 8, 
                      border: darkMode ? '1px solid #fff' : '1.5px solid #ccc', 
                      background: darkMode ? '#000' : '#fafafa', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '1em', 
                      color: darkMode ? '#fff' : '#444' 
                    }}
                    onClick={() => setShowAddLabelModal(false)}
                  >閉じる</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右上に埋め込みiframeを表示 */}
      {selectedHtml && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 3000,
            background: darkMode ? "#222" : "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            padding: 8,
            cursor: dragging.current ? "grabbing" : "default",
            minWidth: 320,
            maxWidth: 420,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 18,
              cursor: "grab",
              marginBottom: 6,
              background: "#eee",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#888",
              userSelect: "none",
            }}
            onMouseDown={handlePopupDragStart}
          >
            移動
          </div>

          {/* 削除ボタンを追加 */}
          <button
            className="popup-close-button"
            onClick={() => {
              setCurrentIndex(null);
              setSelectedHtml(null);
            }}
          >
            ×
          </button>

          {/* iframeを直接append */}
          <div ref={el => {
            if (el && spotifyIframe && !el.firstChild) {
              el.appendChild(spotifyIframe);
            }
          }} />
        </div>
      )}

      <div style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
        <Dock items={dockItems} panelHeight={68} baseItemSize={50} magnification={60} />
      </div>
    </div>
  );
}

export default App;
