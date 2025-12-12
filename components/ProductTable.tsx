
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const DEFAULT_WIDTHS: Record<string, number> = {
    status: 70,
    photo: 80,
    name: 200,
    description: 250,
    categories: 200,
    visibility: 150,
    price: 150,
    value: 150,
    portions: 180,
    special: 180,
    cost: 120,
    actions: 160
};

const DEFAULT_ORDER = [
    'status', 'photo', 'name', 'description', 'categories', 'visibility', 
    'price', 'value', 'portions', 'special', 'cost', 'actions'
];

const COLUMN_LABELS: Record<string, string | React.ReactNode> = {
    status: "Статус",
    photo: "Фото",
    name: "Название",
    description: "Описание",
    categories: "Категории",
    visibility: "Видимость",
    price: "Цена / Ед.Изм.",
    value: "Значение / Вид",
    portions: "Порции (для кг)",
    special: "Спец. цены (для кг)",
    cost: "Себест., ₽",
    actions: <span>Действия</span>
};

const ProductTable: React.FC<ProductTableProps> = ({ products, uspMarkups, setUspMarkups, onApplyMarkups, roles, ...propsForRow }) => {
    const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
    const [colOrder, setColOrder] = useState<string[]>(DEFAULT_ORDER);
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const touchTimeout = useRef<any>(null);

    // Load saved settings from localStorage on mount
    useEffect(() => {
        const savedWidths = localStorage.getItem('productTableColWidths');
        const savedOrder = localStorage.getItem('productTableColOrder');
        
        if (savedWidths) {
            try {
                const parsed = JSON.parse(savedWidths);
                setColWidths(prev => ({ ...prev, ...parsed }));
            } catch (e) { console.error(e); }
        }

        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                // Ensure all default columns exist (in case of updates)
                const mergedOrder = Array.from(new Set([...parsed, ...DEFAULT_ORDER])).filter(key => DEFAULT_ORDER.includes(key));
                setColOrder(mergedOrder);
            } catch (e) { console.error(e); }
        }
    }, []);

    // --- Resize Logic ---
    const handleResizeMouseDown = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation(); // Stop drag from starting
        const startX = e.pageX;
        const startWidth = colWidths[key] || DEFAULT_WIDTHS[key];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.pageX - startX;
            const newWidth = Math.max(50, startWidth + delta);
            setColWidths(prev => ({ ...prev, [key]: newWidth }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setColWidths(currentWidths => {
                localStorage.setItem('productTableColWidths', JSON.stringify(currentWidths));
                return currentWidths;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // --- Drag & Drop Logic (Desktop) ---
    const handleDragStart = (e: React.DragEvent, key: string) => {
        setDraggedCol(key);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent ghost image to reduce visual clutter or custom one could be set
    };

    const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
        e.preventDefault(); // Necessary to allow dropping
        if (!draggedCol || draggedCol === targetKey) return;

        const currentOrder = [...colOrder];
        const draggedIdx = currentOrder.indexOf(draggedCol);
        const targetIdx = currentOrder.indexOf(targetKey);

        if (draggedIdx !== -1 && targetIdx !== -1) {
            // Swap visually immediately
            currentOrder.splice(draggedIdx, 1);
            currentOrder.splice(targetIdx, 0, draggedCol);
            setColOrder(currentOrder);
        }
    }, [colOrder, draggedCol]);

    const handleDragEnd = () => {
        setDraggedCol(null);
        localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
    };

    // --- Touch Logic (Mobile) ---
    // Using elementFromPoint to simulate drag over
    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        // Delay touch drag slightly to allow scrolling if user moves quickly? 
        // Or just start immediately. Let's try immediate but safe.
        // We only care if they hold/move horizontally mostly. 
        // For simplicity: Long press or immediate move.
        // Let's rely on standard logic: if they move finger over another header, swap.
        setDraggedCol(key);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedCol) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Find the closest TH header
        const headerCell = target?.closest('th');
        if (headerCell && headerCell.dataset.colkey) {
            const targetKey = headerCell.dataset.colkey;
            if (targetKey !== draggedCol) {
                 const currentOrder = [...colOrder];
                 const draggedIdx = currentOrder.indexOf(draggedCol);
                 const targetIdx = currentOrder.indexOf(targetKey);

                 if (draggedIdx !== -1 && targetIdx !== -1) {
                     currentOrder.splice(draggedIdx, 1);
                     currentOrder.splice(targetIdx, 0, draggedCol);
                     setColOrder(currentOrder);
                 }
            }
        }
    };

    const handleTouchEnd = () => {
        setDraggedCol(null);
        localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
    };


    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left text-gray-500" ref={tableRef} style={{ tableLayout: 'fixed' }}>
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20">
                    <tr>
                        {colOrder.map(key => (
                             <th 
                                key={key}
                                scope="col" 
                                data-colkey={key}
                                draggable
                                onDragStart={(e) => handleDragStart(e, key)}
                                onDragOver={(e) => handleDragOver(e, key)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={(e) => handleTouchStart(e, key)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className={`py-3 px-2 bg-gray-100 relative group select-none border-b border-gray-200 transition-colors duration-200 cursor-move ${draggedCol === key ? 'bg-indigo-100 opacity-50' : ''}`}
                                style={{ width: `${colWidths[key]}px`, minWidth: `${colWidths[key]}px` }}
                            >
                                <div className="truncate pointer-events-none">{COLUMN_LABELS[key]}</div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, key)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 z-20 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Изменить ширину"
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {products.map(product => (
                        <ProductTableRow 
                            key={product.id}
                            product={product}
                            roles={roles}
                            columnOrder={colOrder}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
