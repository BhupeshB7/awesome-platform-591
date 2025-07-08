
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Check, X, Plus, GripVertical, Search, FileDown, Trash2, Calendar as CalendarIcon, Star, Edit3, ChevronDown } from 'lucide-react';

const initialTasks = [
    { id: 1, text: 'Complete Calculus Assignment 3', completed: false, priority: 'High', subject: 'Math', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0] },
    { id: 2, text: 'Read Chapter 4 of "The Modern Mind"', completed: false, priority: 'Medium', subject: 'Literature', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0] },
    { id: 3, text: 'Prepare for Chemistry Lab', completed: true, priority: 'High', subject: 'Science', dueDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0] },
    { id: 4, text: 'Start drafting History essay outline', completed: false, priority: 'Low', subject: 'History', dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] },
];

const priorityConfig = {
    High: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <Star className="h-3 w-3" /> },
    Medium: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Star className="h-3 w-3" /> },
    Low: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <Star className="h-3 w-3" /> },
};

const StudentTodoApp = () => {
    const [tasks, setTasks] = useState(initialTasks);
    const [newTask, setNewTask] = useState({ text: '', priority: 'Medium', subject: '', dueDate: '' });
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingText, setEditingText] = useState('');
    
    const dragTask = useRef(null);
    const dragOverTask = useRef(null);
    const addTaskInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
        if (name === 'text' && value) {
            setError('');
        }
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.text.trim()) {
            setError('Task description cannot be empty.');
            return;
        }
        const newTaskObject = {
            id: Date.now(),
            text: newTask.text.trim(),
            completed: false,
            priority: newTask.priority,
            subject: newTask.subject.trim(),
            dueDate: newTask.dueDate,
        };
        setTasks(prev => [newTaskObject, ...prev]);
        setNewTask({ text: '', priority: 'Medium', subject: '', dueDate: '' });
        setError('');
        addTaskInputRef.current?.focus();
    };

    const handleToggleComplete = useCallback((id) => {
        let wasCompleted = false;
        setTasks(prevTasks =>
            prevTasks.map(task => {
                if (task.id === id) {
                    wasCompleted = !task.completed;
                    return { ...task, completed: !task.completed };
                }
                return task;
            })
        );
        if (wasCompleted) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        }
    }, []);

    const handleDeleteTask = useCallback((id) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    }, []);


    const handleClearCompleted = useCallback(() => {
        setTasks(prevTasks => prevTasks.filter(task => !task.completed));
    }, []);

    const handleDragSort = useCallback(() => {
        if (dragTask.current === null || dragOverTask.current === null) return;
        const tasksCopy = [...tasks];
        const draggedTaskContent = tasksCopy.splice(dragTask.current, 1)[0];
        tasksCopy.splice(dragOverTask.current, 0, draggedTaskContent);
        dragTask.current = null;
        dragOverTask.current = null;
        setTasks(tasksCopy);
    }, [tasks]);

    const handleEditStart = (task) => {
        setEditingTaskId(task.id);
        setEditingText(task.text);
    };

    const handleEditSave = (id) => {
        if (!editingText.trim()) {
            handleDeleteTask(id);
        } else {
            setTasks(tasks.map(task => task.id === id ? { ...task, text: editingText.trim() } : task));
        }
        setEditingTaskId(null);
        setEditingText('');
    };

    const handleEditCancel = () => {
        setEditingTaskId(null);
        setEditingText('');
    };
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && editingTaskId) {
                handleEditCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingTaskId]);

    const filteredAndSortedTasks = useMemo(() => {
        return tasks
            .filter(task => {
                const matchesFilter = filter === 'All' || (filter === 'Active' && !task.completed) || (filter === 'Completed' && task.completed);
                const matchesSearch = searchTerm === '' || task.text.toLowerCase().includes(searchTerm.toLowerCase()) || task.subject.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesFilter && matchesSearch;
            });
    }, [tasks, filter, searchTerm]);

    const taskStats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, active, overdue, progress };
    }, [tasks]);

    const exportTasks = useCallback(() => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'student_tasks.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [tasks]);
    
    const formatDate = (dateString) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
        
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString));
    };
    
    return (
        <div className="bg-slate-900 min-h-screen text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
            {showConfetti && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none" aria-hidden="true">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="confetti" style={{'--i': i}}></div>
                    ))}
                </div>
            )}
            <style>{`
                .confetti {
                    position: absolute;
                    width: 8px;
                    height: 16px;
                    background: hsl(var(--i) * 7.2, 70%, 60%);
                    top: -20px;
                    left: calc(var(--i) * 2%);
                    animation: fall 3s linear infinite;
                    animation-delay: calc(var(--i) * 0.05s);
                    opacity: 0;
                }
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .task-enter { animation: task-enter-anim 0.4s ease-out; }
                @keyframes task-enter-anim {
                    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .task-drag-indicator {
                    border-top: 2px dashed #4f46e5;
                    margin-top: -2px;
                }
            `}</style>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold text-white tracking-tight">Student Task Hub</h1>
                        <p className="text-slate-400 mt-2">Organize your academic life, one task at a time.</p>
                    </header>

                    <form onSubmit={handleAddTask} className="mb-6 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex flex-col sm:flex-row gap-4">
                           <input
                                ref={addTaskInputRef}
                                type="text"
                                name="text"
                                value={newTask.text}
                                onChange={handleInputChange}
                                placeholder="Add a new task, e.g., 'Finish Physics homework'"
                                className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                                aria-label="New task description"
                            />
                            <button type="submit" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 whitespace-nowrap">
                                <Plus className="h-5 w-5" />
                                <span>Add Task</span>
                            </button>
                        </div>
                         {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <input
                                type="text"
                                name="subject"
                                value={newTask.subject}
                                onChange={handleInputChange}
                                placeholder="Subject (e.g., Math)"
                                className="bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                                aria-label="Task subject"
                            />
                            <div className="relative">
                                <select
                                    name="priority"
                                    value={newTask.priority}
                                    onChange={handleInputChange}
                                    className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                                    aria-label="Task priority"
                                >
                                    <option value="Low">Low Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="High">High Priority</option>
                                </select>
                                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <input
                                type="date"
                                name="dueDate"
                                value={newTask.dueDate}
                                onChange={handleInputChange}
                                className="bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-slate-400"
                                aria-label="Task due date"
                            />
                        </div>
                    </form>

                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                {['All', 'Active', 'Completed'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 w-full sm:w-48 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                                    aria-label="Search tasks"
                                />
                            </div>
                        </div>

                        <ul className="divide-y divide-slate-700/50">
                           {filteredAndSortedTasks.length > 0 ? (
                                filteredAndSortedTasks.map((task, index) => (
                                    <li
                                        key={task.id}
                                        className={`task-enter flex items-center p-4 transition-colors duration-300 ${task.completed ? 'bg-slate-800/30' : 'hover:bg-slate-800'} ${dragOverTask.current === index ? 'task-drag-indicator' : ''}`}
                                        draggable
                                        onDragStart={() => (dragTask.current = index)}
                                        onDragEnter={() => (dragOverTask.current = index)}
                                        onDragEnd={handleDragSort}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <button className="cursor-grab text-slate-500 hover:text-slate-300 mr-3" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
                                        <button onClick={() => handleToggleComplete(task.id)} className="mr-4" aria-label={task.completed ? "Mark as not completed" : "Mark as completed"}>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-indigo-500'}`}>
                                                {task.completed && <Check className="h-4 w-4 text-white" />}
                                            </div>
                                        </button>
                                        
                                        {editingTaskId === task.id ? (
                                            <input
                                                type="text"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onBlur={() => handleEditSave(task.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(task.id)}
                                                className="flex-grow bg-slate-700 border border-indigo-500 rounded-md px-2 py-1 focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="flex-grow">
                                                <p className={`text-base ${task.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.text}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                    {task.subject && <span className="bg-slate-700 px-2 py-0.5 rounded-full">{task.subject}</span>}
                                                    {task.priority && (
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${priorityConfig[task.priority].color}`}>
                                                          {priorityConfig[task.priority].icon} {task.priority}
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className={`flex items-center gap-1 ${!task.completed && new Date(task.dueDate) < new Date() ? 'text-rose-400' : ''}`}>
                                                          <CalendarIcon className="h-3 w-3" /> {formatDate(task.dueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditStart(task)} className="p-1.5 text-slate-400 hover:text-indigo-400" aria-label="Edit task"><Edit3 className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-400" aria-label="Delete task"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-center p-8 text-slate-500">
                                    <h3 className="text-lg font-semibold text-slate-400">All Clear!</h3>
                                    <p>You have no tasks here. Time for a break?</p>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">Productivity Stats</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-base font-medium text-slate-300">Overall Progress</span>
                                    <span className="text-lg font-bold text-indigo-400">{taskStats.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${taskStats.progress}%` }}></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 text-center">
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-2xl font-bold text-white">{taskStats.active}</p>
                                    <p className="text-xs text-slate-400">Active Tasks</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-2xl font-bold text-emerald-400">{taskStats.completed}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-2xl font-bold text-rose-400">{taskStats.overdue}</p>
                                    <p className="text-xs text-slate-400">Overdue</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                        <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
                        <div className="space-y-3">
                           <button onClick={handleClearCompleted} disabled={taskStats.completed === 0} className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 font-semibold px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Trash2 className="h-4 w-4" />
                                <span>Clear Completed ({taskStats.completed})</span>
                            </button>
                            <button onClick={exportTasks} disabled={tasks.length === 0} className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-semibold px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <FileDown className="h-4 w-4" />
                                <span>Export to JSON</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentTodoApp;
