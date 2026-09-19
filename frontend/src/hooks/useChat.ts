import { useState, useCallback } from 'react';
import type { Message } from '../types';
import { sendMessage } from '../services/agentService';

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: "Ahlan! 👋 Ana l'agent dyal Numeos. Kifach nqder n3awnek lyoum? Bghiti t9elleb 3la chi produit?",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const sendUserMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        const userHistory = messages
            .filter(msg => msg.sender === 'user')
            .map(msg => msg.text);

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const data = await sendMessage(text, userHistory);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.reply || "Désolé, j'ai eu un souci technique.",
                sender: 'bot',
                products: data.action_result?.products,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Erreur envoi message:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Erreur de connexion au serveur. Vérifie que le backend tourne.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    return { messages, isLoading, sendUserMessage };
};