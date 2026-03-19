import axios from 'axios';

const api = axios.create({
    // Replace with your Spring Boot server URL
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;