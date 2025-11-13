import React, { useState } from 'react';
import { User, Order } from '../types';

interface AccountModalProps {
    user: User;
    orders: Order[];
    onClose: () => void;
    onUpdateDetails: (userId: number, details: { name: string; city: string; address: string; }) => void;
    onChangePassword: (userId: number, oldPassword: string, newPassword: string) => 'success' | 'wrong_password';
}

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const AccountModal: React.FC<AccountModalProps> = ({ user, orders, onClose, onUpdateDetails, onChangePassword }) => {
    const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
    
    // State for profile details form
    const [details, setDetails] = useState({
        name: user.name || '',
        city: user.city || '',
        address: user.address || '',
    });
    const [detailsMessage, setDetailsMessage] = useState('');

    // State for password change form
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordMessage, setPasswordMessage] = useState('');
    const [isPasswordError, setIsPasswordError] = useState(false);

    const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetails(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateDetails(user.id, details);
        setDetailsMessage('Данные успешно сохранены!');
        setTimeout(() => setDetailsMessage(''), 3000);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setIsPasswordError(false);

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordMessage('Новые пароли не совпадают.');
            setIsPasswordError(true);
            return;
        }
        if (passwords.newPassword.length < 1) {
             setPasswordMessage('Пароль не может быть пустым.');
             setIsPasswordError(true);
             return;
        }

        const result = onChangePassword(user.id, passwords.oldPassword, passwords.newPassword);
        if (result === 'success') {
            setPasswordMessage('Пароль успешно изменен!');
            setIsPasswordError(false);
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: ''});
        } else {
            setPasswordMessage('Неверный старый пароль.');
            setIsPasswordError(true);
        }
    };
    
    const TabButton: React.FC<{tabId: 'orders' | 'profile', children: React.ReactNode}> = ({tabId, children}) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => setActiveTab(tabId)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none -mb-px border-b-2 ${isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
                {children}
            </button>
        )
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true">
                 <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Личный кабинет</h2>
                        <p className="text-sm text-gray-500">{user.name || user.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="border-b border-gray-200 px-4">
                    <nav className="flex space-x-4" aria-label="Tabs">
                       <TabButton tabId="orders">История заказов</TabButton>
                       <TabButton tabId="profile">Личные данные</TabButton>
                    </nav>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'orders' && (
                        <>
                            {orders.length > 0 ? (
                                <div className="space-y-6">
                                    {orders.map(order => (
                                        <div key={order.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3 pb-3 border-b">
                                                <div>
                                                    <p className="font-semibold">Заказ от {new Date(order.date).toLocaleDateString('ru-RU')}</p>
                                                    <p className="text-xs text-gray-500">ID: {order.id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{order.totalAmount.toLocaleString('ru-RU')} ₽</p>
                                                    <p className="text-sm text-gray-500">{order.totalWeight.toFixed(2)} кг</p>
                                                </div>
                                            </div>
                                            <ul className="space-y-2 text-sm">
                                                {order.items.map((item, index) => (
                                                    <li key={`${item.productId}-${index}`} className="flex justify-between">
                                                        <span>{item.name} <span className="text-gray-500">x {item.quantity.toFixed(2)} кг</span></span>
                                                        <span>{item.price.toLocaleString('ru-RU')} ₽</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">У вас еще нет заказов.</p>
                            )}
                        </>
                    )}
                    
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700">Контактная информация</h3>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Имя</label>
                                    <input type="text" id="name" name="name" value={details.name} onChange={handleDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                 <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">Город</label>
                                    <input type="text" id="city" name="city" value={details.city} onChange={handleDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Точный адрес</label>
                                    <input type="text" id="address" name="address" value={details.address} onChange={handleDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        Сохранить данные
                                    </button>
                                    {detailsMessage && <p className="text-sm text-green-600">{detailsMessage}</p>}
                                </div>
                            </form>
                            
                            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-8 border-t">
                                 <h3 className="text-lg font-semibold text-gray-700">Смена пароля</h3>
                                 <div>
                                    <label htmlFor="oldPassword"className="block text-sm font-medium text-gray-700">Старый пароль</label>
                                    <input type="password" id="oldPassword" name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700">Новый пароль</label>
                                    <input type="password" id="newPassword" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">Подтвердите новый пароль</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                 <div className="flex items-center gap-4">
                                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                        Сменить пароль
                                    </button>
                                    {passwordMessage && <p className={`text-sm ${isPasswordError ? 'text-red-600' : 'text-green-600'}`}>{passwordMessage}</p>}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountModal;