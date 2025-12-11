import React, { useState } from 'react';
import { Image as ImageIcon, Check, Star, PawPrint, Film, Coffee, Building, Mountain, WandSparkles } from 'lucide-react';
import { wallpapers, wallpaperCategories, accentColors } from '../config/theme';

interface ThemeProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  accentColor: string;
  onSetAccentColor: (color: string) => void;
  wallpaper: string;
  onSetWallpaper: (wallpaperId: string) => void;
}

const categoryIcons = {
  'Specials': WandSparkles,
  'Exclusive': Star,
  'Animal': PawPrint,
  'Anime': Film,
  'Cafe': Coffee,
  'City': Building,
  'Nature': Mountain,
};

const Theme: React.FC<ThemeProps> = ({ isDarkMode, onToggleDarkMode, accentColor, onSetAccentColor, wallpaper, onSetWallpaper }) => {
  const [activeCategory, setActiveCategory] = useState(wallpaperCategories[0]);
  const [customAccentColor, setCustomAccentColor] = useState(accentColor);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomAccentColor(newColor);
    onSetAccentColor(newColor);
  }

  const filteredWallpapers = wallpapers.filter(wp => wp.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-slate-900/80 text-white backdrop-blur-lg">
       <div className="p-4 border-b border-white/10 flex-shrink-0">
            <h2 className="text-xl font-bold">Background Themes</h2>
            <div className="flex gap-2 mt-3 border-b border-white/10 pb-3 text-sm">
                <button className="px-3 py-1.5 bg-white/10 rounded-lg">Static Themes</button>
                <button className="px-3 py-1.5 text-white/50">Live Themes</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-3 mb-6">
              {wallpaperCategories.map(cat => {
                  const Icon = categoryIcons[cat as keyof typeof categoryIcons] || ImageIcon;
                  return (
                      <button 
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat ? 'bg-[var(--accent-color)]' : 'bg-white/10 hover:bg-white/20'}`}
                      >
                          <Icon size={16} />
                          <span>{cat}</span>
                      </button>
                  )
              })}
          </div>

          <h3 className="text-lg font-semibold mb-3">{activeCategory}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredWallpapers.map(wp => (
              <button
                key={wp.id}
                onClick={() => onSetWallpaper(wp.id)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors relative group ${wallpaper === wp.id ? 'border-[var(--accent-color)]' : 'border-transparent hover:border-gray-400'}`}
              >
                <img src={isDarkMode ? wp.darkUrl : wp.lightUrl} alt={wp.id} className="w-full h-full object-cover" />
                {wallpaper === wp.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Check size={32} className="text-white"/>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-bold mb-4">Accent Color</h3>
             <div className="flex flex-wrap gap-4 items-center">
                {accentColors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => {
                        onSetAccentColor(color.hex);
                        setCustomAccentColor(color.hex);
                    }}
                    className="w-8 h-8 rounded-full transition-transform transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: color.hex }}
                  >
                    {accentColor === color.hex && <Check size={16} className="text-white" />}
                  </button>
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={customAccentColor}
                    onChange={handleCustomColorChange}
                    className="w-10 h-10 p-0 border-none rounded-full cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-white/20"
                    title="Custom Color"
                  />
                </div>
              </div>
          </div>
        </div>
    </div>
  );
};

export default Theme;
