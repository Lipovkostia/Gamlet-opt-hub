
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface WholesaleProductTableRowProps {
    product: Product;
    onUpdatePriceTiers: (productId: string, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: string, costPrice?: number) => void;
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; markupValue?: number; markupType?: 'percent' | 'fixed'; role?: string; }) => void;
    wholesaleRoles: string[];
}

const WholesaleProductTableRow: React.FC<WholesaleProductTableRowProps> = ({ product, onUpdatePriceTiers, onUpdateProductCostPrice, onUpdateUspPrices, wholesaleRoles }) => {
    const [editedTiers, setEditedTiers] = useState(product.priceTiers || {});
    const [localCost, setLocalCost] = useState<string>(product.costPrice?.toString() || '');
    const [isDirty, setIsDirty] = useState(false);
    
    const firstRoleMarkup = wholesaleRoles.length > 0 ? product.tierMarkups?.[wholesaleRoles[0]] : null;
    const [markupType, setMarkupType] = useState<'percent' | 'fixed'>(firstRoleMarkup?.type || 'percent');
    const [markupValue, setMarkupValue] = useState<string>(firstRoleMarkup?.value?.toString() || '');

    useEffect(() => {
        setEditedTiers(product.priceTiers || {});
        setLocalCost(product.costPrice?.toString() || '');
        const markup = wholesaleRoles.length > 0 ? product.tierMarkups?.[wholesaleRoles[0]] : null;
        setMarkupValue(markup?.value?.toString() || '');
        setMarkupType(markup?.type || 'percent');
        setIsDirty(false);
    }, [product, wholesaleRoles]);

    const calculateMarkup = (cost: number, mValue: number, mType: 'percent' | 'fixed') => {
        if (isNaN(cost) || cost === 0) return 0;
        return mType === 'percent' ? Math.round(cost * (1 + mValue / 100)) : Math.round(cost + mValue);
    };

    const applyMarkupToAllTiers = (mValueStr: string, mType: 'percent' | 'fixed', costVal?: number) => {
        const val = parseFloat(mValueStr);
        const activeCost = costVal !== undefined ? costVal : parseFloat(localCost);
        
        if (!isNaN(val) && activeCost) {
            const newPrice = calculateMarkup(activeCost, val, mType);
            if (newPrice > 0) {
                setEditedTiers(prev => {
                    const next = { ...prev };
                    wholesaleRoles.forEach(role => { next[role] = newPrice; });
                    return next;
                });
                setIsDirty(true);
            }
        }
    };

    const handleMarkupChange = (newVal: string) => {
        setMarkupValue(newVal);
        setIsDirty(true);
        applyMarkupToAllTiers(newVal, markupType);
    };

    const handleMarkupTypeChange = (newType: 'percent' | 'fixed') => {
        setMarkupType(newType);
        setIsDirty(true);
        applyMarkupToAllTiers(markupValue, newType);
    };

    const handlePriceChange = (tier: string, value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setEditedTiers(prev => {
            const newTiers = { ...prev, [tier]: numValue };
            if (numValue === undefined) delete newTiers[tier];
            return newTiers;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!isDirty) return;
        onUpdatePriceTiers(product.id, editedTiers);
        const mVal = markupValue === '' ? undefined : parseFloat(markupValue);
        wholesaleRoles.forEach(role => {
            onUpdateUspPrices(product.id, {
                costPrice: parseFloat(localCost) || undefined,
                markupValue: mVal,
                markupType: markupType,
                role: role
            });
        });
        setIsDirty(false);
    };

    const handleReset = () => {
        setEditedTiers(product.priceTiers || {});
        setLocalCost(product.costPrice?.toString() || '');
        const markup = wholesaleRoles.length > 0 ? product.tierMarkups?.[wholesaleRoles[0]] : null;
        setMarkupValue(markup?.value?.toString() || '');
        setMarkupType(markup?.type || 'percent');
        setIsDirty(false);
    };

    const handleMarkupBlur = () => { handleSave(); };
    const handlePriceBlur = () => { handleSave(); };

    const baseInputClasses = "mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm";

    return (
        <tr className={`border-b transition-colors duration-300 ${isDirty ? 'bg-yellow-50' : 'bg-white'} hover:bg-gray-50`}>
            <td className="py-2 px-2 font-medium text-gray-900">{product.name}</td>
            <td className="py-2 px-2">
                <input 
                    type="number" 
                    value={localCost} 
                    readOnly
                    className={`${baseInputClasses} bg-gray-100 text-gray-400 cursor-not-allowed font-medium border-gray-200`} 
                    placeholder="-"
                />
            </td>
            <td className="py-2 px-2">
                <div className="flex items-center h-full w-full bg-white border border-gray-300 rounded-md overflow-hidden mt-1">
                    <select
                        value={markupType}
                        onChange={(e) => handleMarkupTypeChange(e.target.value as 'percent' | 'fixed')}
                        onBlur={handleMarkupBlur}
                        className="h-8 text-[10px] bg-gray-50 border-r border-gray-300 focus:outline-none px-1 cursor-pointer text-gray-700"
                        title="Тип наценки"
                    >
                        <option value="percent">%</option>
                        <option value="fixed">₽</option>
                    </select>
                    <input 
                        type="number" 
                        value={markupValue} 
                        onChange={(e) => handleMarkupChange(e.target.value)}
                        onBlur={handleMarkupBlur}
                        onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
                        className="block w-full h-8 px-2 text-sm focus:outline-none text-gray-800"
                        placeholder="0"
                    />
                </div>
            </td>
            {wholesaleRoles.map(tier => (
                 <td key={tier} className="py-2 px-2">
                    <input 
                        type="number" 
                        value={editedTiers[tier] ?? ''} 
                        onChange={e => handlePriceChange(tier, e.target.value)} 
                        onBlur={handlePriceBlur}
                        onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
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
