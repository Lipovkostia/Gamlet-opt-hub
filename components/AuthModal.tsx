import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface AuthModalProps {
    mode: 'login' | 'register';
    onClose: () => void;
    onSwitchMode: (mode: 'login' | 'register') => void;
}

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, register } = useContext(AuthContext);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (mode === 'login') {
            const result = login(email, password);
            if (result === 'success') {
                onClose();
            } else if (result === 'not_found') {
                setError('Пользователь с таким логином не найден.');
            } else {
                setError('Неверный пароль.');
            }
        } else {
            const result = register(email, password);
            if (result === 'success') {
                onClose();
            } else {
                setError('Пользователь с таким логином уже существует.');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" role="dialog" aria-modal="true">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === 'login' ? 'Вход' : 'Регистрация'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Логин</label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                    <p className="text-sm text-center text-gray-600">
                        {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                        <button
                            type="button"
                            onClick={() => onSwitchMode(mode === 'login' ? 'register' : 'login')}
                            className="font-medium text-indigo-600 hover:underline ml-1"
                        >
                           {mode === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;