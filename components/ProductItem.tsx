
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, ProductBadge } from '../types';

interface ProductItemProps {
  product: Product;
  onAddToCart: (product: Product, portion: ProductPortion, startRect?: DOMRect) => void;
  isExpanded: boolean;
  onToggleExpand: (productId: number) => void;
  isGalleryOpen: boolean;
  onToggleGallery: (productId: number) => void;
  isAdminView?: boolean;
  onDeleteProduct?: (productId: number) => void;
  onCycleStatus?: (productId: number) => void;
  onUpdatePortions?: (productId: number, portion: ProductPortion) => void;
  onUpdatePrices?: (productId: number, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
  onUpdateUnitValue?: (productId: number, newUnitValue: number) => void;
  onUpdateDetails?: (productId: number, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
  onUpdateImages?: (productId: number, newImageUrls: string[]) => void;
  onOpenGalleryModal?: (imageUrls: string[], index: number) => void;
  showProductImages?: boolean;
  allCategories?: string[];
  onUpdateCategories?: (productId: number, newCategories: string[]) => void;
  onCycleBadge?: (productId: number) => void;
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'головка', упаковка: 'упаковка', штука: 'штука', банка: 'банка', ящик: 'ящик' };
const unitOptions: ProductUnit[] = ['kg', 'g', 'pcs', 'l'];
const packagingOptions: ProductPackaging[] = ['головка', 'упаковка', 'штука', 'банка', 'ящик'];

const badgeStyles: Record<ProductBadge, { text: string; bg: string; }> = {
    'ХИТ': { text: 'ХИТ', bg: 'bg-green-500' },
    'акция': { text: 'акция', bg: 'bg-red-500' },
    'мало': { text: 'мало', bg: 'bg-sky-500' },
    'много': { text: 'много', bg: 'bg-blue-600' },
};

const FullCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const HalfCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" >
        <path d="M12 2 a 10 10 0 1 0 0 20 V 2 Z"></path>
    </svg>
);

const QuarterCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
         <path d="M12 2 V 12 H 22 A 10 10 0 0 0 12 2 Z"></path>
    </svg>
);

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

const PencilIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
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

// NOTE: Extracted editor components to prevent focus loss on input change.
// Defining components inside another component's render function causes them to be
// recreated on every render, which unmounts the old component and its state (like focus).
// By making these separate, stable components, React can update them without remounting.

