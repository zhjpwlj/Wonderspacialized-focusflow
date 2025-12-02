import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, Subtask } from '../types';
import { Plus, Trash2, ChevronDown, Check, Folder, Edit3, GripVertical, Link as LinkIcon, Coffee } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, projects, setTasks, setProjects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isCompletedVisible, setIsCompletedVisible] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    if (selectedProjectId && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id || null);
    }
  }, [projects, selectedProjectId]);
  
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const currentTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);
  const incompleteTasks = useMemo(() => currentTasks.filter(t => !t.completed), [currentTasks]);
  const completedTasks = useMemo(() => currentTasks.filter(t => t.completed), [currentTasks]);
  const progress = currentTasks.length > 0 ? (completedTasks.length / currentTasks.length) * 100 : 0;

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = { id: `proj-${Date.now()}`, name: newProjectName.trim() };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setNewProjectName('');
    setIsAddingProject(false);
  };
  
  const handleUpdateProjectName = (projectId: string) => {
    if (!editingProjectName.trim()) return;
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: editingProjectName.trim() } : p));
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };
  
  const handleAddTask = () => {
    if (!newTaskName.trim() || !selectedProjectId) return;
    const newTask: Task = { id: `task-${Date.now()}`, title: newTaskName.trim(), completed: false, projectId: selectedProjectId, subtasks: [] };
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setIsAddingTask(false);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };
  
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        }
      }
      return t;
    }));
  };

  const handleUpdateTaskName = (taskId: string) => {
    if (!editingTaskName.trim()) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: editingTaskName.trim() } : t));
    setEditingTaskId(null);
    setEditingTaskName('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const renderTask = (task: Task) => {
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    return (
    <div key={task.id} className="text-slate-300 py-3 border-b border-slate-800">
        <div className="group flex items-start gap-3">
            <GripVertical size={18} className="mt-1 text-slate-600 flex-shrink-0 cursor-grab" />
            <button onClick={() => handleToggleTask(task.id)} className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors border-2 ${task.completed ? 'bg-orange-400 border-orange-400' : 'border-slate-600 hover:border-orange-400'}`}>
                {task.completed && <Check size={14} className="text-slate-900" />}
            </button>
            <div className="flex-1" onClick={() => { setEditingTaskId(task.id); setEditingTaskName(task.title); }}>
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingTaskName}
                    onChange={e => setEditingTaskName(e.target.value)}
                    onBlur={() => handleUpdateTaskName(task.id)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateTaskName(task.id)}
                    className="w-full bg-transparent focus:outline-none text-slate-100"
                    autoFocus
                  />
                ) : (
                  <p className={`cursor-pointer ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                    {task.title}
                  </p>
                )}
            </div>
            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
        </div>
        {(task.subtasks && totalSubtasks > 0) && (
            <div className="pl-12 mt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-500">Subtasks ({completedSubtasks}/{totalSubtasks})</span>
                {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-3">
                        <button onClick={() => handleToggleSubtask(task.id, subtask.id)} className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${subtask.completed ? 'border-orange-400' : 'border-slate-600 hover:border-orange-400'}`}>
                            {subtask.completed && <div className="w-2 h-2 rounded-sm bg-orange-400"></div>}
                        </button>
                        <span className={`${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'} text-sm`}>{subtask.title}</span>
                    </div>
                ))}
            </div>
        )}
         {/* Mocked links and habits from screenshot */}
         { task.id === 'task-0' && (
           <div className="pl-12 mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                    <LinkIcon size={14} />
                    <span>Links (1)</span>
                </div>
                <a href="#" className="text-indigo-400 hover:underline pl-4 block">See what's new in WonderSpace V3</a>
                <div className="flex items-center gap-3 text-slate-400 pl-4">
                    <Coffee size={14} />
                    <span>drank today | 0 / 3</span>
                    <div className="flex items-center gap-1">
                        <button className="px-1.5 border border-slate-600 rounded">-</button>
                        <button className="px-1.5 border border-slate-600 rounded">+</button>
                    </div>
                    <span>0%</span>
                </div>
           </div>
         )}
    </div>
    );
  };
  
  return (
    <div className="h-full flex bg-slate-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-1/3 max-w-xs flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="p-4 flex-1 overflow-y-auto">
          {projects.map(p => (
              <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${selectedProjectId === p.id ? 'bg-slate-800 font-semibold' : 'hover:bg-slate-800/50 text-slate-400'}`}
              >
                  <span className="flex-1 truncate">{p.name}</span>
              </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
            <button onClick={() => setIsAddingProject(true)} className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-sm transition-colors hover:bg-slate-800">
                <Plus size={16} />
                <span>New Project</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6">
        {selectedProject ? (
            <>
                <header className="flex-shrink-0 mb-4">
                    <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                </header>
                <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                    {completedTasks.length > 0 && (
                        <div className="mb-4">
                            <button onClick={() => setIsCompletedVisible(!isCompletedVisible)} className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                <ChevronDown size={16} className={`transition-transform ${isCompletedVisible ? '' : '-rotate-90'}`}/>
                                <span className="font-semibold">completed</span>
                            </button>
                            {isCompletedVisible && <div className="mt-2">{completedTasks.map(renderTask)}</div>}
                        </div>
                    )}
                    {incompleteTasks.map(renderTask)}
                </div>
                <footer className="pt-4 mt-auto flex items-center gap-4 flex-shrink-0">
                    <button onClick={() => setIsAddingTask(true)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                        <Plus size={18} />
                        <span className="text-sm font-medium">New Task</span>
                    </button>
                   <div className="ml-auto w-1/3 flex items-center gap-3">
                     <span className="text-xs font-mono text-slate-500">{completedTasks.length}/{currentTasks.length}</span>
                     <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-1.5" style={{ width: `${progress}%` }}></div>
                     </div>
                     <span className="text-xs font-mono text-slate-400">{Math.round(progress)}%</span>
                   </div>
                </footer>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <Folder size={48} className="mx-auto mb-4"/>
                    <h2 className="text-lg font-semibold">No project selected</h2>
                    <p>Create or select a project to get started.</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default TaskList;
