import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';

const Auth = ({ onAuthStateChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        // パスワード確認
        if (password !== confirmPassword) {
          setError('パスワードが一致しません');
          return;
        }
        if (password.length < 6) {
          setError('パスワードは6文字以上で入力してください');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (onAuthStateChange) {
          onAuthStateChange(userCredential.user);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (onAuthStateChange) {
          onAuthStateChange(userCredential.user);
        }
      }
    } catch (error) {
      console.error('認証エラー:', error.code, error.message);
      setError(error.code || error.message);
    }
  };



  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        border: '1px solid #fff',
        borderRadius: '12px',
        backgroundColor: '#000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ 
          color: '#fff', 
          marginBottom: '24px',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </h2>
      
      {error && (
        <div style={{ 
          color: '#ff4444', 
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid #ff4444',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {error.includes('auth/email-already-in-use') 
            ? 'このメールアドレスは既に登録されています。別のメールアドレスを使用するか、ログインしてください。'
            : error.includes('auth/user-not-found') || error.includes('auth/wrong-password') || error.includes('auth/invalid-credential')
            ? 'メールアドレスまたはパスワードが正しくありません。'
            : error.includes('auth/weak-password')
            ? 'パスワードが弱すぎます。6文字以上で入力してください。'
            : error.includes('auth/invalid-email')
            ? '有効なメールアドレスを入力してください。'
            : error.includes('auth/too-many-requests')
            ? 'ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください。'
            : error.includes('auth/network-request-failed')
            ? 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
            : error.includes('auth/operation-not-allowed')
            ? 'この認証方法は現在無効になっています。'
            : error
          }
        </div>
      )}
      
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #fff',
              borderRadius: '8px',
              boxSizing: 'border-box',
              backgroundColor: '#000',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#fff'}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #fff',
              borderRadius: '8px',
              boxSizing: 'border-box',
              backgroundColor: '#000',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#fff'}
            required
          />
        </div>
        
        {isSignUp && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              パスワード確認
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #fff',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#fff'}
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.color = '#fff';
            e.target.style.borderColor = '#007bff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#fff';
            e.target.style.borderColor = '#fff';
          }}
        >
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </button>
      </form>
      
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setPassword('');
          setConfirmPassword('');
          setError('');
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: 'transparent',
          color: '#fff',
          border: '1px solid #fff',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.target.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#fff';
        }}
      >
        {isSignUp ? '既存アカウントでログイン' : '新規アカウント作成'}
      </button>
      </div>
    </div>
  );
};

export default Auth; 