import React, { useState, useMemo } from 'react';
import { Task, Project } from '../types';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarDays } from 'lucide-react';

// Predefined colors for the pie chart slices, matching the design aesthetic
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#4f46e5'];

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, projects }) => {
    // State for the project selected in the summary view, defaulting to the first project
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

    // Memoized data for the pie chart, representing projects and their respective task counts
    const pieData = useMemo(() => {
        return projects.map(project => ({
            name: project.name,
            value: tasks.filter(task => task.projectId === project.id).length,
        })).filter(p => p.value > 0); // Only include projects that have tasks
    }, [projects, tasks]);

    // Memoized data for the summary section, calculated based on the selected project
    const {
        completedTasksInProject,
        totalTasksInProject,
        progress,
        nextIncompleteTask
    } = useMemo(() => {
        if (!selectedProjectId) {
            return { completedTasksInProject: 0, totalTasksInProject: 0, progress: 0, nextIncompleteTask: null };
        }
        
        const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);
        const completed = projectTasks.filter(t => t.completed).length;
        const total = projectTasks.length;
        const prog = total > 0 ? (completed / total) * 100 : 0;
        const nextTask = projectTasks.find(t => !t.completed);

        return {
            completedTasksInProject: completed,
            totalTasksInProject: total,
            progress: prog,
            nextIncompleteTask: nextTask
        };
    }, [selectedProjectId, tasks]);

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
    };
    
    // Custom label renderer to display percentages inside the pie chart slices
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // Don't render label for very small slices

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6 p-6 h-full flex flex-col bg-transparent text-white">
            {/* Breakdown by Category Card */}
            <div className="bg-slate-950/70 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Breakdown by Category</h2>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={''} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)', // slate-800 with opacity
                                    border: '1px solid #334155', // slate-700
                                    borderRadius: '8px'
                                }}
                                itemStyle={{ color: '#cbd5e1' }} // slate-300
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-950/70 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex-1">
                <h2 className="text-lg font-semibold text-white">Summary</h2>
                <div className="mt-4">
                    <select
                        value={selectedProjectId}
                        onChange={handleProjectChange}
                        className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        aria-label="Select project for summary"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                {projects.length > 0 && (
                    <div className="mt-6 space-y-3">
                         <div className="flex items-center gap-4">
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                <div className="bg-[var(--accent-color)] h-2 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-sm font-mono text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        <p className="text-sm text-slate-400">completed: {completedTasksInProject}/{totalTasksInProject}</p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-800 text-slate-300">
                           {nextIncompleteTask ? (
                                <>
                                    <p className="text-sm">upcoming deadline: {nextIncompleteTask.title}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                        <CalendarDays size={14} />
                                        <span>
                                            {nextIncompleteTask.deadline 
                                                ? new Date(nextIncompleteTask.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
                                                : 'No deadline set'
                                            }
                                        </span>
                                    </div>
                                </>
                           ) : totalTasksInProject > 0 ? (
                                <p className="text-sm text-green-400">🎉 All tasks in this project are complete!</p>
                           ) : (
                                <p className="text-sm text-slate-400">No tasks in this project yet. Add one to get started!</p>
                           )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
