import React, { useState, useRef, useEffect } from 'react';
import { Music as MusicIcon, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, AlertCircle } from 'lucide-react';

// Using a reliable Lofi track from Pixabay
const MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/05/27/audio_18182442cd.mp3';

const Music: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    setError(null);

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsPlaying(false);
      setError("Playback failed. Source may be unavailable.");
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
        if (audio.duration > 0) {
            setProgress((audio.currentTime / audio.duration) * 100);
        }
    };
    
    const onPlay = () => {
      setIsPlaying(true);
      setError(null);
      progressIntervalRef.current = window.setInterval(updateProgress, 500);
    };
    
    const onPause = () => {
      setIsPlaying(false);
      if(progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
    
    const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        if (audio) audio.currentTime = 0;
        if(progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }

    const onError = (e: Event) => {
        console.error("Audio resource loading error", e);
        setIsPlaying(false);
        setError("Unable to load audio stream.");
    }
    
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.volume = isMuted ? 0 : volume;
    
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause',onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  }, [volume, isMuted]);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if(audioRef.current) audioRef.current.volume = newVolume;
    if(newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if(!audioRef.current) return;
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    audioRef.current.muted = newMuteState;
    audioRef.current.volume = newMuteState ? 0 : volume;
  }
  
  const handleSkip = () => {
      if(!audioRef.current) return;
      audioRef.current.currentTime = 0;
      setProgress(0);
      if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Replay failed:", e));
      }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current) return;
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const percent = Math.max(0, Math.min(1, x / width));
      const time = percent * audioRef.current.duration;
      
      if (isFinite(time)) {
        audioRef.current.currentTime = time;
        setProgress(percent * 100);
      }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative">
        <audio ref={audioRef} src={MUSIC_URL} preload="auto" />
        
        {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-2 animate-fade-in z-10">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        <div className="w-40 h-40 bg-slate-800 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden group">
            <MusicIcon size={64} className={`text-slate-600 group-hover:scale-110 transition-transform duration-500 ${isPlaying ? 'animate-pulse' : ''}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        <div>
            <h3 className="text-xl font-bold">Lofi Study Beats</h3>
            <p className="text-slate-400 text-sm">Focus Flow Radio</p>
        </div>

        <div className="w-full max-w-xs cursor-pointer group" onClick={handleSeek}>
          <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden relative">
              <div className="h-full bg-white transition-all duration-100 ease-linear" style={{width: `${progress}%`}}></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity"></div>
          </div>
        </div>

        <div className="flex items-center gap-6">
            <button onClick={handleSkip} className="text-slate-300 hover:text-white"><SkipBack size={24} /></button>
            <button 
                onClick={togglePlay} 
                className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={handleSkip} className="text-slate-300 hover:text-white"><SkipForward size={24} /></button>
        </div>
        
        <div className="w-full max-w-xs flex items-center gap-3 text-slate-400">
            <button onClick={toggleMute}>{isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>
    </div>
  );
};

export default Music;