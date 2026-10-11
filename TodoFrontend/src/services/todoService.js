import axios from 'axios';

// Prefer Vite environment variable VITE_API_BASE_URL when available (set in .env),
// otherwise fall back to the API HTTPS launch port defined in Properties/launchSettings.json
// (https://localhost:7141). Adjust if your API runs on a different port.
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? 'https://localhost:7141/api/todos';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getTodos = async (filters = {}) => {
    const params = {};
    if (filters.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters.priority && filters.priority !== 'All') params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.isCompleted !== undefined && filters.isCompleted !== null) {
        params.isCompleted = filters.isCompleted;
    }

    const response = await apiClient.get('', { params });
    return response.data;
};

export const getSummary = async () => {
    const response = await apiClient.get('/summary');
    return response.data;
};

export const createTodo = async (todoData) => {
    const response = await apiClient.post('', todoData);
    return response.data;
};

export const updateTodo = async (id, todoData) => {
    const response = await apiClient.put(`/${id}`, todoData);
    return response.data;
};

export const toggleComplete = async (id, isCompleted) => {
    const response = await apiClient.patch(`/${id}/status`, null, {
        params: { isCompleted },
    });
    return response.data;
};

export const deleteTodo = async (id) => {
    const response = await apiClient.delete(`/${id}`);
    return response.data;
};