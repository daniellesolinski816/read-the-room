import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Users, Plus, LogIn, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/brand/Logo';

export default function Multiplayer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setDisplayName(u.full_name || '');
    }).catch(() => {});
  }, []);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const scenarios = await base44.entities.Scenario.list();
      const shuffled = scenarios.sort(() => Math.random() - 0.5).slice(0, 5);
      
      const room = await base44.entities.MultiplayerRoom.create({
        room_code: generateRoomCode(),
        host_id: user?.email || 'guest',
        players: [{
          user_id: user?.email || 'guest-' + Date.now(),
          display_name: displayName,
          is_ready: false
        }],
        status: 'waiting',
        scenario_ids: shuffled.map(s => s.id),
        current_scenario_index: 0
      });

      navigate(createPageUrl('Room') + `?roomId=${room.id}`);
    } catch (err) {
      setError('Failed to create room');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const rooms = await base44.entities.MultiplayerRoom.filter({ room_code: roomCode.toUpperCase() });
      
      if (rooms.length === 0) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      const room = rooms[0];
      if (room.status !== 'waiting') {
        setError('Game already in progress');
        setLoading(false);
        return;
      }

      if (room.players.length >= 6) {
        setError('Room is full');
        setLoading(false);
        return;
      }

      const newPlayer = {
        user_id: user?.email || 'guest-' + Date.now(),
        display_name: displayName,
        is_ready: false
      };

      await base44.entities.MultiplayerRoom.update(room.id, {
        players: [...room.players, newPlayer]
      });

      navigate(createPageUrl('Room') + `?roomId=${room.id}&playerId=${newPlayer.user_id}`);
    } catch (err) {
      setError('Failed to join room');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-full bg-[#C9943A]/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#C9943A]" />
          </div>
          <h1 className="font-serif text-3xl text-[#E8E4DA] mb-2">The Table</h1>
          <p className="text-[#C5C1B8]">Practice empathy together with 2-6 players</p>
        </motion.div>

        {!mode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Duel mode */}
            <div className="bg-[#252542] rounded-2xl p-5 border border-[#C9943A]/30 mb-2">
              <div className="flex items-center gap-3 mb-3">
                <Swords className="w-5 h-5 text-[#C9943A]" />
                <div>
                  <p className="text-[#E8E4DA] font-serif font-semibold">Empathy Duel <span className="text-xs text-[#C9943A] ml-1">NEW</span></p>
                  <p className="text-xs text-[#6B6B8D]">1v1 · swap roles · peer feedback</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setMode('duel-create')}
                  className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium text-sm h-10"
                >
                  <Plus className="w-4 h-4 mr-1" /> Host Duel
                </Button>
                <Button
                  onClick={() => setMode('duel-join')}
                  variant="outline"
                  className="border-[#C9943A] text-[#C9943A] hover:bg-[#C9943A]/10 font-medium text-sm h-10"
                >
                  <LogIn className="w-4 h-4 mr-1" /> Join Duel
                </Button>
              </div>
            </div>

            <p className="text-xs text-[#6B6B8D] text-center">— or play with a group —</p>

            <Button
              onClick={() => setMode('create')}
              variant="outline"
              className="w-full h-12 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-base font-serif"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Group Room
            </Button>
            <Button
              onClick={() => setMode('join')}
              variant="ghost"
              className="w-full h-12 text-[#6B6B8D] hover:text-[#C5C1B8] text-base font-serif"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Join Group Room
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              onClick={() => { setMode(null); setError(''); }}
              className="text-[#C5C1B8] hover:text-[#E8E4DA] -ml-2"
            >
              ← Back
            </Button>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#C5C1B8] mb-2 block">Your Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-12 bg-[#252542] border-[#2F2F4A] text-[#E8E4DA] placeholder:text-[#6B6B8D]"
                />
              </div>

              {mode === 'join' && (
                <div>
                  <label className="text-sm text-[#C5C1B8] mb-2 block">Room Code</label>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="h-12 bg-[#252542] border-[#2F2F4A] text-[#E8E4DA] placeholder:text-[#6B6B8D] uppercase tracking-widest text-center text-xl font-mono"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
                disabled={loading}
                className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium"
              >
                {loading ? 'Please wait...' : mode === 'create' ? 'Create Room' : 'Join Room'}
              </Button>
            </div>
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-[#6B6B8D]">
            All players respond to the same scenario, then vote on which response shows the most empathy before AI reveals the scores.
          </p>
        </div>
      </main>
    </div>
  );
}