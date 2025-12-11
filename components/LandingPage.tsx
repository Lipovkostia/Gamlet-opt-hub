
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, getCountFromServer, query, doc, getDoc, where } from 'firebase/firestore';
import { User, ProductStatus, Shop } from '../types';

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return hash.toString();
};

interface LandingPageProps {
    onShopCreated: (shopId: string, shopName: string) => void;
}

interface ShopWithStats extends Shop {
    userCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShopCreated }) => {
    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Super Admin State
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminLogin, setAdminLogin] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [allShops, setAllShops] = useState<ShopWithStats[]>([]);
    const [isLoadingShops, setIsLoadingShops] = useState(false);
    
    // Enter Shop State
    const [showEnterShop, setShowEnterShop] = useState(false);
    const [enterMode, setEnterMode] = useState<'id' | 'creds'>('id');
    const [enterShopId, setEnterShopId] = useState('');
    const [enterEmail, setEnterEmail] = useState('');
    const [enterPassword, setEnterPassword] = useState('');
    const [isFindingShop, setIsFindingShop] = useState(false);
    
    // User List Modal State
    const [selectedShopUsers, setSelectedShopUsers] = useState<User[]>([]);
    const [selectedShopName, setSelectedShopName] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopName || !email || !password) return;

        setIsCreating(true);
        try {
            if (!db) throw new Error("Database not connected");

            // 1. Create Shop Document
            const shopRef = await addDoc(collection(db, 'shops'), {
                name: shopName,
                ownerEmail: email,
                createdAt: new Date().toISOString()
            });

            const shopId = shopRef.id;

            // 2. Create Admin User for this shop
            const adminUser: User = {
                id: 'temp_id', // Will be replaced by firestore ID
                email: email,
                passwordHash: simpleHash(password),
                isAdmin: true,
                customerType: 'Розничный',
                name: 'Владелец'
            };
            
            // Remove ID from payload for addDoc
            const { id, ...userData } = adminUser;
            const userDocRef = await addDoc(collection(db, 'shops', shopId, 'users'), userData);

            // 3. Auto-login logic: Seed storage before switching context
            const finalAdminUser = { ...adminUser, id: userDocRef.id };
            const currentUserKey = `shop_${shopId}_currentUser`;
            const usersKey = `shop_${shopId}_users`;

            sessionStorage.setItem(currentUserKey, JSON.stringify(finalAdminUser));
            localStorage.setItem(usersKey, JSON.stringify([finalAdminUser]));

            // 4. Switch view via callback
            onShopCreated(shopId, shopName);

        } catch (error) {
            console.error("Error creating shop:", error);
            alert("Ошибка при создании магазина. Убедитесь, что Firebase настроен.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateDemoShop = async () => {
        setIsCreating(true);
        try {
            if (!db) throw new Error("Database not connected");

            const demoName = "Тестовый Магазин";
            const demoLogin = "1234";
            const demoPass = "1234";

            // 1. Create Shop
            const shopRef = await addDoc(collection(db, 'shops'), {
                name: demoName,
                ownerEmail: demoLogin,
                createdAt: new Date().toISOString()
            });
            const shopId = shopRef.id;

            // 2. Create Admin User
            const adminUser: User = {
                id: 'temp_demo_id',
                email: demoLogin,
                passwordHash: simpleHash(demoPass),
                isAdmin: true,
                customerType: 'Розничный',
                name: 'Администратор'
            };
            
            // Remove ID for Firestore
            const { id, ...userData } = adminUser;

            const userDocRef = await addDoc(collection(db, 'shops', shopId, 'users'), userData);
            
            // Auto-login logic for demo shop
            const finalAdminUser = { ...adminUser, id: userDocRef.id };
            const currentUserKey = `shop_${shopId}_currentUser`;
            const usersKey = `shop_${shopId}_users`;
            sessionStorage.setItem(currentUserKey, JSON.stringify(finalAdminUser));
            localStorage.setItem(usersKey, JSON.stringify([finalAdminUser]));

            // 3. Generate 40 Products
            const categories = ['Твердые', 'Мягкие', 'С плесенью', 'Козьи и овечьи', 'Деликатесы'];
            const adjectives = ['Свежий', 'Выдержанный', 'Домашний', 'Фермерский', 'Итальянский', 'Французский', 'Острый', 'Нежный', 'Королевский', 'Альпийский'];
            const nouns = ['Сыр', 'Творог', 'Йогурт', 'Чеддер', 'Пармезан', 'Бри', 'Камамбер', 'Рокфор', 'Гауда', 'Халуми'];
            
            const productsCollection = collection(db, 'shops', shopId, 'products');
            const promises = [];

            for (let i = 1; i <= 40; i++) {
                const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
                const noun = nouns[Math.floor(Math.random() * nouns.length)];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const isKg = i % 3 !== 0; // Mostly kg items

                const product = {
                    name: `${noun} "${adj}" №${i}`,
                    description: `Вкусный и натуральный ${noun.toLowerCase()}. Идеально подходит для завтрака или винной тарелки. Партия от ${new Date().toLocaleDateString()}.`,
                    pricePerUnit: Math.floor(Math.random() * 2000) + 300,
                    unitValue: isKg ? 1 : 1,
                    unit: isKg ? 'kg' : 'pcs',
                    packaging: isKg ? 'головка' : 'упаковка',
                    categories: [category],
                    imageUrls: [`https://picsum.photos/seed/${i * 123}/400/400`],
                    allowedPortions: isKg ? ['whole', 'half', 'quarter'] : ['whole'],
                    status: ProductStatus.Available,
                    priceOverridesPerUnit: {},
                    usp1UseGlobalMarkup: true
                };
                
                promises.push(addDoc(productsCollection, product));
            }

            await Promise.all(promises);

            onShopCreated(shopId, demoName);

        } catch (error) {
            console.error("Error creating demo shop:", error);
            alert("Ошибка создания демо магазина.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminLogin === '1' && adminPassword === '1') {
            setIsSuperAdmin(true);
            setShowAdminLogin(false);
            fetchShops();
        } else {
            alert('Неверный логин или пароль');
        }
    };
    
    // --- LOGIN LOGIC ---

    const handleEnterByShopId = async (e: React.FormEvent) => {
        e.preventDefault();
        const idToEnter = enterShopId.trim();
        if (!idToEnter) return;

        try {
            if (db) {
                const shopDocRef = doc(db, 'shops', idToEnter);
                const shopDoc = await getDoc(shopDocRef);

                if (shopDoc.exists()) {
                    onShopCreated(idToEnter, shopDoc.data().name);
                } else {
                    alert('Магазин с таким ID не найден.');
                }
            } else {
                 onShopCreated(idToEnter, 'Магазин');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка при поиске магазина.');
        }
    };

    const handleEnterByCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enterEmail || !enterPassword) return;
        setIsFindingShop(true);

        try {
            if (!db) throw new Error("DB not connected");

            // 1. Find shop by Owner Email
            const q = query(collection(db, 'shops'), where('ownerEmail', '==', enterEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert('Магазин с таким Email владельца не найден.');
                setIsFindingShop(false);
                return;
            }

            // Assume first match is the shop (one owner per shop in this simple model, or allows multiple shops but picks first)
            const shopDoc = querySnapshot.docs[0];
            const shopId = shopDoc.id;
            const shopData = shopDoc.data();

            // 2. Verify Password against the Admin User in that shop
            const usersQ = query(collection(db, 'shops', shopId, 'users'), where('email', '==', enterEmail));
            const usersSnapshot = await getDocs(usersQ);

            if (usersSnapshot.empty) {
                alert('Пользователь не найден внутри магазина (странная ошибка).');
                setIsFindingShop(false);
                return;
            }

            const userDoc = usersSnapshot.docs[0];
            const userData = userDoc.data() as User;

            if (userData.passwordHash === simpleHash(enterPassword)) {
                // Success! Inject session and redirect
                const finalUser = { ...userData, id: userDoc.id };
                const currentUserKey = `shop_${shopId}_currentUser`;
                const usersKey = `shop_${shopId}_users`; // Optional sync
                
                sessionStorage.setItem(currentUserKey, JSON.stringify(finalUser));
                
                // Let's assume onShopCreated handles the view switch
                onShopCreated(shopId, shopData.name);
            } else {
                alert('Неверный пароль.');
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Ошибка при входе.");
        } finally {
            setIsFindingShop(false);
        }
    };

    const fetchShops = async () => {
        if (!db) return;
        setIsLoadingShops(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'shops'));
            
            // Map shops and fetch user count for each
            const shopsWithCounts = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const shopData = doc.data();
                const usersColl = collection(db, 'shops', doc.id, 'users');
                let count = 0;
                try {
                    const snapshot = await getCountFromServer(usersColl);
                    count = snapshot.data().count;
                } catch (e) {
                    console.warn(`Failed to count users for shop ${doc.id}`, e);
                }

                return {
                    id: doc.id,
                    ...shopData,
                    userCount: count
                } as ShopWithStats;
            }));

            setAllShops(shopsWithCounts);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            setIsLoadingShops(false);
        }
    };
    
    const handleViewUsers = async (shop: ShopWithStats) => {
        if (!db) return;
        setSelectedShopName(shop.name);
        setIsUserModalOpen(true);
        setIsLoadingUsers(true);
        setSelectedShopUsers([]);

        try {
             const usersColl = collection(db, 'shops', shop.id, 'users');
             const snapshot = await getDocs(usersColl);
             const users = snapshot.docs.map(d => ({...d.data(), id: d.id} as User));
             setSelectedShopUsers(users);
        } catch (e) {
            console.error("Error fetching users", e);
            alert("Не удалось загрузить пользователей");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleEnterShopAsAdmin = (shop: ShopWithStats) => {
        // Create Master Admin user object directly
        const masterUser: User = {
            id: 'master-admin',
            email: 'superadmin@opt-hub.com',
            name: 'Главный Администратор',
            passwordHash: 'master',
            isAdmin: true,
            customerType: 'Розничный'
        };

        // Seed session storage directly to avoid URL reload issues
        const currentUserKey = `shop_${shop.id}_currentUser`;
        sessionStorage.setItem(currentUserKey, JSON.stringify(masterUser));

        // Switch context
        onShopCreated(shop.id, shop.name);
    };

    if (isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Панель Супер-Админа</h1>
                        <button onClick={() => setIsSuperAdmin(false)} className="text-red-600 hover:underline">Выйти</button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Список магазинов ({allShops.length})</h2>
                            <button onClick={fetchShops} className="text-sm text-indigo-600 hover:text-indigo-800">Обновить список</button>
                        </div>
                        
                        {isLoadingShops ? (
                            <div className="p-8 text-center text-gray-500">Загрузка...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-100 text-gray-700 uppercase font-medium">
                                        <tr>
                                            <th className="p-4">Название</th>
                                            <th className="p-4">ID Магазина</th>
                                            <th className="p-4">Владелец (Email)</th>
                                            <th className="p-4">Покупатели</th>
                                            <th className="p-4">Дата создания</th>
                                            <th className="p-4 text-right">Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {allShops.map((shop) => (
                                            <tr key={shop.id} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-semibold text-gray-900">{shop.name}</td>
                                                <td className="p-4 font-mono text-xs">{shop.id}</td>
                                                <td className="p-4">{shop.ownerEmail}</td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => handleViewUsers(shop)}
                                                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors font-semibold text-xs"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        {shop.userCount} чел.
                                                    </button>
                                                </td>
                                                <td className="p-4 text-xs">{shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : '-'}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleEnterShopAsAdmin(shop)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Войти как Админ
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {allShops.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">Магазины не найдены.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Users Modal */}
                {isUserModalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-5 border-b">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Пользователи магазина</h3>
                                    <p className="text-sm text-gray-500">{selectedShopName}</p>
                                </div>
                                <button 
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="p-0 overflow-auto flex-grow">
                                {isLoadingUsers ? (
                                    <div className="p-10 text-center">Загрузка пользователей...</div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-700 border-b sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Роль</th>
                                                <th className="px-6 py-3 font-medium">Email (Логин)</th>
                                                <th className="px-6 py-3 font-medium">Имя</th>
                                                <th className="px-6 py-3 font-medium">Тип клиента</th>
                                                <th className="px-6 py-3 font-medium">Пароль (Hash)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedShopUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3">
                                                        {user.isAdmin ? (
                                                            <span className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full">Админ</span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-full">Покупатель</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-gray-900">{user.email}</td>
                                                    <td className="px-6 py-3">{user.name || '-'}</td>
                                                    <td className="px-6 py-3">{user.customerType || 'Розничный'}</td>
                                                    <td className="px-6 py-3 font-mono text-xs text-gray-500 break-all">{user.passwordHash}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                {!isLoadingUsers && selectedShopUsers.length === 0 && (
                                    <div className="p-10 text-center text-gray-500">Пользователей нет.</div>
                                )}
                            </div>
                            <div className="p-4 border-t bg-gray-50 text-right">
                                <button 
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium text-sm"
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 relative">
            {/* Enter Shop Modal */}
            {showEnterShop && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Вход в магазин</h2>
                        
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                className={`flex-1 py-2 text-sm font-medium ${enterMode === 'id' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setEnterMode('id')}
                            >
                                По ID Магазина
                            </button>
                            <button
                                className={`flex-1 py-2 text-sm font-medium ${enterMode === 'creds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setEnterMode('creds')}
                            >
                                Владелец (Логин)
                            </button>
                        </div>

                        {enterMode === 'id' ? (
                            <form onSubmit={handleEnterByShopId} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Магазина</label>
                                    <input 
                                        type="text" 
                                        value={enterShopId}
                                        onChange={e => setEnterShopId(e.target.value)}
                                        placeholder="Введите ID"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">ID можно узнать у владельца магазина.</p>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowEnterShop(false)}
                                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Войти
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleEnterByCredentials} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Владельца</label>
                                    <input 
                                        type="text" 
                                        value={enterEmail}
                                        onChange={e => setEnterEmail(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Пароль</label>
                                    <input 
                                        type="password" 
                                        value={enterPassword}
                                        onChange={e => setEnterPassword(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowEnterShop(false)}
                                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isFindingShop}
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isFindingShop ? 'Поиск...' : 'Войти'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Super Admin Login Modal */}
            {showAdminLogin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Вход Супер-Админа</h2>
                        <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Логин</label>
                                <input 
                                    type="text" 
                                    value={adminLogin}
                                    onChange={e => setAdminLogin(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Пароль</label>
                                <input 
                                    type="password" 
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAdminLogin(false)}
                                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Отмена
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Войти
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col justify-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Opt-Hub
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                        Платформа для создания собственных оптовых и розничных онлайн-магазинов за 1 минуту.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Свой каталог товаров
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Управление клиентами и заказами
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Уникальная ссылка для ваших покупателей
                        </li>
                    </ul>
                </div>

                <div className="flex-1 bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Создать магазин</h2>
                    <form onSubmit={handleCreateShop} className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Название магазина</label>
                            <input 
                                type="text" 
                                required
                                value={shopName}
                                onChange={e => setShopName(e.target.value)}
                                placeholder="Мой Сырный Бутик"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ваш Email (Логин администратора)</label>
                            <input 
                                type="text" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="owner@example.com"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Пароль администратора</label>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isCreating}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Создание...' : 'Запустить магазин'}
                        </button>
                    </form>

                     <div className="mt-6 pt-6 border-t border-gray-200">
                        <button 
                            type="button"
                            onClick={handleCreateDemoShop}
                            disabled={isCreating}
                            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 text-sm"
                        >
                             🚀 Создать Тестовый Магазин (Demo)
                             <span className="block text-xs font-normal text-gray-500 mt-1">Логин: 1234 / Пароль: 1234 / 40 товаров</span>
                        </button>
                    </div>

                    <div className="mt-4 text-center space-y-2">
                        <button 
                            onClick={() => setShowEnterShop(true)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            Уже есть магазин? Войти
                        </button>
                        <div>
                             <button 
                                onClick={() => setShowAdminLogin(true)}
                                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                                Вход для главного админа
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
