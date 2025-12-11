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
        }, {} as Record<string, User>);
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
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
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
                                <div className="w-full p-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-600 truncate">Заказ #{order.id.slice(-6)}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString('ru-RU')}</p>
                                    </div>
                                    <div className="flex-1 min-w-0 hidden sm:block">
                                        <p className="text-sm font-medium text-gray-800 truncate">{user?.email || 'Пользователь не найден'}</p>
                                        {user?.name && <p className="text-xs text-gray-500 truncate">{user.name}</p>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-base font-bold text-gray-800">{order.totalAmount.toLocaleString('ru-RU')} ₽</span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={order.status}
                                                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                                className={`text-xs font-semibold py-1 px-2 rounded-full border-0 focus:ring-2 focus:ring-indigo-400 cursor-pointer ${statusColorMap[order.status]}`}
                                            >
                                                <option value={OrderStatus.New}>Новый</option>
                                                <option value={OrderStatus.Completed}>Завершен</option>
                                                <option value={OrderStatus.Cancelled}>Отменен</option>
                                            </select>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleExpand(order.id);
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
                                            aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                                        >
                                            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 rounded-b-lg">
                                        <div className="p-4 space-y-4">
                                            {/* Customer Details Block */}
                                            {user && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
                                                    <h5 className="font-semibold text-gray-700 mb-2 border-b pb-1">Информация о покупателе</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                        <div><span className="text-gray-500">Имя:</span> {user.name || '—'}</div>
                                                        <div><span className="text-gray-500">Email:</span> {user.email}</div>
                                                        <div><span className="text-gray-500">Город:</span> {user.city || '—'}</div>
                                                        <div><span className="text-gray-500">Адрес:</span> {user.address || '—'}</div>
                                                        <div><span className="text-gray-500">Тип цен:</span> {user.customerType || 'Розничный'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Order Items Table */}
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Кол-во</th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Цена за ед.</th>
                                                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Итого</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {(order.items || []).map((item, index) => {
                                                                const quantity = item.quantity || 0;
                                                                const price = item.price || 0;
                                                                // Calculate approx unit price for display
                                                                const unitPrice = quantity > 0 ? price / quantity : 0;
                                                                return (
                                                                    <tr key={`${item.productId || 'unknown'}-${index}`} className="hover:bg-gray-50">
                                                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-normal break-words">
                                                                            {item.name || 'Товар'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                                                            {quantity.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                                                            ~{unitPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                                                                            {price.toLocaleString('ru-RU')} ₽
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50 border-t border-gray-200">
                                                            <tr>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right" colSpan={3}>Итого к оплате:</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-indigo-600 text-right">{order.totalAmount.toLocaleString('ru-RU')} ₽</td>
                                                            </tr>
                                                            {(order.totalWeight || 0) > 0 && (
                                                                <tr>
                                                                    <td className="px-4 py-2 text-xs text-gray-500 text-right" colSpan={4}>
                                                                        Расчетный общий вес: <span className="font-medium">{(order.totalWeight || 0).toFixed(2)} кг</span>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 shadow-sm">
                        Заказы не найдены.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;