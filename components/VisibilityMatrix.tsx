
import React, { useState, useMemo } from 'react';
import { Product, CustomerType, ALL_CUSTOMER_TYPES, ProductStatus } from '../types';

interface VisibilityMatrixProps {
    products: Product[];
    onUpdateVisibility: (productId: string, visibleToRoles: CustomerType[]) => void;
}

const VisibilityMatrix: React.FC<VisibilityMatrixProps> = ({ products, onUpdateVisibility }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lower = searchTerm.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lower));
    }, [products, searchTerm]);

    const isVisibleForRole = (product: Product, role: CustomerType) => {
        // If array is undefined or empty, it is visible to everyone
        if (!product.visibleToRoles || product.visibleToRoles.length === 0) {
            return true;
        }
        return product.visibleToRoles.includes(role);
    };

    const handleToggle = (product: Product, role: CustomerType) => {
        let currentRoles: CustomerType[];

        // If currently visible to all (empty array), implicit list is ALL_CUSTOMER_TYPES
        if (!product.visibleToRoles || product.visibleToRoles.length === 0) {
            currentRoles = [...ALL_CUSTOMER_TYPES];
        } else {
            currentRoles = [...product.visibleToRoles];
        }

        let newRoles: CustomerType[];
        if (currentRoles.includes(role)) {
            // Uncheck: remove from list
            newRoles = currentRoles.filter(r => r !== role);
        } else {
            // Check: add to list
            newRoles = [...currentRoles, role];
        }

        // Optimization: If all roles are selected, save as empty array (visible to all)
        // Also if array is empty (user unchecked everything), conceptually we might want to hide from all,
        // but current logic implies empty = all. 
        // To avoid confusion: If user wants to hide from ALL, they should use Status: Hidden.
        // Here, if they check everything, we reset to [].
        const isAllSelected = ALL_CUSTOMER_TYPES.every(t => newRoles.includes(t));
        
        if (isAllSelected) {
            onUpdateVisibility(product.id, []);
        } else {
            onUpdateVisibility(product.id, newRoles);
        }
    };

    const handleToggleRow = (product: Product) => {
        // Toggle between "Visible to All" and "Visible to None (in matrix context)"
        // Note: As per logic, empty array = all. So to hide from all via roles is tricky without a 'none' flag.
        // Let's implement: If fully visible -> restrict to none (empty set logic issue).
        // Let's implement: "Reset to All" vs "Select Retail Only" logic is confusing.
        // Simple logic: If currently mostly visible, clear all (except logic says empty=all).
        // Let's make the row button "Reset to All" (Check all).
        onUpdateVisibility(product.id, []);
    };

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Поиск товара..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            
            <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 bg-gray-100 min-w-[200px]">Товар</th>
                            {ALL_CUSTOMER_TYPES.map(role => (
                                <th key={role} className="px-4 py-3 text-center bg-gray-100 min-w-[100px]">
                                    {role}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center bg-gray-100">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className={`hover:bg-gray-50 ${product.status === ProductStatus.Hidden ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        {product.status === ProductStatus.Hidden && (
                                            <span className="text-xs text-red-500 font-normal">(Скрыт глобально)</span>
                                        )}
                                    </div>
                                </td>
                                {ALL_CUSTOMER_TYPES.map(role => {
                                    const isChecked = isVisibleForRole(product, role);
                                    return (
                                        <td key={role} className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggle(product, role)}
                                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleToggleRow(product)}
                                        className="text-xs text-indigo-600 hover:underline"
                                        title="Сбросить ограничения (показать всем)"
                                    >
                                        Всем
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="p-6 text-center text-gray-500">Товары не найдены</div>
                )}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <p>* Галочка означает, что товар <b>виден</b> этой роли в каталоге.</p>
                <p>* Если у товара сняты все галочки, он будет виден всем (системное поведение: "нет ограничений"). Чтобы скрыть товар полностью, используйте статус "Скрыт" в основном каталоге.</p>
            </div>
        </div>
    );
};

export default VisibilityMatrix;
