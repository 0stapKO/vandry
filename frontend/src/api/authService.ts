import api from './axios';

interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

export const authService = {
    register: async (data: RegisterRequest) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    
    login: async (data: LoginRequest) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    }
};