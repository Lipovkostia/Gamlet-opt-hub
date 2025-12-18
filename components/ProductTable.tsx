
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
    roleKey?: string; // Added prop to filter/edit specific role prices
    selectedIds?: Set<string>; // New
    onToggleRow?: (id: string) => void; // New
    onToggleAll?: () => void; // New
    isAllSelected?: boolean; // New
    isMasterView?: boolean; // Added prop
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
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const handleSliderChange = (key: string, value: string) => {
        const newWidth = parseInt(value, 10);
        saveWidths({ ...colWidths, [key]: newWidth });
    };

    // --- Drag & Drop Logic (Desktop) ---
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

    // --- Auto-scroll Logic for Mobile Drag ---
    const handleAutoScroll = (clientX: number) => {
        if (!tableContainerRef.current) return;
        const container = tableContainerRef.current;
        const rect = container.getBoundingClientRect();
        const threshold = 50; // pixels from edge to trigger scroll
        
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }

        if (clientX < rect.left + threshold) {
            scrollInterval.current = setInterval(() => {
                container.scrollLeft -= 8;
            }, 16);
        } else if (clientX > rect.right - threshold) {
            scrollInterval.current = setInterval(() => {
                container.scrollLeft += 8;
            }, 16);
        }
    };

    // --- Enhanced Touch Logic (Mobile Reorder with Ghost) ---
    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        if (key === 'select' || (e.target as HTMLElement).closest('.resize-btn')) return;
        
        const touch = e.touches[0];
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

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
            if (navigator.vibrate) navigator.vibrate(50);
        }, 300);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedCol) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            return;
        }

        // IMPORTANT: Prevent scroll during drag
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        
        // Update Ghost Position
        if (ghostRef.current && ghostState) {
            const deltaX = touch.clientX - ghostState.initialTouchX;
            const deltaY = touch.clientY - ghostState.initialTouchY;
            // Use hardware acceleration for smoothness
            ghostRef.current.style.transform = `translate3d(${ghostState.startX + deltaX}px, ${ghostState.startY + deltaY}px, 0) rotate(2deg) scale(1.02)`;
        }

        handleAutoScroll(touch.clientX);

        // Detection logic
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const headerCell = target?.closest('th');
        
        if (headerCell && headerCell.dataset.colkey) {
            const targetKey = headerCell.dataset.colkey;
            if (targetKey !== draggedCol && targetKey !== 'select') {
                 const currentOrder = [...colOrder];
                 const draggedIdx = currentOrder.indexOf(draggedCol);
                 const targetIdx = currentOrder.indexOf(targetKey);

                 if (draggedIdx !== -1 && targetIdx !== -1) {
                     currentOrder.splice(draggedIdx, 1);
                     currentOrder.splice(targetIdx, 0, draggedCol);
                     // Using a throttle/RAF isn't strictly necessary here but good for performance
                     requestAnimationFrame(() => setColOrder(currentOrder));
                 }
            }
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
        
        if (draggedCol) {
            setDraggedCol(null);
            setGhostState(null);
            localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
        }
    };

    return (
        <div 
            ref={tableContainerRef}
            className="overflow-x-auto relative shadow-none rounded-none border border-gray-300 pb-32 sm:pb-0 select-none scroll-smooth"
        > 
            <style>{`
                th { transition: transform 0.2s ease, width 0.1s linear; }
                .is-dragging { opacity: 0.3; background: #e0e7ff !important; border: 1px dashed #6366f1 !important; }
            `}</style>
            
            {/* Ghost Element for Dragging - pointer-events: none is key! */}
            {ghostState && (
                <div 
                    ref={ghostRef}
                    className="fixed z-[100] bg-indigo-600 text-white shadow-2xl rounded-lg flex items-center justify-center font-bold text-xs pointer-events-none border-2 border-indigo-400 opacity-95"
                    style={{
                        width: ghostState.width,
                        height: ghostState.height,
                        left: 0,
                        top: 0,
                        transform: `translate3d(${ghostState.startX}px, ${ghostState.startY}px, 0)`,
                        willChange: 'transform'
                    }}
                >
                    {ghostState.label}
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
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className={`
                                    py-1 px-1 relative group select-none border-r border-b border-gray-300 bg-gray-100 text-center align-middle h-10
                                    ${draggedCol === key ? 'is-dragging' : 'hover:bg-gray-200'}
                                `}
                                style={{ 
                                    width: `${colWidths[key]}px`, 
                                    minWidth: `${colWidths[key]}px`,
                                    touchAction: draggedCol ? 'none' : 'auto' 
                                }}
                            >
                                <div className={`flex items-center justify-center w-full h-full ${draggedCol === key ? 'invisible' : ''}`}>
                                    <span className="truncate px-1">{dynamicColumnLabels[key]}</span>
                                </div>

                                <button 
                                    className="resize-btn absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center pointer-events-auto hover:bg-gray-300 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors sm:hidden z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveResizeMenu(activeResizeMenu === key ? null : key);
                                    }}
                                >
                                    <ResizeIcon className="w-3 h-3" />
                                </button>

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
                                                type="range" min="30" max="600" step="5"
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

                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, key)}
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
