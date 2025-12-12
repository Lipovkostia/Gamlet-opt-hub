
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
    onUpdatePriceTiers?: (productId: string, priceTiers: Product['priceTiers']) => void; // Added prop
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
    visibleColumns?: string[];
    roleKey?: string; // Added prop to filter/edit specific role prices
}

const DEFAULT_WIDTHS: Record<string, number> = {
    status: 50,
    photo: 60,
    name: 200,
    description: 250,
    categories: 180,
    visibility: 140,
    price: 180,
    value: 180,
    portions: 160,
    special: 160,
    cost: 100,
    actions: 140
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
    price: "Цена / Ед.",
    value: "Вес / Вид",
    portions: "Порции (кг)",
    special: "Спец. цены",
    cost: "Себест.",
    actions: <span>Действия</span>
};

const ResizeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(90 10 10)" />
    </svg>
);

const ProductTable: React.FC<ProductTableProps> = ({ products, uspMarkups, setUspMarkups, onApplyMarkups, roles, visibleColumns, roleKey, onUpdatePriceTiers, ...propsForRow }) => {
    const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
    const [colOrder, setColOrder] = useState<string[]>(DEFAULT_ORDER);
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    
    // State for Mobile Resize Menu
    const [activeResizeMenu, setActiveResizeMenu] = useState<string | null>(null);
    
    // State for Mobile Drag Ghost
    const [ghostState, setGhostState] = useState<{
        key: string;
        label: React.ReactNode;
        width: number;
        height: number;
        startX: number;
        startY: number;
        initialTouchX: number;
        initialTouchY: number;
    } | null>(null);

    const resizeMenuRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

    // Customize labels if roleKey is present
    const dynamicColumnLabels = useMemo(() => {
        if (!roleKey) return COLUMN_LABELS;
        return {
            ...COLUMN_LABELS,
            price: <span className="text-indigo-700 font-bold">Цена ({roleKey})</span>,
            portions: <span className="text-gray-400">Порции</span>,
            special: <span className="text-gray-400">Спец.</span>
        };
    }, [roleKey]);

    // --- Desktop Resize Logic ---
    const handleResizeMouseDown = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation(); 
        const startX = e.pageX;
        const startWidth = colWidths[key] || DEFAULT_WIDTHS[key];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.pageX - startX;
            const newWidth = Math.max(30, startWidth + delta);
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
        setActiveResizeMenu(null); 
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

    // --- Enhanced Touch Logic (Mobile Reorder with Ghost) ---
    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        if ((e.target as HTMLElement).closest('.resize-btn')) return;
        
        const touch = e.touches[0];
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        // Start long press timer
        longPressTimer.current = setTimeout(() => {
            setDraggedCol(key);
            setGhostState({
                key,
                label: dynamicColumnLabels[key],
                width: rect.width,
                height: rect.height,
                startX: rect.left,
                startY: rect.top,
                initialTouchX: touch.clientX,
                initialTouchY: touch.clientY
            });
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(50);
        }, 300); // 300ms long press to activate drag
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // If we haven't entered drag mode yet, clear timer if user moves finger (scrolling)
        if (!draggedCol) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            return;
        }

        // If dragging, prevent scrolling
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        
        // Update Ghost Position directly via DOM for performance
        if (ghostRef.current && ghostState) {
            const deltaX = touch.clientX - ghostState.initialTouchX;
            const deltaY = touch.clientY - ghostState.initialTouchY;
            ghostRef.current.style.transform = `translate(${ghostState.startX + deltaX}px, ${ghostState.startY + deltaY}px) rotate(3deg) scale(1.05)`;
        }

        // Find target under finger
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
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (draggedCol) {
            setDraggedCol(null);
            setGhostState(null);
            localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
        }
    };

    return (
        <div className="overflow-x-auto relative shadow-none rounded-none border border-gray-300 pb-32 sm:pb-0 select-none"> 
            
            {/* Ghost Element for Dragging */}
            {ghostState && (
                <div 
                    ref={ghostRef}
                    className="fixed z-50 bg-indigo-600 text-white shadow-2xl rounded-lg flex items-center justify-center font-bold text-xs pointer-events-none border-2 border-indigo-400 opacity-90"
                    style={{
                        width: ghostState.width,
                        height: ghostState.height,
                        left: 0,
                        top: 0,
                        // Initial transform set here, updated in touchMove
                        transform: `translate(${ghostState.startX}px, ${ghostState.startY}px) rotate(3deg) scale(1.05)`,
                        touchAction: 'none'
                    }}
                >
                    {ghostState.label}
                </div>
            )}

            <table className="w-full text-xs text-left text-gray-500 border-collapse border border-gray-300" ref={tableRef} style={{ tableLayout: 'fixed' }}>
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20">
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
                                className={`
                                    py-1 px-1 relative group select-none border-r border-b border-gray-300 bg-gray-100 transition-all duration-200 cursor-grab active:cursor-grabbing text-center align-middle h-10
                                    ${draggedCol === key 
                                        ? 'bg-indigo-50 border-indigo-300 text-transparent opacity-50' 
                                        : 'hover:bg-gray-200'
                                    }
                                `}
                                style={{ width: `${colWidths[key]}px`, minWidth: `${colWidths[key]}px` }}
                            >
                                <div className={`flex items-center justify-center pointer-events-none ${draggedCol === key ? 'invisible' : ''}`}>
                                    <span className="truncate">{dynamicColumnLabels[key]}</span>
                                    
                                    {/* Mobile Resize Button */}
                                    <button 
                                        className="resize-btn pointer-events-auto p-1 ml-1 rounded hover:bg-gray-300 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors sm:hidden"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent drag start
                                            setActiveResizeMenu(activeResizeMenu === key ? null : key);
                                        }}
                                        title="Изменить ширину"
                                    >
                                        <ResizeIcon className="w-3 h-3" />
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
                                                min="30" 
                                                max="600" 
                                                step="5"
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
                <tbody className="bg-white">
                    {products.map(product => (
                        <ProductTableRow 
                            key={product.id}
                            product={product}
                            roles={roles}
                            columnOrder={effectiveColumnOrder}
                            roleKey={roleKey}
                            onUpdatePriceTiers={onUpdatePriceTiers}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
