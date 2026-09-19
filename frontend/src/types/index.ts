export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
    timestamp: Date;
}

export interface Product {
    ref: string;
    modele: string;
    famille?: string;
    genre?: string;
    couleur?: string;
    taille?: string;
    matiere?: string;
    saison?: string;
    prix_mad: number;
    stock: number;
    image_url?: string;
}

export interface AgentResponse {
    reply: string;
    action_executed: boolean;
    action_result?: {
        count: number;
        products: Product[];
    };
}