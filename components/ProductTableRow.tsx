import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging } from '../types';

interface ProductTableRowProps {
    product: Product;
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
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'головка', упаковка: 'упаковка', штука: 'штука', банка: 'банка', ящик: 'ящик' };
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

const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const MoreIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ProductTableRow: React.FC<ProductTableRowProps> = ({ product, allCategories, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateUspPrices, onUpdateUspMarkupFlags, onUpdateUnitValue, onUpdateDetails, onUpdateCategories, onUpdateImages }) => {
    const [editedProduct, setEditedProduct] = useState(product);
    const [newCategory, setNewCategory] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const categoryEditorRef = useRef<HTMLDivElement>(null);
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    
    const [isImageEditorOpen, setImageEditorOpen] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const imageEditorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const baseInputClasses = "mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm";

    useEffect(() => {
        setEditedProduct(product);
        setIsDirty(false);
    }, [product]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryEditorRef.current && !categoryEditorRef.current.contains(event.target as Node)) {
                setCategoryPopoverOpen(false);
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
    }, [categoryEditorRef, imageEditorRef, actionsMenuRef]);

     useEffect(() => {
        // Cleanup camera stream
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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

    const handleMarkupTypeChange = (uspKey: 'usp1', useGlobal: boolean) => {
        const propName = `${uspKey}UseGlobalMarkup` as const;
        setEditedProduct(prev => ({ ...prev, [propName]: useGlobal }));
        setIsDirty(true);
    };

    const handleUspPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const uspKey = name.replace('Price', '') as 'usp1';

        setEditedProduct(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        setIsDirty(true);
        
        // Switch to manual mode on typing if it's not already
        const propName = `${uspKey}UseGlobalMarkup` as const;
        if (editedProduct[propName] !== false) {
             handleMarkupTypeChange(uspKey, false);
        }
    };

    const handlePriceOverrideChange = (portion: 'half' | 'quarter', value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setEditedProduct(prev => {
            const newOverrides = { ...prev.priceOverridesPerUnit, [portion]: numValue };
            // Clean up undefined keys
            if (numValue === undefined) {
                delete newOverrides[portion];
            }
            return { ...prev, priceOverridesPerUnit: newOverrides };
        });
        setIsDirty(true);
    };
    
    const handlePortionToggle = (portion: ProductPortion) => {
        if (portion === 'whole') return;
        const newPortions = editedProduct.allowedPortions.includes(portion)
            ? editedProduct.allowedPortions.filter(p => p !== portion)
            : [...editedProduct.allowedPortions, portion];
        setEditedProduct(prev => ({...prev, allowedPortions: newPortions}));
        setIsDirty(true);
    }
    
    const handleCategoryToggle = (category: string) => {
        const newCategories = new Set(editedProduct.categories);
        if (newCategories.has(category)) {
            newCategories.delete(category);
        } else {
            newCategories.add(category);
        }
        setEditedProduct(prev => ({...prev, categories: Array.from(newCategories)}));
        setIsDirty(true);
    };

    const handleAddNewCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !editedProduct.categories.includes(trimmed)) {
           const newCategories = new Set([...editedProduct.categories, trimmed]);
           setEditedProduct(prev => ({...prev, categories: Array.from(newCategories)}));
           setNewCategory('');
           setIsDirty(true);
        }
    };
    
    const allPossibleCategories = useMemo(() => {
        const combined = new Set([...allCategories, ...editedProduct.categories]);
        return Array.from(combined).sort();
    }, [allCategories, editedProduct.categories]);

    const handleSave = () => {
        if (!isDirty) return;
        
        onUpdateDetails(product.id, { name: editedProduct.name, description: editedProduct.description, unit: editedProduct.unit, packaging: editedProduct.packaging });
        onUpdatePrices(product.id, { pricePerUnit: editedProduct.pricePerUnit, priceOverridesPerUnit: editedProduct.priceOverridesPerUnit });
        onUpdateUspPrices(product.id, {
            costPrice: editedProduct.costPrice,
            usp1Price: editedProduct.usp1Price,
        });
        onUpdateUspMarkupFlags(product.id, {
            usp1UseGlobalMarkup: editedProduct.usp1UseGlobalMarkup,
        });
        onUpdateUnitValue(product.id, editedProduct.unitValue);
        onUpdateCategories(product.id, editedProduct.categories);
        
        const originalPortions = new Set(product.allowedPortions);
        const newPortions = new Set(editedProduct.allowedPortions);

        if (originalPortions.has('half') !== newPortions.has('half')) {
            onUpdatePortions(product.id, 'half');
        }
        if (originalPortions.has('quarter') !== newPortions.has('quarter')) {
            onUpdatePortions(product.id, 'quarter');
        }

        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleReset = () => {
        setEditedProduct(product);
        setIsDirty(false);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleDeleteImage = (indexToDelete: number) => {
        if (product.imageUrls.length <= 1) {
            alert('Нельзя удалить последнее изображение товара.');
            return;
        }
        const newImageUrls = product.imageUrls.filter((_, index) => index !== indexToDelete);
        onUpdateImages(product.id, newImageUrls);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            try {
                const base64Promises = files.map(fileToBase64);
                const newBase64Urls = await Promise.all(base64Promises);
                onUpdateImages(product.id, [...product.imageUrls, ...newBase64Urls]);
            } catch (error) {
                console.error("Error converting files to base64:", error);
                alert("Не удалось загрузить изображения.");
            }
        }
    };

    const handleAddFromFileClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleOpenCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Не удалось получить доступ к камере. Проверьте разрешения в браузере.");
        }
    };
    
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };
    
    const handleTakePicture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            onUpdateImages(product.id, [...product.imageUrls, dataUrl]);
        }
        stopCamera();
    };

    
    const getStatusInfo = () => {
        switch (product.status) {
            case ProductStatus.Available: return { Icon: StopIcon, color: 'text-green-500', label: 'Доступен' };
            case ProductStatus.OutOfStock: return { Icon: StopIcon, color: 'text-orange-500', label: 'Нет в наличии' };
            case ProductStatus.Hidden: return { Icon: EyeIcon, color: 'text-red-500', label: 'Скрыт' };
            default: return { Icon: StopIcon, color: 'text-gray-400', label: 'Неизвестно' };
        }
    };

    const StatusInfo = getStatusInfo();

    return (
        <tr className={`border-b transition-colors duration-300 ${isDirty ? 'bg-yellow-50' : 'bg-white'} hover:bg-gray-50`}>
            <td className="py-2 px-2 text-center">
                <button onClick={() => onCycleStatus(product.id)} className={`p-1 rounded-full hover:bg-gray-200 ${StatusInfo.color}`} title={StatusInfo.label}>
                    <StatusInfo.Icon className="w-5 h-5"/>
                </button>
            </td>
            <td className="py-2 px-2 align-top">
                <div className="relative">
                    <button onClick={() => setImageEditorOpen(o => !o)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md">
                        <img src={product.imageUrls[0]} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                    </button>
                    {isImageEditorOpen && (
                        <div ref={imageEditorRef} className="absolute z-10 mt-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            {isCameraActive ? (
                                <div className="flex flex-col items-center gap-2">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-lg bg-black"></video>
                                    <div className="flex gap-2">
                                        <button onClick={handleTakePicture} className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg">Сделать снимок</button>
                                        <button onClick={stopCamera} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg">Отмена</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex space-x-2 overflow-x-auto pb-2">
                                        {product.imageUrls.map((url, index) => (
                                           <div key={index} className="relative flex-shrink-0 group">
                                             <img src={url} alt={`${product.name} photo ${index + 1}`} className="h-24 object-cover rounded-lg"/>
                                             <button onClick={() => handleDeleteImage(index)} className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label={`Удалить изображение ${index + 1}`}>
                                                 <TrashIcon className="w-4 h-4" />
                                             </button>
                                           </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 justify-center pt-2 border-t mt-2">
                                       <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                                       <button onClick={handleAddFromFileClick} className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                            <PlusIcon className="w-4 h-4" />
                                            <span>Фото</span>
                                       </button>
                                       <button onClick={handleOpenCamera} className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                                            <CameraIcon className="w-4 h-4" />
                                            <span>Снимок</span>
                                       </button>
                                    </div>
                                </>
                            )}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    )}
                </div>
            </td>
            <td className="py-2 px-2"><input type="text" name="name" value={editedProduct.name} onChange={handleGenericChange} className={baseInputClasses} /></td>
            <td className="py-2 px-2"><textarea name="description" value={editedProduct.description} onChange={handleGenericChange} rows={2} className={baseInputClasses} /></td>
            <td className="py-2 px-2 align-top">
                <div className="relative">
                    <div className="flex flex-wrap gap-1 items-center">
                        {editedProduct.categories.slice(0, 2).map(c => <span key={c} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{c}</span>)}
                        {editedProduct.categories.length > 2 && <span className="text-xs font-semibold text-gray-500">+{editedProduct.categories.length - 2}</span>}
                        <button onClick={() => setCategoryPopoverOpen(o => !o)} className="text-xs text-indigo-600 hover:underline ml-1">Изм.</button>
                    </div>
                     {isCategoryPopoverOpen && (
                        <div ref={categoryEditorRef} className="absolute z-10 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">Категории</label>
                            <div className="space-y-1 max-h-32 overflow-y-auto mb-2 pr-1">
                                {allPossibleCategories.map(cat => (
                                    <div key={cat} className="flex items-center">
                                        <input id={`table-cat-${product.id}-${cat}`} type="checkbox" checked={editedProduct.categories.includes(cat)} onChange={() => handleCategoryToggle(cat)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                        <label htmlFor={`table-cat-${product.id}-${cat}`} className="ml-2 block text-xs text-gray-900">{cat}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-1">
                                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){e.preventDefault(); handleAddNewCategory()}}} placeholder="Новая категория" className={`${baseInputClasses} text-xs py-1`}/>
                                <button type="button" onClick={handleAddNewCategory} className="px-2 py-1 bg-gray-200 text-xs font-medium rounded-md hover:bg-gray-300 flex-shrink-0">OK</button>
                            </div>
                        </div>
                    )}
                </div>
            </td>
            <td className="py-2 px-2">
                <input type="number" name="pricePerUnit" value={editedProduct.pricePerUnit} onChange={handleNumberChange} className={`${baseInputClasses} mb-1`} />
                <select name="unit" value={editedProduct.unit} onChange={handleGenericChange} className={baseInputClasses}>
                    {unitOptions.map(u => <option key={u} value={u}>{unitDisplayMap[u]}</option>)}
                </select>
            </td>
            <td className="py-2 px-2">
                <input type="number" step="0.01" name="unitValue" value={editedProduct.unitValue} onChange={handleNumberChange} className={`${baseInputClasses} mb-1`} />
                <select name="packaging" value={editedProduct.packaging} onChange={handleGenericChange} className={baseInputClasses}>
                    {packagingOptions.map(p => <option key={p} value={p}>{packagingDisplayMap[p]}</option>)}
                </select>
            </td>
            <td className="py-2 px-2">
                 {editedProduct.unit === 'kg' ? (
                     <div className="space-y-2">
                        <div className="flex items-center"><input id={`half-${product.id}`} type="checkbox" checked={editedProduct.allowedPortions.includes('half')} onChange={() => handlePortionToggle('half')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/><label htmlFor={`half-${product.id}`} className="ml-2 text-sm text-gray-900">Половинка</label></div>
                        <div className="flex items-center"><input id={`quarter-${product.id}`} type="checkbox" checked={editedProduct.allowedPortions.includes('quarter')} onChange={() => handlePortionToggle('quarter')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/><label htmlFor={`quarter-${product.id}`} className="ml-2 text-sm text-gray-900">Четверть</label></div>
                     </div>
                 ) : <span className="text-xs text-gray-400">N/A</span>}
            </td>
            <td className="py-2 px-2">
                {editedProduct.unit === 'kg' ? (
                    <div className="space-y-1">
                        <div>
                            <label className="text-xs text-gray-600">₽/кг (1/2)</label>
                            <input type="number" value={editedProduct.priceOverridesPerUnit?.half ?? ''} onChange={e => handlePriceOverrideChange('half', e.target.value)} placeholder={editedProduct.pricePerUnit.toString()} className={baseInputClasses}/>
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">₽/кг (1/4)</label>
                            <input type="number" value={editedProduct.priceOverridesPerUnit?.quarter ?? ''} onChange={e => handlePriceOverrideChange('quarter', e.target.value)} placeholder={editedProduct.pricePerUnit.toString()} className={baseInputClasses}/>
                        </div>
                    </div>
                ) : <span className="text-xs text-gray-400">N/A</span>}
            </td>
            <td className="py-2 px-2"><input type="number" name="costPrice" value={editedProduct.costPrice ?? ''} onChange={handleUspPriceChange} className={baseInputClasses} placeholder="-" /></td>
            <td className="py-2 px-2">
                <div className="relative">
                    <input type="number" name="usp1Price" value={editedProduct.usp1Price ?? ''} onChange={handleUspPriceChange} className={`${baseInputClasses} pr-7`} placeholder="-" />
                    <button type="button" onClick={() => handleMarkupTypeChange('usp1', !(editedProduct.usp1UseGlobalMarkup !== false))} className={`absolute inset-y-0 right-0 top-1 flex items-center px-2 rounded-r-md focus:outline-none ${editedProduct.usp1UseGlobalMarkup !== false ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`} title={editedProduct.usp1UseGlobalMarkup !== false ? 'Используется общая наценка. Нажмите для ручного ввода.' : 'Ручной ввод. Нажмите для использования общей наценки.'}>
                        <span className="text-xs font-bold">{editedProduct.usp1UseGlobalMarkup !== false ? '%' : '₽'}</span>
                    </button>
                </div>
            </td>
            <td className="py-2 px-2 text-center align-top">
                <div className="flex items-center justify-center gap-2 h-full">
                    <div className="flex-grow">
                        <button onClick={handleSave} disabled={!isDirty} className="w-full px-2 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Сохранить
                        </button>
                        {showSaved && <span className="text-xs text-green-600 block mt-1">✓ Сохр.</span>}
                    </div>
                    <div className="relative" ref={actionsMenuRef}>
                        <button onClick={() => setActionsMenuOpen(o => !o)} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <MoreIcon className="w-5 h-5" />
                        </button>
                        {isActionsMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-md shadow-lg z-20 border py-1">
                                <button
                                    onClick={() => { handleReset(); setActionsMenuOpen(false); }}
                                    disabled={!isDirty}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Сбросить
                                </button>
                                <div className="border-t my-1"></div>
                                <button
                                    onClick={() => { onDeleteProduct(product.id); setActionsMenuOpen(false); }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Удалить товар
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default ProductTableRow;