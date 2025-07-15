import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ユーザーの音楽ギャラリーデータを保存
export const saveUserData = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// ユーザーの音楽ギャラリーデータを取得
export const loadUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      // 新規ユーザーの場合はデフォルトデータを返す
      return {
        cards: [],
        labels: [],
        visibleMemos: {},
        listView: false,
        darkMode: false
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

// リアルタイムでデータを監視（オプション）
export const subscribeToUserData = (userId, callback) => {
  // この機能は後で実装可能
  // onSnapshot(doc(db, 'users', userId), callback);
};

// ユーザーの設定を更新
export const updateUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...settings,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return false;
  }
};

// ユーザーデータを削除（アカウント削除時）
export const deleteUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    return false;
  }
};

// オフライン時のフォールバック用ローカルストレージ
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}; 