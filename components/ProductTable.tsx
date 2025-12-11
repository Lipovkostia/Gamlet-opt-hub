
import React from 'react';
import { Product, ProductPortion, ProductUnit, ProductPackaging, CustomerType } from '../types';
import ProductTableRow from './ProductTableRow';

// Define props based on what AdminPanel will pass
interface ProductTableProps {
    products: Product[];
    allCategories: string[];
    onDeleteProduct: (productId: string) => void;
    onCycleStatus: (productId: string) => void;
    onUpdatePortions: (productId: string, portion: ProductPortion) => void;
    onUpdatePrices: (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; }) => void;
    onUpdateUspMarkupFlags: (productId: string, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUnitValue: (productId: string, newUnitValue: number) => void;
    onUpdateDetails: (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateCategories: (productId: string, newCategories: string[]) => void;
    onUpdateImages: (productId: string, newImageUrls: string[]) => void;
    onUpdateVisibility: (productId: string, visibleToRoles: CustomerType[]) => void;
    uspMarkups: { usp1: string; };
    setUspMarkups: React.Dispatch<React.SetStateAction<{ usp1: string; }>>;
    onApplyMarkups: () => void;
    roles?: string[];
}

const ProductTable: React.FC<ProductTableProps> = ({ products, uspMarkups, setUspMarkups, onApplyMarkups, roles, ...propsForRow }) => {
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
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Видимость</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Цена / Ед.Изм.</th>
                        <th scope="col" className="py-3 px-2 min-w-[150px]">Значение / Вид</th>
                        <th scope="col" className="py-3 px-2 min-w-[180px]">Порции (для кг)</th>
                        <th scope="col" className="py-3 px-2 min-w-[180px]">Спец. цены (для кг)</th>
                        <th scope="col" className="py-3 px-2 min-w-[120px]">Себест., ₽</th>
                        <th scope="col" className="py-3 px-2 w-40 text-center">
                            <span>Действия</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <ProductTableRow 
                            key={product.id}
                            product={product}
                            roles={roles}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
