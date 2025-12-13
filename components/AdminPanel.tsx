import React, { useState, useMemo } from 'react';
import { Product, Order, User, CustomerType, ProductStatus, Badge, ProductUnit, ProductPackaging, ProductPortion, OrderStatus } from '../types';
import ProductTable from './ProductTable';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import WholesaleProductTable from './WholesaleProductTable';
import VisibilityMatrix from './VisibilityMatrix';
import CategoryDropdown from './CategoryDropdown';

interface AdminPanelProps {
    shopId: string;
    products: Product[];
    allCategories: string[];
    orders: Order[];
    allUsers: User[];
    roles: string[];
    badges: Badge[];
    onAddProduct: (product: Omit<Product, 'id' | 'status'>) => Promise<void>;
    onBulkAddProducts: (products: Omit<Product, 'id' | 'status'>[]) => Promise<void>;
    onDeleteProduct: (id: string) => Promise<void>;
    onCycleStatus: (id: string) => void;
    onUpdatePortions: (id: string, portion: ProductPortion) => void;
    onUpdatePrices: (id: string, prices: any) => void;
    onUpdateProductPriceTiers: (id: string, tiers: any) => void;
    onUpdateProductCostPrice: (id: string, cost?: number) => void;
    onUpdateUspPrices: (id: string, prices: any) => void;
    onBulkUpdateUspPrices: (updates: any[]) => void;
    onBulkUpdateWholesalePrices: (updates: any[]) => void;
    onUpdateUspMarkupFlags: (id: string, flags: any) => void;
    onUpdateUnitValue: (id: string, value: number) => void;
    onUpdateDetails: (id: string, details: any) => void;
    onUpdateImages: (id: string, urls: string[]) => void;
    onUpdateCategories: (id: string, cats: string[]) => void;
    onUpdateVisibility: (id: string, roles: string[]) => void;
    onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    onAddUser: (email: string, pass: string) => 'success' | 'exists';
    onDeleteUser: (id: string) => Promise<void>;
    onUpdateUserByAdmin: (id: string, updates: any) => Promise<void>;
    onCycleBadge: (id: string) => void;
    onImportData: (data: any) => Promise<void>;
    onAddRole: (role: string) => Promise<void>;
    onDeleteRole: (role: string) => Promise<void>;
    onAddBadge: (text: string, color: string) => Promise<void>;
    onDeleteBadge: (id: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
    shopId, products, allCategories, orders, allUsers, roles, badges,
    onAddProduct, onBulkAddProducts, onDeleteProduct, onCycleStatus,
    onUpdatePortions, onUpdatePrices, onUpdateProductPriceTiers, onUpdateProductCostPrice,
    onUpdateUspPrices, onBulkUpdateUspPrices, onBulkUpdateWholesalePrices, onUpdateUspMarkupFlags,
    onUpdateUnitValue, onUpdateDetails, onUpdateImages, onUpdateCategories, onUpdateVisibility,
    onUpdateOrderStatus, onAddUser, onDeleteUser, onUpdateUserByAdmin, onCycleBadge,
    onImportData, onAddRole, onDeleteRole, onAddBadge, onDeleteBadge
}) => {
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'wholesale' | 'visibility'>('products');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [uspMarkups, setUspMarkups] = useState({ usp1: '' });

    // New Product State
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');

    const filteredTableProducts = useMemo(() => {
        let filtered = products;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categories.includes(selectedCategory));
        }
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(lower));
        }
        return filtered;
    }, [products, searchTerm, selectedCategory]);

    const handleApplyMarkups = () => {
        // Logic to apply markup to products that have costPrice and useGlobalMarkup flag
        const markup = parseFloat(uspMarkups.usp1);
        if (isNaN(markup)) return;
        
        const updates: any[] = [];
        products.forEach(p => {
            if (p.costPrice && p.usp1UseGlobalMarkup) {
                const newPrice = Math.round(p.costPrice * (1 + markup / 100));
                if (newPrice !== p.usp1Price) {
                    updates.push({ productId: p.id, usp1Price: newPrice });
                }
            }
        });
        
        if (updates.length > 0) {
            onBulkUpdateUspPrices(updates);
            alert(`Обновлено цен: ${updates.length}`);
        } else {
            alert('Нет товаров для обновления (проверьте себестоимость и галочку глобальной наценки).');
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(newProductPrice) || 0;
        if (!newProductName || price <= 0) {
            alert("Пожалуйста, введите название и корректную цену.");
            return;
        }

        const product: Omit<Product, 'id' | 'status'> = {
            name: newProductName,
            pricePerUnit: price,
            unit: 'kg', // default
            unitValue: 1, // default
            packaging: 'головка', // default
            categories: selectedCategory !== 'all' ? [selectedCategory] : (allCategories.length > 0 ? [allCategories[0]] : ['Твердые']),
            imageUrls: ['https://placehold.co/400'], // placeholder
            description: '',
            allowedPortions: ['whole'],
            // other defaults
        };
        await onAddProduct(product);
        setIsAddProductOpen(false);
        setNewProductName('');
        setNewProductPrice('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
                <button onClick={() => setActiveTab('products')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Товары</button>
                <button onClick={() => setActiveTab('wholesale')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'wholesale' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Опт/Цены</button>
                <button onClick={() => setActiveTab('visibility')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'visibility' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Видимость</button>
                <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Заказы</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-medium ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Клиенты</button>
            </div>

            {activeTab === 'products' && (
                <div className="space-y-4">
                     {/* Toolbar: Search, Filter, Add */}
                     <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-2 items-center flex-1 w-full md:w-auto">
                            <CategoryDropdown categories={allCategories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
                            <input 
                                type="text" 
                                placeholder="Поиск товара..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="border rounded-md px-3 py-2 text-sm w-full"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setIsAddProductOpen(!isAddProductOpen)} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium whitespace-nowrap">
                                + Добавить товар
                            </button>
                        </div>
                     </div>
                     
                     {isAddProductOpen && (
                         <div className="bg-white p-4 rounded-lg shadow border border-green-200">
                             <h3 className="text-sm font-bold text-gray-700 mb-2">Быстрое добавление товара</h3>
                             <form onSubmit={handleCreateProduct} className="flex flex-col sm:flex-row gap-4 items-end">
                                 <div className="flex-1 w-full">
                                     <label className="block text-xs font-medium text-gray-700">Название</label>
                                     <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                                 </div>
                                 <div className="w-full sm:w-32">
                                     <label className="block text-xs font-medium text-gray-700">Цена (₽)</label>
                                     <input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                                 </div>
                                 <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">Создать</button>
                             </form>
                         </div>
                     )}

                     <ProductTable 
                        products={filteredTableProducts}
                        allCategories={allCategories}
                        onDeleteProduct={onDeleteProduct}
                        onCycleStatus={onCycleStatus}
                        onUpdatePortions={onUpdatePortions}
                        onUpdatePrices={onUpdatePrices}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateUspPrices={onUpdateUspPrices}
                        onUpdateUspMarkupFlags={onUpdateUspMarkupFlags}
                        onUpdateUnitValue={onUpdateUnitValue}
                        onUpdateDetails={onUpdateDetails}
                        onUpdateCategories={onUpdateCategories}
                        onUpdateImages={onUpdateImages}
                        onUpdateVisibility={onUpdateVisibility}
                        uspMarkups={uspMarkups}
                        setUspMarkups={setUspMarkups}
                        onApplyMarkups={handleApplyMarkups}
                        roles={roles}
                        onCycleBadge={onCycleBadge}
                     />
                </div>
            )}

            {activeTab === 'wholesale' && (
                <div className="space-y-4">
                     <WholesaleProductTable 
                        products={filteredTableProducts}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateProductCostPrice={onUpdateProductCostPrice}
                        onBulkUpdateWholesalePrices={onBulkUpdateWholesalePrices}
                        roles={roles}
                     />
                </div>
            )}
            
            {activeTab === 'visibility' && (
                <VisibilityMatrix 
                    products={filteredTableProducts}
                    onUpdateVisibility={onUpdateVisibility}
                    roles={roles}
                />
            )}

            {activeTab === 'orders' && (
                <AdminOrders 
                    orders={orders}
                    users={allUsers}
                    onUpdateStatus={onUpdateOrderStatus}
                />
            )}

            {activeTab === 'users' && (
                <AdminCustomers 
                    shopId={shopId}
                    users={allUsers}
                    orders={orders}
                    onAddUser={onAddUser}
                    onDeleteUser={onDeleteUser}
                    onUpdateUserByAdmin={onUpdateUserByAdmin}
                    roles={roles}
                    onAddRole={onAddRole}
                    onDeleteRole={onDeleteRole}
                />
            )}
        </div>
    );
};

export default AdminPanel;