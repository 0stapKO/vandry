import api from './axios';

// Interfaces for our data (similar to DTOs in Java)
interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export const authService = {
    register: async (data: RegisterRequest) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data; // Here we expect to get our JWT token
    }
};