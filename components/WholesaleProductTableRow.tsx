
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface WholesaleProductTableRowProps {
    product: Product;
    onUpdatePriceTiers: (productId: string, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: string, newCostPrice?: number) => void;
    wholesaleRoles: string[];
}

const WholesaleProductTableRow: React.FC<WholesaleProductTableRowProps> = ({ product, onUpdatePriceTiers, onUpdateProductCostPrice, wholesaleRoles }) => {
    const [editedTiers, setEditedTiers] = useState(product.priceTiers || {});
    // Removed editable cost price state
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setEditedTiers(product.priceTiers || {});
        setIsDirty(false);
    }, [product]);

    const handlePriceChange = (tier: string, value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setEditedTiers(prev => {
            const newTiers = { ...prev, [tier]: numValue };
            if (numValue === undefined) {
                delete newTiers[tier];
            }
            return newTiers;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!isDirty) return;
        onUpdatePriceTiers(product.id, editedTiers);
        // Cost price update removed from here
        setIsDirty(false);
    };
    
    const handleReset = () => {
        setEditedTiers(product.priceTiers || {});
        setIsDirty(false);
    };

    const baseInputClasses = "mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm";

    return (
        <tr className={`border-b transition-colors duration-300 ${isDirty ? 'bg-yellow-50' : 'bg-white'} hover:bg-gray-50`}>
            <td className="py-2 px-2 font-medium text-gray-900">{product.name}</td>
            <td className="py-2 px-2">
                <input 
                    type="number" 
                    value={product.costPrice ?? ''} // Read directly from product props
                    disabled // Disable editing
                    className={`${baseInputClasses} bg-gray-100 text-gray-500 cursor-not-allowed`} 
                    placeholder="-"
                />
            </td>
            {wholesaleRoles.map(tier => (
                 <td key={tier} className="py-2 px-2">
                    <input 
                        type="number" 
                        value={editedTiers[tier] ?? ''} 
                        onChange={e => handlePriceChange(tier, e.target.value)} 
                        className={baseInputClasses} 
                        placeholder="-"
                    />
                </td>
            ))}
            <td className="py-2 px-2 text-center align-middle">
                <div className="flex items-center justify-center gap-2 h-full">
                    <button onClick={handleSave} disabled={!isDirty} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Сохранить
                    </button>
                    <button onClick={handleReset} disabled={!isDirty} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Сброс
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default WholesaleProductTableRow;
