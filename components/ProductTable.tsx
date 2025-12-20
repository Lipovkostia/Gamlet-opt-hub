
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product, ProductPortion, ProductUnit, ProductPackaging, CustomerType } from '../types';
import ProductTableRow from './ProductTableRow';

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
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" transform="rotate(90 12 12)" />
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
    const [activeResizeMenu, setActiveResizeMenu] = useState<string | null>(null);
    
    // Drag and Drop States
    const [draggedCol, setDraggedCol] = useState<string | null>(null);
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
    const [ghostState, setGhostState] = useState<{
        key: string;
        label: React.ReactNode;
        width: number;
        height: number;
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
    } | null>(null);

    const tableRef = useRef<HTMLTableElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isActuallyDragging = useRef(false);

    useEffect(() => {
        const savedWidths = localStorage.getItem('productTableColWidths');
        const savedOrder = localStorage.getItem('productTableColOrder');
        if (savedWidths) try { setColWidths(prev => ({ ...prev, ...JSON.parse(savedWidths) })); } catch (e) {}
        if (savedOrder) try { setColOrder(JSON.parse(savedOrder)); } catch (e) {}
    }, []);

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
            price: <span className="text-indigo-700 font-bold">Цена ({roleKey})</span>
        };
    }, [roleKey, isAllSelected, onToggleAll]);

    // --- RESIZE LOGIC ---
    const handleAdjustWidth = (key: string, delta: number) => {
        const current = colWidths[key] || DEFAULT_WIDTHS[key];
        const nextWidth = Math.max(40, Math.min(800, current + delta));
        const next = { ...colWidths, [key]: nextWidth };
        setColWidths(next);
        localStorage.setItem('productTableColWidths', JSON.stringify(next));
    };

    // --- TOUCH DRAG LOGIC ---
    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        if (key === 'select') return;
        
        const target = e.target as HTMLElement;
        if (target.closest('.resize-trigger')) return;

        const touch = e.touches[0];
        const rect = target.closest('th')?.getBoundingClientRect();
        if (!rect) return;

        longPressTimer.current = setTimeout(() => {
            isActuallyDragging.current = true;
            setDraggedCol(key);
            setGhostState({
                key,
                label: dynamicColumnLabels[key],
                width: rect.width,
                height: rect.height,
                x: rect.left,
                y: rect.top,
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
            if (navigator.vibrate) navigator.vibrate(40);
            document.body.style.overflow = 'hidden'; 
        }, 250);
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isActuallyDragging.current || !ghostState) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        
        setGhostState(prev => prev ? { ...prev, x: touch.clientX - prev.offsetX, y: touch.clientY - prev.offsetY } : null);

        if (!tableRef.current) return;
        const headers = Array.from(tableRef.current.querySelectorAll('thead th[data-colkey]')) as HTMLElement[];
        let foundIdx = -1;

        for (let i = 0; i < headers.length; i++) {
            const hRect = headers[i].getBoundingClientRect();
            const mid = hRect.left + hRect.width / 2;
            
            if (touch.clientX < mid) {
                foundIdx = i;
                break;
            }
            if (i === headers.length - 1) foundIdx = headers.length;
        }
        
        setDropTargetIdx(foundIdx);
    }, [ghostState]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isActuallyDragging.current && draggedCol !== null && dropTargetIdx !== null) {
            const currentIdx = effectiveColumnOrder.indexOf(draggedCol);
            let targetIdx = dropTargetIdx;

            if (currentIdx < targetIdx) targetIdx--;
            
            if (currentIdx !== targetIdx) {
                const newOrder = [...colOrder];
                const realDraggedIdx = newOrder.indexOf(draggedCol);
                const targetKey = effectiveColumnOrder[dropTargetIdx === effectiveColumnOrder.length ? effectiveColumnOrder.length - 1 : dropTargetIdx];
                const realTargetIdx = newOrder.indexOf(targetKey);

                newOrder.splice(realDraggedIdx, 1);
                newOrder.splice(realTargetIdx, 0, draggedCol);
                
                setColOrder(newOrder);
                localStorage.setItem('productTableColOrder', JSON.stringify(newOrder));
            }
        }

        isActuallyDragging.current = false;
        setDraggedCol(null);
        setDropTargetIdx(null);
        setGhostState(null);
        document.body.style.overflow = '';
    }, [draggedCol, dropTargetIdx, effectiveColumnOrder, colOrder]);

    useEffect(() => {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchMove, handleTouchEnd]);

    const handleDragStart = (e: React.DragEvent, key: string) => {
        if (key === 'select') { e.preventDefault(); return; }
        setDraggedCol(key);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetKey: string) => {
        e.preventDefault();
        if (!draggedCol || draggedCol === targetKey || targetKey === 'select') return;
        const newOrder = [...colOrder];
        const di = newOrder.indexOf(draggedCol);
        const ti = newOrder.indexOf(targetKey);
        newOrder.splice(di, 1);
        newOrder.splice(ti, 0, draggedCol);
        setColOrder(newOrder);
    };

    const handleDragEnd = () => {
        setDraggedCol(null);
        localStorage.setItem('productTableColOrder', JSON.stringify(colOrder));
    };

    return (
        <div className="overflow-x-auto relative shadow-none rounded-none border border-gray-300 pb-32 sm:pb-0 select-none bg-gray-50"> 
            
            {/* Drop Indicator Line */}
            {isActuallyDragging.current && dropTargetIdx !== null && tableRef.current && (
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-[60] pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    style={{
                        left: (() => {
                            const headers = Array.from(tableRef.current.querySelectorAll('thead th')) as HTMLElement[];
                            if (dropTargetIdx >= headers.length) {
                                return headers[headers.length - 1].getBoundingClientRect().right - tableRef.current.getBoundingClientRect().left;
                            }
                            return headers[dropTargetIdx].getBoundingClientRect().left - tableRef.current.getBoundingClientRect().left;
                        })()
                    }}
                />
            )}

            {/* Ghost Header for Mobile Drag */}
            {ghostState && (
                <div 
                    className="fixed z-[100] bg-white border-2 border-indigo-500 shadow-2xl rounded-lg flex items-center px-4 font-bold text-xs pointer-events-none opacity-90 scale-105 rotate-2"
                    style={{
                        width: ghostState.width,
                        height: ghostState.height,
                        left: ghostState.x,
                        top: ghostState.y,
                    }}
                >
                    <span className="truncate text-indigo-700">{ghostState.label}</span>
                </div>
            )}

            <table 
                className="w-full text-xs text-left text-gray-500 border-collapse" 
                ref={tableRef} 
                style={{ tableLayout: 'fixed' }}
            >
                <thead className="text-[10px] sm:text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-40">
                    <tr>
                        {effectiveColumnOrder.map((key, idx) => (
                             <th 
                                key={key}
                                scope="col" 
                                data-colkey={key}
                                draggable={!isActuallyDragging.current && key !== 'select'}
                                onDragStart={(e) => handleDragStart(e, key)}
                                onDragOver={(e) => handleDragOver(e, key)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={(e) => handleTouchStart(e, key)}
                                className={`
                                    py-2 px-1 relative group select-none border-r border-b border-gray-300 bg-gray-100 transition-colors h-12 text-center align-middle
                                    ${draggedCol === key ? 'opacity-30 bg-gray-200' : 'hover:bg-gray-200 active:bg-gray-300'}
                                    ${idx === 0 ? 'border-l' : ''}
                                `}
                                style={{ width: `${colWidths[key]}px`, minWidth: `${colWidths[key]}px` }}
                            >
                                <div className="flex items-center justify-center w-full h-full px-1">
                                    <span className="truncate leading-tight">{dynamicColumnLabels[key]}</span>
                                </div>

                                {/* Minimalist Resize Trigger */}
                                {key !== 'select' && key !== 'actions' && (
                                    <button 
                                        className="resize-trigger absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 flex items-center justify-center pointer-events-auto text-gray-400 opacity-10 hover:opacity-100 focus:outline-none z-50 bg-white/50 rounded hover:bg-white hover:shadow-sm transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setActiveResizeMenu(activeResizeMenu === key ? null : key);
                                        }}
                                        onTouchStart={(e) => e.stopPropagation()} 
                                    >
                                        <ResizeIcon className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Floating +/- Controls */}
                                {activeResizeMenu === key && (
                                    <div 
                                        className="absolute top-full right-0 z-50 bg-white shadow-2xl border border-gray-200 rounded-full px-2 py-1.5 flex items-center gap-3 mt-1 normal-case"
                                        onClick={(e) => e.stopPropagation()} 
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                        <button 
                                            onClick={() => handleAdjustWidth(key, -20)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all border border-red-100 font-bold text-lg"
                                            title="Уменьшить"
                                        >
                                            −
                                        </button>
                                        
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold text-gray-400 leading-none">Ширина</span>
                                            <span className="text-xs font-mono text-indigo-600 font-bold leading-tight">{colWidths[key]}</span>
                                        </div>

                                        <button 
                                            onClick={() => handleAdjustWidth(key, 20)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 active:scale-95 transition-all border border-green-100 font-bold text-lg"
                                            title="Увеличить"
                                        >
                                            +
                                        </button>

                                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                        <button 
                                            onClick={() => setActiveResizeMenu(null)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all border border-gray-200"
                                            title="Готово"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </button>
                                    </div>
                                )}
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
