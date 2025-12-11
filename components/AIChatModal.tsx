import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product, ProductPortion, CartItem } from '../types';

interface AIChatModalProps {
    products: Product[];
    onClose: () => void;
    onAddToCart: (product: Product, portion: ProductPortion) => void;
}

interface AICartItemProposal {
    productId: string;
    productName: string;
    quantity: number;
    portion: ProductPortion;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    proposedItems?: AICartItemProposal[];
    isAdded?: boolean;
}

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const AIChatModal: React.FC<AIChatModalProps> = ({ products, onClose, onAddToCart }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: 'Привет! Я ваш умный помощник. Напишите, что вы хотите купить (например, "хочу полкило пармезана и головку бри"), и я соберу для вас корзину.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Prepare catalog context for the AI
    const catalogContext = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.pricePerUnit,
        unit: p.unit,
        packaging: p.packaging,
        allowedPortions: p.allowedPortions
    }));

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const responseSchema: Schema = {
                type: Type.OBJECT,
                properties: {
                    responseText: { type: Type.STRING, description: "Friendly answer to the customer." },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                productId: { type: Type.STRING },
                                quantity: { type: Type.NUMBER, description: "Quantity or weight. For items sold by piece/packaging, this is the count. For items sold by kg, this is the weight in unitValue (e.g. 1.5 for 1.5kg or 1.5 units)." },
                                portion: { type: Type.STRING, enum: ["whole", "half", "quarter"], description: "Portion type. Default 'whole' if not specified." }
                            },
                            required: ["productId", "quantity", "portion"]
                        }
                    }
                },
                required: ["responseText", "items"]
            };

            const model = ai.models.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: `You are a helpful grocery shopping assistant. 
                Here is the product catalog JSON: ${JSON.stringify(catalogContext)}.
                
                Your goal is to interpret the user's request and match it to products in the catalog.
                
                Rules:
                1. If the user asks for a product, find the best match by ID.
                2. Calculate quantities carefully. 
                   - If user says "500g", and unit is 'kg', quantity is 0.5.
                   - If user says "2 heads", quantity is 2.
                3. Respect 'allowedPortions'. If a product only allows 'whole', do not suggest 'half'.
                4. Do not hallucinate products. Only use IDs from the provided catalog.
                5. If the request is unclear, just ask for clarification in 'responseText' and leave 'items' empty.
                6. Respond in Russian.`
            });

            const result = await model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: input }] }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });

            const responseData = JSON.parse(result.response.text());
            
            // Enrich items with names for display
            const proposedItems: AICartItemProposal[] = (responseData.items || []).map((item: any) => {
                const product = products.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    productName: product ? product.name : 'Unknown Item',
                    quantity: item.quantity,
                    portion: item.portion as ProductPortion
                };
            }).filter((i: AICartItemProposal) => i.productName !== 'Unknown Item');

            const modelMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseData.responseText,
                proposedItems: proposedItems.length > 0 ? proposedItems : undefined
            };

            setMessages(prev => [...prev, modelMsg]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: 'Извините, произошла ошибка при обработке запроса. Попробуйте еще раз.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddProposedItems = (messageId: string, items: AICartItemProposal[]) => {
        items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                // Determine how many times to add based on quantity vs unitValue
                // For simplicity in this logic: if quantity is count (e.g. 2 pieces), loop add.
                // If quantity is weight (e.g. 0.5kg), the cart logic expects separate entries or we treat quantity as multiplier.
                // The current app `handleAddToCart` adds 1 unit of `portion`.
                
                // Simplified Logic: 
                // Since `onAddToCart` adds +1 quantity to a specific cartId (prod+portion).
                // We will call it Math.ceil(item.quantity) times. 
                // *Refinement needed for precise weight support in chat, but currently cart logic is piece/portion based.*
                
                // Assuming item.quantity is the number of "units" or "portions" needed.
                // If item.quantity is 0.5 and it's a weighted item, user likely meant "Half portion".
                
                let loopCount = Math.max(1, Math.round(item.quantity));
                
                // Special handling if AI returns fractional quantity for 'whole' that implies portion
                if (item.portion === 'whole' && item.quantity < 1 && product.unit === 'kg') {
                    // Try to map to portion
                    if (item.quantity === 0.5 && product.allowedPortions.includes('half')) {
                        onAddToCart(product, 'half');
                        return;
                    }
                     if (item.quantity === 0.25 && product.allowedPortions.includes('quarter')) {
                        onAddToCart(product, 'quarter');
                        return;
                    }
                }

                for(let i = 0; i < loopCount; i++) {
                    onAddToCart(product, item.portion);
                }
            }
        });

        // Mark message as processed to disable button
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAdded: true } : m));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-yellow-300" />
                        <h2 className="text-lg font-bold">ИИ-Помощник</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                
                                {msg.proposedItems && msg.proposedItems.length > 0 && (
                                    <div className="mt-3 bg-indigo-50 rounded-lg p-2 border border-indigo-100">
                                        <p className="text-xs font-bold text-indigo-800 mb-2 uppercase tracking-wide">Предлагаемый заказ:</p>
                                        <ul className="space-y-1 mb-3">
                                            {msg.proposedItems.map((item, idx) => (
                                                <li key={idx} className="text-xs text-gray-700 flex justify-between border-b border-indigo-100 pb-1 last:border-0">
                                                    <span>{item.productName} ({item.portion === 'whole' ? 'цел.' : item.portion === 'half' ? '1/2' : '1/4'})</span>
                                                    <span className="font-mono font-semibold">x{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {msg.isAdded ? (
                                            <div className="text-center py-1 text-xs font-bold text-green-600 bg-green-100 rounded">
                                                ✓ Добавлено в корзину
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddProposedItems(msg.id, msg.proposedItems!)}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                                            >
                                                Добавить всё в корзину
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="bg-white rounded-2xl p-3 border border-gray-200 rounded-bl-none flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Например: Мне нужно 2 кг чеддера..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;
