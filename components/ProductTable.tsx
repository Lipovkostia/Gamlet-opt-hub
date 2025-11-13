import React from 'react';
import { Product, ProductPortion, ProductUnit, ProductPackaging } from '../types';
import ProductTableRow from './ProductTableRow';

// Define props based on what AdminPanel will pass
interface ProductTableProps {
    products: Product[];
    allCategories: string[];
    onDeleteProduct: (productId: number) => void;
    onCycleStatus: (productId: number) => void;
    onUpdatePortions: (productId: number, portion: ProductPortion) => void;
    onUpdatePrices: (productId: number, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdateUspPrices: (productId: number, newUspPrices: { costPrice?: number; usp1Price?: number; }) => void;
    onUpdateUspMarkupFlags: (productId: number, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUnitValue: (productId: number, newUnitValue: number) => void;
    onUpdateDetails: (productId: number, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateCategories: (productId: number, newCategories: string[]) => void;
    onUpdateImages: (productId: number, newImageUrls: string[]) => void;
    uspMarkups: { usp1: string; };
    setUspMarkups: React.Dispatch<React.SetStateAction<{ usp1: string; }>>;
    onApplyMarkups: () => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, uspMarkups, setUspMarkups, onApplyMarkups, ...propsForRow }) => {
    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                        <th scope="col" className="py-3 px-2 w-16 text-center">Статус</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Фото</th>
                        <th scope="col" className="py-3 px-2 min-w-[200px]">Название</th>
                        <th scope="col" className="py-3 px-2 min-w-[250px]">Описание</th>
                        <th scope="col" className="py-3 px-2 min-w-[250px]">Категории</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Цена / Ед.Изм.</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Значение / Вид</th>
                        <th scope="col" className="py-3 px-2 min-w-[180px]">Порции (для кг)</th>
                        <th scope="col" className="py-3 px-2 min-w-[180px]">Спец. цены (для кг)</th>
                        <th scope="col" className="py-3 px-2 min-w-[120px]">Себест., ₽</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">
                            <div className="flex flex-col">
                                <span>УТП 1, ₽</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <input type="number" placeholder="%" value={uspMarkups.usp1} onChange={e => setUspMarkups(prev => ({...prev, usp1: e.target.value}))} className="w-20 p-1 text-xs border rounded"/>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                        </th>
                        <th scope="col" className="py-3 px-2 w-40 text-center">
                            <div className="flex flex-col items-center gap-1">
                                <span>Действия</span>
                                <button onClick={onApplyMarkups} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Применить наценки
                                </button>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <ProductTableRow 
                            key={product.id}
                            product={product}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;