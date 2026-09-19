import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Package, Loader2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import type { Message } from '../types';

export const ChatInterface = () => {
    const { messages, isLoading, sendUserMessage } = useChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            sendUserMessage(input);
            setInput('');
        }
    };

    const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="w-full max-w-md h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

                {/* Header */}
                <div className="bg-[#075E54] text-white p-4 flex items-center gap-3 shadow-md">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Numeos Agent</h1>
                        <p className="text-xs text-green-100 opacity-90">En ligne • Darija & Français</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] custom-scrollbar">
                    {messages.map((msg: Message) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'user'
                                    ? 'bg-[#dcf8c6] rounded-tr-none'
                                    : 'bg-white rounded-tl-none'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>

                                {msg.products && msg.products.length > 0 && (
                                    <div className="mt-3 space-y-2 border-t border-black/5 pt-2">
                                        <p className="text-xs font-semibold text-[#075E54] flex items-center gap-1">
                                            <Package size={12} /> Produits ({msg.products.length})
                                        </p>
                                        {msg.products.map(product => (
                                            <div key={product.ref} className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex gap-2">
                                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                    <Package size={16} className="text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-xs truncate">{product.modele}</p>
                                                    <p className="text-[10px] text-gray-500">{product.prix_mad} MAD • Stock: {product.stock}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <span className="text-[10px] text-gray-400 block text-right mt-1">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-gray-50 p-3 border-t border-gray-200 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Écris en Darija ou Français..."
                        className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#128C7E]"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};