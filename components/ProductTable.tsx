
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
    onUpdatePriceTiers?: (productId: string, priceTiers: Product['priceTiers']) => void; 
    onUpdateTierPortions?: (productId: string, role: string, portions: ProductPortion[]) => void;
    onUpdateTierPriceOverrides?: (productId: string, role: string, overrides: { half?: number; quarter?: number }) => void;
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; markupValue?: number; markupType?: 'percent' | 'fixed'; role?: string; }) => void;
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
    roleKey?: string; 
    selectedIds?: Set<string>; 
    onToggleRow?: (id: string) => void; 
    onToggleAll?: () => void; 
    isAllSelected?: boolean; 
    isMasterView?: boolean; 
}

const DEFAULT_WIDTHS: Record<string, number> = {
    select: 40,
    status: 50,
    photo: 60,
    name: 200,
    description: 250,
    categories: 180,
    visibility: 140,
    price: 100,
    unit: 70,
    value: 80,
    packaging: 90,
    portions: 160,
    special: 160,
    cost: 100,
    markup: 110, 
    actions: 140
};

const DEFAULT_ORDER = [
    'select', 'status', 'photo', 'name', 'description', 'categories', 'visibility', 
    'cost', 'markup', 'price', 'unit', 'value', 'packaging', 'portions', 'special', 'actions'
];

const COLUMN_LABELS: Record<string, string | React.ReactNode> = {
    select: "",
    status: "Статус",
    photo: "Фото",
    name: "Название",
    description: "Описание",
    categories: "Категории",
    visibility: "Видимость",
    price: "Цена",
    unit: "Ед.",
    value: "Вес/Об.",
    packaging: "Вид",
    portions: "Порции",
    special: "Спец.",
    cost: "Себест.",
    markup: "Наценка", 
    actions: <span>Действия</span>
};

const ResizeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(90 10 10)" />
    </svg>
);

