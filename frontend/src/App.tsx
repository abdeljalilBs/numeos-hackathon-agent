import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Package, Sparkles, Loader2, ShoppingBag, CheckCircle2 } from 'lucide-react';

// --- TYPES ---
interface Product {
    ref: string;
    modele: string;
    prix_mad: number;
    stock: number;
    matiere?: string;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
    timestamp: Date;
}

// --- COMPOSANT PRINCIPAL ---
function App() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: "Ahlan! 👋 Ana l'agent dyal Numeos. Kifach nqder n3awnek lyoum? Bghiti t9elleb 3la chi produit?",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automatique fluide
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        const userMsg: Message = {
            id: Date.now().toString(),
            text: currentInput,
            sender: 'user',
            timestamp: new Date()
        };

        // Construire l'historique complet de la conversation (utilisateur et assistant)
        const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentInput, history: conversationHistory })
            });

            const data = await response.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.reply || "Désolé, je n'ai pas pu traiter ta demande.",
                sender: 'bot',
                products: data.action_result?.products || [],
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Erreur API:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "⚠️ Erreur de connexion au serveur. Assure-toi que le backend tourne.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">

            {/* Container Principal - Style Premium Dark */}
            <div className="w-full max-w-md h-[90vh] bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-800 relative">

                {/* Header Élégant */}
                <div className="p-5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center gap-4 z-20 sticky top-0">
                    <div className="relative group">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-slate-900 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                            Numeos Agent
                            <Sparkles size={14} className="text-emerald-400" />
                        </h1>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            En ligne • Darija & Français
                        </p>
                    </div>
                </div>

                {/* Zone de Chat */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-950/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>

                            {/* Avatar Bot */}
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mr-3 mt-auto mb-1 border border-slate-700 flex-shrink-0">
                                    <Bot size={14} className="text-emerald-400" />
                                </div>
                            )}

                            <div className={`max-w-[85%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-300
                    ${msg.sender === 'user'
                                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                                            : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* Cartes Produits - Style "Ticket Premium" */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-2">
                                                <ShoppingBag size={12} /> Sélection pour toi ({msg.products.length})
                                            </div>

                                            {msg.products.map((product) => (
                                                <div key={product.ref} className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 flex gap-3 items-center hover:border-emerald-500/30 transition-colors group/card">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-700 group-hover/card:bg-emerald-500/10 group-hover/card:border-emerald-500/30 transition-all">
                                                        <Package size={18} className="text-slate-500 group-hover/card:text-emerald-400 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">{product.modele}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                                                                {product.prix_mad} MAD
                                                            </span>
                                                            {product.stock > 0 ? (
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                    <CheckCircle2 size={10} /> En stock ({product.stock})
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-400">Rupture</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <span className={`text-[10px] text-slate-500 mt-1.5 font-medium px-1 ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>

                            {/* Avatar User */}
                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center ml-3 mt-auto mb-1 border border-emerald-600/30 flex-shrink-0">
                                    <User size={14} className="text-emerald-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Indicateur de frappe */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mr-3 border border-slate-700">
                                <Bot size={14} className="text-emerald-400" />
                            </div>
                            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-1.5 items-center h-[52px]">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Zone de Saisie Flottante */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 z-20">
                    <div className="relative flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700 focus-within:border-emerald-500/50 focus-within:bg-slate-800/80 transition-all shadow-lg">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Écris ton message en Darija ou Français..."
                            className="flex-1 bg-transparent border-none text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-0"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-600 mt-2 font-medium">
                        Propulsé par Numeos AI • Données temps réel
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;