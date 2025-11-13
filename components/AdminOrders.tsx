import React, { useState, useMemo } from 'react';
import { Order, User, OrderStatus } from '../types';

interface AdminOrdersProps {
    orders: Order[];
    users: User[];
    onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const statusDisplayMap: Record<OrderStatus, string> = {
    [OrderStatus.New]: 'Новый',
    [OrderStatus.Completed]: 'Завершен',
    [OrderStatus.Cancelled]: 'Отменен'
};

const statusColorMap: Record<OrderStatus, string> = {
    [OrderStatus.New]: 'bg-blue-100 text-blue-800',
    [OrderStatus.Completed]: 'bg-green-100 text-green-800',
    [OrderStatus.Cancelled]: 'bg-red-100 text-red-800'
};

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, users, onUpdateStatus }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const userMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<number, User>);
    }, [users]);

    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders]);
    
    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) {
            return sortedOrders;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        return sortedOrders.filter(order => {
            const user = userMap[order.userId];
            return (
                order.id.toLowerCase().includes(lowercasedSearchTerm) ||
                (user && user.email.toLowerCase().includes(lowercasedSearchTerm))
            );
        });
    }, [sortedOrders, searchTerm, userMap]);

    const handleToggleExpand = (orderId: string) => {
        setExpandedOrderId(currentId => (currentId === orderId ? null : orderId));
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Управление Заказами</h3>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Поиск по ID заказа или email клиента..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full max-w-md bg-white border border-gray-300 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label="Поиск по заказам"
                />
            </div>
            
            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                        const user = userMap[order.userId];
                        const isExpanded = expandedOrderId === order.id;
                        return (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                <button 
                                    onClick={() => handleToggleExpand(order.id)}
                                    className="w-full text-left p-4 focus:outline-none"
                                    aria-expanded={isExpanded}
                                    aria-controls={`order-details-${order.id}`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-indigo-600 truncate">Заказ #{order.id.slice(-6)}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString('ru-RU')}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{user?.email || 'Пользователь не найден'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-base font-bold text-gray-800">{order.totalAmount.toLocaleString('ru-RU')} ₽</span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                                onClick={(e) => e.stopPropagation()} // Prevent expansion when changing status
                                                className={`text-xs font-semibold py-1 px-2 rounded-full border-0 focus:ring-2 focus:ring-indigo-400 ${statusColorMap[order.status]}`}
                                            >
                                                <option value={OrderStatus.New}>Новый</option>
                                                <option value={OrderStatus.Completed}>Завершен</option>
                                                <option value={OrderStatus.Cancelled}>Отменен</option>
                                            </select>
                                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </button>
                                <div 
                                    id={`order-details-${order.id}`}
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="border-t border-gray-200 p-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Состав заказа:</h4>
                                            <ul className="space-y-2 text-sm">
                                                {order.items.map((item, index) => (
                                                    <li key={`${item.productId}-${index}`} className="flex justify-between items-center text-gray-600">
                                                        <span>{item.name} <span className="text-gray-500">({item.quantity.toFixed(2)} кг)</span></span>
                                                        <span>{item.price.toLocaleString('ru-RU')} ₽</span>
                                                    </li>
                                                ))}
                                            </ul>
                                             <div className="text-right text-sm font-semibold text-gray-500 mt-2 pt-2 border-t">
                                                Общий вес: ~{order.totalWeight.toFixed(2)} кг
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-gray-500 py-8">Заказы не найдены.</p>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
