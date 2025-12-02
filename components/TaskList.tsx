import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, Subtask, Link as LinkType, Counter } from '../types';
import { Plus, Trash2, ChevronDown, Check, Folder, GripVertical, Link as LinkIcon, Hash, X, Edit2, MoreHorizontal, Minus, BookOpen } from 'lucide-react';

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
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  const [isCompletedVisible, setIsCompletedVisible] = useState(true);
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'links' | 'counters' | 'details'>('subtasks');
  
  // State for adding new sub-items
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterTarget, setNewCounterTarget] = useState(3);
  
  // State for editing task details
  const [editingDeadline, setEditingDeadline] = useState('');
  const [editingNotes, setEditingNotes] = useState('');


  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    if (selectedProjectId && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id || null);
    }
  }, [projects, selectedProjectId]);
  
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  
  const handleProjectNameClick = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };
  
  const currentTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId).sort((a,b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1), [tasks, selectedProjectId]);
  const incompleteTasks = useMemo(() => currentTasks.filter(t => !t.completed), [currentTasks]);
  const completedTasks = useMemo(() => currentTasks.filter(t => t.completed), [currentTasks]);
  const progress = currentTasks.length > 0 ? (completedTasks.length / currentTasks.length) * 100 : 0;

  // FIX: Updated handleAddProject to accept an optional SyntheticEvent to handle calls
  // from onSubmit, onKeyDown, and onBlur, improving type safety.
  const handleAddProject = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!newProjectName.trim()) return;
    const newProject: Project = { id: `proj-${Date.now()}`, name: newProjectName.trim() };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setNewProjectName('');
    setIsAddingProject(false);
  };
  
  const handleUpdateProjectName = () => {
    if (!editingProjectName.trim() || !editingProjectId) return;
    setProjects(prev => prev.map(p => p.id === editingProjectId ? { ...p, name: editingProjectName.trim() } : p));
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProjectId) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskName.trim(),
      completed: false,
      projectId: selectedProjectId,
      subtasks: [],
      links: [],
      counters: [],
      deadline: newTaskDeadline || undefined,
      notes: newTaskNotes.trim() || undefined
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskName('');
    setNewTaskDeadline('');
    setNewTaskNotes('');
    setIsAddingTask(false);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };
  
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }
  
  // SUB-ITEM HANDLERS
  const handleAddSubItem = (taskId: string, type: 'subtask' | 'link' | 'counter') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (type === 'subtask' && newSubtaskTitle.trim()) {
      const newSubtask: Subtask = { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false };
      updateTask(taskId, { subtasks: [...(task.subtasks || []), newSubtask] });
      setNewSubtaskTitle('');
    }
    if (type === 'link' && newLinkUrl.trim()) {
      const newLink: LinkType = { id: `link-${Date.now()}`, url: newLinkUrl.trim() };
      updateTask(taskId, { links: [...(task.links || []), newLink] });
      setNewLinkUrl('');
    }
    if (type === 'counter' && newCounterName.trim()) {
      const newCounter: Counter = { id: `counter-${Date.now()}`, name: newCounterName.trim(), count: 0, target: newCounterTarget };
      updateTask(taskId, { counters: [...(task.counters || []), newCounter] });
      setNewCounterName('');
      setNewCounterTarget(3);
    }
  };
  
  const handleDeleteSubItem = (taskId: string, subItemId: string, type: 'subtask' | 'link' | 'counter') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (type === 'subtask') updateTask(taskId, { subtasks: task.subtasks?.filter(s => s.id !== subItemId) });
    if (type === 'link') updateTask(taskId, { links: task.links?.filter(l => l.id !== subItemId) });
    if (type === 'counter') updateTask(taskId, { counters: task.counters?.filter(c => c.id !== subItemId) });
  };
  
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
     const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
    updateTask(taskId, { subtasks: updatedSubtasks });
  };
  
  const handleUpdateCounter = (taskId: string, counterId: string, change: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedCounters = task.counters?.map(c => 
      c.id === counterId ? { ...c, count: Math.max(0, c.count + change) } : c
    );
    updateTask(taskId, { counters: updatedCounters });
  }

  const handleTaskClick = (task: Task) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(task.id);
      setActiveTab('subtasks');
      setEditingDeadline(task.deadline || '');
      setEditingNotes(task.notes || '');
    }
  };

  const renderTask = (task: Task) => {
    const isExpanded = expandedTaskId === task.id;

    return (
    <div key={task.id} className="text-slate-300 border-b border-slate-800 animate-fade-in">
        <div className="group flex items-start gap-3 py-3">
            <GripVertical size={18} className="mt-1 text-slate-600 flex-shrink-0 cursor-grab opacity-50" />
            <button 
              onClick={() => handleToggleTask(task.id)} 
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors border-2 ${task.completed ? 'bg-[var(--accent-color)] border-[var(--accent-color)]' : 'border-slate-600 hover:border-[var(--accent-color)]'}`}>
                {task.completed && <Check size={14} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleTaskClick(task)}>
                <p className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {task.title}
                </p>
                {(task.deadline || (task.counters && task.counters.length > 0)) && (
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        {task.deadline && (
                            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                        )}
                        {task.counters?.map(c => (
                            <div key={c.id} className="flex items-center gap-1.5">
                                <Hash size={12}/> {c.name}: {c.count}/{c.target}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
        </div>

        {isExpanded && (
           <div className="pl-10 pb-3">
              {/* Tabs */}
              <div className="flex border-b border-slate-700 mb-3 text-sm">
                  <button onClick={() => setActiveTab('subtasks')} className={`px-3 py-2 ${activeTab === 'subtasks' ? 'text-white border-b-2 border-[var(--accent-color)]' : 'text-slate-400'}`}>Subtasks</button>
                  <button onClick={() => setActiveTab('links')} className={`px-3 py-2 ${activeTab === 'links' ? 'text-white border-b-2 border-[var(--accent-color)]' : 'text-slate-400'}`}>Links</button>
                  <button onClick={() => setActiveTab('counters')} className={`px-3 py-2 ${activeTab === 'counters' ? 'text-white border-b-2 border-[var(--accent-color)]' : 'text-slate-400'}`}>Counters</button>
                  <button onClick={() => setActiveTab('details')} className={`px-3 py-2 ${activeTab === 'details' ? 'text-white border-b-2 border-[var(--accent-color)]' : 'text-slate-400'}`}>Details</button>
              </div>

              {/* Content */}
              {activeTab === 'subtasks' && (
                  <div className="space-y-2">
                      {task.subtasks?.map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-3 py-1 group">
                              <input 
                                type="checkbox" 
                                id={`subtask-${subtask.id}`} 
                                checked={subtask.completed} 
                                onChange={() => handleToggleSubtask(task.id, subtask.id)}
                                className="w-4 h-4 rounded-sm border-slate-600 bg-slate-800 text-[var(--accent-color)] focus:ring-[var(--accent-color)]" 
                              />
                              <label htmlFor={`subtask-${subtask.id}`} className={`${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'} text-sm flex-1`}>{subtask.title}</label>
                              <button onClick={() => handleDeleteSubItem(task.id, subtask.id, 'subtask')} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                          </div>
                      ))}
                      <form onSubmit={e => {e.preventDefault(); handleAddSubItem(task.id, 'subtask');}} className="flex gap-2 pt-2">
                        <input value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} type="text" placeholder="Add subtask..." className="flex-1 bg-slate-800/50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]" />
                        <button type="submit" className="p-1.5 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14}/></button>
                      </form>
                  </div>
              )}
               {activeTab === 'links' && (
                  <div className="space-y-2">
                      {task.links?.map(link => (
                          <div key={link.id} className="flex items-center gap-3 py-1 group text-sm">
                            <LinkIcon size={14} className="text-slate-500"/>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-indigo-400 hover:underline truncate">{link.url}</a>
                            <button onClick={() => handleDeleteSubItem(task.id, link.id, 'link')} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                          </div>
                      ))}
                      <form onSubmit={e => {e.preventDefault(); handleAddSubItem(task.id, 'link');}} className="flex gap-2 pt-2">
                        <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} type="url" placeholder="Add link URL..." className="flex-1 bg-slate-800/50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]" />
                        <button type="submit" className="p-1.5 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14}/></button>
                      </form>
                  </div>
              )}
              {activeTab === 'counters' && (
                  <div className="space-y-3">
                      {task.counters?.map(counter => (
                          <div key={counter.id} className="flex items-center justify-between py-1 group text-sm">
                            <div className="flex-1 flex items-center gap-3">
                               <Hash size={14} className="text-slate-500"/>
                               <span>{counter.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => handleUpdateCounter(task.id, counter.id, -1)} className="px-1.5 border border-slate-600 rounded-md">-</button>
                               <span>{counter.count} / {counter.target}</span>
                               <button onClick={() => handleUpdateCounter(task.id, counter.id, 1)} className="px-1.5 border border-slate-600 rounded-md">+</button>
                            </div>
                            <button onClick={() => handleDeleteSubItem(task.id, counter.id, 'counter')} className="ml-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                          </div>
                      ))}
                      <form onSubmit={e => {e.preventDefault(); handleAddSubItem(task.id, 'counter');}} className="flex gap-2 pt-2 border-t border-slate-800">
                        <input value={newCounterName} onChange={e => setNewCounterName(e.target.value)} type="text" placeholder="Counter name..." className="flex-1 bg-slate-800/50 rounded px-2 py-1 text-sm" />
                        <input value={newCounterTarget} onChange={e => setNewCounterTarget(Number(e.target.value))} type="number" placeholder="Target" min="1" className="w-16 bg-slate-800/50 rounded px-2 py-1 text-sm" />
                        <button type="submit" className="p-1.5 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14}/></button>
                      </form>
                  </div>
              )}
               {activeTab === 'details' && (
                  <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400">Deadline</label>
                        <input type="date" value={editingDeadline} onChange={e => setEditingDeadline(e.target.value)} onBlur={() => updateTask(task.id, { deadline: editingDeadline })} className="w-full mt-1 bg-slate-800/50 border-slate-700 rounded p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400">Notes</label>
                        <textarea value={editingNotes} onChange={e => setEditingNotes(e.target.value)} onBlur={() => updateTask(task.id, { notes: editingNotes })} placeholder="Add notes..." rows={4} className="w-full mt-1 bg-slate-800/50 border-slate-700 rounded p-2 text-sm resize-none" />
                      </div>
                  </div>
              )}
           </div>
        )}
    </div>
    );
  };
  
  return (
    <div className="h-full flex bg-slate-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-1/3 max-w-[240px] flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="p-2 flex-1 overflow-y-auto">
          {projects.map(p => (
              <div key={p.id} className="group flex items-center w-full rounded-md hover:bg-slate-800/50">
                <button
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`flex-1 text-left flex items-center gap-3 px-3 py-2 transition-colors text-sm rounded-l-md ${selectedProjectId === p.id ? 'bg-slate-800 font-semibold' : 'text-slate-400'}`}
                >
                    <Folder size={16} />
                    <span className="flex-1 truncate">{p.name}</span>
                </button>
                <button onClick={() => handleProjectNameClick(p)} className={`p-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white ${selectedProjectId === p.id ? 'bg-slate-800 rounded-r-md' : ''}`}><Edit2 size={14}/></button>
              </div>
          ))}
        </div>
        <div className="p-2 border-t border-slate-800">
          {isAddingProject ? (
            <form onSubmit={handleAddProject}>
              <input 
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project..."
                className="w-full bg-slate-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                autoFocus
                // FIX: Removed reference to undefined variable 'e'. Now calls handleAddProject without an argument,
                // which is handled by the updated function signature.
                onBlur={() => { if(!newProjectName.trim()) setIsAddingProject(false); else handleAddProject(); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProject(e); }}
              />
            </form>
          ) : (
            <button onClick={() => setIsAddingProject(true)} className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-sm transition-colors hover:bg-slate-800">
                <Plus size={16} />
                <span>New Project</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 pl-4">
        {selectedProject ? (
            <>
                <header className="flex-shrink-0 mb-4 px-2">
                    {editingProjectId === selectedProject.id ? (
                      <input
                        type="text"
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        onBlur={handleUpdateProjectName}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateProjectName()}
                        className="text-2xl font-bold bg-transparent border-b-2 border-slate-700 focus:outline-none focus:border-[var(--accent-color)]"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-2xl font-bold cursor-pointer" onClick={() => handleProjectNameClick(selectedProject)}>{selectedProject.name}</h1>
                    )}
                </header>
                <div className="flex-1 overflow-y-auto -mr-6 pr-6 pl-2">
                    {completedTasks.length > 0 && (
                        <div className="mb-4">
                            <button onClick={() => setIsCompletedVisible(!isCompletedVisible)} className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                <ChevronDown size={16} className={`transition-transform ${isCompletedVisible ? '' : '-rotate-90'}`}/>
                                <span className="font-semibold">completed</span>
                                <span className="text-xs">({completedTasks.length})</span>
                            </button>
                            {isCompletedVisible && <div className="mt-2">{completedTasks.map(renderTask)}</div>}
                        </div>
                    )}
                    {incompleteTasks.map(renderTask)}
                    
                    {isAddingTask && (
                       <div className="p-4 border border-slate-700 rounded-lg mt-4 space-y-3 bg-slate-900">
                         <form onSubmit={handleAddTask}>
                           <input
                             type="text"
                             value={newTaskName}
                             onChange={(e) => setNewTaskName(e.target.value)}
                             placeholder="Task name"
                             className="w-full bg-transparent text-lg font-semibold focus:outline-none placeholder-slate-500"
                             autoFocus
                           />
                           <div className="grid grid-cols-2 gap-3 mt-3">
                               <div>
                                   <label className="text-xs text-slate-400">Deadline</label>
                                   <input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded p-2 text-sm mt-1" />
                               </div>
                           </div>
                           <textarea
                             value={newTaskNotes}
                             onChange={(e) => setNewTaskNotes(e.target.value)}
                             placeholder="Add notes..."
                             rows={3}
                             className="w-full bg-slate-800 border-slate-700 rounded p-2 text-sm resize-none mt-3"
                           />
                           <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-3">
                                <button type="button" onClick={() => setIsAddingTask(false)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-slate-800">Cancel</button>
                                <button type="submit" disabled={!newTaskName.trim()} className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-color)] text-white disabled:opacity-50">Add Task</button>
                           </div>
                         </form>
                       </div>
                    )}

                </div>
                <footer className="pt-4 mt-auto flex items-center gap-4 flex-shrink-0 px-2">
                    {!isAddingTask && (
                      <button onClick={() => setIsAddingTask(true)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                          <Plus size={18} />
                          <span className="text-sm font-medium">New Task</span>
                      </button>
                    )}
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