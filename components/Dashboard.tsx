import React, { useState, useMemo } from 'react';
import { Task, Project, TimeEntry } from '../types';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CalendarDays, CheckCircle2, Circle, Clock, Flame, Layout, Palette } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  timeEntries: TimeEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, projects, setProjects, timeEntries }) => {
    // State for the project selected in the summary view, defaulting to the first project
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

    // --- Data Preparation ---

    // 1. Overview Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const tasksLeft = totalTasks - completedTasks;

    // 2. Pie Chart Data
    const pieData = useMemo(() => {
        return projects.map(project => ({
            name: project.name,
            value: tasks.filter(task => task.projectId === project.id).length,
            color: project.color || '#ccc'
        })).filter(p => p.value > 0);
    }, [projects, tasks]);

    // 3. Bar Chart Data (Focus Duration by Project)
    // Mapping timeEntries to project names. In a real app, timeEntries should link to project IDs.
    // Assuming timeEntry.project is the project NAME for now based on TimeTracker implementation.
    // Ideally we match by ID, but let's try to match by name or ID if possible.
    const barData = useMemo(() => {
        const data: Record<string, number> = {};
        timeEntries.forEach(entry => {
            // Find project by name or ID
            const proj = projects.find(p => p.name === entry.project || p.id === entry.project);
            const key = proj ? proj.name : entry.project; // Fallback to raw string
            data[key] = (data[key] || 0) + entry.duration;
        });

        return Object.entries(data).map(([name, duration]) => {
             const proj = projects.find(p => p.name === name);
             return {
                name,
                minutes: Math.round(duration / 60),
                color: proj?.color || '#8884d8'
             };
        });
    }, [timeEntries, projects]);

    // 4. Analytics Data
    const totalSessions = timeEntries.length;
    const totalDurationMinutes = Math.round(timeEntries.reduce((acc, curr) => acc + curr.duration, 0) / 60);
    const longestSessionMinutes = Math.round(Math.max(...timeEntries.map(t => t.duration), 0) / 60);

    // 5. Summary Section Data
    const {
        completedTasksInProject,
        totalTasksInProject,
        progress,
        nextIncompleteTask,
        selectedProjectColor
    } = useMemo(() => {
        if (!selectedProjectId) {
            return { completedTasksInProject: 0, totalTasksInProject: 0, progress: 0, nextIncompleteTask: null, selectedProjectColor: '#fff' };
        }
        
        const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);
        const completed = projectTasks.filter(t => t.completed).length;
        const total = projectTasks.length;
        const prog = total > 0 ? (completed / total) * 100 : 0;
        const nextTask = projectTasks.find(t => !t.completed);
        const color = projects.find(p => p.id === selectedProjectId)?.color || '#fff';

        return {
            completedTasksInProject: completed,
            totalTasksInProject: total,
            progress: prog,
            nextIncompleteTask: nextTask,
            selectedProjectColor: color
        };
    }, [selectedProjectId, tasks, projects]);

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, color: newColor } : p));
    };
    
    // Helper to calc streak (naive implementation based on consecutive days with entries)
    const currentStreak = useMemo(() => {
       if (timeEntries.length === 0) return 0;
       const sortedDates = [...new Set(timeEntries.map(e => new Date(e.startTime).toDateString()))]
           .map((d: string) => new Date(d).getTime()) // FIX: Explicitly cast 'd' to string
           .sort((a, b) => b - a); // Descending
       
       let streak = 0;
       let today = new Date().setHours(0,0,0,0);
       let checkDate = today;

       // If no entry today, check yesterday for start of streak, otherwise 0 unless we allow today to be skipped if strictly consecutive
       // But let's say if last entry was today or yesterday, streak is alive.
       if (sortedDates[0] !== today && sortedDates[0] !== today - 86400000) {
           return 0;
       }
       
       // Simple consecutive check
       for (let i = 0; i < sortedDates.length; i++) {
           // allow gaps? No.
           // Actually, let's just count unique days for now as "Productive Days" if streak is too hard to calc perfectly without more logic
           // But let's try.
           if (i === 0) { streak = 1; continue; }
           const diff = (sortedDates[i-1] - sortedDates[i]) / (1000 * 60 * 60 * 24);
           if (diff === 1) streak++;
           else break;
       }
       return streak;
    }, [timeEntries]);


    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        return (percent > 0.05 ? 
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text> : null
        );
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 text-white bg-transparent">
            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-slate-400 text-sm font-medium">Tasks Left</span>
                    <span className="text-4xl font-bold mt-2">{tasksLeft}</span>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-slate-400 text-sm font-medium">Tasks Completed</span>
                    <span className="text-4xl font-bold mt-2">{completedTasks}</span>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-slate-400 text-sm font-medium">Total Tasks</span>
                    <span className="text-4xl font-bold mt-2">{totalTasks}</span>
                </div>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Breakdown Pie Chart */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Breakdown by Category</h2>
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    innerRadius={40}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {pieData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">No data</div>
                        )}
                    </div>
                </div>

                {/* Summary / Project Details */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-lg font-semibold">Summary</h2>
                        <div className="flex items-center gap-2">
                             <Palette size={16} className="text-slate-400"/>
                             <input 
                                type="color" 
                                value={selectedProjectColor} 
                                onChange={handleColorChange}
                                className="w-6 h-6 rounded overflow-hidden border-none p-0 bg-transparent cursor-pointer"
                                title="Change project color"
                             />
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <select
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {projects.length > 0 && (
                        <div className="space-y-6 flex-1">
                             <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-2 transition-all duration-500 rounded-full" 
                                        style={{ width: `${progress}%`, backgroundColor: selectedProjectColor }}
                                    ></div>
                                </div>
                                <p className="text-xs text-right text-slate-500">{completedTasksInProject} / {totalTasksInProject} Tasks</p>
                            </div>
                            
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                               <h3 className="text-sm font-medium text-slate-300 mb-2">Next Up</h3>
                               {nextIncompleteTask ? (
                                    <div className="flex items-start gap-3">
                                        <Circle size={16} className="mt-1 text-slate-500" />
                                        <div>
                                            <p className="text-sm font-medium">{nextIncompleteTask.title}</p>
                                            {nextIncompleteTask.deadline && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <CalendarDays size={12} />
                                                    <span>{new Date(nextIncompleteTask.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                               ) : totalTasksInProject > 0 ? (
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <CheckCircle2 size={16} />
                                        <span>All tasks completed!</span>
                                    </div>
                               ) : (
                                    <p className="text-sm text-slate-500">No tasks created yet.</p>
                               )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 3. Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Layout size={20}/></div>
                        <span className="text-sm font-medium text-slate-300">Total Sessions</span>
                    </div>
                    <span className="text-2xl font-bold">{totalSessions}</span>
                 </div>
                 
                 <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg"><Clock size={20}/></div>
                        <span className="text-sm font-medium text-slate-300">Total Focus</span>
                    </div>
                    <span className="text-2xl font-bold">{totalDurationMinutes} <span className="text-sm font-normal text-slate-500">min</span></span>
                 </div>

                 <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Flame size={20}/></div>
                        <span className="text-sm font-medium text-slate-300">Longest Session</span>
                    </div>
                    <span className="text-2xl font-bold">{longestSessionMinutes} <span className="text-sm font-normal text-slate-500">min</span></span>
                 </div>
                 
                 <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle2 size={20}/></div>
                        <span className="text-sm font-medium text-slate-300">Current Streak</span>
                    </div>
                    <span className="text-2xl font-bold">{currentStreak} <span className="text-sm font-normal text-slate-500">days</span></span>
                 </div>
            </div>

            {/* 4. Bar Chart Row */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl">
                <h2 className="text-lg font-semibold mb-4">Focus Duration by Project (Minutes)</h2>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {barData.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center text-slate-500 pt-10">No focus data yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;