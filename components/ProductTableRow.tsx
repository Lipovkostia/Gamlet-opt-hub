
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, CustomerType } from '../types';

interface ProductTableRowProps {
    product: Product;
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
    roles?: string[];
    columnOrder?: string[];
    roleKey?: string;
    isSelected?: boolean;
    onToggleSelect?: (productId: string) => void;
    isMasterView?: boolean;
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'гол.', упаковка: 'упак.', штука: 'шт.', банка: 'банк.', ящик: 'ящ.' };
const unitOptions: ProductUnit[] = ['kg', 'g', 'pcs', 'l'];
const packagingOptions: ProductPackaging[] = ['головка', 'упаковка', 'штука', 'банка', 'ящик'];

const StopIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
);

const EyeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 4.5 10 4.5c.478 0 6.268.443 9.542 5.5c-3.274 5.057-9.064 5.5-9.542 5.5c-.478 0-6.268-.443-9.542-5.5zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const MoreIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CloudIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);

const ProductTableRow: React.FC<ProductTableRowProps> = ({ 
    product, 
    allCategories, 
    onDeleteProduct, 
    onCycleStatus, 
    onUpdatePortions, 
    onUpdatePrices, 
    onUpdatePriceTiers,
    onUpdateTierPortions,
    onUpdateTierPriceOverrides,
    onUpdateUspPrices, 
    onUpdateUspMarkupFlags, 
    onUpdateUnitValue, 
    onUpdateDetails, 
    onUpdateCategories, 
    onUpdateImages,
    onUpdateVisibility, 
    roles = [],
    columnOrder = ['select', 'status', 'photo', 'name', 'description', 'categories', 'visibility', 'price', 'value', 'portions', 'special', 'cost', 'actions'],
    roleKey,
    isSelected = false,
    onToggleSelect,
    isMasterView = false
}) => {
    const currentRoleKey = roleKey || 'retail';
    const [editedProduct, setEditedProduct] = useState(product);
    const [tierPrice, setTierPrice] = useState<string>(
        roleKey && product.priceTiers ? (product.priceTiers[roleKey]?.toString() || '') : ''
    );
    const [newCategory, setNewCategory] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [isRolePopoverOpen, setRolePopoverOpen] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const categoryEditorRef = useRef<HTMLDivElement>(null);
    const roleEditorRef = useRef<HTMLDivElement>(null);
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    
    const initialMarkup = product.tierMarkups?.[currentRoleKey] || { type: 'percent', value: undefined };
    const [markupType, setMarkupType] = useState<'percent' | 'fixed'>(initialMarkup.type);
    const [markupValue, setMarkupValue] = useState<string>(initialMarkup.value?.toString() || '');

    const [isImageEditorOpen, setImageEditorOpen] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const imageEditorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const flushInputClasses = "block w-full h-full px-2 py-1.5 border-0 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-xs bg-transparent rounded-none focus:outline-none placeholder-gray-300 leading-tight";
    const flushSelectClasses = "block w-full h-full px-1 py-1.5 border-0 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-xs bg-transparent rounded-none cursor-pointer focus:outline-none leading-tight";
    const nestedInputClasses = "block w-full px-1 py-0.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-sm bg-white h-6";
    const baseCellClasses = "border-r border-b border-gray-300 align-middle transition-colors";
    const cellPadded = `${baseCellClasses} px-1 py-1`;
    const cellFlush = `${baseCellClasses} p-0 h-8`;

    useEffect(() => {
        setEditedProduct(product);
        if (roleKey) {
            setTierPrice(product.priceTiers?.[roleKey]?.toString() || '');
        }
        const markup = product.tierMarkups?.[currentRoleKey] || { type: 'percent', value: undefined };
        setMarkupValue(markup.value?.toString() || '');
        setMarkupType(markup.type || 'percent');
        setIsDirty(false);
    }, [product, roleKey, currentRoleKey]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryEditorRef.current && !categoryEditorRef.current.contains(event.target as Node)) {
                setCategoryPopoverOpen(false);
            }
            if (roleEditorRef.current && !roleEditorRef.current.contains(event.target as Node)) {
                setRolePopoverOpen(false);
            }
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setActionsMenuOpen(false);
            }
            if (imageEditorRef.current && !imageEditorRef.current.contains(event.target as Node)) {
                setImageEditorOpen(false);
                stopCamera();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const calculateMarkup = (cost: number, mValue: number, mType: 'percent' | 'fixed') => {
        if (isNaN(cost) || cost === 0) return 0;
        return mType === 'percent' ? Math.round(cost * (1 + mValue / 100)) : Math.round(cost + mValue);
    };

    const handleMarkupChange = (newVal: string) => {
        setMarkupValue(newVal);
        const val = parseFloat(newVal);
        setIsDirty(true);
        const activeCost = editedProduct.costPrice || product.costPrice;
        if (!isNaN(val) && activeCost) {
            const newPrice = calculateMarkup(activeCost, val, markupType);
            if (newPrice > 0) {
                if (roleKey) setTierPrice(newPrice.toString());
                else setEditedProduct(prev => ({ ...prev, pricePerUnit: newPrice }));
            }
        }
    };

    const handleMarkupTypeChange = (newType: 'percent' | 'fixed') => {
        setMarkupType(newType);
        setIsDirty(true);
        const val = parseFloat(markupValue);
        const activeCost = editedProduct.costPrice || product.costPrice;
        if (!isNaN(val) && activeCost) {
            const newPrice = calculateMarkup(activeCost, val, newType);
            if (newPrice > 0) {
                if (roleKey) setTierPrice(newPrice.toString());
                else setEditedProduct(prev => ({ ...prev, pricePerUnit: newPrice }));
            }
        }
    };

    const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedProduct(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedProduct(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        setIsDirty(true);
    };

    const handleTierPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTierPrice(e.target.value);
        setIsDirty(true);
    }

    const handleUspPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newVal = value === '' ? undefined : parseFloat(value);
        setEditedProduct(prev => ({ ...prev, [name]: newVal }));
        setIsDirty(true);

        if (name === 'costPrice' && newVal !== undefined && markupValue) {
            const val = parseFloat(markupValue);
            if (!isNaN(val)) {
                const newPrice = calculateMarkup(newVal, val, markupType);
                if (newPrice > 0) {
                    if (roleKey) setTierPrice(newPrice.toString());
                    else setEditedProduct(prev => ({ ...prev, pricePerUnit: newPrice, costPrice: newVal }));
                }
            }
        }
    };

    const handlePriceOverrideChange = (portion: 'half' | 'quarter', value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setEditedProduct(prev => {
            if (roleKey) {
                const currentOverrides = prev.tierPriceOverrides?.[roleKey] || {};
                const newOverrides = { ...currentOverrides, [portion]: numValue };
                if (numValue === undefined) delete newOverrides[portion];
                return { ...prev, tierPriceOverrides: { ...prev.tierPriceOverrides, [roleKey]: newOverrides } };
            }
            const newOverrides = { ...prev.priceOverridesPerUnit, [portion]: numValue };
            if (numValue === undefined) delete newOverrides[portion];
            return { ...prev, priceOverridesPerUnit: newOverrides };
        });
        setIsDirty(true);
    };
    
    const handlePortionToggle = (portion: ProductPortion) => {
        if (portion === 'whole') return;
        setEditedProduct(prev => {
            let currentList = roleKey ? (prev.tierPortions?.[roleKey] ?? prev.allowedPortions) : prev.allowedPortions;
            const newList = currentList.includes(portion) ? currentList.filter(p => p !== portion) : [...currentList, portion];
            return roleKey ? { ...prev, tierPortions: { ...prev.tierPortions, [roleKey]: newList } } : { ...prev, allowedPortions: newList };
        });
        setIsDirty(true);
    }
    
    const handleCategoryToggle = (category: string) => {
        const newCategories = new Set(editedProduct.categories);
        newCategories.has(category) ? newCategories.delete(category) : newCategories.add(category);
        setEditedProduct(prev => ({...prev, categories: Array.from(newCategories)}));
        setIsDirty(true);
    };

    const handleRoleToggle = (role: CustomerType) => {
        const currentRoles = editedProduct.visibleToRoles || [];
        const newRoles = currentRoles.includes(role) ? currentRoles.filter(r => r !== role) : [...currentRoles, role];
        setEditedProduct(prev => ({...prev, visibleToRoles: newRoles}));
        setIsDirty(true);
    };

    const handleAddNewCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !editedProduct.categories.includes(trimmed)) {
           setEditedProduct(prev => ({...prev, categories: [...prev.categories, trimmed]}));
           setNewCategory('');
           setIsDirty(true);
        }
    };
    
    const allPossibleCategories = useMemo(() => Array.from(new Set([...allCategories, ...editedProduct.categories])).sort(), [allCategories, editedProduct.categories]);
    const currentPortions = useMemo(() => roleKey ? (editedProduct.tierPortions?.[roleKey] ?? editedProduct.allowedPortions) : editedProduct.allowedPortions, [editedProduct, roleKey]);
    const currentOverrides = useMemo(() => roleKey ? (editedProduct.tierPriceOverrides?.[roleKey] ?? {}) : editedProduct.priceOverridesPerUnit, [editedProduct, roleKey]);

    const handleSave = () => {
        if (!isDirty) return;
        
        if (editedProduct.name !== product.name || editedProduct.description !== product.description || editedProduct.unit !== product.unit || editedProduct.packaging !== product.packaging) {
            onUpdateDetails(product.id, { name: editedProduct.name, description: editedProduct.description, unit: editedProduct.unit, packaging: editedProduct.packaging });
        }
        if (editedProduct.unitValue !== product.unitValue) onUpdateUnitValue(product.id, editedProduct.unitValue);
        if (JSON.stringify(editedProduct.categories) !== JSON.stringify(product.categories)) onUpdateCategories(product.id, editedProduct.categories);
        if (JSON.stringify(editedProduct.visibleToRoles) !== JSON.stringify(product.visibleToRoles)) onUpdateVisibility(product.id, editedProduct.visibleToRoles || []);
        
        const mVal = markupValue === '' ? undefined : parseFloat(markupValue);
        const currentMarkupRule = product.tierMarkups?.[currentRoleKey];
        
        // Improved cost comparison handles transitions from undefined/null correctly
        const costChanged = editedProduct.costPrice !== product.costPrice && 
                           !(editedProduct.costPrice === undefined && product.costPrice === undefined);

        if (mVal !== currentMarkupRule?.value || markupType !== currentMarkupRule?.type || costChanged) {
            onUpdateUspPrices(product.id, { costPrice: editedProduct.costPrice, markupValue: mVal, markupType, role: currentRoleKey });
        }

        if (!roleKey && editedProduct.usp1UseGlobalMarkup !== product.usp1UseGlobalMarkup) onUpdateUspMarkupFlags(product.id, { usp1UseGlobalMarkup: editedProduct.usp1UseGlobalMarkup });

        if (roleKey) {
            if (onUpdateTierPortions) {
                const portions = editedProduct.tierPortions?.[roleKey] ?? currentPortions;
                if (JSON.stringify(portions) !== JSON.stringify(product.tierPortions?.[roleKey])) onUpdateTierPortions(product.id, roleKey, portions);
            }
            if (onUpdateTierPriceOverrides) {
                const overrides = editedProduct.tierPriceOverrides?.[roleKey] ?? {};
                if (JSON.stringify(overrides) !== JSON.stringify(product.tierPriceOverrides?.[roleKey])) onUpdateTierPriceOverrides(product.id, roleKey, overrides);
            }
        } else {
            const originalPortions = new Set(product.allowedPortions);
            const newPortions = new Set(editedProduct.allowedPortions);
            if (originalPortions.has('half') !== newPortions.has('half')) onUpdatePortions(product.id, 'half');
            if (originalPortions.has('quarter') !== newPortions.has('quarter')) onUpdatePortions(product.id, 'quarter');
            if (editedProduct.pricePerUnit !== product.pricePerUnit || JSON.stringify(editedProduct.priceOverridesPerUnit) !== JSON.stringify(product.priceOverridesPerUnit)) {
                 onUpdatePrices(product.id, { pricePerUnit: editedProduct.pricePerUnit, priceOverridesPerUnit: editedProduct.priceOverridesPerUnit });
            }
        }

        if (roleKey && onUpdatePriceTiers) {
            const newPrice = tierPrice === '' ? undefined : parseFloat(tierPrice);
            if (newPrice !== product.priceTiers?.[roleKey]) {
                const newTiers = { ...product.priceTiers };
                (newPrice !== undefined && !isNaN(newPrice)) ? newTiers[roleKey] = newPrice : delete newTiers[roleKey];
                onUpdatePriceTiers(product.id, newTiers);
            }
        }

        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => { if (e.key === 'Enter') e.currentTarget.blur(); };
    const handleReset = () => {
        setEditedProduct(product);
        if (roleKey) setTierPrice(product.priceTiers?.[roleKey]?.toString() || '');
        const markup = product.tierMarkups?.[currentRoleKey] || { type: 'percent', value: undefined };
        setMarkupValue(markup.value?.toString() || '');
        setMarkupType(markup.type || 'percent');
        setIsDirty(false);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    };

    const getStatusInfo = () => {
        switch (product.status) {
            case ProductStatus.Available: return { Icon: StopIcon, color: 'text-green-500', label: 'Доступен' };
            case ProductStatus.OutOfStock: return { Icon: StopIcon, color: 'text-orange-500', label: 'Нет' };
            case ProductStatus.Hidden: return { Icon: EyeIcon, color: 'text-red-500', label: 'Скрыт' };
            default: return { Icon: StopIcon, color: 'text-gray-400', label: '?' };
        }
    };

    const StatusInfo = getStatusInfo();

    const cells: Record<string, React.ReactNode> = {
        select: (
            <td key="select" className={`${cellPadded} text-center w-8`}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect && onToggleSelect(product.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"/>
            </td>
        ),
        status: (
            <td key="status" className={`${cellPadded} text-center`}>
                <button onClick={() => onCycleStatus(product.id)} className={`p-1 rounded hover:bg-gray-200 ${StatusInfo.color}`} title={StatusInfo.label}><StatusInfo.Icon className="w-4 h-4"/></button>
            </td>
        ),
        photo: (
            <td key="photo" className={`${cellPadded} text-center`}>
                <div className="relative inline-block">
                    <button onClick={() => setImageEditorOpen(o => !o)} className="focus:outline-none"><img src={product.imageUrls[0]} alt="img" className="w-8 h-8 object-cover rounded-sm border border-gray-200" /></button>
                    {isImageEditorOpen && (
                        <div ref={imageEditorRef} className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded shadow-lg p-2 left-0">
                            {isCameraActive ? (
                                <div className="flex flex-col items-center gap-2">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-32 object-cover bg-black"></video>
                                    <div className="flex gap-1"><button onClick={handleSave} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Снять</button><button onClick={stopCamera} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Отмена</button></div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex space-x-1 overflow-x-auto pb-1 mb-1">
                                        {product.imageUrls.map((url, index) => (
                                           <div key={index} className="relative flex-shrink-0 group"><img src={url} alt={`img ${index}`} className="h-16 w-16 object-cover border"/><button onClick={() => onUpdateImages(product.id, product.imageUrls.filter((_, i) => i !== index))} className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-0.5 opacity-0 group-hover:opacity-100"><TrashIcon className="w-3 h-3" /></button></div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1 justify-center"><input type="file" ref={fileInputRef} onChange={async (e) => { if(e.target.files) onUpdateImages(product.id, [...product.imageUrls, URL.createObjectURL(e.target.files[0])])}} accept="image/*" multiple className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+ Фото</button></div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        ),
        name: (
            <td key="name" className={cellFlush}>
                <div className="flex items-center h-full w-full">
                    <input type="text" name="name" value={editedProduct.name} onChange={handleGenericChange} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${flushInputClasses} flex-grow font-semibold`} />
                    {product.msId && (
                        <div className="px-1 flex items-center gap-0.5 cursor-help" title="🔗 Синхронизировано с МойСклад">
                            <CloudIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[8px] font-extrabold text-indigo-600">MS</span>
                        </div>
                    )}
                </div>
            </td>
        ),
        description: <td key="description" className={cellFlush}><textarea name="description" value={editedProduct.description} onChange={handleGenericChange} onBlur={handleSave} onKeyDown={handleKeyDown} rows={1} className={`${flushInputClasses} min-h-[2rem] resize-none overflow-hidden hover:overflow-auto`} /></td>,
        categories: (
            <td key="categories" className={cellPadded}>
                <div className="relative h-full flex items-center">
                    <button onClick={() => setCategoryPopoverOpen(o => !o)} className="text-xs text-left w-full truncate px-1 hover:text-indigo-600">{editedProduct.categories.length > 0 ? editedProduct.categories.join(', ') : <span className="text-gray-400">Нет</span>}</button>
                     {isCategoryPopoverOpen && (
                        <div ref={categoryEditorRef} className="absolute z-10 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 top-full left-0">
                            <div className="space-y-0.5 max-h-32 overflow-y-auto mb-2">{allPossibleCategories.map(cat => (
                                <div key={cat} className="flex items-center">
                                    <input id={`table-cat-${product.id}-${cat}`} type="checkbox" checked={editedProduct.categories.includes(cat)} onChange={() => { handleCategoryToggle(cat); setIsDirty(true); }} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/>
                                    <label htmlFor={`table-cat-${product.id}-${cat}`} className="ml-1.5 block text-xs text-gray-900">{cat}</label>
                                </div>
                            ))}</div>
                            <div className="flex items-center gap-1"><input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){e.preventDefault(); handleAddNewCategory();}}} placeholder="Категория" className="block w-full px-1 py-0.5 border border-gray-300 rounded text-xs"/><button type="button" onClick={handleAddNewCategory} className="px-1 py-0.5 bg-gray-200 text-xs rounded hover:bg-gray-300">+</button></div>
                            <div className="mt-2 pt-2 border-t flex justify-end"><button onClick={() => { handleSave(); setCategoryPopoverOpen(false); }} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">ОК</button></div>
                        </div>
                    )}
                </div>
            </td>
        ),
        visibility: (
            <td key="visibility" className={cellPadded}>
                <div className="relative h-full flex items-center">
                    <button onClick={() => setRolePopoverOpen(o => !o)} className="text-xs text-indigo-600 hover:underline px-1 truncate w-full text-left">{!editedProduct.visibleToRoles || editedProduct.visibleToRoles.length === 0 ? 'Все' : `${editedProduct.visibleToRoles.length} ролей`}</button>
                    {isRolePopoverOpen && (
                        <div ref={roleEditorRef} className="absolute z-10 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg p-2 left-0">
                            <div className="space-y-0.5 max-h-40 overflow-y-auto"><div className="text-[10px] text-gray-500 mb-1 italic">Пусто = всем</div>{roles.map(role => (<div key={role} className="flex items-center"><input id={`role-${product.id}-${role}`} type="checkbox" checked={(editedProduct.visibleToRoles || []).includes(role)} onChange={() => { handleRoleToggle(role); setIsDirty(true); }} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/><label htmlFor={`role-${product.id}-${role}`} className="ml-1.5 block text-xs text-gray-900 truncate">{role}</label></div>))}</div>
                            <div className="mt-2 pt-2 border-t flex justify-end"><button onClick={() => { handleSave(); setRolePopoverOpen(false); }} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">ОК</button></div>
                        </div>
                    )}
                </div>
            </td>
        ),
        price: (
            <td key="price" className={cellFlush}>
                <input type="number" value={roleKey ? tierPrice : editedProduct.pricePerUnit} onChange={roleKey ? handleTierPriceChange : handleNumberChange} name={roleKey ? undefined : "pricePerUnit"} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${flushInputClasses} ${roleKey ? 'bg-yellow-50' : ''}`} placeholder="-"/>
            </td>
        ),
        unit: <td key="unit" className={cellFlush}><select name="unit" value={editedProduct.unit} onChange={handleGenericChange} onBlur={handleSave} className={flushSelectClasses}>{unitOptions.map(u => <option key={u} value={u}>{unitDisplayMap[u]}</option>)}</select></td>,
        value: <td key="value" className={cellFlush}><input type="number" step="0.01" name="unitValue" value={editedProduct.unitValue} onChange={handleNumberChange} onBlur={handleSave} onKeyDown={handleKeyDown} className={flushInputClasses} /></td>,
        packaging: <td key="packaging" className={cellFlush}><select name="packaging" value={editedProduct.packaging} onChange={handleGenericChange} onBlur={handleSave} className={flushSelectClasses}>{packagingOptions.map(p => <option key={p} value={p}>{packagingDisplayMap[p]}</option>)}</select></td>,
        portions: (
            <td key="portions" className={`${cellPadded} text-xs`}>
                 {editedProduct.packaging === 'головка' ? (
                     <div className="flex flex-col gap-0.5 justify-center h-full">
                        <div className="flex items-center"><input id={`half-${product.id}`} type="checkbox" checked={currentPortions.includes('half')} onChange={() => handlePortionToggle('half')} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/><label htmlFor={`half-${product.id}`} className="ml-1">1/2</label></div>
                        <div className="flex items-center"><input id={`quarter-${product.id}`} type="checkbox" checked={currentPortions.includes('quarter')} onChange={() => handlePortionToggle('quarter')} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/><label htmlFor={`quarter-${product.id}`} className="ml-1">1/4</label></div>
                     </div>
                 ) : <span className="text-gray-300">-</span>}
            </td>
        ),
        special: (
            <td key="special" className={cellPadded}>
                {editedProduct.packaging === 'головка' ? (
                    <div className="flex flex-col gap-1 justify-center h-full">
                        <input type="number" value={currentOverrides?.half ?? ''} onChange={e => handlePriceOverrideChange('half', e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} placeholder="1/2" className={nestedInputClasses} title="Цена за ед. (1/2)"/>
                        <input type="number" value={currentOverrides?.quarter ?? ''} onChange={e => handlePriceOverrideChange('quarter', e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} placeholder="1/4" className={nestedInputClasses} title="Цена за ед. (1/4)"/>
                    </div>
                ) : <span className="text-gray-300 text-center block">-</span>}
            </td>
        ),
        cost: (
            <td key="cost" className={cellFlush}>
                <input 
                    type="number" 
                    name="costPrice" 
                    value={editedProduct.costPrice ?? ''} 
                    onChange={handleUspPriceChange} 
                    onBlur={handleSave} 
                    onKeyDown={handleKeyDown} 
                    className={`${flushInputClasses} bg-white border-indigo-100 font-medium`} 
                    placeholder="-" 
                />
            </td>
        ),
        markup: (
            <td key="markup" className={cellPadded}>
                <div className="flex items-center h-full w-full bg-white border border-gray-300 rounded-sm overflow-hidden">
                    <select value={markupType} onChange={(e) => handleMarkupTypeChange(e.target.value as 'percent' | 'fixed')} className="h-6 text-[10px] bg-gray-50 border-r border-gray-300 focus:outline-none px-0.5 cursor-pointer text-gray-700" title="Тип наценки"><option value="percent">%</option><option value="fixed">₽</option></select>
                    <input type="number" value={markupValue} onChange={(e) => handleMarkupChange(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="block w-full h-6 px-1 text-xs focus:outline-none text-gray-800" placeholder="0"/>
                </div>
            </td>
        ),
        actions: (
            <td key="actions" className={`${cellPadded} text-center`}>
                <div className="flex items-center justify-center gap-1 h-full">
                    {showSaved && <span className="flex items-center text-green-500 animate-pulse mr-1" title="Сохранено"><CheckIcon className="w-4 h-4" /></span>}
                    <div className="relative" ref={actionsMenuRef}>
                        <button onClick={() => setActionsMenuOpen(o => !o)} className="p-0.5 text-gray-500 hover:bg-gray-200 rounded"><MoreIcon className="w-4 h-4" /></button>
                        {isActionsMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded shadow-lg border z-20 py-1 text-xs">
                                <button onClick={() => { handleReset(); setActionsMenuOpen(false); }} disabled={!isDirty} className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50">Сброс изменений</button>
                                <button onClick={() => { onDeleteProduct(product.id); setActionsMenuOpen(false); }} className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-50">Удалить</button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        )
    };

    return (
        <tr className={`transition-colors hover:bg-gray-50 ${isDirty ? 'bg-yellow-50' : ''} ${isSelected ? 'bg-indigo-50' : ''}`}>
            {columnOrder.map(colKey => cells[colKey] || null)}
        </tr>
    );
};

export default ProductTableRow;
