import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./App.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.css";
import Dock from "./Dock";
import Auth from "./components/Auth";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { saveUserData, loadUserData, saveToLocalStorage, loadFromLocalStorage } from "./services/firebaseService";
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

function SortableCard({ card, visibleMemos, toggleMemo, handleMemoChange, handlePlay, handleDelete, listView, labels = [], toggleCardLabel, setLabelMenuCardId, setModalMemoCardId, setFilterLabelId, setShowAlbumCardId, showAlbumCardId, darkMode, is1020, is770Strict, is769, is700, setCenterModalCardId }) {
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
  const [hoveredListBtn, setHoveredListBtn] = useState(null);

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

  const titleColor = darkMode ? '#ccc' : '#222';

  // 700px以下のリスト表示時はカード全体クリックで中央モーダル表示
  const handleCardClick = () => {
    if (listView && !is700 && setCenterModalCardId) {
      setCenterModalCardId(card.id);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`music-card-container ${isDragging ? "dragging" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes} {...listeners}
      onClick={handleCardClick}
    >
        {listView ? (
          <div className="music-list-row">
            <div className="music-index">{card.index !== undefined ? card.index + 1 : ''}</div>
            <div className="music-drag-handle" {...listeners} style={{ cursor: "grab", width: 18, height: 18, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>≡</div>
            <img className="music-img" src={card.image} alt={card.title} />
            <div className="music-title-col">
              {/* 1020px以下のときは必ず題名の上にアーティスト名（＋700px以下ならアルバム名）を表示 */}
              {is1020 && (
                <span className="music-artist-album-row music-artist-album-row-responsive" style={{width: '100%'}}>
                  <span className="music-artist-small" style={{fontSize: '0.98em', lineHeight: '1.2', verticalAlign: 'baseline', fontWeight: 'normal', fontStyle: 'normal'}}>
                    {card.artist}{is770Strict && card.album ? '：' : ''}
                  </span>
                  {is770Strict && card.album && (
                    <span className="music-album-inline-top" style={{marginLeft: 0, marginTop: '-5px', fontSize: '0.98em', color: titleColor, fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.2', verticalAlign: 'baseline', display: 'inline'}}>{card.album.length > 18 ? card.album.slice(0, 18) + '…' : card.album}</span>
                  )}
                </span>
              )}
              <div 
                className="music-title"
                ref={titleRef}
                style={{ cursor: 'default', color: titleColor }}
                title={card.title && ((is769 ? card.title.length > 23 : card.title.length > 18) ? card.title : '')}
              >
                {/* 769px以上は23文字、未満は18文字で省略 */}
                {card.title
                  ? is769
                    ? (card.title.length > 23 ? card.title.slice(0, 23) + '…' : card.title)
                    : (card.title.length > 18 ? card.title.slice(0, 18) + '…' : card.title)
                  : "（タイトルなし）"}
                {card.labels && card.labels.length > 0 && (
                  <span className="music-title-labels">
                    {card.labels.map((lid) => {
                const label = labels.find(l => l.id === lid);
                return label ? (
                        <span 
                          key={lid}
                          style={{ 
                            fontSize: '1.2em', 
                            marginLeft: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterLabelId(lid);
                          }}
                          title={`${label.name}でフィルタ`}
                        >
                          {label.emoji || '🏷'}
                  </span>
                ) : null;
              })}
                  </span>
                )}
            </div>
              </div>
            <div className="music-artist-col">
              {/* 1020px超のときだけアーティスト名を本来の位置に表示 */}
              {!is1020 && <div className="music-artist">{card.artist}</div>}
            </div>
            <div className="music-album-col"><div className="music-album">{card.album}</div></div>
            <div className="music-labels">
            {card.labels && card.labels.map((lid, idx) => {
                const label = labels.find(l => l.id === lid);
                return label ? (
                <span 
                  key={lid} 
                  style={{ 
                    fontSize: '1.5em', 
                    background: 'none', 
                    padding: 0, 
                    minWidth: 0, 
                    maxWidth: 'none', 
                    flexShrink: 0, 
                    marginLeft: idx === 0 ? '8px' : 0, 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterLabelId(lid);
                  }}
                  title={`${label.name}でフィルタ`}
                >
                  <span>{label.emoji || '🏷'}</span>
                  <span className="label-name-text" style={{ color: darkMode ? '#fff' : '#222', fontSize: '0.7em', marginLeft: 2 }}>{label.name}</span>
                  </span>
                ) : null;
              })}
            </div>
            {/* ボタン群を1つのmusic-actions内にまとめる */}
            <div className="music-actions" style={{ pointerEvents: 'auto' }}>
              <button onClick={e => { e.stopPropagation(); handlePlay(card); }}>▶</button>
              <button onClick={e => { e.stopPropagation(); handleDelete(card.id); }}>
                <i className="fa-sharp-duotone fa-solid fa-xmark"></i>
              </button>
              <button className="label-toggle" onClick={e => { e.stopPropagation(); setLabelMenuCardId(card.id); }} style={{ fontSize: 16, padding: "2px 10px", borderRadius: 8, cursor: "pointer", zIndex: 21 }}>
                <i className="bi bi-flag"></i>
              </button>
              <button className="memo-toggle" onClick={e => { e.stopPropagation(); setModalMemoCardId(card.id); }}>
                <i className="bi bi-chat-dots"></i>
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
                      background: 'transparent',
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
                      e.target.style.background = 'transparent';
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
                      background: 'transparent',
                      border: '2px solid white',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={e => { e.stopPropagation(); handleDelete(card.id); }}
                    onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
                  >✕</button>
                  {/* メモボタン */}
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'transparent',
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
                      e.target.style.background = 'transparent';
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
                      background: 'transparent',
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
                      e.target.style.background = 'transparent';
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
  const [labels, setLabels] = useState(() => {
    const saved = localStorage.getItem("my-music-labels");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "お気に入り", emoji: "⭐" },
      { id: 2, name: "J-POP", emoji: "🎵" },
      { id: 3, name: "ロック", emoji: "🎸" },
    ];
  });
  const popupRef = useRef();
  const [filterLabelId, setFilterLabelId] = useState(null);
  const [labelEditId, setLabelEditId] = useState(null);
  const [labelEditValue, setLabelEditValue] = useState("");
  const [labelEditEmoji, setLabelEditEmoji] = useState("");
  const [labelMenuCardId, setLabelMenuCardId] = useState(null);
  const [modalMemoCardId, setModalMemoCardId] = useState(null);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [addLabelEmoji, setAddLabelEmoji] = useState('⭐');
  const [addLabelName, setAddLabelName] = useState('');
  const [labelNameError, setLabelNameError] = useState('');
  const [enterPressCount, setEnterPressCount] = useState(0);
  const enterTimeoutRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMaxLabelMsg, setShowMaxLabelMsg] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);
  const [showAlbumCardId, setShowAlbumCardId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is1020, setIs1020] = useState(window.innerWidth <= 1020);
  const [is770Strict, setIs770Strict] = useState(window.innerWidth <= 770);
  const [is769, setIs769] = useState(window.innerWidth >= 769);
  const [is700, setIs700] = useState(window.innerWidth > 700);
  const [is700Strict, setIs700Strict] = useState(window.innerWidth <= 700);
  const [showAllLabelMenu, setShowAllLabelMenu] = useState(false);
  const [centerModalCardId, setCenterModalCardId] = useState(null);
  const [centerModalHoveredBtn, setCenterModalHoveredBtn] = useState(null);
  const [is965, setIs965] = useState(window.innerWidth <= 965);
  const [nickname, setNickname] = useState(localStorage.getItem("my-music-nickname") || "");
  const [profileIcon, setProfileIcon] = useState(localStorage.getItem("my-music-profile-icon") || "");
  const fileInputRef = useRef();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Firebase認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // ユーザーがログインした場合、Firestoreからデータを読み込み
        console.log('ユーザーログイン:', user.email);
        try {
          const userData = await loadUserData(user.uid);
          if (userData) {
            setCards(userData.cards || []);
            setLabels(userData.labels || [
              { id: 1, name: "お気に入り", emoji: "⭐" },
              { id: 2, name: "J-POP", emoji: "🎵" },
              { id: 3, name: "ロック", emoji: "🎸" },
            ]);
            setListView(userData.listView || false);
            setDarkMode(userData.darkMode !== undefined ? userData.darkMode : true);
            setProfileText(userData.profileText || "これは自分の好きな音楽をまとめるための作品です！");
            setVisibleMemos(userData.visibleMemos || {});
            setNickname(userData.nickname || "");
            setProfileIcon(userData.profileIcon || "");
            nextId = userData.cards && userData.cards.length > 0 ? Math.max(...userData.cards.map((c) => c.id)) + 1 : 1;
          }
        } catch (error) {
          console.error('ユーザーデータ読み込みエラー:', error);
          // エラー時はローカルストレージから読み込み
          const savedCards = loadFromLocalStorage("my-music-gallery");
          const savedLabels = loadFromLocalStorage("my-music-labels");
          if (savedCards) setCards(savedCards);
          if (savedLabels) setLabels(savedLabels);
        }
      } else {
        // ユーザーがログアウトした場合、データをクリア
        console.log('ユーザーログアウト');
        setCards([]);
        setLabels([
          { id: 1, name: "お気に入り", emoji: "⭐" },
          { id: 2, name: "J-POP", emoji: "🎵" },
          { id: 3, name: "ロック", emoji: "🎸" },
        ]);
        setListView(false);
        setDarkMode(true);
        setProfileText("これは自分の好きな音楽をまとめるための作品です！");
        setVisibleMemos({});
        setNickname("");
        setProfileIcon("");
        setCurrentIndex(null);
        setSelectedHtml(null);
        nextId = 1;
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 画面幅によるレスポンシブ判定
  useEffect(() => {
    const handleResize = () => {
      setIs1020(window.innerWidth <= 1020);
      setIs770Strict(window.innerWidth <= 770);
      setIs769(window.innerWidth >= 769);
      setIs700(window.innerWidth > 700);
      setIs965(window.innerWidth <= 965);
      setIs700Strict(window.innerWidth <= 700); // ←追加
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowAccountMenu(false);
      // ログアウト時にデータをクリア（認証状態監視で自動的に処理される）
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

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

  // ユーザーデータをFirestoreに保存する関数
  const saveUserDataToFirestore = async (data) => {
    if (!user) return;
    
    try {
      const userData = {
        cards: data.cards || cards,
        labels: data.labels || labels,
        visibleMemos: data.visibleMemos || visibleMemos,
        listView: data.listView !== undefined ? data.listView : listView,
        darkMode: data.darkMode !== undefined ? data.darkMode : darkMode,
        profileText: data.profileText || profileText,
        nickname: data.nickname || nickname,
        profileIcon: data.profileIcon || profileIcon,
        lastUpdated: new Date().toISOString()
      };
      
      await saveUserData(user.uid, userData);
      console.log('ユーザーデータをFirestoreに保存しました');
    } catch (error) {
      console.error('Firestore保存エラー:', error);
      // エラー時はローカルストレージにフォールバック
      saveToLocalStorage("my-music-gallery", cards);
      saveToLocalStorage("my-music-labels", labels);
      saveToLocalStorage("my-music-profile", profileText);
    }
  };

  // カードデータが変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ cards });
    }, 500);
    return () => clearTimeout(timeout);
  }, [cards, user]);

  // ラベルデータが変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ labels });
    }, 500);
    return () => clearTimeout(timeout);
  }, [labels, user]);

  // プロフィールテキストが変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ profileText });
    }, 500);
    return () => clearTimeout(timeout);
  }, [profileText, user]);

  // ニックネームが変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ nickname });
      localStorage.setItem("my-music-nickname", nickname);
    }, 500);
    return () => clearTimeout(timeout);
  }, [nickname, user]);

  // プロフィールアイコンが変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ profileIcon });
      localStorage.setItem("my-music-profile-icon", profileIcon);
    }, 500);
    return () => clearTimeout(timeout);
  }, [profileIcon, user]);

  // ファイル選択からプロフィール画像を設定
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }
      
      // 画像ファイルのみ許可
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileIcon(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // パスワード確認でメールアドレス表示
  const handleShowEmail = () => {
    if (showFullEmail) {
      setShowFullEmail(false);
      return;
    }
    setShowPasswordPrompt(true);
  };

  // パスワード確認処理
  const handlePasswordConfirm = async () => {
    if (!passwordInput.trim()) {
      alert('パスワードを入力してください');
      return;
    }

    try {
      // Firebase認証でパスワードを確認
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, user.email, passwordInput);
      
      // 認証成功
      setShowFullEmail(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } catch (error) {
      alert('パスワードが正しくありません');
      setPasswordInput('');
    }
  };

  // 設定が変更されたときにFirestoreに保存
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      saveUserDataToFirestore({ listView, darkMode });
    }, 500);
    return () => clearTimeout(timeout);
  }, [listView, darkMode, user]);

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
      // 入力URLからトラックIDだけを抽出し、正規化
      const match = input.match(/open\.spotify\.com\/(?:intl-[^/]+\/)?track\/([a-zA-Z0-9]+)/);
      const trackId = match ? match[1] : null;
      const normalizedUrl = trackId ? `https://open.spotify.com/track/${trackId}` : input;
      console.log("正規化後のSpotify URL:", normalizedUrl);
      try {
        console.log("oEmbed APIを呼び出し中...");
        const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(normalizedUrl)}`;
        console.log("API URL:", url);
        
        const res = await axios.get(url);
        console.log("oEmbed API呼び出し成功");
        console.log("Spotify oEmbed response:", res.data); // デバッグ用
        
        // titleに「曲名 · アーティスト名」形式が含まれている場合
        let title = res.data.title;
        let artist = "";
        let album = "";
        
        // タイトルがURLそのものの場合は「（タイトルなし）」に
        if (!title || title === input) {
          title = "（タイトルなし）";
        }
        
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
        }
        // --- ここでAPIからalbumも取得 ---
        album = "";
        if (trackId) {
          try {
            const apiRes = await axios.get(`/api/spotify-artist?trackId=${trackId}`);
            if (apiRes.data && apiRes.data.artist) {
              artist = apiRes.data.artist;
              album = apiRes.data.album || "";
              console.log("APIからアーティスト名・アルバム名取得成功:", artist, album);
            }
          } catch (apiErr) {
            console.error("APIからアーティスト名取得エラー:", apiErr);
          }
        }
        // アーティスト名が取得できない場合はデフォルト値を設定
        if (!artist) {
          artist = "Unknown Artist";
          console.log("アーティスト名が取得できませんでした。デフォルト値を設定:", artist);
        }
        newCard.title = title;
        newCard.artist = artist;
        newCard.album = album;
        newCard.image = res.data.thumbnail_url;
        newCard.html = res.data.html;
        console.log("カード情報を設定完了:", newCard);
      } catch (err) {
        console.error("Spotify情報の取得失敗:", err);
        // --- oEmbed失敗時でもtrackIdがあればAPIで取得を試みる ---
        let artist = "Unknown Artist";
        let album = "";
        if (trackId) {
          try {
            const apiRes = await axios.get(`/api/spotify-artist?trackId=${trackId}`);
            if (apiRes.data && apiRes.data.artist) {
              artist = apiRes.data.artist;
              album = apiRes.data.album || "";
              console.log("APIからアーティスト名・アルバム名取得成功(oEmbed失敗時):", artist, album);
            }
          } catch (apiErr) {
            console.error("APIからアーティスト名取得エラー(oEmbed失敗時):", apiErr);
          }
        }
        newCard.title = "（タイトルなし）";
        newCard.artist = artist;
        newCard.album = album;
        newCard.image = "https://via.placeholder.com/300";
        newCard.html = null;
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

  // ドラッグ中
  const handleDragMove = (e) => {
    // ドラッグ移動を無効化
  };
  // ドラッグ終了
  const handlePopupDragEnd = () => {
    // ドラッグ終了時の処理
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
    setLabelNameError('');
    setEnterPressCount(0);
    setShowAddLabelModal(true);
    setShowMaxLabelMsg(true);
  };
  const handleAddLabelSubmit = () => {
    if (!addLabelName.trim() || !addLabelEmoji) return;
    if (labels.length >= 5) return; // 5個まで制限
    setLabels(prev => [...prev, { id: Date.now(), name: addLabelName.trim(), emoji: addLabelEmoji }]);
    setShowAddLabelModal(false);
    setLabelNameError('');
    setEnterPressCount(0);
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }
  };
  
  // タグ名入力制御
  const handleLabelNameChange = (e) => {
    const value = e.target.value;
    if (value.length > 6) {
      setLabelNameError('文字数の上限は6文字までです。');
      return;
    }
    setLabelNameError('');
    setAddLabelName(value);
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

  // ローディング中は何も表示しない
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: darkMode ? "#000" : "#fff",
        color: darkMode ? "#fff" : "#000"
      }}>
        読み込み中...
      </div>
    );
  }

  // ユーザーが未認証の場合はログイン画面を表示
  if (!user) {
    return <Auth onAuthStateChange={(user) => setUser(user)} />;
  }

  return (
    <div className={`app ${darkMode ? "dark" : ""}`} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100vw", maxWidth: "100vw", margin: 0, padding: listView ? 0 : 20, boxSizing: "border-box" }}>
      {/* アカウントメニュー */}
      {!loading && user && (
        <div style={{ position: "fixed", top: 6, right: 6, zIndex: 2000 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: profileIcon ? "transparent" : (darkMode ? "#333" : "#fff"),
                border: darkMode ? "1px solid #fff" : "1px solid #222",
                color: darkMode ? "#fff" : "#222",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: 0
              }}
            >
              {profileIcon ? (
                <img 
                  src={profileIcon} 
                  alt="Profile" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%"
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
              ) : null}
              <span style={{ display: profileIcon ? "none" : "block" }}>
                {nickname ? nickname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </button>
            
            {showAccountMenu && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  right: 0,
                  background: darkMode ? "#000" : "#fff",
                  border: darkMode ? "1px solid #fff" : "1px solid #222",
                  borderRadius: 8,
                  padding: 16,
                  minWidth: 200,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 2001,
                }}
              >
                {/* アカウントアイコン表示 */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: profileIcon ? "transparent" : (darkMode ? "#333" : "#f5f5f5"),
                      border: darkMode ? "2px solid #fff" : "2px solid #222",
                      color: darkMode ? "#fff" : "#222",
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: 0
                    }}
                  >
                    {profileIcon ? (
                      <img 
                        src={profileIcon} 
                        alt="Profile" 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%"
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                    ) : null}
                    <span style={{ display: profileIcon ? "none" : "block" }}>
                      {nickname ? nickname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.9rem", color: darkMode ? "#ccc" : "#666", marginBottom: 4 }}>
                    ニックネーム
                  </div>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="ニックネームを入力"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: darkMode ? "1px solid #666" : "1px solid #ccc",
                      background: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#222",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.9rem", color: darkMode ? "#ccc" : "#666", marginBottom: 4 }}>
                    プロフィール画像
                  </div>
                  
                  {/* ファイル選択ボタン */}
                  <div style={{ marginBottom: 8 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: darkMode ? "1px solid #666" : "1px solid #ccc",
                        background: darkMode ? "#444" : "#f5f5f5",
                        color: darkMode ? "#fff" : "#222",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        width: "100%"
                      }}
                    >
                      📁 ファイルを選択
                    </button>
                  </div>
                  
                  {/* URL入力（オプション） */}
                  <div style={{ fontSize: "0.8rem", color: darkMode ? "#aaa" : "#888", marginBottom: 4 }}>
                    または画像URLを入力:
                  </div>
                  <input
                    type="text"
                    value={profileIcon.startsWith('data:') ? '' : profileIcon}
                    onChange={(e) => setProfileIcon(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: darkMode ? "1px solid #666" : "1px solid #ccc",
                      background: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#222",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.9rem", color: darkMode ? "#ccc" : "#666", marginBottom: 4 }}>
                    メールアドレス
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.95rem", color: darkMode ? "#fff" : "#222" }}>
                      {showFullEmail ? user.email : `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}`}
                    </span>
                    <button
                      onClick={handleShowEmail}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      👁
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="delete-all-btn logout-btn"
                  style={{
                    width: "100%",
                    height: "2.2rem",
                    lineHeight: "2.2rem",
                    fontSize: "1rem",
                    borderRadius: "9999px",
                    minWidth: "75px",
                    padding: "0 18px",
                    borderWidth: "1.7px",
                    borderStyle: "solid",
                    borderColor: darkMode ? "#fff" : "#222",
                    cursor: "pointer",
                    background: darkMode ? "#111" : "#fff",
                    color: darkMode ? "#fff" : "#222",
                    fontWeight: "900",
                    letterSpacing: "0.02em",
                    transition: "background-color 0.2s, color 0.2s, border 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                    fontFamily: "'Mochiy Pop P One', sans-serif",
                  }}
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* パスワード確認モーダル */}
      {showPasswordPrompt && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2500 }}
          onClick={() => {
            setShowPasswordPrompt(false);
            setPasswordInput('');
          }}
        >
          <div 
            className="modal-content" 
            style={{ 
              background: darkMode ? "#000" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: darkMode ? "1px solid #fff" : "1px solid #222",
              minWidth: 300
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>パスワードを入力してください</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="パスワード"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: darkMode ? "1px solid #666" : "1px solid #ccc",
                background: darkMode ? "#333" : "#fff",
                color: darkMode ? "#fff" : "#222",
                fontSize: "1rem",
                marginBottom: 16,
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordConfirm();
                }
              }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handlePasswordConfirm}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: darkMode ? "1px solid #fff" : "1px solid #222",
                  background: darkMode ? "#000" : "#fff",
                  color: darkMode ? "#fff" : "#222",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                確認
              </button>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordInput('');
                }}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: darkMode ? "1px solid #fff" : "1px solid #222",
                  background: darkMode ? "#000" : "#fff",
                  color: darkMode ? "#fff" : "#222",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* レスポンシブ：965px以下は縦並び、超は横並び */}
      {is965 ? (
        <>
          <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="header" style={{ margin: 0, flexShrink: 0, paddingRight: 0, marginBottom: 0 }}>MY MUSIC GALLERY</div>
          </div>
          <hr className="main-header-hr" />
          <div className="main-header" style={{ display: 'flex', flexDirection: window.innerWidth <= 700 ? 'column' : 'row', alignItems: window.innerWidth <= 700 ? 'flex-start' : 'center', gap: 5, marginBottom: 3, padding: 0 }}>
            {/* タイトルはここでは表示しない */}
            <form onSubmit={handleAdd} className="form" style={{ marginBottom: 0, justifyContent: 'flex-start', gap: 0, width: '100%', flexDirection: window.innerWidth <= 700 ? 'column' : 'row', alignItems: 'flex-start' }}>
              <div className="search-container" style={{ marginLeft: 0 }}>
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Spotifyの共有リンクを貼ってね 🎵" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              {window.innerWidth <= 700 ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: -7, width: '100%' }}>
                  <button type="submit">追加</button>
                  {cards.length > 0 && (
                    <button
                      type="button"
                      className="delete-all-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >全カード削除</button>
                  )}
                  <button 
                    onClick={() => setShowAllLabelMenu(true)}
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
                      marginLeft: 3,
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.15s, color 0.15s, border 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = darkMode ? '#222' : '#f5f5f5';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = darkMode ? '#111' : '#fff';
                    }}
                  >タグ一覧</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <button type="submit">追加</button>
                  {cards.length > 0 && (
                    <button
                      type="button"
                      className="delete-all-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >全カード削除</button>
                  )}
                </div>
              )}
            </form>
          </div>
          {/* 950px以下700px以上の時にタグリストを表示 */}
          {window.innerWidth > 700 && (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleLabelDragEnd}
              modifiers={[restrictToHorizontalAxis]}
            >
              <SortableContext items={labels.map(label => label.id)} strategy={horizontalListSortingStrategy}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0, overflowX: 'auto', padding: '0px 20px 8px 4px', justifyContent: 'flex-start' }}>
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
                  <button 
                    className="tag-create-btn"
                    onClick={() => {
                      if (labels.length >= 5) {
                        setShowMaxLabelMsg(true);
                        return;
                      }
                      setAddLabelEmoji('⭐');
                      setAddLabelName('');
                      setLabelNameError('');
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
                      fontSize: '1em',
                      marginLeft: 3,
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
          )}
        </>
      ) : (
        <>
          {/* ヘッダーとフォームを横並びに配置（従来） */}
          <div style={{ display: 'flex', flexDirection: window.innerWidth <= 700 ? 'column' : 'row', alignItems: window.innerWidth <= 700 ? 'flex-start' : 'center', gap: 5, marginBottom: 3, padding: 0 }}>
            <div className="header" style={{ margin: 0, flexShrink: 0, paddingRight: 0, marginBottom: 0 }}>MY MUSIC GALLERY</div>
            <form onSubmit={handleAdd} className="form" style={{ marginBottom: 0, justifyContent: 'flex-start', gap: 0, width: '100%', flexDirection: window.innerWidth <= 700 ? 'column' : 'row', alignItems: 'flex-start', marginTop: '2px' }}>
              <div className="search-container" style={{ marginLeft: 0 }}>
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Spotifyの共有リンクを貼ってね 🎵" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              {window.innerWidth <= 700 ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: -7, width: '100%' }}>
                  <button type="submit">追加</button>
                  {cards.length > 0 && (
                    <button
                      type="button"
                      className="delete-all-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >全カード削除</button>
                  )}
                  <button 
                    onClick={() => setShowAllLabelMenu(true)}
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
                      marginLeft: 3,
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.15s, color 0.15s, border 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = darkMode ? '#222' : '#f5f5f5';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = darkMode ? '#111' : '#fff';
                    }}
                  >タグ一覧</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <button type="submit">追加</button>
                  {cards.length > 0 && (
                    <button
                      type="button"
                      className="delete-all-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >全カード削除</button>
                  )}
                </div>
              )}
            </form>
          </div>
          <hr className="main-header-hr" />
          {/* タグ管理UI（独立した行） */}
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleLabelDragEnd}
            modifiers={[restrictToHorizontalAxis]}
          >
            <SortableContext items={labels.map(label => label.id)} strategy={horizontalListSortingStrategy}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0, overflowX: 'auto', padding: '0px 20px 8px 4px', justifyContent: 'flex-start' }}> {/* タグリストのコンテナ */}
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
                {!is965 && (
                  <button 
                    className="tag-create-btn"
                    onClick={() => {
                      if (labels.length >= 5) {
                        setShowMaxLabelMsg(true);
                        return;
                      }
                      setAddLabelEmoji('⭐');
                      setAddLabelName('');
                      setLabelNameError('');
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
                      fontSize: '1em',
                      marginLeft: 3,
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
                )}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

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

      {/* 中央モーダルカード表示（700px以下＆リスト表示時クリックで表示） */}
      {centerModalCardId !== null && (
        <div className="modal-overlay" style={{ zIndex: 5000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCenterModalCardId(null)}>
          <div style={{ background: darkMode ? '#222' : '#fafafa', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.25)', padding: '22px 26px', minWidth: 144, maxWidth: 192, width: '48vw', position: 'relative', color: darkMode ? '#fff' : '#222', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: darkMode ? '#fff' : '#222', fontSize: 28, cursor: 'pointer', zIndex: 10 }} onClick={() => setCenterModalCardId(null)}>×</button>
            {(() => {
              const card = cards.find(c => c.id === centerModalCardId);
              if (!card) return null;
              const btnBaseStyle = { width: 38, height: 38, borderRadius: '50%', border: darkMode ? '2px solid #fff' : '2px solid #222', background: 'transparent', color: darkMode ? '#fff' : '#222', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' };
              const btnHoverStyle = { background: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)' };
              return (
                <>
                  {/* アルバム名 */}
                  <div style={{ fontSize: '1em', opacity: 0.85, marginBottom: 8, color: darkMode ? '#fff' : '#222', textAlign: 'center', fontWeight: 500 }}>{card.album}</div>
                  {/* アルバム画像 */}
                  <img src={card.image} alt={card.title} style={{ width: 144, height: 144, objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} />
                  {/* 曲名 */}
                  <div style={{ fontWeight: 'bold', fontSize: '1.15em', marginBottom: 8, textAlign: 'center' }}>{card.title || '（タイトルなし）'}</div>
                  {/* アーティスト名 */}
                  <div style={{ fontSize: '1em', opacity: 0.85, marginBottom: 14, color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>{card.artist}</div>
                  {/* ボタン群 */}
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8 }}>
                    <button
                      style={centerModalHoveredBtn === 'play' ? { ...btnBaseStyle, ...btnHoverStyle } : btnBaseStyle}
                      onMouseEnter={() => setCenterModalHoveredBtn('play')}
                      onMouseLeave={() => setCenterModalHoveredBtn(null)}
                      onClick={() => { setCenterModalCardId(null); handlePlay(card); }}
                    >▶</button>
                    <button
                      style={centerModalHoveredBtn === 'delete' ? { ...btnBaseStyle, ...btnHoverStyle } : btnBaseStyle}
                      onMouseEnter={() => setCenterModalHoveredBtn('delete')}
                      onMouseLeave={() => setCenterModalHoveredBtn(null)}
                      onClick={() => { setCenterModalCardId(null); handleDelete(card.id); }}
                    >✕</button>
                    <button
                      style={centerModalHoveredBtn === 'memo' ? { ...btnBaseStyle, ...btnHoverStyle } : btnBaseStyle}
                      onMouseEnter={() => setCenterModalHoveredBtn('memo')}
                      onMouseLeave={() => setCenterModalHoveredBtn(null)}
                      onClick={() => { setCenterModalCardId(null); setModalMemoCardId(card.id); }}
                    ><i className="bi bi-chat-dots"></i></button>
                    <button
                      style={centerModalHoveredBtn === 'flag' ? { ...btnBaseStyle, ...btnHoverStyle } : btnBaseStyle}
                      onMouseEnter={() => setCenterModalHoveredBtn('flag')}
                      onMouseLeave={() => setCenterModalHoveredBtn(null)}
                      onClick={() => { setCenterModalCardId(null); setLabelMenuCardId(card.id); }}
                    ><i className="bi bi-flag"></i></button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCards.map((card) => card.id)} strategy={rectSortingStrategy}>
            <div className={`card-list ${listView ? "list" : ""}`} style={listView ? { width: "100%", maxWidth: "100%", margin: 0, background: "#eee" } : { padding: 0 }}>
              {listView ? (
                filteredCards.map((card, idx) => (
                  <React.Fragment key={card.id}>
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
                      setFilterLabelId={setFilterLabelId}
                      setShowAlbumCardId={setShowAlbumCardId}
                      showAlbumCardId={showAlbumCardId}
                      darkMode={darkMode}
                      is1020={is1020}
                      is770Strict={is770Strict}
                      is769={is769}
                      is700={is700}
                      setCenterModalCardId={setCenterModalCardId}
                    />
                  </React.Fragment>
                ))
              ) : (
                filteredCards.map((card) => (
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
                    setFilterLabelId={setFilterLabelId}
                    setShowAlbumCardId={setShowAlbumCardId}
                    showAlbumCardId={showAlbumCardId}
                    darkMode={darkMode}
                    is1020={is1020}
                    is770Strict={is770Strict}
                    is769={is769}
                    is700={is700}
                    setCenterModalCardId={setCenterModalCardId}
                  />
                ))
              )}
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
            <div style={{ background: darkMode ? "#000" : "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.18)", padding: 24, minWidth: 240, minHeight: 80, zIndex: 4001, border: darkMode ? "1px solid #fff" : "1px solid #222", color: darkMode ? "#fff" : "#222" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: "bold", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>タグを選択</div>
              {labels.length === 0 && <div style={{ padding: 8, fontSize: 12, color: darkMode ? "#aaa" : "#666" }}>タグがありません</div>}
              {labels.map(label => {
                const card = cards.find(c => c.id === labelMenuCardId);
                const checked = card && card.labels.includes(label.id);
                return (
                  <div key={label.id} style={{ padding: "6px 12px", fontSize: 15, cursor: "pointer", background: checked ? (darkMode ? "#333" : "#e0e0e0") : (darkMode ? "#111" : "#f5f5f5"), borderRadius: 6, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between", border: darkMode ? "1px solid #333" : "1px solid #ccc" }}>
                    <span onClick={() => { toggleCardLabel(labelMenuCardId, label.id); }} style={{ flex: 1, color: darkMode ? "#fff" : "#222" }}>
                      {checked ? "✓ " : ""}<span style={{ fontSize: '1.2em', marginRight: '8px' }}>{label.emoji || "🏷"}</span>{label.name}
                    </span>
                    <span style={{ fontSize: 16, color: darkMode ? "#aaa" : "#666", cursor: "pointer", marginLeft: 8 }} onClick={() => handleDeleteLabel(label.id)}>×</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%', marginTop: 8, justifyContent: 'center' }}>
                <button
                  style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: darkMode ? "1px solid #fff" : "1px solid #222", background: darkMode ? "#000" : "#fff", cursor: labels.length >= 5 ? 'not-allowed' : 'pointer', color: darkMode ? '#fff' : '#222', opacity: labels.length >= 5 ? 0.5 : 1 }}
                  onClick={() => {
                    if (labels.length >= 5) return; // 5個のときは何もしない
                    setAddLabelEmoji('⭐');
                    setAddLabelName('');
                    setLabelNameError('');
                    setShowAddLabelModal(true);
                    setLabelMenuCardId(null);
                  }}
                  disabled={labels.length >= 5}
                >タグ作成</button>
                <button style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: darkMode ? "1px solid #fff" : "1px solid #222", background: darkMode ? "#000" : "#fff", cursor: "pointer", color: darkMode ? "#fff" : "#222" }} onClick={() => setLabelMenuCardId(null)}>閉じる</button>
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
            <div style={{ background: darkMode ? "#000" : "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.18)", padding: 24, minWidth: 320, minHeight: 80, zIndex: 4001, border: darkMode ? "1px solid #fff" : "1px solid #222", color: darkMode ? "#fff" : "#222" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: "bold", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>メモを編集</div>
              <input type="text" className="memo-input" placeholder="メモを書く..." value={cards.find(c => c.id === modalMemoCardId)?.memo || ""} onChange={e => handleMemoChange(modalMemoCardId, e.target.value)} style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, background: darkMode ? "#111" : "#fff", color: darkMode ? "#fff" : "#222", border: darkMode ? "1px solid #333" : "1px solid #ccc", borderRadius: 8, padding: 12 }} />
              <button style={{ padding: "4px 18px", borderRadius: 8, border: darkMode ? "1px solid #fff" : "1px solid #222", background: darkMode ? "#000" : "#fff", cursor: "pointer", color: darkMode ? "#fff" : "#222" }} onClick={() => setModalMemoCardId(null)}>閉じる</button>
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
                    onChange={handleLabelNameChange}
                    onDoubleClick={handleAddLabelSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEnterPressCount(prev => prev + 1);
                        
                        // 既存のタイムアウトをクリア
                        if (enterTimeoutRef.current) {
                          clearTimeout(enterTimeoutRef.current);
                        }
                        
                        // 2回目のEnterの場合はタグを追加
                        if (enterPressCount === 1) {
                          handleAddLabelSubmit();
                          setEnterPressCount(0);
                        } else {
                          // 1回目のEnterの場合は500ms後にカウントをリセット
                          enterTimeoutRef.current = setTimeout(() => {
                            setEnterPressCount(0);
                          }, 500);
                        }
                      }
                    }}
                    style={{ 
                      flex: 1, 
                      fontSize: '1.1em', 
                      padding: 8,
                      borderRadius: 8, 
                      border: labelNameError ? (darkMode ? '1px solid #ff6666' : '1px solid #ff4444') : (darkMode ? '1px solid #fff' : '1px solid #ccc'),
                      background: darkMode ? '#111' : '#fff',
                      color: darkMode ? '#fff' : '#000'
                    }}
                    maxLength={6}
                  />
                </div>
                {labelNameError && (
                  <div style={{ color: '#ff4444', fontSize: '0.9em', marginTop: 0, width: '80%', textAlign: 'left' }}>
                    {labelNameError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, width: '80%', marginTop: labelNameError ? 0 : 8 }}>
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
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3000,
            background: "transparent",
            borderRadius: 12,
            boxShadow: "none",
            padding: 0,
            minWidth: 320,
            maxWidth: 420,
          }}
        >
          {/* 削除ボタンを追加 */}
          <button
            className="popup-close-button"
            style={{ position: 'absolute', top: -4, right: -4 }}
            onClick={() => {
              setCurrentIndex(null);
              setSelectedHtml(null);
            }}
          >
            ×
          </button>

          {/* iframeを直接append */}
          <div
            ref={el => {
            if (el && spotifyIframe && !el.firstChild) {
              el.appendChild(spotifyIframe);
            }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <div style={{ position: "sticky", bottom: 0, zIndex: 1000 }}>
        <Dock items={dockItems} panelHeight={68} baseItemSize={50} magnification={60} />
      </div>

      {/* タグ一覧モーダル（1020px以下用） */}
      {showAllLabelMenu && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.18)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAllLabelMenu(false)}>
          <div style={{ background: darkMode ? "#000" : "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.18)", padding: 24, minWidth: 240, minHeight: 80, zIndex: 4001, border: darkMode ? "1px solid #fff" : "1px solid #222", color: darkMode ? "#fff" : "#222" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: "bold", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>タグを選択</div>
            {labels.length === 0 && <div style={{ padding: 8, fontSize: 12, color: darkMode ? "#aaa" : "#666" }}>タグがありません</div>}
            {labels.map(label => (
              <div key={label.id} style={{ padding: "6px 12px", fontSize: 15, cursor: "pointer", background: darkMode ? "#111" : "#f5f5f5", borderRadius: 6, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between", border: darkMode ? "1px solid #333" : "1px solid #ccc" }}>
                <span onClick={() => { setFilterLabelId(filterLabelId === label.id ? null : label.id); }} style={{ flex: 1, color: darkMode ? "#fff" : "#222" }}>
                  {filterLabelId === label.id ? "✓ " : ""}<span style={{ fontSize: '1.2em', marginRight: '8px' }}>{label.emoji || "🏷"}</span>{label.name}
                </span>
                <span style={{ fontSize: 16, color: darkMode ? "#aaa" : "#666", cursor: "pointer", marginLeft: 8 }} onClick={() => handleDeleteLabel(label.id)}>×</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%', marginTop: 8, justifyContent: 'center' }}>
              <button
                style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: darkMode ? "1px solid #fff" : "1px solid #222", background: darkMode ? "#000" : "#fff", cursor: labels.length >= 5 ? 'not-allowed' : 'pointer', color: darkMode ? '#fff' : '#222', opacity: labels.length >= 5 ? 0.5 : 1 }}
                onClick={() => {
                  if (labels.length >= 5) return; // 5個のときは何もしない
                  setAddLabelEmoji('⭐');
                  setAddLabelName('');
                  setLabelNameError('');
                  setShowAddLabelModal(true);
                  setShowAllLabelMenu(false);
                }}
                disabled={labels.length >= 5}
              >タグ作成</button>
              <button style={{ flex: 1, marginTop: 0, marginBottom: 0, padding: "4px 18px", borderRadius: 8, border: darkMode ? "1px solid #fff" : "1px solid #222", background: darkMode ? "#000" : "#fff", cursor: "pointer", color: darkMode ? "#fff" : "#222" }} onClick={() => setShowAllLabelMenu(false)}>閉じる</button>
            </div>
            {labels.length >= 5 && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12, color: '#ff8888', fontWeight: 500, fontSize: '1em', whiteSpace: 'nowrap', gap: 8 }}>
                作成できるタグは5個までです。
              </span>
            )}
          </div>
        </div>
      )}

      {cards.length === 0 && labels.length === 0 && (
        <div style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 500,
          color: darkMode ? '#fff' : '#222', 
          fontSize: window.innerWidth > 900 ? '1.8em' : '1.5em', 
          fontWeight: 900,
          fontFamily: "'Mochiy Pop P One', sans-serif",
          letterSpacing: '0.02em',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center',
          maxWidth: window.innerWidth > 900 ? 'none' : '80vw'
        }}>
          <div style={{ whiteSpace: window.innerWidth > 900 ? 'nowrap' : 'normal' }}>まずは楽曲の共有リンクをコピーして貼り付けて楽曲を追加してみよう🎶</div>
          <div style={{ 
            width: '400px', 
            height: '300px', 
            background: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
                <rect width="400" height="300" fill="#1a1a1a" rx="8"/>
                
                <!-- アルバムカバー -->
                <rect x="20" y="20" width="120" height="120" fill="#c44536" rx="8"/>
                <text x="80" y="95" text-anchor="middle" fill="white" font-size="24" font-family="Arial" font-weight="bold">SONG</text>
                
                <!-- メインメニューエリア -->
                <rect x="160" y="20" width="220" height="260" fill="#2a2a2a" rx="8"/>
                
                <!-- 左側メニュー項目 -->
                <g transform="translate(180, 50)">
                  <text x="0" y="0" fill="white" font-size="6" font-family="Arial">+</text>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">プレイリストに追加</text>
                </g>
                
                <g transform="translate(180, 75)">
                  <text x="0" y="0" fill="white" font-size="8" font-family="Arial">▶</text>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">再生</text>
                </g>
                
                <g transform="translate(180, 100)">
                  <circle cx="4" cy="-2" r="3" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">ソングラジオに移動</text>
                </g>
                
                <g transform="translate(180, 125)">
                  <circle cx="4" cy="-2" r="2" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">アーティストに移動</text>
                </g>
                
                <g transform="translate(180, 150)">
                  <circle cx="4" cy="-2" r="3" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">アルバムに移動</text>
                </g>
                
                <g transform="translate(180, 175)">
                  <rect x="0" y="-4" width="8" height="6" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="0" fill="white" font-size="10" font-family="Arial">楽曲クレジットを表示</text>
                </g>
                
                <!-- シェア項目（選択状態の明るい背景） -->
                <rect x="175" y="195" width="90" height="20" fill="#555555" rx="4"/>
                <g transform="translate(180, 210)">
                  <rect x="0" y="-8" width="6" height="6" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="-2" fill="white" font-size="10" font-family="Arial" font-weight="bold">シェア</text>
                </g>
                
                <!-- 右側：曲のリンクをコピー（選択状態の明るい背景） -->
                <rect x="275" y="195" width="100" height="20" fill="#666666" rx="4"/>
                <g transform="translate(280, 210)">
                  <rect x="0" y="-8" width="8" height="6" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="-2" fill="white" font-size="9" font-family="Arial" font-weight="bold">曲のリンクをコピー</text>
                </g>
                
                <!-- クリック促進エフェクト：点滅する境界線 -->
                <rect x="274" y="194" width="102" height="22" fill="none" stroke="#00ff88" stroke-width="2" rx="4" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-width" values="2;3;2" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                
                <!-- クリック促進エフェクト：パルス効果 -->
                <circle cx="325" cy="205" r="8" fill="none" stroke="#00ff88" stroke-width="2" opacity="0.6">
                  <animate attributeName="r" values="5;15;5" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                <!-- トラックの埋め込み（曲のリンクをコピーの真下） -->
                <rect x="275" y="220" width="100" height="20" fill="#666666" rx="4"/>
                <g transform="translate(280, 235)">
                  <rect x="0" y="-8" width="8" height="6" fill="none" stroke="white" stroke-width="0.5"/>
                  <text x="15" y="-2" fill="white" font-size="9" font-family="Arial" font-weight="bold">トラックの埋め込み</text>
                </g>
                

              </svg>
            `)}")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }} />
        </div>
      )}
    </div>
  );
}

export default App;
