import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import MenuBar from './components/MenuBar';
import Dock from './components/Dock';
import Window from './components/Window';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import FocusTimer from './components/FocusTimer';
import TimeTracker from './components/TimeTracker';
import Journal from './components/Journal';
import StudyRoom from './components/StudyRoom';
import ChatBot from './components/ChatBot';
import Settings from './components/Settings';
import Theme from './components/Theme';
import ConfirmationModal from './components/ConfirmationModal';
import Calculator from './components/Calculator';
import Notes from './components/Notes';
import Weather from './components/Weather';
import Clock from './components/Clock';
import Calendar from './components/Calendar';
import Goals from './components/Goals';
import Music from './components/Music';
import { AppModule, Project, Task, TimeEntry, JournalEntry, ActiveTimer, WindowConfig, Note, Event, Goal } from './types';
import { usePersistentState } from './hooks/usePersistentState';
import { wallpapers, accentColors } from './config/theme';

const getDefaultWindowSize = (appId: AppModule) => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const MENUBAR_HEIGHT = 28;
  const DOCK_HEIGHT = 64;
  const availableHeight = screenHeight - MENUBAR_HEIGHT - DOCK_HEIGHT;
  const availableWidth = screenWidth;
  
  const paddingX = 100;
  const paddingY = 120;

  switch (appId) {
    case AppModule.CHAT:
      return {
        width: Math.min(450, availableWidth - 40),
        height: Math.min(700, availableHeight - 40),
      };
    case AppModule.CALCULATOR:
      return {
        width: 340,
        height: 500,
      };
    case AppModule.NOTES:
       return {
        width: Math.min(700, availableWidth - paddingX),
        height: Math.min(550, availableHeight - paddingY),
      };
    case AppModule.WEATHER:
      return {
        width: Math.min(400, availableWidth - 40),
        height: Math.min(650, availableHeight - 40),
      };
    case AppModule.CLOCK:
      return {
        width: Math.min(500, availableWidth - paddingX),
        height: Math.min(600, availableHeight - paddingY),
      };
    case AppModule.MUSIC:
      return {
        width: 380,
        height: 420,
      };
    case AppModule.POMODORO:
        return {
            width: 420,
            height: 580,
        }
    case AppModule.THEME:
      return {
        width: Math.min(900, availableWidth - 80),
        height: Math.min(750, availableHeight - 60),
      };
    default:
      return {
        width: Math.min(800, availableWidth - paddingX),
        height: Math.min(600, availableHeight - paddingY),
      };
  }
};


