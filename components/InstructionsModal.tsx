
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
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white my-4 mx-1 sm:mx-0">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex gap-2 items-center">
            <div className="flex gap-1 flex-shrink-0">
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 bg-white px-2 py-0.5 rounded flex-grow text-center mx-2 truncate shadow-sm">
                {title}
            </div>
        </div>
        <div className="p-3 sm:p-4 bg-gray-50 overflow-x-auto">
            {children}
        </div>
    </div>
);

const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('start');

    const menuItems = [
        { id: 'start', label: '🚀 Старт', fullLabel: 'Быстрый старт' },
        { id: 'products', label: '📦 Товары', fullLabel: 'Товары и Импорт' },
        { id: 'pricelist', label: '📊 Прайс-лист', fullLabel: 'Управление ценами' },
        { id: 'roles', label: '👥 Клиенты', fullLabel: 'Клиенты и Цены' },
        { id: 'orders', label: '🛒 Заказы', fullLabel: 'Обработка заказов' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'start':
                return (
                    <div className="space-y-6 pb-10">
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Добро пожаловать в Opt-Hub!</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Ваша платформа для мгновенного запуска оптового и розничного онлайн-магазина.
                            </p>
                        </div>
                        
                        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                            <h3 className="font-bold text-indigo-800 mb-3 text-lg flex items-center gap-2">
                                <span className="bg-indigo-200 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                                Как это работает:
                            </h3>
                            <ol className="space-y-3 text-gray-700 ml-2">
                                <li className="flex gap-3 items-start">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>Создайте магазин (достаточно Email и названия).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>Добавьте товары вручную или через Excel.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>Отправьте ссылку клиентам (они увидят каталог).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>Получайте заказы прямо в админ-панель.</span>
                                </li>
                            </ol>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-800 mb-2 px-1">Интерфейс администратора:</h3>
                            <MockBrowserWindow title="Панель управления">
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                    <div className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">Каталог</div>
                                    <div className="bg-white border text-gray-600 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">Заказы</div>
                                    <div className="bg-white border text-gray-600 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">Покупатели</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="aspect-square bg-white border rounded-lg p-2 flex flex-col gap-2 items-center justify-center shadow-sm">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full"></div>
                                            <div className="w-12 sm:w-16 h-2 bg-gray-100 rounded-full"></div>
                                        </div>
                                    ))}
                                    <div className="aspect-square bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-lg p-2 flex flex-col gap-1 items-center justify-center">
                                        <div className="text-indigo-400 font-bold text-xl">+</div>
                                        <div className="text-[10px] text-indigo-400 font-medium">Добавить</div>
                                    </div>
                                </div>
                            </MockBrowserWindow>
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-8 pb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Товары</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Добавляйте товары по одному или загружайте их сотнями через Excel таблицы.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">1</span>
                                <h3 className="text-lg font-bold text-gray-800">Массовая загрузка</h3>
                            </div>
                            <p className="text-sm text-gray-600 pl-11">
                                Перейдите на вкладку <b>"Excel"</b> или <b>"Sheets"</b> в админ-панели. Скачайте шаблон, заполните и загрузите обратно.
                            </p>
                            <div className="pl-0 sm:pl-11">
                                <MockBrowserWindow title="Импорт Excel">
                                    <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white justify-center">
                                        <div className="text-green-600 font-bold text-2xl">XLSX</div>
                                        <div className="text-sm text-gray-500 text-center">Нажмите, чтобы выбрать файл<br/>или перетащите его сюда</div>
                                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-xs font-semibold">Скачать шаблон</button>
                                    </div>
                                </MockBrowserWindow>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">2</span>
                                <h3 className="text-lg font-bold text-gray-800">Редактирование данных</h3>
                            </div>
                            <p className="text-sm text-gray-600 pl-11">
                                Кликните на название товара в общем списке для изменения описания, категории или фото.
                            </p>
                        </div>
                    </div>
                );
            case 'pricelist':
                return (
                    <div className="space-y-8 pb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Прайс-лист</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Гибкое управление ценообразованием и автоматизация расчетов.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <ul className="space-y-4 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">1.</span>
                                    <span><b>Наценки:</b> На каждый товар можно сделать наценку в Рублях или Процентах относительно себестоимости.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">2.</span>
                                    <span><b>Роли:</b> Устанавливается разная цена для разных типов покупателей (Розничный, Оптовый, VIP и др.).</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">3.</span>
                                    <span><b>Порции:</b> Выставляется спец цена в зависимости от «порции» товара. Например, за целую головку сыра (10кг) цена — 2000р/кг. Если 1/2 головки — 2100р/кг, за 1/4 — 2200р/кг.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">4.</span>
                                    <span><b>Кнопки заказа:</b> Покупатель видит до 3 кнопок: «Купить целой головкой», «Купить 1/2», «Купить 1/4».</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-indigo-500 font-bold">5.</span>
                                    <span><b>Авто-расчет:</b> Цена за килограмм автоматически перемножается на вес товара и спец цену. В корзину попадает правильный вес и сумма.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-800 mb-2 px-1 text-sm">Интерфейс «Прайс-листа» в админ-панели:</h3>
                            <MockBrowserWindow title="Редактирование прайс-листа">
                                <div className="text-[10px] text-gray-700 bg-white border border-gray-200 shadow-sm rounded">
                                    <table className="min-w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-2 border-r">НАЗВАНИЕ</th>
                                                <th className="p-2 border-r">СЕБЕСТ.</th>
                                                <th className="p-2 border-r">НАЦЕНКА</th>
                                                <th className="p-2 border-r">ЦЕНА</th>
                                                <th className="p-2 border-r">ВЕС</th>
                                                <th className="p-2 border-r">ПОРЦИИ</th>
                                                <th className="p-2">СПЕЦ.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <tr>
                                                <td className="p-2 border-r font-bold">Буйвол Каас, кг</td>
                                                <td className="p-2 border-r">900</td>
                                                <td className="p-2 border-r">% 100</td>
                                                <td className="p-2 border-r">1800</td>
                                                <td className="p-2 border-r">10</td>
                                                <td className="p-2 border-r">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="flex items-center gap-1 opacity-40">☐ 1/2</span>
                                                        <span className="flex items-center gap-1 text-indigo-600">☑ 1/4</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="space-y-1">
                                                        <div className="border border-gray-300 px-1 text-[8px] bg-gray-50">1900</div>
                                                        <div className="border border-gray-300 px-1 text-[8px] bg-gray-50">2000</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </MockBrowserWindow>
                        </div>
                    </div>
                );
            case 'roles':
                return (
                    <div className="space-y-8 pb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Клиенты и Цены</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Главная фишка Opt-Hub: показывайте разные цены разным клиентам.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-white p-4 border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
                                <h4 className="font-bold text-indigo-700 mb-1 flex justify-between">
                                    Розничный
                                    <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-600">По умолчанию</span>
                                </h4>
                                <p className="text-sm text-gray-600">Видит обычную базовую цену. Это любой гость, зашедший на сайт.</p>
                            </div>
                            <div className="bg-white p-4 border-l-4 border-green-500 rounded-r-lg shadow-sm">
                                <h4 className="font-bold text-green-700 mb-1 flex justify-between">
                                    Оптовый / VIP
                                    <span className="text-xs bg-green-100 px-2 py-0.5 rounded-full text-green-600">Спец. цена</span>
                                </h4>
                                <p className="text-sm text-gray-600">Видит цену из "Оптового прайс-листа". Вы сами назначаете эту роль клиенту.</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Как пригласить оптовика?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Не нужно регистрировать их вручную. Просто отправьте ссылку.
                            </p>
                            
                            <MockBrowserWindow title="Раздел 'Покупатели'">
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border shadow-sm">
                                        <div className="flex gap-2 items-center mb-1">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">🔗</div>
                                            <span className="text-sm font-bold text-gray-800">Ссылка для Оптовиков</span>
                                        </div>
                                        <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200 text-gray-500 font-mono break-all">
                                            opt-hub.com/join/shop123/wholesale
                                        </div>
                                        <button className="bg-green-600 text-white text-xs font-bold py-2 rounded shadow-sm">Копировать ссылку</button>
                                    </div>
                                    <div className="text-xs text-gray-500 px-1 text-center">
                                        * Клиент переходит &rarr; Регистрируется &rarr; Сразу видит оптовые цены.
                                    </div>
                                </div>
                            </MockBrowserWindow>
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="space-y-6 pb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Заказы</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Управляйте потоком заказов во вкладке <b>"Заказы"</b>.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Клиент</h4>
                                    <p className="text-xs text-gray-500 mt-1">Видно имя, телефон и адрес доставки из профиля.</p>
                                </div>
                            </div>
                            <div className="h-px bg-gray-100"></div>
                            <div className="flex items-start gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Состав</h4>
                                    <p className="text-xs text-gray-500 mt-1">Список товаров, вес и итоговая сумма.</p>
                                </div>
                            </div>
                            <div className="h-px bg-gray-100"></div>
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Статус</h4>
                                    <p className="text-xs text-gray-500 mt-1">Меняйте статус: <span className="bg-blue-50 text-blue-700 px-1 rounded">Новый</span> &rarr; <span className="bg-green-50 text-green-700 px-1 rounded">Завершен</span>.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex gap-3 items-start">
                            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold text-yellow-800 text-sm mb-1">Совет: Управление с телефона</h4>
                                <p className="text-xs text-yellow-700 leading-relaxed">
                                    Сохраните ID магазина. Вы можете зайти в админку с любого телефона, введя ID на главной странице входа.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white w-full h-full sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in-up">
                
                {/* Mobile Header (Fixed Top) */}
                <div className="md:hidden bg-white border-b border-gray-200 flex-shrink-0 z-10">
                    <div className="flex justify-between items-center p-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <span className="text-2xl">📚</span> Инструкция
                        </h3>
                        <button 
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-500 hover:text-gray-800 rounded-full active:bg-gray-100"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {/* Mobile Horizontal Tabs */}
                    <div className="px-4 pb-0 overflow-x-auto scrollbar-hide">
                        <div className="flex space-x-4 pb-3">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                                        activeTab === item.id
                                            ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-1/4 bg-gray-50 border-r border-gray-200 flex-col flex-shrink-0">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xl">
                            <span>📚</span> Инструкции
                        </h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    activeTab === item.id
                                        ? 'bg-white text-indigo-700 shadow-md border border-indigo-100 ring-1 ring-indigo-50 translate-x-1'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                {item.fullLabel}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
                        Opt-Hub Help v1.2
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                    {/* Desktop Close Button */}
                    <div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-10">
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10 scroll-smooth">
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
