import { useEffect, useState } from 'react';
import './Profile.css';

const SUPABASE_URL = 'https://cvigdtwvkcsmwglfugqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aWdkdHd2a2NzbXdnbGZ1Z3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MTU3ODUsImV4cCI6MjA2MTk5MTc4NX0.JI6-Ui2fI2kzjRB9yIsWgUN_xTe0oyOQ3vwMtq4wHv8';

const Profile = () => {
  const [userData, setUserData] = useState<any>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (!token) return;

    fetchFromSupabase(token).then((data) => {
      setUserData(data.user);
      setTopTracks(data.topTracks);
      setTopArtists(data.topArtists);
      setIsLoading(false);
    });
  }, []);

  const fetchFromSupabase = async (token: string) => {
    try {
      // Get Spotify user profile to extract spotify_id
      const profileRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      // Step 1: Get user ID from Supabase using spotify_id
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,display_name,email,country&spotify_id=eq.${profile.id}`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const userData = await userRes.json();
      if (!userData.length) throw new Error('User not found in DB');
      const user = userData[0];

      // Step 2: Get top tracks
      const tracksRes = await fetch(`${SUPABASE_URL}/rest/v1/top_tracks?user_id=eq.${user.id}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const tracks = await tracksRes.json();

      // Step 3: Get top artists
      const artistsRes = await fetch(`${SUPABASE_URL}/rest/v1/top_artists?user_id=eq.${user.id}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const artists = await artistsRes.json();

      return { user, topTracks: tracks, topArtists: artists };
    } catch (err) {
      console.error('Error fetching from Supabase:', err);
      return { user: { display_name: 'Unknown' }, topTracks: [], topArtists: [] };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-xl">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mb-4" />
        <p>Loading your Spotify stats...</p>
      </div>
    );
  }
  return (
    <div className="profile-container">
    <h1 className="profile-header">Welcome, {userData.display_name}</h1>
    <div className="profile-info">
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Country:</strong> {userData.country}</p>
    </div>

    <h2 className="section-title">Top Tracks</h2>
    {topTracks.length > 0 ? (
      <div className="grid">
        {topTracks.map((track: any) => (
          <div key={track.track_id} className="card">
            <img src={track.image_url} alt={track.name} />
            <div className="card-content">
              <p className="title">{track.name}</p>
              <p className="subtitle">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    ) : <p>No tracks found.</p>}

    <h2 className="section-title">Top Artists</h2>
    {topArtists.length > 0 ? (
      <div className="grid">
        {topArtists.map((artist: any) => (
          <div key={artist.artist_id} className="card">
            <img src={artist.image_url} alt={artist.name} />
            <div className="card-content">
              <p className="title">{artist.name}</p>
              <p className="subtitle">Popularity: {artist.popularity}</p>
            </div>
          </div>
        ))}
      </div>
    ) : <p>No artists found.</p>}
  </div>
  );
  
};

export default Profile;
