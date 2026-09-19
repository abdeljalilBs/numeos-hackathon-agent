import type { AgentResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api/agent';

export const sendMessage = async (message: string, history?: string[]): Promise<AgentResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
};