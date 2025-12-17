
import React, { useState } from 'react';

interface InstructionsModalProps {
    onClose: () => void;
}

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Mock UI components to simulate screenshots using CSS/HTML
const MockBrowserWindow: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white my-4">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex gap-2 items-center">
            <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded flex-grow text-center mx-4 truncate">
                {title}
            </div>
        </div>
        <div className="p-4 bg-gray-50">
            {children}
        </div>
    </div>
);

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('start');

    const menuItems = [
        { id: 'start', label: '🚀 Быстрый старт' },
        { id: 'products', label: '📦 Товары и Импорт' },
        { id: 'roles', label: '👥 Клиенты и Цены' },
        { id: 'orders', label: '🛒 Обработка заказов' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'start':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Добро пожаловать в Opt-Hub!</h2>
                        <p className="text-gray-600">
                            Это платформа для мгновенного создания вашего онлайн-магазина. Здесь вы можете управлять товарами, назначать разные цены для разных групп клиентов (розница, опт, VIP) и получать заказы.
                        </p>
                        
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h3 className="font-semibold text-indigo-800 mb-2">Как это работает:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                <li>Вы создаете магазин (нужен только Email и название).</li>
                                <li>Добавляете товары (вручную или через Excel).</li>
                                <li>Отправляете ссылку на магазин своим клиентам.</li>
                                <li>Клиенты видят каталог и делают заказы.</li>
                                <li>Вы видите заказы в админ-панели.</li>
                            </ol>
                        </div>

                        <MockBrowserWindow title="Панель администратора">
                            <div className="flex gap-2 mb-2">
                                <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">Каталог</div>
                                <div className="bg-white border text-gray-600 text-xs px-2 py-1 rounded">Заказы</div>
                                <div className="bg-white border text-gray-600 text-xs px-2 py-1 rounded">Покупатели</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="h-20 bg-white border rounded p-2 flex flex-col gap-1 items-center justify-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                    <div className="w-16 h-2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-20 bg-white border rounded p-2 flex flex-col gap-1 items-center justify-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                    <div className="w-16 h-2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-20 bg-white border border-dashed border-indigo-300 rounded p-2 flex flex-col gap-1 items-center justify-center bg-indigo-50">
                                    <div className="text-indigo-500 font-bold">+</div>
                                    <div className="text-[10px] text-indigo-500">Добавить</div>
                                </div>
                            </div>
                        </MockBrowserWindow>
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Управление товарами</h2>
                        <p className="text-gray-600">
                            Вы можете добавлять товары по одному или загружать списком через Excel / Google Таблицы.
                        </p>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">1. Массовая загрузка (Excel)</h3>
                            <p className="text-sm text-gray-600">
                                Перейдите на вкладку <b>"Excel"</b> или <b>"Sheets"</b>. Скачайте шаблон, заполните его своими товарами и загрузите обратно.
                            </p>
                            <MockBrowserWindow title="Импорт Excel">
                                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded bg-white justify-center">
                                    <div className="text-green-600 font-bold text-lg">XLSX</div>
                                    <div className="text-sm text-gray-500">Перетащите файл сюда или нажмите для выбора</div>
                                </div>
                                <div className="mt-2 text-xs text-gray-400 text-center">Поддерживаются колонки: Название, Цена, Категория, Фото (ссылка)</div>
                            </MockBrowserWindow>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">2. Редактирование цен</h3>
                            <p className="text-sm text-gray-600">
                                На вкладке <b>"Прайс лист"</b> или <b>"Оптовый прайс-лист"</b> вы можете быстро менять цены сразу для множества товаров.
                            </p>
                        </div>
                    </div>
                );
            case 'roles':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Клиенты и Типы цен</h2>
                        <p className="text-gray-600">
                            Особенность Opt-Hub — возможность давать разные цены разным клиентам.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-4 border rounded-lg">
                                <h4 className="font-bold text-indigo-600 mb-2">Розничный</h4>
                                <p className="text-xs text-gray-500">Видит базовую цену. Обычный покупатель с улицы.</p>
                            </div>
                            <div className="bg-white p-4 border rounded-lg">
                                <h4 className="font-bold text-green-600 mb-2">Оптовый / VIP</h4>
                                <p className="text-xs text-gray-500">Видит специальную цену, которую вы задали в Оптовом прайс-листе.</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-700 mt-4">Как пригласить клиента?</h3>
                        <p className="text-sm text-gray-600">
                            Перейдите в раздел <b>"Покупатели"</b>. Там вы найдете готовые ссылки.
                        </p>
                        
                        <MockBrowserWindow title="Ссылки для регистрации">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-white p-2 rounded border">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">🔗</div>
                                        <span className="text-sm font-medium">Ссылка для Оптовиков</span>
                                    </div>
                                    <button className="bg-gray-100 text-xs px-2 py-1 rounded">Копировать</button>
                                </div>
                                <div className="text-xs text-gray-500 px-2">
                                    * Если клиент перейдет по этой ссылке, он автоматически станет "Оптовиком".
                                </div>
                            </div>
                        </MockBrowserWindow>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Обработка заказов</h2>
                        <p className="text-gray-600">
                            Все заказы попадают в раздел <b>"Заказы"</b>.
                        </p>

                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 bg-white p-4 rounded-lg border">
                            <li>Вы видите <b>имя клиента</b> и его телефон (из профиля).</li>
                            <li>Видите <b>состав заказа</b> и общую сумму.</li>
                            <li>Можете менять статус: <span className="bg-blue-100 text-blue-800 text-xs px-1 rounded">Новый</span> &rarr; <span className="bg-green-100 text-green-800 text-xs px-1 rounded">Завершен</span>.</li>
                        </ul>

                        <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Совет: Используйте ID магазина, чтобы зайти в админку с телефона.</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <span>📚</span> Инструкции
                        </h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === item.id
                                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                        Opt-Hub Help v1.0
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-end p-4">
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 pb-8">
                        <div className="max-w-3xl mx-auto">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;
