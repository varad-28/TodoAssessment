import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Pencil,
    Trash2,
    CheckSquare,
    Square,
    AlertCircle
} from 'lucide-react';
import * as todoApi from './services/todoService';

export default function App() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        category: 'Work',
    });
    const [editingId, setEditingId] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    const [todos, setTodos] = useState([]);
    const [summary, setSummary] = useState({ pendingCount: 0, completedCount: 0 });
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState(null);

    const loadSummaryCounts = async () => {
        try {
            const data = await todoApi.getSummary();
            setSummary(data);
        } catch (err) {
            console.error('Failed to fetch summary counts', err);
        }
    };

    const loadTodoList = useCallback(async () => {
        setLoading(true);
        setServerError(null);
        try {
            const filterParams = {
                searchTerm,
                priority: priorityFilter,
                category: categoryFilter,
                fromDate: fromDate || null,
                toDate: toDate || null,
                isCompleted: activeTab === 'completed',
            };
            const data = await todoApi.getTodos(filterParams);
            setTodos(data);
        } catch (err) {
            setServerError(
                err.response?.data?.detail ||
                'Could not connect to ADO.NET Web API. Ensure backend is running.'
            );
        } finally {
            setLoading(false);
        }
    }, [searchTerm, priorityFilter, categoryFilter, fromDate, toDate, activeTab]);

    useEffect(() => {
        let active = true;

        const fetchInitialData = async () => {
            try {
                const [items, summaryRes] = await Promise.all([
                    todoApi.getTodos({
                        searchTerm,
                        priority: priorityFilter,
                        category: categoryFilter,
                        fromDate: fromDate || null,
                        toDate: toDate || null,
                        isCompleted: activeTab === 'completed',
                    }),
                    todoApi.getSummary(),
                ]);

                if (active) {
                    setTodos(items);
                    setSummary(summaryRes);
                }
            } catch (err) {
                if (active) {
                    setServerError(
                        err.response?.data?.detail ||
                        'Could not connect to ADO.NET Web API. Ensure backend is running.'
                    );
                }
            }
        };

        fetchInitialData();

        return () => {
            active = false;
        };
    }, [searchTerm, priorityFilter, categoryFilter, fromDate, toDate, activeTab]);




    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const validateForm = () => {
        const errors = {};
        const today = getTodayString();

        if (!formData.title.trim()) {
            errors.title = 'Task Name is required.';
        } else if (formData.title.trim().length < 2) {
            errors.title = 'Task Name must be at least 2 characters.';
        }

        if (!formData.dueDate) {
            errors.dueDate = 'Due Date is required.';
        } else if (formData.dueDate < today) {
            errors.dueDate = 'Due Date cannot be earlier than today.';
        }

        if (!formData.priority) {
            errors.priority = 'Priority is required.';
        }

        if (!formData.category) {
            errors.category = 'Category is required.';
        }

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            if (editingId) {
                await todoApi.updateTodo(editingId, {
                    ...formData,
                    isCompleted: false,
                });

                setEditingId(null);
            } else {
                await todoApi.createTodo(formData);
            }

            setFormData({
                title: '',
                description: '',
                dueDate: '',
                priority: 'Medium',
                category: 'Work',
            });

            setValidationErrors({});
            setServerError(null);

            await loadTodoList();
            await loadSummaryCounts();
        } catch (err) {
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Failed to save task.';

            setValidationErrors({
                ...(message.toLowerCase().includes('same name and due date')
                    ? {
                        title: message,
                        dueDate: message,
                    }
                    : {}),

                ...(message.toLowerCase().includes('earlier than today')
                    ? {
                        dueDate: message,
                    }
                    : {}),
            });

            if (
                !message.toLowerCase().includes('same name and due date') &&
                !message.toLowerCase().includes('earlier than today')
            ) {
                setServerError(message);
            }
        }
    };

    const handleStartEdit = (item) => {
        if (item.isCompleted) {
            return;
        }

        setEditingId(item.id);

        setFormData({
            title: item.title,
            description: item.description || '',
            dueDate: item.dueDate
                ? item.dueDate.split('T')[0]
                : '',
            priority: item.priority,
            category: item.category,
        });

        setValidationErrors({});
        setServerError(null);
    };

    const handleToggleDone = async (id, currentStatus) => {
        try {
            await todoApi.toggleComplete(id, !currentStatus);
            await loadTodoList();
            await loadSummaryCounts();
        } catch (err) {
            setServerError(err.response?.data?.detail || 'Failed to update status.');
        }
    };

    const handleDeleteTask = async (id) => {
        const todo = todos.find((item) => item.id === id);

        if (todo?.isCompleted) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await todoApi.deleteTodo(id);

            await loadTodoList();
            await loadSummaryCounts();
        } catch (err) {
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Failed to delete task.';

            setServerError(message);
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High':
                return 'text-red-400';
            case 'Medium':
                return 'text-amber-400';
            case 'Low':
                return 'text-blue-400';
            default:
                return 'text-slate-300';
        }
    };

    return (
        <div className="min-h-screen bg-[#0e131f] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-white text-center tracking-wide">
                    Task Management
                </h1>

                {serverError && (
                    <div className="bg-red-950/60 border border-red-700/60 p-3.5 rounded-lg flex items-center gap-3 text-red-300 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Task Form */}
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-6 shadow-xl">
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                                    Task Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="What needs to be done?"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full bg-[#1b2438] border ${validationErrors.title ? 'border-red-500' : 'border-slate-700'
                                        } rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500`}
                                />
                                {validationErrors.title && (
                                    <p className="text-red-400 text-xs mt-1">{validationErrors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    min={getTodayString()}
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className={`w-full bg-[#1b2438] border ${validationErrors.dueDate ? 'border-red-500' : 'border-slate-700'
                                        } rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500`}
                                />
                                {validationErrors.dueDate && (
                                    <p className="text-red-400 text-xs mt-1">{validationErrors.dueDate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                                    Priority
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-[#1b2438] p-1 rounded-lg border border-slate-700">
                                    {['High', 'Medium', 'Low'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            className={`py-1.5 text-xs font-semibold rounded-md transition-all ${formData.priority === p
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="Additional notes or subtasks..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#1b2438] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                                    Category
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-[#1b2438] p-1 rounded-lg border border-slate-700">
                                    {['Work', 'Personal'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: c })}
                                            className={`py-1.5 text-xs font-semibold rounded-md transition-all ${formData.category === c
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({
                                            title: '',
                                            description: '',
                                            dueDate: '',
                                            priority: 'Medium',
                                            category: 'Work',
                                        });
                                    }}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
                            >
                                {editingId ? 'Update Task' : 'Add Task'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filter Engine */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Cumulative Filter Engine: Active filters apply simultaneously (AND logic)
                    </div>

                    <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-4 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#1b2438] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="shrink-0">From:</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="bg-[#1b2438] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                                <span className="shrink-0">To:</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="bg-[#1b2438] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400 font-medium mr-1">Priority:</span>
                                {['All', 'High', 'Medium', 'Low'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriorityFilter(p)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${priorityFilter === p
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-[#1b2438] text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCategoryFilter(categoryFilter === 'Work' ? '' : 'Work')}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${categoryFilter === 'Work'
                                            ? 'bg-slate-700 border-blue-500 text-white shadow-sm'
                                            : 'border-slate-700 text-slate-400 hover:text-white bg-[#1b2438]'
                                        }`}
                                >
                                    View Work
                                </button>
                                <button
                                    onClick={() => setCategoryFilter(categoryFilter === 'Personal' ? '' : 'Personal')}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${categoryFilter === 'Personal'
                                            ? 'bg-slate-700 border-blue-500 text-white shadow-sm'
                                            : 'border-slate-700 text-slate-400 hover:text-white bg-[#1b2438]'
                                        }`}
                                >
                                    View Personal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Badges */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-[#151c2c] text-slate-400 hover:text-white border border-slate-800'
                            }`}
                    >
                        Pending Tasks ({summary.pendingCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-[#151c2c] text-slate-400 hover:text-white border border-slate-800'
                            }`}
                    >
                        Completed Tasks ({summary.completedCount})
                    </button>
                </div>

                {/* Data Table */}
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-[#192236] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <th className="py-3 px-4">Rank</th>
                                    <th className="py-3 px-4">Done</th>
                                    <th className="py-3 px-4">Task Details</th>
                                    <th className="py-3 px-4">Due Date</th>
                                    <th className="py-3 px-4">Priority</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-500">
                                            Loading tasks...
                                        </td>
                                    </tr>
                                ) : todos.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-500">
                                            No tasks found matching current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    todos.map((todo, index) => (
                                        <tr
                                            key={todo.id}
                                            className="hover:bg-[#1b2438]/50 transition-colors group"
                                        >
                                            <td className="py-3 px-4 font-mono text-slate-500">#{index + 1}</td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleDone(todo.id, todo.isCompleted)}
                                                    className="text-slate-400 hover:text-blue-400 transition-colors"
                                                >
                                                    {todo.isCompleted ? (
                                                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div
                                                    className={`font-semibold text-slate-200 ${todo.isCompleted ? 'line-through text-slate-500' : ''
                                                        }`}
                                                >
                                                    {todo.title}
                                                </div>
                                                {todo.description && (
                                                    <div className="text-slate-500 text-[11px] truncate max-w-xs">
                                                        {todo.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">
                                                {todo.dueDate ? todo.dueDate.split('T')[0] : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`flex items-center gap-1.5 font-medium ${getPriorityColor(todo.priority)}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {todo.priority}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{todo.category}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    {!todo.isCompleted && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStartEdit(todo)}
                                                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteTask(todo.id)}
                                                                className="text-slate-400 hover:text-red-400 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}