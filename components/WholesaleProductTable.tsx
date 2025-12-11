
import React, { useState } from 'react';
import { Product } from '../types';
import WholesaleProductTableRow from './WholesaleProductTableRow';

interface WholesaleProductTableProps {
    products: Product[];
    onUpdatePriceTiers: (productId: string, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: string, costPrice?: number) => void;
    onBulkUpdateWholesalePrices: (updates: { productId: string; newPrice: number; }[]) => void;
    roles: string[];
}

const WholesaleProductTable: React.FC<WholesaleProductTableProps> = ({ products, onUpdatePriceTiers, onUpdateProductCostPrice, onBulkUpdateWholesalePrices, roles }) => {
    // Filter out 'Retail' or 'Розничный' as it uses base price
    const wholesaleRoles = roles.filter(r => r !== 'Розничный');

    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                        <th scope="col" className="py-3 px-2 min-w-[200px]">Название</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">себестоимость</th>
                        {wholesaleRoles.map(role => (
                            <th key={role} scope="col" className="py-3 px-2 min-w-[150px]">
                                Цена {role}
                            </th>
                        ))}
                        <th scope="col" className="py-3 px-2 w-40 text-center">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <WholesaleProductTableRow 
                            key={product.id}
                            product={product}
                            onUpdatePriceTiers={onUpdatePriceTiers}
                            onUpdateProductCostPrice={onUpdateProductCostPrice}
                            wholesaleRoles={wholesaleRoles}
                        />
                    ))}
                </tbody>
            </table>
             {products.length === 0 && (
                <p className="p-6 text-center text-gray-500">Товары не найдены.</p>
            )}
        </div>
    );
};

export default WholesaleProductTable;
