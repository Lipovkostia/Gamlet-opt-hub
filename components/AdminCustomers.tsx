
import React, { useState, useMemo } from 'react';
import { User, Order, CustomerType } from '../types';

interface AdminCustomersProps {
    shopId: string;
    users: User[];
    orders: Order[];
    onAddUser: (email: string, password: string) => 'success' | 'exists';
    onDeleteUser: (userId: string) => void;
    onUpdateUserByAdmin: (userId: string, updates: Partial<User> & { newPassword?: string }) => void;
    roles: string[];
    onAddRole: (role: string) => void;
    onDeleteRole: (role: string) => void;
}

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PencilIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

const LinkIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const UserEditor: React.FC<{ user: User; roles: string[]; onSave: (updates: Partial<User> & { newPassword?: string }) => void; onCancel: () => void; }> = ({ user, roles, onSave, onCancel }) => {
    const [name, setName] = useState(user.name || '');
    const [city, setCity] = useState(user.city || '');
    const [address, setAddress] = useState(user.address || '');
    const [newPassword, setNewPassword] = useState('');
    const [customerType, setCustomerType] = useState(user.customerType || 'Розничный');

    const handleSave = () => {
        const updates: Partial<User> & { newPassword?: string } = {
            name: name.trim(),
            city: city.trim(),
            address: address.trim(),
            customerType: customerType,
        };
        if (newPassword) {
            updates.newPassword = newPassword;
        }
        onSave(updates);
    };

    return (
        <div className="p-4 bg-gray-100 space-y-4">
            <h4 className="font-semibold text-gray-700">Редактировать: {user.email}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Имя</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Тип покупателя</label>
                    <select 
                        value={customerType} 
                        onChange={(e) => setCustomerType(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Город</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Адрес</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
                <p className="text-xs text-gray-500">Оставьте пустым, чтобы не менять</p>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Отмена</button>
                <button onClick={handleSave} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Сохранить</button>
            </div>
        </div>
    );
};


const AdminCustomers: React.FC<AdminCustomersProps> = ({ shopId, users, orders, onAddUser, onDeleteUser, onUpdateUserByAdmin, roles, onAddRole, onDeleteRole }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState('');

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setGeneratedLink('');

        if (!login || !password) {
            setError('Логин и пароль обязательны.');
            return;
        }

        const result = onAddUser(login, password);

        if (result === 'success') {
            setSuccess(`Пользователь ${login} успешно добавлен.`);
            
            // Generate auto-login link
            // NOTE: Passing password in URL is not secure for production but acceptable for this specific MVP context
            const origin = window.location.origin;
            const path = window.location.pathname;
            const link = `${origin}${path}?shopId=${shopId}&autoLogin=${encodeURIComponent(login)}&p=${encodeURIComponent(password)}`;
            setGeneratedLink(link);

            setLogin('');
            setPassword('');
        } else {
            setError(`Пользователь с логином ${login} уже существует.`);
        }
    };

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoleName.trim()) {
            onAddRole(newRoleName.trim());
            setNewRoleName('');
        }
    }

    const customers = useMemo(() => {
        const customerUsers = users.filter(u => !u.isAdmin);
        if (!searchTerm.trim()) {
            return customerUsers;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        return customerUsers.filter(u => 
            u.email.toLowerCase().includes(lowercasedSearchTerm) ||
            u.name?.toLowerCase().includes(lowercasedSearchTerm)
        );
    }, [users, searchTerm]);
    
    const ordersByUser = useMemo(() => {
        return orders.reduce((acc, order) => {
            acc[order.userId] = (acc[order.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [orders]);

    const handleCustomerTypeChange = (userId: string, customerType: CustomerType) => {
        onUpdateUserByAdmin(userId, { customerType });
    };

    const handleSaveUserDetails = (userId: string, updates: Partial<User> & { newPassword?: string }) => {
        onUpdateUserByAdmin(userId, updates);
        setExpandedUserId(null); // Close editor on save
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Ссылка скопирована в буфер обмена');
    }

    const generateRegistrationLink = (type: string) => {
        const origin = window.location.origin;
        const path = window.location.pathname;
        return `${origin}${path}?shopId=${shopId}&registerType=${encodeURIComponent(type)}`;
    }


    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Manual Add User Form & Role Management */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Ручное добавление покупателя</h3>
                        <form onSubmit={handleAddUser} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {success && <p className="text-green-600 text-sm">{success}</p>}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="login-add" className="block text-sm font-medium text-gray-700">Логин</label>
                                    <input
                                        type="text"
                                        id="login-add"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        placeholder="Введите логин"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password-add"className="block text-sm font-medium text-gray-700">Пароль</label>
                                    <input
                                        type="password"
                                        id="password-add"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>

                        {generatedLink && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-bold text-green-800 mb-2">Ссылка для входа:</p>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={generatedLink} 
                                        className="text-xs w-full p-2 border border-green-300 rounded bg-white text-gray-700 font-mono"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(generatedLink)}
                                        className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 whitespace-nowrap"
                                    >
                                        Копировать
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Управление ролями</h3>
                        <div className="p-4 border rounded-lg bg-white space-y-4">
                            <form onSubmit={handleCreateRole} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="Название новой роли"
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newRoleName.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Создать
                                </button>
                            </form>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(role => (
                                    <div key={role} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-800 border border-gray-200">
                                        <span>{role}</span>
                                        {role !== 'Розничный' && (
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`Удалить роль "${role}"?`)) onDeleteRole(role);
                                                }}
                                                className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                                                title="Удалить роль"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Self-Registration Links */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Ссылки для самостоятельной регистрации</h3>
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b">
                            <p className="text-sm text-gray-600">
                                Отправьте эти ссылки клиентам. При регистрации по ним, клиенту автоматически будет присвоен выбранный тип цен.
                            </p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                            {roles.map(type => {
                                const link = generateRegistrationLink(type);
                                return (
                                    <div key={type} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
                                                <LinkIcon className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">{type}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <input 
                                                readOnly 
                                                value={link} 
                                                className="flex-grow sm:w-48 text-xs p-2 border border-gray-300 rounded bg-gray-50 text-gray-500 font-mono"
                                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                            />
                                            <button 
                                                onClick={() => copyToClipboard(link)}
                                                className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-100 whitespace-nowrap transition-colors"
                                            >
                                                Копировать
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Список покупателей</h3>
                 <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Поиск по логину или имени..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full max-w-md bg-white border border-gray-300 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Поиск по покупателям"
                    />
                </div>
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" className="py-3 px-6">Логин</th>
                                <th scope="col" className="py-3 px-6">Имя</th>
                                <th scope="col" className="py-3 px-6">Тип покупателя</th>
                                <th scope="col" className="py-3 px-6">Кол-во заказов</th>
                                <th scope="col" className="py-3 px-6 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(user => (
                                <React.Fragment key={user.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50">
                                        <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{user.email}</td>
                                        <td className="py-4 px-6">{user.name || '-'}</td>
                                        <td className="py-4 px-6">
                                            <select 
                                                value={user.customerType || 'Розничный'} 
                                                onChange={(e) => handleCustomerTypeChange(user.id, e.target.value as CustomerType)}
                                                className="block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                {roles.map(type => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-4 px-6 text-center">{ordersByUser[user.id] || 0}</td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => setExpandedUserId(prevId => prevId === user.id ? null : user.id)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
                                                title="Редактировать данные"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                <span>{expandedUserId === user.id ? 'Закрыть' : 'Редакт.'}</span>
                                            </button>
                                            <button onClick={() => onDeleteUser(user.id)} className="text-red-500 hover:text-red-700 inline-flex" title="Удалить пользователя">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedUserId === user.id && (
                                        <tr className="bg-gray-50 border-b">
                                            <td colSpan={5} className="p-0">
                                                <UserEditor 
                                                    user={user} 
                                                    roles={roles}
                                                    onSave={(updates) => handleSaveUserDetails(user.id, updates)}
                                                    onCancel={() => setExpandedUserId(null)}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                     {customers.length === 0 && (
                        <p className="p-6 text-center text-gray-500">Покупатели не найдены.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCustomers;