const ProductTable: React.FC<ProductTableProps> = ({ 
    products, 
    uspMarkups, 
    setUspMarkups, 
    onApplyMarkups, 
    roles, 
    visibleColumns, 
    roleKey, 
    onUpdatePriceTiers, 
    onUpdateTierPortions, 
    onUpdateTierPriceOverrides,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected,
    isMasterView = false,
    ...propsForRow 
}) => {
    const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
    const [colOrder, setColOrder] = useState<string[]>(DEFAULT_ORDER);
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    const [activeResizeMenu, setActiveResizeMenu] = useState<string | null>(null);
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
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const colOrderRef = useRef(colOrder); // For access in listeners without re-binding

    useEffect(() => {
        colOrderRef.current = colOrder;
    }, [colOrder]);

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

    const effectiveColumnOrder = useMemo(() => {
        if (!visibleColumns) return colOrder;
        return colOrder.filter(key => visibleColumns.includes(key) || key === 'select');
    }, [colOrder, visibleColumns]);

    const dynamicColumnLabels = useMemo(() => {
        const baseLabels = {
            ...COLUMN_LABELS,
            select: (
                <input 
                    type="checkbox" 
                    checked={isAllSelected} 
                    onChange={onToggleAll}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
            )
        };

        if (!roleKey) return baseLabels;
        return {
            ...baseLabels,
            price: <span className="text-indigo-700 font-bold">Цена ({roleKey})</span>,
            portions: <span className="text-gray-400">Порции</span>,
            special: <span className="text-gray-400">Спец.</span>
        };
    }, [roleKey, isAllSelected, onToggleAll]);

    // Desktop Resize Logic
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

    const handleSliderChange = (key: string, value: string) => {
        const newWidth = parseInt(value, 10);
        saveWidths({ ...colWidths, [key]: newWidth });
    };

    const handleDragStart = (e: React.DragEvent, key: string) => {
        if (key === 'select') {
            e.preventDefault();
            return;
        }
        setDraggedCol(key);
        e.dataTransfer.effectAllowed = 'move';
        setActiveResizeMenu(null); 
    };

    const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
        e.preventDefault();
        if (!draggedCol || draggedCol === targetKey || targetKey === 'select') return;

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

    // --- ENHANCED TOUCH REORDER LOGIC WITH GLOBAL LISTENERS ---

    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        if (key === 'select') return;
        if ((e.target as HTMLElement).closest('.resize-btn')) return;
        
        const touch = e.touches[0];
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        longPressTimer.current = setTimeout(() => {
            // Block scrolling
            document.body.style.overflow = 'hidden';
            
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
            
            if (navigator.vibrate) navigator.vibrate(50);
        }, 300); 
    };

    const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
        if (!ghostState || !draggedCol) {
             if (longPressTimer.current) {
                 const touch = e.touches[0];
                 // Simple threshold to cancel long press if finger is moving
                 const initial = { x: 0, y: 0 }; // We'd need to store start touch coords if we want precise cancellation
                 // For simplicity, we only allow move if drag is already active
             }
             return;
        }

        // Prevent scrolling while moving
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        
        if (ghostRef.current) {
            const deltaX = touch.clientX - ghostState.initialTouchX;
            const deltaY = touch.clientY - ghostState.initialTouchY;
            ghostRef.current.style.transform = `translate(${ghostState.startX + deltaX}px, ${ghostState.startY + deltaY}px) rotate(3deg) scale(1.05)`;
        }

        // --- COORDINATE-BASED TARGET DETECTION ---
        // Instead of elementFromPoint, we check all th boundaries
        if (!tableRef.current) return;
        const headers = Array.from(tableRef.current.querySelectorAll('thead th[data-colkey]')) as HTMLElement[];
        
        for (const header of headers) {
            const key = header.dataset.colkey;
            if (!key || key === draggedCol || key === 'select') continue;

            const rect = header.getBoundingClientRect();
            // Finger is within column X bounds
            if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
                const currentOrder = [...colOrderRef.current];
                const draggedIdx = currentOrder.indexOf(draggedCol);
                const targetIdx = currentOrder.indexOf(key);

                if (draggedIdx !== -1 && targetIdx !== -1) {
                    const mid = rect.left + rect.width / 2;
                    const isMovingRight = draggedIdx < targetIdx;
                    
                    if ((isMovingRight && touch.clientX > mid) || (!isMovingRight && touch.clientX < mid)) {
                        currentOrder.splice(draggedIdx, 1);
                        currentOrder.splice(targetIdx, 0, draggedCol);
                        setColOrder(currentOrder);
                    }
                }
                break;
            }
        }
    }, [draggedCol, ghostState]);

    const handleGlobalTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        document.body.style.overflow = '';
        
        if (draggedCol) {
            setDraggedCol(null);
            setGhostState(null);
            localStorage.setItem('productTableColOrder', JSON.stringify(colOrderRef.current));
        }
    }, [draggedCol]);

    // Use effect for global listeners to ensure drag is stable
    useEffect(() => {
        if (draggedCol) {
            window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
            window.addEventListener('touchend', handleGlobalTouchEnd);
            window.addEventListener('touchcancel', handleGlobalTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleGlobalTouchMove);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
            window.removeEventListener('touchcancel', handleGlobalTouchEnd);
        };
    }, [draggedCol, handleGlobalTouchMove, handleGlobalTouchEnd]);

    return (
        <div className="overflow-x-auto relative shadow-none rounded-none border border-gray-300 pb-32 sm:pb-0 select-none"> 
            
            {/* Ghost Element for Dragging */}
            {ghostState && (
                <div 
                    ref={ghostRef}
                    className="fixed z-[100] bg-indigo-600 text-white shadow-2xl rounded-lg flex items-center justify-center font-bold text-xs pointer-events-none border-2 border-indigo-400 opacity-90 transition-none"
                    style={{
                        width: ghostState.width,
                        height: ghostState.height,
                        left: 0,
                        top: 0,
                        transform: `translate(${ghostState.startX}px, ${ghostState.startY}px) rotate(3deg) scale(1.05)`,
                        touchAction: 'none'
                    }}
                >
                    <span className="truncate px-2">{ghostState.label}</span>
                </div>
            )}

            <table 
                className="w-full text-xs text-left text-gray-500 border-collapse border border-gray-300" 
                ref={tableRef} 
                style={{ tableLayout: 'fixed' }}
            >
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-20">
                    <tr>
                        {effectiveColumnOrder.map(key => (
                             <th 
                                key={key}
                                scope="col" 
                                data-colkey={key}
                                draggable={key !== 'select'}
                                onDragStart={(e) => handleDragStart(e, key)}
                                onDragOver={(e) => handleDragOver(e, key)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={(e) => handleTouchStart(e, key)}
                                className={`
                                    py-1 px-1 relative group select-none border-r border-b border-gray-300 bg-gray-100 transition-all duration-200 cursor-grab active:cursor-grabbing text-center align-middle h-10
                                    ${draggedCol === key 
                                        ? 'bg-indigo-50 border-indigo-300 text-transparent opacity-50' 
                                        : 'hover:bg-gray-200'
                                    }
                                `}
                                style={{ width: `${colWidths[key]}px`, minWidth: `${colWidths[key]}px` }}
                            >
                                <div className={`flex items-center justify-center w-full h-full ${draggedCol === key ? 'invisible' : ''}`}>
                                    <span className="truncate px-1">{dynamicColumnLabels[key]}</span>
                                </div>

                                {/* Mobile Resize Button */}
                                <button 
                                    className="resize-btn absolute right-0 top-0 bottom-0 w-5 flex items-center justify-center pointer-events-auto hover:bg-gray-300 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors sm:hidden z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveResizeMenu(activeResizeMenu === key ? null : key);
                                    }}
                                    title="Изменить ширину"
                                >
                                    <ResizeIcon className="w-3 h-3" />
                                </button>

                                {/* Slider Menu */}
                                {activeResizeMenu === key && (
                                    <div 
                                        ref={resizeMenuRef}
                                        className="absolute top-full right-0 z-50 bg-white shadow-xl border border-gray-200 rounded-md p-3 min-w-[200px]"
                                        onClick={(e) => e.stopPropagation()} 
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
                            onUpdateTierPortions={onUpdateTierPortions}
                            onUpdateTierPriceOverrides={onUpdateTierPriceOverrides}
                            isSelected={selectedIds?.has(product.id)}
                            onToggleSelect={onToggleRow}
                            isMasterView={isMasterView}
                            {...propsForRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
