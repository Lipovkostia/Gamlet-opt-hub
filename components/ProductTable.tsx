
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    visibleColumns?: string[]; // New prop
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

const ResizeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(90 10 10)" />
    </svg>
);

const ProductTable: React.FC<ProductTableProps> = ({ products, uspMarkups, setUspMarkups, onApplyMarkups, roles, visibleColumns, ...propsForRow }) => {
    const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
    const [colOrder, setColOrder] = useState<string[]>(DEFAULT_ORDER);
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    
    // State for Mobile Resize Menu
    const [activeResizeMenu, setActiveResizeMenu] = useState<string | null>(null);
    const resizeMenuRef = useRef<HTMLDivElement>(null);

    const tableRef = useRef<HTMLTableElement>(null);

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
                const mergedOrder = Array.from(new Set([...parsed, ...DEFAULT_ORDER])).filter(key => DEFAULT_ORDER.includes(key));
                setColOrder(mergedOrder);
            } catch (e) { console.error(e); }
        }
    }, []);

    // Close resize menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (resizeMenuRef.current && !resizeMenuRef.current.contains(event.target as Node)) {
                setActiveResizeMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const saveWidths = (newWidths: Record<string, number>) => {
        setColWidths(newWidths);
        localStorage.setItem('productTableColWidths', JSON.stringify(newWidths));
    };

    // Calculate effective columns based on order and visibility filter
    const effectiveColumnOrder = useMemo(() => {
        if (!visibleColumns) return colOrder;
        return colOrder.filter(key => visibleColumns.includes(key));
    }, [colOrder, visibleColumns]);

    // --- Desktop Resize Logic ---
    const handleResizeMouseDown = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation(); 
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

    // --- Slider Resize Logic (Mobile/Menu) ---
    const handleSliderChange = (key: string, value: string) => {
        const newWidth = parseInt(value, 10);
        saveWidths({ ...colWidths, [key]: newWidth });
    };

    // --- Drag & Drop Logic (Desktop) ---
    const handleDragStart = (e: React.DragEvent, key: string) => {
        setDraggedCol(key);
        e.dataTransfer.effectAllowed = 'move';
        setActiveResizeMenu(null); // Close menu if dragging starts
    };

    const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
        e.preventDefault();
        if (!draggedCol || draggedCol === targetKey) return;

        const currentOrder = [...colOrder];
        const draggedIdx = currentOrder.indexOf(draggedCol);
        const targetIdx = currentOrder.indexOf(targetKey);

        if (draggedIdx !== -1 && targetIdx !== -1) {
            currentOrder.splice(draggedIdx, 1);
            currentOrder.splice(targetIdx, 0, draggedCol);
            setColOrder(currentOrder);
        }
    }, [colOrder, draggedCol]);

    const handleDragEnd = () => {
        setDraggedCol(null);
        localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
    };

    // --- Touch Logic (Mobile Reorder) ---
    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        // Only start drag logic if not interacting with resize button
        if ((e.target as HTMLElement).closest('.resize-btn')) return;
        setDraggedCol(key);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedCol) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
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
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 pb-32 sm:pb-0"> 
            {/* Added bottom padding on mobile to ensure dropdowns/sliders have space if at the bottom */}
            <table className="w-full text-sm text-left text-gray-500" ref={tableRef} style={{ tableLayout: 'fixed' }}>
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20 shadow-sm">
                    <tr>
                        {effectiveColumnOrder.map(key => (
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
                                <div className="flex items-center justify-between pointer-events-none">
                                    <span className="truncate mr-1">{COLUMN_LABELS[key]}</span>
                                    
                                    {/* Mobile Resize Button */}
                                    <button 
                                        className="resize-btn pointer-events-auto p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent drag start
                                            setActiveResizeMenu(activeResizeMenu === key ? null : key);
                                        }}
                                        title="Изменить ширину"
                                    >
                                        <ResizeIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Slider Menu */}
                                {activeResizeMenu === key && (
                                    <div 
                                        ref={resizeMenuRef}
                                        className="absolute top-full left-0 z-50 bg-white shadow-xl border border-gray-200 rounded-md p-3 min-w-[200px]"
                                        onClick={(e) => e.stopPropagation()} // Prevent bubble up
                                        onTouchStart={(e) => e.stopPropagation()} // Prevent touch drag interaction
                                    >
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-semibold text-gray-600 flex justify-between">
                                                <span>Ширина</span>
                                                <span>{colWidths[key]}px</span>
                                            </label>
                                            <input 
                                                type="range" 
                                                min="50" 
                                                max="600" 
                                                step="10"
                                                value={colWidths[key]} 
                                                onChange={(e) => handleSliderChange(key, e.target.value)}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <button onClick={() => handleSliderChange(key, (colWidths[key] - 10).toString())} className="p-2 hover:bg-gray-100 rounded">-10</button>
                                                <button onClick={() => handleSliderChange(key, DEFAULT_WIDTHS[key].toString())} className="p-2 hover:bg-gray-100 rounded text-indigo-500">Сброс</button>
                                                <button onClick={() => handleSliderChange(key, (colWidths[key] + 10).toString())} className="p-2 hover:bg-gray-100 rounded">+10</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Desktop Resize Handle */}
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, key)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 z-20 transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
                                    title="Тяните мышкой"
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
                            columnOrder={effectiveColumnOrder}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
