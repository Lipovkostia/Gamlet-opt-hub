
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, CustomerType } from '../types';

interface ProductTableRowProps {
    product: Product;
    allCategories: string[];
    onDeleteProduct: (productId: string) => void;
    onCycleStatus: (productId: string) => void;
    onUpdatePortions: (productId: string, portion: ProductPortion) => void;
    onUpdatePrices: (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdatePriceTiers?: (productId: string, priceTiers: Product['priceTiers']) => void; // New prop
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; }) => void;
    onUpdateUspMarkupFlags: (productId: string, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUnitValue: (productId: string, newUnitValue: number) => void;
    onUpdateDetails: (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateCategories: (productId: string, newCategories: string[]) => void;
    onUpdateImages: (productId: string, newImageUrls: string[]) => void;
    onUpdateVisibility: (productId: string, visibleToRoles: CustomerType[]) => void;
    roles?: string[];
    columnOrder?: string[];
    roleKey?: string; // New prop to identify current pricing role context
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

const ProductTableRow: React.FC<ProductTableRowProps> = ({ 
    product, 
    allCategories, 
    onDeleteProduct, 
    onCycleStatus, 
    onUpdatePortions, 
    onUpdatePrices, 
    onUpdatePriceTiers,
    onUpdateUspPrices, 
    onUpdateUspMarkupFlags, 
    onUpdateUnitValue, 
    onUpdateDetails, 
    onUpdateCategories, 
    onUpdateImages, 
    onUpdateVisibility, 
    roles = [],
    columnOrder = ['status', 'photo', 'name', 'description', 'categories', 'visibility', 'price', 'value', 'portions', 'special', 'cost', 'actions'],
    roleKey // Optional: if present, we are editing a specific tier price
}) => {
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
    
    const [isImageEditorOpen, setImageEditorOpen] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const imageEditorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Compact styles
    const compactInputClasses = "block w-full px-1 py-0.5 border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-sm bg-white h-7";
    const compactSelectClasses = "block px-1 py-0.5 border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-sm bg-white h-7";
    const cellClasses = "py-1 px-1 border-r border-b border-gray-300 align-middle";

    useEffect(() => {
        setEditedProduct(product);
        if (roleKey) {
            setTierPrice(product.priceTiers?.[roleKey]?.toString() || '');
        }
        setIsDirty(false);
    }, [product, roleKey]);

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
    }, [categoryEditorRef, roleEditorRef, imageEditorRef, actionsMenuRef]);

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

    const handleTierPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTierPrice(e.target.value);
        setIsDirty(true);
    }

    const handleUspPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedProduct(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        setIsDirty(true);
    };

    const handlePriceOverrideChange = (portion: 'half' | 'quarter', value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setEditedProduct(prev => {
            const newOverrides = { ...prev.priceOverridesPerUnit, [portion]: numValue };
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

    const handleRoleToggle = (role: CustomerType) => {
        const currentRoles = editedProduct.visibleToRoles || [];
        
        let newRoles: CustomerType[];
        if (currentRoles.includes(role)) {
            newRoles = currentRoles.filter(r => r !== role);
        } else {
            newRoles = [...currentRoles, role];
        }
        setEditedProduct(prev => ({...prev, visibleToRoles: newRoles}));
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
        
        // General updates
        onUpdateDetails(product.id, { name: editedProduct.name, description: editedProduct.description, unit: editedProduct.unit, packaging: editedProduct.packaging });
        onUpdateUnitValue(product.id, editedProduct.unitValue);
        onUpdateCategories(product.id, editedProduct.categories);
        onUpdateVisibility(product.id, editedProduct.visibleToRoles || []);
        onUpdateUspPrices(product.id, {
            costPrice: editedProduct.costPrice,
            usp1Price: editedProduct.usp1Price,
        });
        onUpdateUspMarkupFlags(product.id, {
            usp1UseGlobalMarkup: editedProduct.usp1UseGlobalMarkup,
        });

        // Price updates
        if (roleKey && onUpdatePriceTiers) {
            const newPrice = tierPrice === '' ? undefined : parseFloat(tierPrice);
            const newTiers = { ...product.priceTiers };
            if (newPrice !== undefined && !isNaN(newPrice)) {
                newTiers[roleKey] = newPrice;
            } else {
                delete newTiers[roleKey];
            }
            onUpdatePriceTiers(product.id, newTiers);
        } else {
            onUpdatePrices(product.id, { pricePerUnit: editedProduct.pricePerUnit, priceOverridesPerUnit: editedProduct.priceOverridesPerUnit });
            
            const originalPortions = new Set(product.allowedPortions);
            const newPortions = new Set(editedProduct.allowedPortions);

            if (originalPortions.has('half') !== newPortions.has('half')) {
                onUpdatePortions(product.id, 'half');
            }
            if (originalPortions.has('quarter') !== newPortions.has('quarter')) {
                onUpdatePortions(product.id, 'quarter');
            }
        }

        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleReset = () => {
        setEditedProduct(product);
        if (roleKey) {
            setTierPrice(product.priceTiers?.[roleKey]?.toString() || '');
        }
        setIsDirty(false);
    };

    const handleDeleteImage = (indexToDelete: number) => {
        if (product.imageUrls.length <= 1) {
            alert('Нельзя удалить последнее изображение.');
            return;
        }
        const newImageUrls = product.imageUrls.filter((_, index) => index !== indexToDelete);
        onUpdateImages(product.id, newImageUrls);
    };

    // Helper to compress images before upload
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    } else {
                        reject(new Error("Canvas context missing"));
                    }
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            try {
                const base64Promises = files.map(compressImage);
                const newBase64Urls = await Promise.all(base64Promises);
                onUpdateImages(product.id, [...product.imageUrls, ...newBase64Urls]);
            } catch (error) {
                console.error("Error compressing/loading images:", error);
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
            alert("Не удалось получить доступ к камере.");
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
        const MAX_DIM = 1000;
        let w = video.videoWidth;
        let h = video.videoHeight;
        
        if (w > MAX_DIM || h > MAX_DIM) {
             const ratio = w / h;
             if (w > h) { w = MAX_DIM; h = MAX_DIM / ratio; }
             else { h = MAX_DIM; w = MAX_DIM * ratio; }
        }

        canvas.width = w;
        canvas.height = h;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onUpdateImages(product.id, [...product.imageUrls, dataUrl]);
        }
        stopCamera();
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

    // Map content for each cell type
    const cells: Record<string, React.ReactNode> = {
        status: (
            <td key="status" className={`${cellClasses} text-center`}>
                <button onClick={() => onCycleStatus(product.id)} className={`p-1 rounded hover:bg-gray-200 ${StatusInfo.color}`} title={StatusInfo.label}>
                    <StatusInfo.Icon className="w-4 h-4"/>
                </button>
            </td>
        ),
        photo: (
            <td key="photo" className={`${cellClasses} text-center`}>
                <div className="relative inline-block">
                    <button onClick={() => setImageEditorOpen(o => !o)} className="focus:outline-none">
                        <img src={product.imageUrls[0]} alt="img" className="w-8 h-8 object-cover rounded-sm border border-gray-200" />
                    </button>
                    {isImageEditorOpen && (
                        <div ref={imageEditorRef} className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded shadow-lg p-2 left-0">
                            {isCameraActive ? (
                                <div className="flex flex-col items-center gap-2">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-32 object-cover bg-black"></video>
                                    <div className="flex gap-1">
                                        <button onClick={handleTakePicture} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Снять</button>
                                        <button onClick={stopCamera} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Отмена</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex space-x-1 overflow-x-auto pb-1 mb-1">
                                        {product.imageUrls.map((url, index) => (
                                           <div key={index} className="relative flex-shrink-0 group">
                                             <img src={url} alt={`img ${index}`} className="h-16 w-16 object-cover border"/>
                                             <button onClick={() => handleDeleteImage(index)} className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-0.5 opacity-0 group-hover:opacity-100">
                                                 <TrashIcon className="w-3 h-3" />
                                             </button>
                                           </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1 justify-center">
                                       <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                                       <button onClick={handleAddFromFileClick} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                            + Фото
                                       </button>
                                       <button onClick={handleOpenCamera} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                                            Камера
                                       </button>
                                    </div>
                                </>
                            )}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    )}
                </div>
            </td>
        ),
        name: <td key="name" className={cellClasses}><input type="text" name="name" value={editedProduct.name} onChange={handleGenericChange} className={compactInputClasses} /></td>,
        description: <td key="description" className={cellClasses}><textarea name="description" value={editedProduct.description} onChange={handleGenericChange} rows={1} className={`${compactInputClasses} h-full min-h-[1.75rem] resize-none overflow-hidden hover:overflow-auto`} /></td>,
        categories: (
            <td key="categories" className={cellClasses}>
                <div className="relative h-full flex items-center">
                    <button onClick={() => setCategoryPopoverOpen(o => !o)} className="text-xs text-left w-full truncate px-1 hover:text-indigo-600">
                        {editedProduct.categories.length > 0 ? editedProduct.categories.join(', ') : <span className="text-gray-400">Нет</span>}
                    </button>
                     {isCategoryPopoverOpen && (
                        <div ref={categoryEditorRef} className="absolute z-10 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 top-full left-0">
                            <div className="space-y-0.5 max-h-32 overflow-y-auto mb-2">
                                {allPossibleCategories.map(cat => (
                                    <div key={cat} className="flex items-center">
                                        <input id={`table-cat-${product.id}-${cat}`} type="checkbox" checked={editedProduct.categories.includes(cat)} onChange={() => handleCategoryToggle(cat)} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/>
                                        <label htmlFor={`table-cat-${product.id}-${cat}`} className="ml-1.5 block text-xs text-gray-900">{cat}</label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){e.preventDefault(); handleAddNewCategory()}}} placeholder="Категория" className="block w-full px-1 py-0.5 border border-gray-300 rounded text-xs"/>
                                <button type="button" onClick={handleAddNewCategory} className="px-1 py-0.5 bg-gray-200 text-xs rounded hover:bg-gray-300">+</button>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        ),
        visibility: (
            <td key="visibility" className={cellClasses}>
                <div className="relative h-full flex items-center">
                    <button onClick={() => setRolePopoverOpen(o => !o)} className="text-xs text-indigo-600 hover:underline px-1 truncate w-full text-left">
                        {!editedProduct.visibleToRoles || editedProduct.visibleToRoles.length === 0 
                            ? 'Все' 
                            : `${editedProduct.visibleToRoles.length} ролей`
                        }
                    </button>
                    {isRolePopoverOpen && (
                        <div ref={roleEditorRef} className="absolute z-10 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg p-2 left-0">
                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                <div className="text-[10px] text-gray-500 mb-1 italic">Пусто = всем</div>
                                {roles.map(role => (
                                    <div key={role} className="flex items-center">
                                        <input 
                                            id={`role-${product.id}-${role}`} 
                                            type="checkbox" 
                                            checked={(editedProduct.visibleToRoles || []).includes(role)} 
                                            onChange={() => handleRoleToggle(role)} 
                                            className="h-3 w-3 text-indigo-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`role-${product.id}-${role}`} className="ml-1.5 block text-xs text-gray-900 truncate">{role}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
        ),
        price: (
            <td key="price" className={cellClasses}>
                {roleKey ? (
                    <div className="flex flex-col h-full justify-center">
                        <input 
                            type="number" 
                            value={tierPrice} 
                            onChange={handleTierPriceChange} 
                            className={`${compactInputClasses} bg-yellow-50`}
                            placeholder="-"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-1 h-full">
                        <input 
                            type="number" 
                            name="pricePerUnit" 
                            value={editedProduct.pricePerUnit} 
                            onChange={handleNumberChange} 
                            className={compactInputClasses} 
                        />
                        <select 
                            name="unit" 
                            value={editedProduct.unit} 
                            onChange={handleGenericChange} 
                            className={`${compactSelectClasses} w-16`}
                        >
                            {unitOptions.map(u => <option key={u} value={u}>{unitDisplayMap[u]}</option>)}
                        </select>
                    </div>
                )}
            </td>
        ),
        value: (
            <td key="value" className={cellClasses}>
                <div className="flex items-center gap-1 h-full">
                    <input 
                        type="number" 
                        step="0.01" 
                        name="unitValue" 
                        value={editedProduct.unitValue} 
                        onChange={handleNumberChange} 
                        className={compactInputClasses} 
                    />
                    <select 
                        name="packaging" 
                        value={editedProduct.packaging} 
                        onChange={handleGenericChange} 
                        className={`${compactSelectClasses} w-20`}
                    >
                        {packagingOptions.map(p => <option key={p} value={p}>{packagingDisplayMap[p]}</option>)}
                    </select>
                </div>
            </td>
        ),
        portions: (
            <td key="portions" className={`${cellClasses} text-xs`}>
                 {editedProduct.unit === 'kg' && !roleKey ? (
                     <div className="flex flex-col gap-0.5 justify-center h-full">
                        <div className="flex items-center"><input id={`half-${product.id}`} type="checkbox" checked={editedProduct.allowedPortions.includes('half')} onChange={() => handlePortionToggle('half')} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/><label htmlFor={`half-${product.id}`} className="ml-1">1/2</label></div>
                        <div className="flex items-center"><input id={`quarter-${product.id}`} type="checkbox" checked={editedProduct.allowedPortions.includes('quarter')} onChange={() => handlePortionToggle('quarter')} className="h-3 w-3 text-indigo-600 border-gray-300 rounded"/><label htmlFor={`quarter-${product.id}`} className="ml-1">1/4</label></div>
                     </div>
                 ) : <span className="text-gray-300">-</span>}
            </td>
        ),
        special: (
            <td key="special" className={cellClasses}>
                {editedProduct.unit === 'kg' && !roleKey ? (
                    <div className="flex flex-col gap-1 justify-center h-full">
                        <input type="number" value={editedProduct.priceOverridesPerUnit?.half ?? ''} onChange={e => handlePriceOverrideChange('half', e.target.value)} placeholder="1/2" className={`${compactInputClasses} h-6`} title="Цена за кг (1/2)"/>
                        <input type="number" value={editedProduct.priceOverridesPerUnit?.quarter ?? ''} onChange={e => handlePriceOverrideChange('quarter', e.target.value)} placeholder="1/4" className={`${compactInputClasses} h-6`} title="Цена за кг (1/4)"/>
                    </div>
                ) : <span className="text-gray-300 text-center block">-</span>}
            </td>
        ),
        cost: <td key="cost" className={cellClasses}><input type="number" name="costPrice" value={editedProduct.costPrice ?? ''} onChange={handleUspPriceChange} className={compactInputClasses} placeholder="-" /></td>,
        actions: (
            <td key="actions" className={`${cellClasses} text-center`}>
                <div className="flex items-center justify-center gap-1 h-full">
                    <button onClick={handleSave} disabled={!isDirty} className="px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Сохр.
                    </button>
                    <div className="relative" ref={actionsMenuRef}>
                        <button onClick={() => setActionsMenuOpen(o => !o)} className="p-0.5 text-gray-500 hover:bg-gray-200 rounded">
                            <MoreIcon className="w-4 h-4" />
                        </button>
                        {isActionsMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded shadow-lg border z-20 py-1 text-xs">
                                <button
                                    onClick={() => { handleReset(); setActionsMenuOpen(false); }}
                                    disabled={!isDirty}
                                    className="w-full text-left px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Сброс
                                </button>
                                <button
                                    onClick={() => { onDeleteProduct(product.id); setActionsMenuOpen(false); }}
                                    className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-50"
                                >
                                    Удалить
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        )
    };

    return (
        <tr className={`transition-colors hover:bg-gray-50 ${isDirty ? 'bg-yellow-50' : ''}`}>
            {columnOrder.map(colKey => cells[colKey] || null)}
        </tr>
    );
};

export default ProductTableRow;
