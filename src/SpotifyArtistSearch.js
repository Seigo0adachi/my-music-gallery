import { useState } from 'react';

function SpotifyArtistSearch() {
  const [trackId, setTrackId] = useState('');
  const [artist, setArtist] = useState('');
  const [error, setError] = useState('');

  const fetchArtist = async () => {
    setError('');
    setArtist('');
    try {
      const res = await fetch(`http://localhost:5001/api/spotify-artist?trackId=${trackId}`);
      const data = await res.json();
      if (data.artist) {
        setArtist(data.artist);
      } else {
        setError(data.error || 'アーティスト名が取得できませんでした');
      }
    } catch (e) {
      setError('通信エラー');
    }
  };

  return (
    <div>
      <input
        value={trackId}
        onChange={e => setTrackId(e.target.value)}
        placeholder="SpotifyのtrackIdを入力"
      />
      <button onClick={fetchArtist}>アーティスト名取得</button>
      {artist && <div>アーティスト名: {artist}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

export default SpotifyArtistSearch;