const PriceEditorComponent: React.FC<{
  product: Product;
  prices: { pricePerUnit: string; half_unit_override: string; quarter_unit_override: string; };
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ product, prices, onPriceChange, onSave, onCancel }) => (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
      <h4 className="font-semibold text-gray-700">Редактировать цены</h4>
      
      <div>
        <label htmlFor={`pricePerUnit-${product.id}`} className="block text-sm font-medium text-gray-700">Базовая цена за {unitDisplayMap[product.unit]} (₽)</label>
        <p className="text-xs text-gray-500 mb-1">Используется для целой единицы товара и по умолчанию для порций.</p>
        <input type="number" name="pricePerUnit" id={`pricePerUnit-${product.id}`} value={prices.pricePerUnit} onChange={onPriceChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
      
      {product.unit === 'kg' && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Специальные цены за килограмм для порций</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor={`price-half-unit-${product.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <HalfCircleIcon className="w-4 h-4 text-gray-500"/>
                      <span>Цена за кг (Половинка)</span>
                  </label>
                  <input type="number" name="half_unit_override" id={`price-half-unit-${product.id}`} value={prices.half_unit_override} onChange={onPriceChange} placeholder={product.pricePerUnit.toString()} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                  <label htmlFor={`price-quarter-unit-${product.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <QuarterCircleIcon className="w-4 h-4 text-gray-500"/>
                      <span>Цена за кг (Четвертинка)</span>
                  </label>
                  <input type="number" name="quarter_unit_override" id={`price-quarter-unit-${product.id}`} value={prices.quarter_unit_override} onChange={onPriceChange} placeholder={product.pricePerUnit.toString()} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Отмена</button>
          <button onClick={onSave} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Сохранить</button>
      </div>
    </div>
);


const DetailsEditorComponent: React.FC<{
    product: Product;
    details: { name: string; description: string; categories: Set<string>; unit: ProductUnit; packaging: ProductPackaging; };
    allPossibleCategories: string[];
    newCategory: string;
    onDetailsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onCategoryToggle: (category: string) => void;
    onNewCategoryChange: (value: string) => void;
    onAddNewCategory: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
}> = ({ product, details, allPossibleCategories, newCategory, onDetailsChange, onCategoryToggle, onNewCategoryChange, onAddNewCategory, onDelete, onSave, onCancel }) => (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
        <h4 className="font-semibold text-gray-700">Редактировать товар</h4>
        <div>
            <label htmlFor={`details-name-${product.id}`} className="block text-sm font-medium text-gray-700">Название</label>
            <input type="text" name="name" id={`details-name-${product.id}`} value={details.name} onChange={onDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
            <label htmlFor={`details-desc-${product.id}`} className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea name="description" id={`details-desc-${product.id}`} value={details.description} onChange={onDetailsChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor={`details-unit-${product.id}`} className="block text-sm font-medium text-gray-700">Ед. изм.</label>
                <select id={`details-unit-${product.id}`} name="unit" value={details.unit} onChange={onDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {unitOptions.map(u => <option key={u} value={u}>{unitDisplayMap[u]}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor={`details-packaging-${product.id}`} className="block text-sm font-medium text-gray-700">Вид</label>
                <select id={`details-packaging-${product.id}`} name="packaging" value={details.packaging} onChange={onDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {packagingOptions.map(p => <option key={p} value={p}>{packagingDisplayMap[p]}</option>)}
                </select>
            </div>
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Категории</label>
            <div className="mt-2 space-y-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-white">
                {allPossibleCategories.map(cat => (
                    <div key={cat} className="flex items-center">
                        <input 
                            id={`details-cat-${product.id}-${cat}`} 
                            type="checkbox" 
                            checked={details.categories.has(cat)} 
                            onChange={() => onCategoryToggle(cat)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`details-cat-${product.id}-${cat}`} className="ml-2 block text-sm text-gray-900">{cat}</label>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input 
                    type="text" 
                    value={newCategory} 
                    onChange={e => onNewCategoryChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddNewCategory(); } }}
                    placeholder="Добавить новую категорию"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button 
                    type="button" 
                    onClick={onAddNewCategory}
                    className="px-3 py-2 bg-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 flex-shrink-0"
                >
                    Добавить
                </button>
            </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t mt-4">
            <button 
                type="button" 
                onClick={onDelete}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 rounded-md"
            >
                Удалить товар
            </button>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Отмена</button>
                <button onClick={onSave} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Сохранить</button>
            </div>
        </div>
    </div>
);


const ProductItem: React.FC<ProductItemProps> = ({ product, onAddToCart, isExpanded, onToggleExpand, isGalleryOpen, onToggleGallery, isAdminView, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onOpenGalleryModal, showProductImages = true, allCategories, onUpdateCategories, onCycleBadge }) => {
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [isUnitValueEditing, setIsUnitValueEditing] = useState(false);
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const imgButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Local state for the forms, initialized from props
  const [newUnitValue, setNewUnitValue] = useState(product.unitValue.toString());
  const [prices, setPrices] = useState({
    pricePerUnit: product.pricePerUnit.toString(),
    half_unit_override: product.priceOverridesPerUnit?.half?.toString() ?? '',
    quarter_unit_override: product.priceOverridesPerUnit?.quarter?.toString() ?? '',
  });
  const [details, setDetails] = useState({
    name: product.name,
    description: product.description,
    categories: new Set(product.categories),
    unit: product.unit,
    packaging: product.packaging,
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isPriceEditing) {
      setPrices({
        pricePerUnit: product.pricePerUnit.toString(),
        half_unit_override: product.priceOverridesPerUnit?.half?.toString() ?? '',
        quarter_unit_override: product.priceOverridesPerUnit?.quarter?.toString() ?? '',
      });
    }
  }, [isPriceEditing, product]);

  useEffect(() => {
    if (isUnitValueEditing) {
      setNewUnitValue(product.unitValue.toString());
    }
  }, [isUnitValueEditing, product]);
  
  useEffect(() => {
    if (isDetailsEditing) {
      setDetails({
        name: product.name,
        description: product.description,
        categories: new Set(product.categories),
        unit: product.unit,
        packaging: product.packaging,
      });
      setNewCategory('');
    }
  }, [isDetailsEditing, product]);

  useEffect(() => {
    // Cleanup camera stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  const formatPrice = (price: number) => price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const getPortionPrice = (portion: ProductPortion) => {
    const basePricePerUnit = product.pricePerUnit || 0;
    const baseUnitValue = product.unitValue || 0;
    let effectivePricePerUnit = basePricePerUnit;
    let portionValue = 0;

    switch (portion) {
        case 'whole':
            effectivePricePerUnit = basePricePerUnit;
            portionValue = baseUnitValue;
            break;
        case 'half':
            effectivePricePerUnit = product.priceOverridesPerUnit?.half ?? basePricePerUnit;
            portionValue = baseUnitValue / 2;
            break;
        case 'quarter':
            effectivePricePerUnit = product.priceOverridesPerUnit?.quarter ?? basePricePerUnit;
            portionValue = baseUnitValue / 4;
            break;
    }
    return effectivePricePerUnit * portionValue;
  };
  
  const handleAddToCartClick = (portion: ProductPortion) => {
    if (showProductImages && imgButtonRef.current) {
        const rect = imgButtonRef.current.getBoundingClientRect();
        onAddToCart(product, portion, rect);
    } else {
        // Если изображения скрыты, у нас нет элемента для анимации.
        // Вызываем onAddToCart без startRect, чтобы пропустить анимацию, но добавить товар.
        onAddToCart(product, portion, undefined);
    }
  };

  const wholePrice = getPortionPrice('whole');
  const halfPrice = getPortionPrice('half');
  const quarterPrice = getPortionPrice('quarter');
  
  const handleCycleStatus = () => {
    if (onCycleStatus) {
        onCycleStatus(product.id);
    }
  }

  const handlePriceFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrices(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceSave = () => {
    if (!onUpdatePrices) return;

    const newPricePerUnit = parseFloat(prices.pricePerUnit) || 0;
    const newPriceOverrides: Product['priceOverridesPerUnit'] = {
        half: prices.half_unit_override ? parseFloat(prices.half_unit_override) : undefined,
        quarter: prices.quarter_unit_override ? parseFloat(prices.quarter_unit_override) : undefined,
    };
    
    Object.keys(newPriceOverrides).forEach(key => {
      const typedKey = key as keyof typeof newPriceOverrides;
      if (newPriceOverrides[typedKey] === undefined || newPriceOverrides[typedKey] === 0) {
        delete newPriceOverrides[typedKey];
      }
    });

    onUpdatePrices(product.id, {
        pricePerUnit: newPricePerUnit,
        priceOverridesPerUnit: newPriceOverrides,
    });
    setIsPriceEditing(false);
  };
  
  const handleUnitValueSave = () => {
    if (!onUpdateUnitValue) return;
    const unitValue = parseFloat(newUnitValue);
    if (!isNaN(unitValue) && unitValue > 0) {
        onUpdateUnitValue(product.id, unitValue);
    }
    setIsUnitValueEditing(false);
  };

  const handleDetailsFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDetailsSave = () => {
    if (onUpdateDetails) {
        onUpdateDetails(product.id, { 
            name: details.name.trim(), 
            description: details.description.trim(),
            unit: details.unit,
            packaging: details.packaging,
        });
    }
    if (onUpdateCategories) {
        onUpdateCategories(product.id, Array.from(details.categories));
    }
    setIsDetailsEditing(false);
  };

    const handleDeleteImage = (indexToDelete: number) => {
        if (!onUpdateImages) return;
        if (product.imageUrls.length <= 1) {
            alert('Нельзя удалить последнее изображение товара.');
            return;
        }
        const newImageUrls = product.imageUrls.filter((_, index) => index !== indexToDelete);
        onUpdateImages(product.id, newImageUrls);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && onUpdateImages) {
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
        if (!videoRef.current || !canvasRef.current || !onUpdateImages) return;
        
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


  const itemClasses = `px-3 py-[3px] transition-colors duration-150 flex flex-col ${product.status === ProductStatus.Hidden && isAdminView ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`

  const customerButtonClasses = "flex items-center gap-1.5 text-center px-2 py-1.5 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200";

  const getAdminPortionButtonClasses = (isAllowed: boolean) => 
    `flex items-center gap-1.5 text-center p-2 font-semibold rounded-lg transition-colors duration-200 ${
      isAllowed
        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
    }`;
    
  const getAdminAriaLabel = () => {
    switch (product.status) {
        case ProductStatus.Available: return 'Пометить как "Нет в наличии"';
        case ProductStatus.OutOfStock: return 'Скрыть товар';
        case ProductStatus.Hidden: return 'Сделать товар доступным';
        default: return 'Изменить статус';
    }
  }
  
  const handleCategoryToggle = (category: string) => {
    setDetails(prev => {
        const newCategories = new Set(prev.categories);
        if (newCategories.has(category)) {
            newCategories.delete(category);
        } else {
            newCategories.add(category);
        }
        return { ...prev, categories: newCategories };
    });
  };

  const handleAddNewCategoryInEditor = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
        setDetails(prev => {
            const newCategories = new Set(prev.categories);
            newCategories.add(trimmed);
            return { ...prev, categories: newCategories };
        });
        setNewCategory('');
    }
  };
  
  const allPossibleCategories = useMemo(() => {
    const combined = new Set([...(allCategories || []), ...details.categories]);
    return Array.from(combined).sort();
  }, [allCategories, details.categories]);

  const badge = product.badge;
  const badgeInfo = badge ? badgeStyles[badge] : null;

  return (
    <div className={itemClasses}>
        <div className="flex gap-4">
            {showProductImages && (
                <div className="flex-shrink-0 mt-1 self-start">
                    <button 
                        ref={imgButtonRef}
                        onClick={() => onToggleGallery(product.id)} 
                        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md block"
                        aria-expanded={isGalleryOpen}
                        aria-controls={`gallery-${product.id}`}
                    >
                        <img src={product.imageUrls[0]} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                    </button>
                    
                    {isAdminView ? (
                        <button
                            onClick={() => onCycleBadge && onCycleBadge(product.id)}
                            className={`w-12 mt-1 py-1 text-xs font-semibold rounded-md transition-colors text-center text-white capitalize ${
                                badgeInfo ? badgeInfo.bg : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                        >
                            {badgeInfo ? badgeInfo.text : 'метка'}
                        </button>
                    ) : (
                        badgeInfo && (
                            <div
                                className={`w-12 mt-1 py-1 text-xs font-semibold rounded-md text-white text-center capitalize ${badgeInfo.bg}`}
                            >
                                {badgeInfo.text}
                            </div>
                        )
                    )}
                </div>
            )}
            <div className="flex flex-col flex-grow gap-1 w-full min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <button 
                        onClick={() => isAdminView ? setIsDetailsEditing(!isDetailsEditing) : onToggleExpand(product.id)}
                        className="font-semibold text-base text-gray-800 text-left w-full focus:outline-none flex items-center gap-2 group min-w-0"
                        aria-expanded={isExpanded}
                        aria-controls={`description-${product.id}`}
                    >
                        <span className="truncate">{product.name}</span>
                        {isAdminView && <PencilIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600" />}
                    </button>
                    {isAdminView && (
                        <div className="flex items-center gap-1">
                            <button onClick={handleCycleStatus} className={`p-1 rounded-full ${product.status !== ProductStatus.Hidden ? 'text-red-500 hover:bg-red-100' : 'text-green-500 hover:bg-green-100'}`} aria-label={getAdminAriaLabel()}>
                               {product.status === ProductStatus.Hidden ? <EyeIcon className="w-5 h-5"/> : <StopIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    )}
                </div>
                
                <div 
                    id={`description-${product.id}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded && !isAdminView ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                    <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 pt-1 pb-2 pr-4">
                            {product.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-y-2 gap-x-4">
                    <div className="flex items-center gap-1">
                        <div className="flex items-center text-sm text-gray-500 flex-wrap gap-x-1.5">
                            <button
                                className={`flex items-center rounded-md ${isAdminView ? 'cursor-pointer hover:bg-gray-100 px-1 py-0.5' : 'cursor-default'}`}
                                onClick={() => isAdminView && setIsPriceEditing(!isPriceEditing)}
                                disabled={!isAdminView}
                                aria-label={isAdminView ? "Редактировать цены" : ""}
                            >
                                <span>{product.pricePerUnit.toLocaleString('ru-RU')} ₽/{unitDisplayMap[product.unit]}</span>
                                {isAdminView && <PencilIcon className="w-3.5 h-3.5 text-gray-400 ml-1" />}
                            </button>

                            <span className="text-gray-400 hidden sm:inline">·</span>

                            {isUnitValueEditing && isAdminView ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newUnitValue}
                                        onChange={(e) => setNewUnitValue(e.target.value)}
                                        onBlur={handleUnitValueSave}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleUnitValueSave() }}
                                        className="w-20 px-1 py-0.5 border border-indigo-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                    <span className="text-gray-500">{unitDisplayMap[product.unit]}/{packagingDisplayMap[product.packaging]}</span>
                                </div>
                            ) : (
                                <button
                                    className={`flex items-center rounded-md ${isAdminView ? 'cursor-pointer hover:bg-gray-100 px-1 py-0.5' : 'cursor-default'}`}
                                    onClick={() => isAdminView && setIsUnitValueEditing(true)}
                                    disabled={!isAdminView}
                                    aria-label={isAdminView ? "Редактировать значение" : ""}
                                >
                                    <span>{product.unitValue} {unitDisplayMap[product.unit]}/{packagingDisplayMap[product.packaging]}</span>
                                    {isAdminView && <PencilIcon className="w-3.5 h-3.5 text-gray-400 ml-1" />}
                                </button>
                            )}
                        </div>
                        {isAdminView && product.status === ProductStatus.OutOfStock && <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Нет в наличии</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                        {isAdminView ? (
                          <>
                           {product.unit === 'kg' && (
                            <>
                                <button
                                    onClick={() => onUpdatePortions && onUpdatePortions(product.id, 'quarter')}
                                    className={getAdminPortionButtonClasses(product.allowedPortions.includes('quarter'))}
                                    aria-label={`Переключить продажу четвертинками для ${product.name}`}
                                >
                                    <QuarterCircleIcon className="w-4 h-4"/>
                                </button>
                                <button
                                    onClick={() => onUpdatePortions && onUpdatePortions(product.id, 'half')}
                                    className={getAdminPortionButtonClasses(product.allowedPortions.includes('half'))}
                                    aria-label={`Переключить продажу половинками для ${product.name}`}
                                >
                                    <HalfCircleIcon className="w-4 h-4"/>
                                </button>
                            </>
                           )}
                            <button
                                className="flex items-center gap-1.5 text-center p-2 font-semibold rounded-lg bg-indigo-100 text-indigo-700 cursor-not-allowed opacity-75"
                                disabled
                                aria-label="Продажу целой единицей отключить нельзя"
                            >
                                <FullCircleIcon className="w-4 h-4"/>
                            </button>
                          </>
                        ) : product.status === ProductStatus.Available ? (
                          <>
                            {product.unit === 'kg' && product.allowedPortions.includes('quarter') && (
                              <button
                                  onClick={() => handleAddToCartClick('quarter')}
                                  className={customerButtonClasses}
                                  aria-label={`Купить четверть ${product.name}`}
                              >
                                  <QuarterCircleIcon className="w-4 h-4"/>
                                  <span className="text-xs">{formatPrice(quarterPrice)} ₽</span>
                              </button>
                            )}
                            {product.unit === 'kg' && product.allowedPortions.includes('half') && (
                              <button
                                  onClick={() => handleAddToCartClick('half')}
                                  className={customerButtonClasses}
                                  aria-label={`Купить половину ${product.name}`}
                              >
                                  <HalfCircleIcon className="w-4 h-4"/>
                                  <span className="text-xs">{formatPrice(halfPrice)} ₽</span>
                              </button>
                            )}
                            {product.allowedPortions.includes('whole') && (
                              <button
                                  onClick={() => handleAddToCartClick('whole')}
                                  className={customerButtonClasses}
                                  aria-label={`Купить ${packagingDisplayMap[product.packaging]} ${product.name}`}
                              >
                                  <FullCircleIcon className="w-4 h-4"/>
                                  <span className="text-xs">{formatPrice(wholePrice)} ₽</span>
                              </button>
                            )}
                          </>
                        ) : (
                             <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                Нет в наличии
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div 
          id={`gallery-${product.id}`}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isGalleryOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
            <div className="overflow-hidden py-2">
                {isCameraActive ? (
                    <div className="flex flex-col items-center gap-2">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-lg bg-black"></video>
                        <div className="flex gap-2">
                            <button onClick={handleTakePicture} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg">Сделать снимок</button>
                            <button onClick={stopCamera} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg">Отмена</button>
                        </div>
                    </div>
                ) : (
                  <>
                    <div className="flex space-x-3 overflow-x-auto pt-2 pb-2">
                        {product.imageUrls.map((url, index) => (
                           <div key={index} className="relative flex-shrink-0 group">
                             <button
                                onClick={() => !isAdminView && onOpenGalleryModal && onOpenGalleryModal(product.imageUrls, index)}
                                disabled={isAdminView}
                                className={`focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg ${!isAdminView ? 'cursor-pointer' : 'cursor-default'}`}
                                aria-label={!isAdminView ? `View image ${index + 1} of ${product.imageUrls.length} in full screen` : undefined}
                             >
                                <img 
                                    src={url} 
                                    alt={`${product.name} photo ${index + 1}`} 
                                    className="h-40 object-cover rounded-lg"
                                    aria-hidden={!isGalleryOpen}
                                />
                             </button>
                             {isAdminView && (
                                <button
                                    onClick={() => handleDeleteImage(index)}
                                    className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label={`Удалить изображение ${index + 1}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             )}
                           </div>
                        ))}
                    </div>
                    {isAdminView && (
                        <div className="flex gap-2 justify-center pt-2 border-t mt-2">
                           <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileSelect} 
                              accept="image/*" 
                              multiple
                              className="hidden" 
                           />
                           <button 
                              onClick={handleAddFromFileClick}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                           >
                                <PlusIcon className="w-4 h-4" />
                                <span>Добавить фото</span>
                           </button>
                           <button 
                              onClick={handleOpenCamera}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                           >
                                <CameraIcon className="w-4 h-4" />
                                <span>Сделать снимок</span>
                           </button>
                        </div>
                    )}
                  </>
                )}
                 <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        </div>
        
        {isAdminView && (
            <>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isDetailsEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                     <DetailsEditorComponent
                       product={product}
                       details={details}
                       allPossibleCategories={allPossibleCategories}
                       newCategory={newCategory}
                       onDetailsChange={handleDetailsFormChange}
                       onCategoryToggle={handleCategoryToggle}
                       onNewCategoryChange={setNewCategory}
                       onAddNewCategory={handleAddNewCategoryInEditor}
                       onDelete={() => onDeleteProduct && onDeleteProduct(product.id)}
                       onSave={handleDetailsSave}
                       onCancel={() => setIsDetailsEditing(false)}
                     />
                  </div>
              </div>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isPriceEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                     <PriceEditorComponent
                        product={product}
                        prices={prices}
                        onPriceChange={handlePriceFormChange}
                        onSave={handlePriceSave}
                        onCancel={() => setIsPriceEditing(false)}
                     />
                  </div>
              </div>
            </>
        )}
    </div>
  );
};

export default ProductItem;