import React, { useState } from 'react';
import { Product } from '../types';
import WholesaleProductTableRow from './WholesaleProductTableRow';

interface WholesaleProductTableProps {
    products: Product[];
    onUpdatePriceTiers: (productId: number, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: number, costPrice?: number) => void;
    onBulkUpdateWholesalePrices: (updates: { productId: number; newPrice: number; }[]) => void;
}

const WholesaleProductTable: React.FC<WholesaleProductTableProps> = ({ products, onUpdatePriceTiers, onUpdateProductCostPrice, onBulkUpdateWholesalePrices }) => {
    const [markup, setMarkup] = useState('');
    const [markupAmount, setMarkupAmount] = useState('');

    const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMarkup(e.target.value);
        if (e.target.value) {
            setMarkupAmount(''); // Clear the other input
        }
    };

    const handleMarkupAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMarkupAmount(e.target.value);
        if (e.target.value) {
            setMarkup(''); // Clear the other input
        }
    };

    const handleApplyMarkup = () => {
        const markupPercent = parseFloat(markup);
        const markupFixed = parseFloat(markupAmount);

        if (isNaN(markupPercent) && isNaN(markupFixed)) {
            alert('Пожалуйста, введите корректную наценку (в % или ₽).');
            return;
        }

        const updates = products.reduce((acc, product) => {
            if (product.costPrice && product.costPrice > 0) {
                let newPrice: number;
                if (!isNaN(markupPercent) && markupPercent >= 0) {
                    newPrice = Math.round(product.costPrice * (1 + markupPercent / 100));
                } else if (!isNaN(markupFixed) && markupFixed >= 0) {
                    newPrice = Math.round(product.costPrice + markupFixed);
                } else {
                    return acc; // Skip if markup is invalid
                }
                acc.push({ productId: product.id, newPrice });
            }
            return acc;
        }, [] as { productId: number; newPrice: number; }[]);


        if (updates.length > 0) {
            onBulkUpdateWholesalePrices(updates);
            alert(`Оптовая цена обновлена для ${updates.length} товаров.`);
            setMarkup('');
            setMarkupAmount('');
        } else {
            alert('Нет товаров для обновления. Убедитесь, что у товаров указана себестоимость.');
        }
    };
    
    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                        <th scope="col" className="py-3 px-2 min-w-[200px]">Название</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">себестоимость</th>
                        <th scope="col" className="py-3 px-2 min-w-[250px]">
                             <div className="flex flex-col gap-1">
                                <span>Цена Оптовый</span>
                                <div className="flex items-end gap-2">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={markup}
                                            onChange={handleMarkupChange}
                                            className="w-20 p-1 text-xs border rounded"
                                        />
                                        <input
                                            type="number"
                                            placeholder="₽"
                                            value={markupAmount}
                                            onChange={handleMarkupAmountChange}
                                            className="w-20 p-1 text-xs border rounded"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyMarkup}
                                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Применить
                                    </button>
                                </div>
                            </div>
                        </th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Цена Средний опт</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Цена Крупный опт</th>
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