const App: React.FC = () => {
  // THEME STATE
  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>('focusflow-theme-dark', () => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [accentColor, setAccentColor] = usePersistentState<string>('focusflow-theme-accent', accentColors[0].hex);
  const [wallpaper, setWallpaper] = usePersistentState<string>('focusflow-theme-wallpaper', wallpapers[0].id);
  
  // WINDOW MANAGEMENT STATE
  const [windows, setWindows] = usePersistentState<WindowConfig[]>('focusflow-windows', []);
  const [activeWindowId, setActiveWindowId] = useState<AppModule | null>(null);
  const [isClosingWindow, setIsClosingWindow] = useState<AppModule | null>(null);
  const nextZIndex = useRef(10);
  
  // DATA STATE
  const [projects, setProjects] = usePersistentState<Project[]>('focusflow-projects', [
    { id: 'proj-0', name: 'First Project', color: '#0ea5e9' }
  ]);
  const [tasks, setTasks] = usePersistentState<Task[]>('focusflow-tasks', [
    { id: 'task-0', title: "Let's get you started!", completed: false, projectId: 'proj-0', subtasks: [
        { id: 'sub-1', title: 'You can edit the project name by clicking on it', completed: false },
        { id: 'sub-2', title: 'Edit the task by clicking on the name of this task object', completed: false },
        { id: 'sub-3', title: 'Try creating a new project by clicking on the + button on the bottom left corner of this menu', completed: false },
        { id: 'sub-4', title: 'Customize your background by clicking on the Theme button on the bottom of your workspace', completed: false },
        { id: 'sub-5', title: 'Add a mood journal entry', completed: false },
        { id: 'sub-6', title: 'Add your own spotify playlist', completed: false },
        { id: 'sub-7', title: 'Create a Track Session or start a pomodoro to log your focus time', completed: false },
        { id: 'sub-8', title: 'View your focus time and productivity stats by clicking on the Stats button on the bottom of your workspace', completed: false },
    ],
    links: [
        { id: 'link-1', url: 'https://aistudio.google.com/app' }
    ],
    counters: [
        { id: 'counter-1', name: 'Coffee', count: 1, target: 3 }
    ]
    },
    { id: 'task-1', title: "A completed task example", completed: true, projectId: 'proj-0' }
  ]);
  const [timeEntries, setTimeEntries] = usePersistentState<TimeEntry[]>('focusflow-timeEntries', []);
  const [activeTimer, setActiveTimer] = usePersistentState<ActiveTimer | null>('focusflow-activeTimer', null);
  const [journalEntries, setJournalEntries] = usePersistentState<JournalEntry[]>('focusflow-journalEntries', []);
  const [notes, setNotes] = usePersistentState<Note[]>('focusflow-notes', [{ id: 'note-1', content: 'This is a sample note.\n\n- You can write in Markdown!\n- Add more notes using the plus icon.', createdAt: Date.now() }]);
  const [events, setEvents] = usePersistentState<Event[]>('focusflow-events', []);
  const [goals, setGoals] = usePersistentState<Goal[]>('focusflow-goals', []);

  // MODAL STATE
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  // THEME EFFECTS
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const selectedColor = accentColors.find(c => c.hex === accentColor) || { hex: accentColor, hoverHex: accentColor };
    document.documentElement.style.setProperty('--accent-color', selectedColor.hex);
    document.documentElement.style.setProperty('--accent-color-hover', selectedColor.hoverHex);
  }, [accentColor]);

  const currentWallpaper = useMemo(() => wallpapers.find(w => w.id === wallpaper) || wallpapers[0], [wallpaper]);

  // WINDOW MANAGEMENT FUNCTIONS
  const openWindow = useCallback((appId: AppModule) => {
    setWindows(prev => {
      const existingIndex = prev.findIndex(w => w.id === appId);
      const newZIndex = nextZIndex.current++;
      if (existingIndex !== -1) {
        return prev.map((w, i) => i === existingIndex ? { ...w, isMinimized: false, zIndex: newZIndex } : w);
      }
      
      const { width, height } = getDefaultWindowSize(appId);
      const MENUBAR_HEIGHT = 28;
      const DOCK_HEIGHT = 64;
      const availableHeight = window.innerHeight - MENUBAR_HEIGHT - DOCK_HEIGHT;
      const availableWidth = window.innerWidth;
      
      // Ensure windows spawn fully within the visible area
      const x = Math.max(20, Math.min(Math.random() * (availableWidth - width - 40), availableWidth - width - 20));
      const y = Math.max(MENUBAR_HEIGHT + 10, Math.min(Math.random() * (availableHeight - height - 20) + MENUBAR_HEIGHT, availableHeight - height + MENUBAR_HEIGHT - 10));

      return [...prev, {
        id: appId,
        x: x,
        y: y,
        width: width,
        height: height,
        zIndex: newZIndex,
        isMinimized: false,
        isMaximized: false,
      }];
    });
    setActiveWindowId(appId);
  }, []);

  const focusWindow = useCallback((appId: AppModule) => {
    const newZIndex = nextZIndex.current++;
    setWindows(prev => prev.map(w => w.id === appId ? { ...w, isMinimized: false, zIndex: newZIndex } : w));
    setActiveWindowId(appId);
  }, []);

  const closeWindow = useCallback((appId: AppModule) => {
    setIsClosingWindow(appId);
    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== appId));
      if (activeWindowId === appId) {
        setActiveWindowId(null);
      }
      setIsClosingWindow(null);
    }, 300);
  }, [activeWindowId]);

  const minimizeWindow = useCallback((appId: AppModule) => {
    setWindows(prev => prev.map(w => w.id === appId ? { ...w, isMinimized: true } : w));
    if (activeWindowId === appId) setActiveWindowId(null);
  }, [activeWindowId]);
  
  const toggleMaximize = useCallback((appId: AppModule) => {
    setWindows(prev => prev.map(w => {
        if (w.id === appId) {
            if (w.isMaximized) {
                // Restore
                return { ...w, isMaximized: false, ...w.preMaximizeState };
            } else {
                // Maximize
                return { ...w, isMaximized: true, preMaximizeState: { x: w.x, y: w.y, width: w.width, height: w.height }};
            }
        }
        return w;
    }));
  }, []);

  const updateWindowState = useCallback((appId: AppModule, updates: Partial<WindowConfig>) => {
    setWindows(prev => prev.map(w => w.id === appId ? { ...w, ...updates } : w));
  }, []);
  
  const handleCloseAll = () => setWindows([]);

  // DATA HANDLERS
  const handleStartTimer = (description: string, project: string) => setActiveTimer({ startTime: Date.now(), description, project });
  const handleStopTimer = () => {
    if (!activeTimer) return;
    const endTime = Date.now();
    const newEntry: TimeEntry = {
      id: `time-${endTime}`,
      description: activeTimer.description,
      startTime: activeTimer.startTime,
      endTime,
      duration: Math.floor((endTime - activeTimer.startTime) / 1000),
      project: activeTimer.project,
    };
    setTimeEntries(prev => [newEntry, ...prev]);
    setActiveTimer(null);
  };
  const handleAddJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    const newEntry: JournalEntry = { ...entry, id: `journal-${Date.now()}`, date: new Date().toISOString() };
    setJournalEntries(prev => [newEntry, ...prev]);
  };
  const handleAddNote = () => {
    const newNote: Note = { id: `note-${Date.now()}`, content: '', createdAt: Date.now() };
    setNotes(prev => [newNote, ...prev]);
  };
  const handleUpdateNote = (id: string, content: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  const handleDeleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));
  const handleAddEvent = (event: Omit<Event, 'id'>) => setEvents(prev => [...prev, { ...event, id: `event-${Date.now()}` }]);
  const handleDeleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));
  const handleAddGoal = (goal: Omit<Goal, 'id'>) => setGoals(prev => [...prev, { ...goal, id: `goal-${Date.now()}` }]);
  const handleToggleGoal = (id: string) => setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const handleDeleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  // SETTINGS HANDLERS
  const handleExportData = () => {
      const allData = { projects, tasks, timeEntries, journalEntries, notes, events, goals, settings: { isDarkMode, accentColor, wallpaper } };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleWipeData = () => {
      localStorage.clear();
      window.location.reload();
  };

  const renderAppModule = (appId: AppModule) => {
    switch (appId) {
      case AppModule.DASHBOARD: return <Dashboard tasks={tasks} projects={projects} setProjects={setProjects} timeEntries={timeEntries} />;
      case AppModule.TASKS: return <TaskList tasks={tasks} projects={projects} setTasks={setTasks} setProjects={setProjects} />;
      case AppModule.TIMER: return <TimeTracker timeEntries={timeEntries} activeTimer={activeTimer} onStartTimer={handleStartTimer} onStopTimer={handleStopTimer} />;
      case AppModule.POMODORO: return <FocusTimer />;
      case AppModule.JOURNAL: return <Journal entries={journalEntries} onAddEntry={handleAddJournalEntry} />;
      case AppModule.SOCIAL: return <StudyRoom />;
      case AppModule.CHAT: return <ChatBot />;
      case AppModule.SETTINGS: return <Settings onExportData={handleExportData} onWipeData={() => setIsWipeModalOpen(true)} />;
      case AppModule.THEME: return <Theme isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(p => !p)} accentColor={accentColor} onSetAccentColor={setAccentColor} wallpaper={wallpaper} onSetWallpaper={setWallpaper} />;
      case AppModule.CALCULATOR: return <Calculator />;
      case AppModule.NOTES: return <Notes notes={notes} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} />;
      case AppModule.WEATHER: return <Weather />;
      case AppModule.CLOCK: return <Clock />;
      case AppModule.CALENDAR: return <Calendar events={events} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />;
      case AppModule.GOALS: return <Goals goals={goals} onAddGoal={handleAddGoal} onToggleGoal={handleToggleGoal} onDeleteGoal={handleDeleteGoal} />;
      case AppModule.MUSIC: return <Music />;
      default: return null;
    }
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(${isDarkMode ? currentWallpaper.darkUrl : currentWallpaper.lightUrl})` }}
    >
      <MenuBar 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(p => !p)}
        onNewTask={() => {}}
        onOpenPreferences={() => openWindow(AppModule.SETTINGS)}
        onCloseWindow={activeWindowId ? () => closeWindow(activeWindowId) : () => {}}
        onMinimizeWindow={activeWindowId ? () => minimizeWindow(activeWindowId) : () => {}}
        onToggleMaximize={activeWindowId ? () => toggleMaximize(activeWindowId) : () => {}}
        onCloseAll={handleCloseAll}
        windows={windows}
        activeWindowId={activeWindowId}
        onFocusWindow={focusWindow}
      />
      
      <main className="h-full w-full">
        <div className="relative h-full w-full">
          {windows.map(config => (
            <Window
              key={config.id}
              config={{...config, isClosing: isClosingWindow === config.id}}
              onClose={() => closeWindow(config.id)}
              onMinimize={() => minimizeWindow(config.id)}
              onToggleMaximize={() => toggleMaximize(config.id)}
              onFocus={() => focusWindow(config.id)}
              onUpdate={(updates) => updateWindowState(config.id, updates)}
            >
              {renderAppModule(config.id)}
            </Window>
          ))}
        </div>
      </main>

      <Dock
        openWindows={windows}
        onLaunch={openWindow}
        onFocus={focusWindow}
      />
      
      <ConfirmationModal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        onConfirm={handleWipeData}
        title="Reset Application"
        message="Are you sure you want to proceed? All your data, including tasks, projects, and settings, will be permanently erased. This action cannot be undone."
        confirmText="Yes, Wipe Everything"
      />
    </div>
  );
};

export default App;