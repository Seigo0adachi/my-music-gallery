const express = require('express');
const axios = require('axios');
const app = express();

require('dotenv').config();

// Spotify Developer Dashboardで取得した認証情報を.envから読み込む
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// テスト用のルートエンドポイント
app.get('/', (req, res) => {
  res.json({ message: 'Spotify Proxy API is running!', status: 'OK' });
});

// Spotifyのアクセストークンを取得する関数
async function getAccessToken() {
  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      }
    }
  );
  return res.data.access_token;
}

// トラックIDからアーティスト名を取得するAPI
app.get('/api/spotify-artist', async (req, res) => {
  const { trackId } = req.query;
  if (!trackId) return res.status(400).json({ error: 'trackId required' });

  try {
    console.log('Getting access token...');
    const token = await getAccessToken();
    console.log('Access token received:', token ? 'Success' : 'Failed');
    
    console.log('Fetching track info for:', trackId);
    const trackRes = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const artistName = trackRes.data.artists[0].name;
    res.json({ artist: artistName });
  } catch (err) {
    console.error('Error details:', err.response?.data || err.message);
    res.status(500).json({ 
      error: err.message,
      details: err.response?.data || 'No additional details'
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Spotify proxy running on port ${PORT}`));
