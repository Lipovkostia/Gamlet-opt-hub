
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, Order, User, OrderStatus, CustomerType, Badge } from '../types';
import ProductList from './ProductList';
import CategoryDropdown from './CategoryDropdown';
import ProductTable from './ProductTable';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import WholesaleProductTable from './WholesaleProductTable';
import VisibilityMatrix from './VisibilityMatrix';


// Make TypeScript aware of the XLSX library loaded from the CDN
declare var XLSX: any;

// Defined in App.tsx but also valid here
type AdminTabType = 'pricelist' | 'products_master' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist' | 'visibility' | 'badges' | 'sync' | 'moysklad';

interface AdminPageProps {
    shopId: string;
    activeTab: AdminTabType; // Controlled prop
    onTabChange: (tab: AdminTabType) => void; // Controlled prop callback
    products: Product[];
    allCategories: string[];
    orders: Order[];
    allUsers: User[];
    roles: string[];
    badges: Badge[];
    onAddProduct: (product: Omit<Product, 'id' | 'status'>) => Promise<void>;
    onBulkAddProducts: (products: Omit<Product, 'id' | 'status'>[]) => void;
    onDeleteProduct: (productId: string) => void;
    onCycleStatus: (productId: string) => void;
    onUpdatePortions: (productId: string, portion: ProductPortion) => void;
    onUpdatePrices: (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdateProductPriceTiers: (productId: string, priceTiers: Product['priceTiers']) => void;
    onUpdateTierPortions: (productId: string, role: string, portions: ProductPortion[]) => void;
    onUpdateTierPriceOverrides: (productId: string, role: string, overrides: { half?: number; quarter?: number }) => void;
    onUpdateProductCostPrice: (productId: string, costPrice?: number) => void;
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; markupValue?: number; markupType?: 'percent' | 'fixed'; role?: string; }) => void;
    onBulkUpdateUspPrices: (updates: { productId: string; usp1Price?: number; }[]) => void;
    onBulkUpdateWholesalePrices: (updates: { productId: string; newPrice: number; }[]) => void;
    onUpdateUspMarkupFlags: (productId: string, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUspPrice: (productId: string, role: string, price: number) => void;
    onUpdateUnitValue: (productId: string, newUnitValue: number) => void;
    onUpdateDetails: (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateImages: (productId: string, newImageUrls: string[]) => void;
    onUpdateCategories: (productId: string, newCategories: string[]) => void;
    onUpdateVisibility: (productId: string, visibleToRoles: CustomerType[]) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onAddUser: (email: string, password: string, role: string) => 'success' | 'exists';
    onDeleteUser: (userId: string) => void;
    onUpdateUserByAdmin: (userId: string, updates: Partial<User> & { newPassword?: string }) => void;
    onCycleBadge: (productId: string) => void;
    onImportData: (data: { products: Product[], users: User[], orders: Order[] }) => void;
    onAddRole: (role: string) => void;
    onDeleteRole: (role: string) => void;
    onAddBadge: (text: string, color: string) => void;
    onDeleteBadge: (badgeId: string) => void;
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'головка', упаковка: 'упаковка', штука: 'штука', банка: 'банка', ящик: 'ящик' };
const unitOptions: ProductUnit[] = ['kg', 'g', 'pcs', 'l'];
const packagingOptions: ProductPackaging[] = ['головка', 'упаковка', 'штука', 'банка', 'ящик'];

const BADGE_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500', 'bg-gray-800'
];

const TABLE_COLUMNS_OPTIONS = [
    { key: 'select', label: 'Выбор' },
    { key: 'status', label: 'Статус' },
    { key: 'photo', label: 'Фото' },
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание' },
    { key: 'categories', label: 'Категории' },
    { key: 'visibility', label: 'Видимость' },
    { key: 'price', label: 'Цена' },
    { key: 'unit', label: 'Ед. изм.' },
    { key: 'value', label: 'Значение' },
    { key: 'packaging', label: 'Вид' },
    { key: 'portions', label: 'Порции' },
    { key: 'special', label: 'Спец. цены' },
    { key: 'cost', label: 'Себестоимость' },
    { key: 'markup', label: 'Наценка' },
    { key: 'actions', label: 'Действия' },
];

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

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const UsersIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CloudDownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { shopId, activeTab, onTabChange, products, allCategories, orders, allUsers, roles, badges, onAddProduct, onBulkAddProducts, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateProductPriceTiers, onUpdateProductCostPrice, onUpdateUspPrices, onBulkUpdateUspPrices, onBulkUpdateWholesalePrices, onUpdateUspMarkupFlags, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onUpdateCategories, onUpdateVisibility, onUpdateOrderStatus, onAddUser, onDeleteUser, onUpdateUserByAdmin, onCycleBadge, onImportData, onAddRole, onDeleteRole, onAddBadge, onDeleteBadge, onUpdateTierPortions, onUpdateTierPriceOverrides } = props;
    
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [unitValue, setUnitValue] =useState('');
    const [unit, setUnit] = useState<ProductUnit>('kg');
    const [packaging, setPackaging] = useState<ProductPackaging>('головка');
    const [imageUrls, setImageUrls] = useState('');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [allowHalf, setAllowHalf] = useState(false);
    const [allowQuarter, setAllowQuarter] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [newCategory, setNewCategory] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // MoySklad state
    const [msLogin, setMsLogin] = useState(() => localStorage.getItem('ms_login') || '');
    const [msPassword, setMsPassword] = useState(() => localStorage.getItem('ms_password') || '');
    const [msData, setMsData] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('ms_data_cache');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });
    const [msLoading, setMsLoading] = useState(false);
    const [msError, setMsError] = useState('');
    const [msUseProxy, setMsUseProxy] = useState(() => localStorage.getItem('ms_useProxy') !== 'false');
    const [msAutoRefresh, setMsAutoRefresh] = useState(() => localStorage.getItem('ms_autoRefresh') === 'true');
    const [msFields, setMsFields] = useState(() => {
        try {
            const saved = localStorage.getItem('ms_fields');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return {
            name: true,
            buyPrice: true,
            salePrice: false,
            article: false,
            code: false,
            description: false,
            uom: false,
            weight: false,
            volume: false,
            barcodes: false,
        };
    });
    const [selectedMsIds, setSelectedMsIds] = useState<Set<string>>(new Set());
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    useEffect(() => { localStorage.setItem('ms_login', msLogin); }, [msLogin]);
    useEffect(() => { localStorage.setItem('ms_password', msPassword); }, [msPassword]);
    useEffect(() => { localStorage.setItem('ms_useProxy', String(msUseProxy)); }, [msUseProxy]);
    useEffect(() => { localStorage.setItem('ms_autoRefresh', String(msAutoRefresh)); }, [msAutoRefresh]);
    useEffect(() => { localStorage.setItem('ms_fields', JSON.stringify(msFields)); }, [msFields]);
    useEffect(() => { 
        try {
            localStorage.setItem('ms_data_cache', JSON.stringify(msData)); 
        } catch(e) {
            console.error("Failed to save MS data to local storage", e);
        }
    }, [msData]);

    const [badgeText, setBadgeText] = useState('');
    const [badgeColor, setBadgeColor] = useState('bg-red-500');
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetRow, setSheetRow] = useState('2');
    const [importError, setImportError] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [adminSelectedCategory, setAdminSelectedCategory] = useState<string | 'all'>('all');
    const [previewRole, setPreviewRole] = useState<string | null>(null);
    const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isTableHelpVisible, setIsTableHelpVisible] = useState(false);
    const [isIdInfoVisible, setIsIdInfoVisible] = useState(false);
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableFilterCategory, setTableFilterCategory] = useState<string | 'all'>('all');
    const [tableFilterStatus, setTableFilterStatus] = useState<ProductStatus | 'all'>('all');
    const [isTableFilterVisible, setIsTableFilterVisible] = useState(false);
    const [isMasterFilterVisible, setIsMasterFilterVisible] = useState(false);
    
    const [visibleTableColumns, setVisibleTableColumns] = useState<string[]>(TABLE_COLUMNS_OPTIONS.map(c => c.key));
    
    // Initial state for master columns: REMOVE price and markup as they are variable
    const [visibleMasterColumns, setVisibleMasterColumns] = useState<string[]>(
        TABLE_COLUMNS_OPTIONS.map(c => c.key).filter(k => !['portions', 'special', 'price', 'markup'].includes(k))
    );
    
    const [uspMarkups, setUspMarkups] = useState({ usp1: '' });
    const [activePriceListRole, setActivePriceListRole] = useState<string>('Базовый (Розничный)');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageFileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const roleSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return () => { stopCamera(); };
    }, [activeTab]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (roleSelectorRef.current && !roleSelectorRef.current.contains(event.target as Node)) {
                setIsRoleSelectorOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [roleSelectorRef]);

    const adminCategories = useMemo(() => [
        ...new Set(products.map(p => p.categories).flat())
    ].sort(), [products]);

    const adminFilteredProducts = useMemo(() => {
        let filtered = products;
        if (adminSelectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categories.includes(adminSelectedCategory));
        }
        if (previewRole) {
            filtered = filtered.filter(p => {
                if (!p.visibleToRoles || p.visibleToRoles.length === 0) return true;
                return p.visibleToRoles.includes(previewRole);
            });
        }
        return filtered;
    }, [adminSelectedCategory, products, previewRole]);
    
    const filteredTableProducts = useMemo(() => {
        return products
            .filter(product => {
                if (tableSearchTerm === '') return true;
                const searchTermLower = tableSearchTerm.toLowerCase();
                return product.name.toLowerCase().includes(searchTermLower) || product.description.toLowerCase().includes(searchTermLower);
            })
            .filter(product => {
                if (tableFilterCategory === 'all') return true;
                return product.categories.includes(tableFilterCategory);
            })
            .filter(product => {
                if (tableFilterStatus === 'all') return true;
                return product.status === tableFilterStatus;
            });
    }, [products, tableSearchTerm, tableFilterCategory, tableFilterStatus]);


    const handleApplyMarkups = () => {
        const updates: { productId: string; usp1Price?: number; }[] = [];
        const markup1 = parseFloat(uspMarkups.usp1);
        filteredTableProducts.forEach(product => {
            if (product.costPrice && product.costPrice > 0) {
                const newPrices: { productId: string; usp1Price?: number; } = { productId: product.id };
                if (product.usp1UseGlobalMarkup !== false && !isNaN(markup1)) {
                    newPrices.usp1Price = Math.round(product.costPrice * (1 + markup1 / 100));
                }
                if (Object.keys(newPrices).length > 1) updates.push(newPrices);
            }
        });
        if (updates.length > 0) {
            onBulkUpdateUspPrices(updates);
            alert(`${updates.length} товаров обновлено.`);
        } else {
            alert('Нет товаров для обновления. Убедитесь, что у отфильтрованных товаров указана себестоимость.');
        }
    };

    const handleTableToggleRow = (id: string) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleTableToggleAll = () => {
        const visibleIds = filteredTableProducts.map(p => p.id);
        const allSelected = visibleIds.every(id => selectedProductIds.has(id));
        if (allSelected) {
            setSelectedProductIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedProductIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    const handleBulkDeleteProducts = () => {
        if (selectedProductIds.size === 0) return;
        if (window.confirm(`Удалить выбранные товары (${selectedProductIds.size})?`)) {
            selectedProductIds.forEach(id => onDeleteProduct(id));
            setSelectedProductIds(new Set());
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const resetForm = () => {
        setName(''); setDescription(''); setPricePerUnit(''); setUnitValue('');
        setUnit('kg'); setPackaging('головка'); setImageUrls(''); setUploadedImages([]);
        setAllowHalf(false); setAllowQuarter(false); setSelectedCategories(new Set());
        setNewCategory(''); stopCamera();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const manualUrls = imageUrls.split(',').map(url => url.trim()).filter(url => url);
        const finalImageUrls = [...manualUrls, ...uploadedImages];
        if (finalImageUrls.length === 0) { alert("Добавьте изображение."); return; }
        const allowedPortions: ProductPortion[] = ['whole'];
        if (packaging === 'головка') {
          if (allowHalf) allowedPortions.push('half');
          if (allowQuarter) allowedPortions.push('quarter');
        }
        const newProduct: Omit<Product, 'id' | 'status'> = {
            name, description, pricePerUnit: parseFloat(pricePerUnit) || 0,
            unitValue: parseFloat(unitValue) || 0, unit, packaging,
            categories: Array.from(selectedCategories), imageUrls: finalImageUrls,
            allowedPortions, priceOverridesPerUnit: {}, usp1UseGlobalMarkup: true,
        };
        setIsSubmitting(true);
        try {
            await onAddProduct(newProduct);
            alert('Товар успешно добавлен!');
            resetForm();
            onTabChange('pricelist');
        } catch (error) { alert("Ошибка при добавлении товара."); } finally { setIsSubmitting(false); }
    };
    
    const handleToggleTableColumn = (key: string) => {
        setVisibleTableColumns(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 1) return prev;
                return prev.filter(c => c !== key);
            } else return [...prev, key];
        });
    };

    const handleToggleMasterColumn = (key: string) => {
        setVisibleMasterColumns(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 1) return prev;
                return prev.filter(c => c !== key);
            } else return [...prev, key];
        });
    };

    const handleCreateBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (badgeText.length > 5 || !badgeText.trim()) return;
        onAddBadge(badgeText.trim(), badgeColor);
        setBadgeText('');
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
                    let width = img.width; let height = img.height;
                    if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                    else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject(new Error("Canvas error")); return; }
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            try {
                const base64Promises = files.map(compressImage);
                const newBase64Urls = await Promise.all(base64Promises);
                setUploadedImages(prev => [...prev, ...newBase64Urls]);
            } catch (error) { alert("Ошибка обработки фото."); }
            event.target.value = '';
        }
    };

    const handleOpenCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        } catch (err) { alert("Нет доступа к камере."); }
    };

    const handleTakePicture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current; const canvas = canvasRef.current;
        const MAX_DIM = 1000; let w = video.videoWidth; let h = video.videoHeight;
        if (w > MAX_DIM || h > MAX_DIM) { const ratio = w / h; if (w > h) { w = MAX_DIM; h = MAX_DIM / ratio; } else { h = MAX_DIM; w = MAX_DIM * ratio; } }
        canvas.width = w; canvas.height = h;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, w, h);
            setUploadedImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.8)]);
        }
        stopCamera();
    };

    const handleDeleteUploadedImage = (index: number) => { setUploadedImages(prev => prev.filter((_, i) => i !== index)); };
    const handleAddImageFromFileClick = () => { imageFileInputRef.current?.click(); };
    
    const handleGoogleSheetImport = async () => {
        if (!sheetUrl) { setImportError('Вставьте URL.'); return; }
        setIsImporting(true); setImportError('');
        try {
            const csvUrl = sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=');
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Ошибка загрузки. Проверьте права доступа.');
            const csvText = await response.text();
            const rows = csvText.split(/\r\n|\n/);
            const rowIndex = parseInt(sheetRow, 10) - 1;
            if (rowIndex < 0 || rowIndex >= rows.length) throw new Error(`Строка ${sheetRow} не найдена.`);
            const rowData = rows[rowIndex].split(',');
            if (rowData.length < 3) throw new Error('Формат: Название, Цена, Описание, [Себест.].');

            const [importedName, importedPrice, importedDesc, importedCost] = rowData;
            setName(importedName.trim());
            setPricePerUnit(importedPrice.trim().replace(/[^0-9.]/g, ''));
            setDescription(importedDesc ? importedDesc.trim() : '');
            if (importedCost) {
                const costVal = parseFloat(importedCost.trim().replace(/[^0-9.]/g, ''));
                if (!isNaN(costVal)) {
                    // Update state or logic to save cost price later
                }
            }
            setUnit('kg');
        } catch (error: any) { setImportError(error.message); } finally { setIsImporting(false); }
    };

    const handleDownloadGSheetTemplate = () => {
        const headers = ['Название', 'Цена за кг', 'Описание', 'Себестоимость'];
        const exampleRow = ['Сыр Бри', '2200', 'Мягкий сыр', '1500'];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'GSheets_Template');
        XLSX.writeFile(wb, 'шаблон_gsheets.xlsx');
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Название', 'Описание', 'Цена за ед.', 'Значение ед.',
            'Себестоимость', 'Ед. изм. (kg, g, pcs, l)', 'Вид',
            'Категории', 'URL изображений', 'Половинки (да/нет)', 'Четвертинки (да/нет)'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        XLSX.writeFile(wb, 'шаблон_товаров.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true); setUploadMessage('');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawJson = XLSX.utils.sheet_to_json(worksheet);
                const productsToAdd: Omit<Product, 'id' | 'status'>[] = [];
                let errors = 0;

                const findKey = (row: any, ...candidates: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const candidate of candidates) {
                        const found = rowKeys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
                        if (found) return found;
                    }
                    return null;
                }
                const getValue = (row: any, ...candidates: string[]) => { const key = findKey(row, ...candidates); return key ? row[key] : undefined; }
                const parseNum = (val: any): number => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') return parseFloat(val.replace(/,/g, '.').replace(/\s/g, ''));
                    return NaN;
                }

                rawJson.forEach((row: any) => {
                   try {
                        const nameKey = findKey(row, 'Название', 'Name');
                        const name = row[nameKey!]?.toString().trim();
                        if (!name) throw new Error('Нет названия');
                        const pricePerUnit = parseNum(getValue(row, 'Цена за ед.', 'Price')) || 0;
                        const costPrice = parseNum(getValue(row, 'Себестоимость', 'Cost')) || undefined;
                        const unitValue = parseNum(getValue(row, 'Значение ед.', 'Unit Value')) || 1;
                        const unitRaw = getValue(row, 'Ед. изм.', 'Unit')?.toString().trim().toLowerCase();
                        let unit: ProductUnit = 'kg';
                        if (['кг', 'kg'].includes(unitRaw)) unit = 'kg'; else if (['гр', 'г', 'g'].includes(unitRaw)) unit = 'g'; else if (['шт', 'pcs'].includes(unitRaw)) unit = 'pcs'; else if (['л', 'l'].includes(unitRaw)) unit = 'l';
                        const product: Omit<Product, 'id' | 'status'> = {
                            name, description: getValue(row, 'Описание', 'Description')?.toString() || '',
                            pricePerUnit, costPrice, unitValue, unit, 
                            packaging: (getValue(row, 'Вид', 'Packaging') as ProductPackaging) || 'упаковка',
                            categories: getValue(row, 'Категории', 'Categories')?.toString().split(';') || [],
                            imageUrls: getValue(row, 'URL изображений', 'Images')?.toString().split(';') || [],
                            allowedPortions: ['whole'], priceOverridesPerUnit: {}, usp1UseGlobalMarkup: true,
                        };
                        productsToAdd.push(product);
                   } catch(err) { errors++; }
                });
                if (productsToAdd.length > 0) onBulkAddProducts(productsToAdd);
                setUploadMessage(`Добавлено: ${productsToAdd.length}. Ошибок: ${errors}.`);
            } catch (error) { setUploadMessage('Ошибка чтения файла.'); } finally { setIsUploading(false); if (e.target) e.target.value = ''; }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleExport = () => {
        const dataToExport = { products, orders, users: allUsers };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    };

    const handleImportClick = () => { fileInputRef.current?.click(); };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !window.confirm("Перезаписать все данные?")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (!data.products) throw new Error('Неверный формат.');
                onImportData(data);
            } catch (error: any) { alert(`Ошибка: ${error.message}`); } finally { if (event.target) event.target.value = ''; }
        };
        reader.readAsText(file);
    };

    const TabButton: React.FC<{tabId: AdminTabType, children: React.ReactNode}> = ({tabId, children}) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => onTabChange(tabId)}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none flex-shrink-0 whitespace-nowrap ${isActive ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
            >
                {children}
            </button>
        )
    };

    const allPossibleCategories = useMemo(() => {
      const combined = new Set([...allCategories, ...selectedCategories]);
      return Array.from(combined).sort();
    }, [allCategories, selectedCategories]);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) newSet.delete(category); else newSet.add(category);
            return newSet;
        });
    };

    const handleAddNewCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !selectedCategories.has(trimmed)) {
            setSelectedCategories(prev => { const newSet = new Set(prev); newSet.add(trimmed); return newSet; });
            setNewCategory('');
        }
    };

    const unitValueLabel = useMemo(() => {
        switch(unit) {
            case 'kg': return `Вес ${packagingDisplayMap[packaging]} (кг)`;
            case 'g': return `Вес ${packagingDisplayMap[packaging]} (гр)`;
            case 'l': return `Объем ${packagingDisplayMap[packaging]} (л)`;
            case 'pcs': return `Кол-во в ${packagingDisplayMap[packaging]} (шт)`;
            default: return 'Значение';
        }
    }, [unit, packaging]);

    const copyShopId = () => { navigator.clipboard.writeText(shopId); alert('ID скопирован!'); }

    // --- MoySklad Logic ---
    const handleLoadMoySklad = useCallback(async (isSilent = false) => {
        setMsError('');
        if (!isSilent) { setMsLoading(true); setSelectedMsIds(new Set()); }
        if (!msLogin || !msPassword) { setMsError('Введите логин и пароль.'); if (!isSilent) setMsLoading(false); return; }
        try {
            const auth = btoa(`${msLogin}:${msPassword}`);
            const fetchUrl = msUseProxy ? `https://corsproxy.io/?${encodeURIComponent('https://api.moysklad.ru/api/remap/1.2/entity/product?limit=1000&expand=uom')}` : 'https://api.moysklad.ru/api/remap/1.2/entity/product?limit=1000&expand=uom';
            const response = await fetch(fetchUrl, { headers: { 'Authorization': `Basic ${auth}` } });
            if (!response.ok) throw new Error('Ошибка подключения.');
            const data = await response.json();
            if (data?.rows) {
                setMsData(data.rows.map((item: any) => ({
                    id: item.id, name: item.name,
                    buyPrice: item.buyPrice ? item.buyPrice.value / 100 : 0,
                    salePrice: (item.salePrices && item.salePrices.length > 0) ? item.salePrices[0].value / 100 : 0,
                    article: item.article || '-', code: item.code || '-', uom: item.uom?.name || '-',
                    weight: item.weight || 0, description: item.description || '-'
                })));
            } else setMsData([]);
        } catch (error: any) { setMsError(error.message); } finally { if (!isSilent) setMsLoading(false); }
    }, [msLogin, msPassword, msUseProxy]);

    useEffect(() => {
        let interval: any;
        if (msAutoRefresh && activeTab === 'moysklad') interval = setInterval(() => handleLoadMoySklad(true), 5000);
        return () => clearInterval(interval);
    }, [msAutoRefresh, activeTab, handleLoadMoySklad]);

    const handleMsToggleRow = (id: string) => { setSelectedMsIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
    const handleMsToggleAll = () => { if (selectedMsIds.size === msData.length) setSelectedMsIds(new Set()); else setSelectedMsIds(new Set(msData.map(item => item.id))); };
    const handleAddSelectedToCatalog = () => {
        if (selectedMsIds.size === 0) return;
        const productsToAdd: Omit<Product, 'id' | 'status'>[] = msData.filter(item => selectedMsIds.has(item.id)).map(item => ({
            name: item.name, description: item.description, pricePerUnit: item.salePrice || 0, costPrice: item.buyPrice || 0,
            unitValue: item.weight || 1, unit: 'kg', packaging: 'головка', categories: [], imageUrls: [],
            allowedPortions: ['whole', 'half', 'quarter'], priceOverridesPerUnit: {}, usp1UseGlobalMarkup: true,
        }));
        onBulkAddProducts(productsToAdd); alert(`Добавлено: ${productsToAdd.length}`); setSelectedMsIds(new Set());
    };

    const priceListRoles = useMemo(() => ['Базовый (Розничный)', ...roles.filter(r => r !== 'Розничный')], [roles]);

    return (
        <div className="bg-white rounded-none sm:rounded-lg shadow-none sm:shadow-sm px-0 py-2 sm:p-6 relative w-full">
            <div className="mb-2 sm:mb-4 px-1 sm:px-0">
                <button 
                    onClick={() => setIsIdInfoVisible(!isIdInfoVisible)}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <span>ID магазина: {shopId}</span>
                </button>
            </div>

            <div className="border-b">
                 <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-2 sm:pb-4 px-2 sm:-mx-6 sm:px-6" role="tablist" aria-orientation="horizontal">
                    <TabButton tabId="pricelist">Каталог</TabButton>
                    <TabButton tabId="products_master">Справочник</TabButton>
                    <TabButton tabId="table">Прайс лист</TabButton>
                    <TabButton tabId="badges">Метки</TabButton>
                    <TabButton tabId="visibility">Видимость</TabButton>
                    <TabButton tabId="orders">Заказы</TabButton>
                    <TabButton tabId="customers">Покупатели</TabButton>
                    <TabButton tabId="moysklad">МойСклад</TabButton>
                    <TabButton tabId="add">Добавить</TabButton>
                    <TabButton tabId="import">Excel</TabButton>
                    <TabButton tabId="importSheets">Sheets</TabButton>
                    <TabButton tabId="sync">Sync</TabButton>
                </div>
            </div>

            {activeTab === 'pricelist' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                     <ProductList
                        products={adminFilteredProducts}
                        onAddToCart={() => {}}
                        isAdminView={true}
                        onDeleteProduct={onDeleteProduct}
                        onCycleStatus={onCycleStatus}
                        onUpdatePortions={onUpdatePortions}
                        onUpdatePrices={onUpdatePrices}
                        onUpdateUnitValue={onUpdateUnitValue}
                        onUpdateDetails={onUpdateDetails}
                        onUpdateImages={onUpdateImages}
                        allCategories={allCategories}
                        onUpdateCategories={onUpdateCategories}
                        onCycleBadge={onCycleBadge}
                        badges={badges}
                     />
                </div>
            )}

            {activeTab === 'products_master' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Все товары (Справочник)</h3>
                        <button onClick={() => setIsMasterFilterVisible(!isMasterFilterVisible)} className="p-2 bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    
                    <div className={`grid transition-all duration-300 ease-in-out ${isMasterFilterVisible ? 'grid-rows-[1fr] mb-4 opacity-100' : 'grid-rows-[0fr] mb-0 opacity-0'}`}>
                        <div className="min-h-0 overflow-hidden">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Поиск..." value={tableSearchTerm} onChange={e => setTableSearchTerm(e.target.value)} className="p-2 border rounded"/>
                                    <CategoryDropdown categories={allCategories} selectedCategory={tableFilterCategory} onSelectCategory={setTableFilterCategory} label="Категория"/>
                                    <select value={tableFilterStatus} onChange={e => setTableFilterStatus(e.target.value as any)} className="p-2 border rounded">
                                        <option value="all">Все статусы</option>
                                        <option value={ProductStatus.Available}>Доступен</option>
                                        <option value={ProductStatus.OutOfStock}>Нет</option>
                                        <option value={ProductStatus.Hidden}>Скрыт</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ProductTable
                        products={filteredTableProducts}
                        allCategories={allCategories}
                        onDeleteProduct={onDeleteProduct}
                        onCycleStatus={onCycleStatus}
                        onUpdatePortions={onUpdatePortions}
                        onUpdatePrices={onUpdatePrices}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateUspPrices={onUpdateUspPrices}
                        onUpdateUspMarkupFlags={onUpdateUspMarkupFlags}
                        onUpdateUnitValue={onUpdateUnitValue}
                        onUpdateDetails={onUpdateDetails}
                        onUpdateCategories={onUpdateCategories}
                        onUpdateImages={onUpdateImages}
                        onUpdateVisibility={onUpdateVisibility}
                        uspMarkups={uspMarkups}
                        setUspMarkups={setUspMarkups}
                        onApplyMarkups={handleApplyMarkups}
                        roles={roles}
                        visibleColumns={visibleMasterColumns}
                        onUpdateTierPortions={onUpdateTierPortions}
                        onUpdateTierPriceOverrides={onUpdateTierPriceOverrides}
                        selectedIds={selectedProductIds}
                        onToggleRow={handleTableToggleRow}
                        onToggleAll={handleTableToggleAll}
                        isAllSelected={filteredTableProducts.length > 0 && filteredTableProducts.every(p => selectedProductIds.has(p.id))}
                        isMasterView={true}
                    />
                </div>
            )}
            
            {activeTab === 'table' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="mb-4 overflow-x-auto bg-gray-50 p-2 rounded-lg border">
                        <div className="flex items-center gap-2 whitespace-nowrap min-w-max">
                            <span className="text-sm font-semibold text-gray-500 mr-2">Роль:</span>
                            {priceListRoles.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setActivePriceListRole(role)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                        activePriceListRole === role 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ProductTable
                        key={activePriceListRole}
                        products={filteredTableProducts}
                        allCategories={allCategories}
                        onDeleteProduct={onDeleteProduct}
                        onCycleStatus={onCycleStatus}
                        onUpdatePortions={onUpdatePortions}
                        onUpdatePrices={onUpdatePrices}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateUspPrices={onUpdateUspPrices}
                        onUpdateUspMarkupFlags={onUpdateUspMarkupFlags}
                        onUpdateUnitValue={onUpdateUnitValue}
                        onUpdateDetails={onUpdateDetails}
                        onUpdateCategories={onUpdateCategories}
                        onUpdateImages={onUpdateImages}
                        onUpdateVisibility={onUpdateVisibility}
                        uspMarkups={uspMarkups}
                        setUspMarkups={setUspMarkups}
                        onApplyMarkups={handleApplyMarkups}
                        roles={roles}
                        visibleColumns={visibleTableColumns}
                        roleKey={activePriceListRole === 'Базовый (Розничный)' ? undefined : activePriceListRole}
                        onUpdateTierPortions={onUpdateTierPortions}
                        onUpdateTierPriceOverrides={onUpdateTierPriceOverrides}
                        isMasterView={false}
                    />
                </div>
            )}

            {activeTab === 'import' && (
                 <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="flex items-center gap-4">
                         <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-green-100 text-green-700 rounded-md">Скачать шаблон</button>
                         <label htmlFor="excel-upload" className="px-4 py-2 bg-indigo-600 text-white rounded-md cursor-pointer">Загрузить файл</label>
                         <input id="excel-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" />
                    </div>
                    {uploadMessage && <p className="mt-4 text-sm bg-gray-100 p-3 rounded-md">{uploadMessage}</p>}
                </div>
            )}

            {activeTab === 'importSheets' && (
                 <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                             <button onClick={handleDownloadGSheetTemplate} className="px-4 py-2 bg-green-100 text-green-700 rounded-md">Скачать пример CSV</button>
                        </div>
                        <input type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="Google Sheets CSV URL" className="w-full p-2 border rounded"/>
                        <button onClick={handleGoogleSheetImport} disabled={isImporting} className="bg-green-600 text-white py-2 px-4 rounded-lg">Загрузить данные</button>
                    </div>
                </div>
            )}
            
            {activeTab === 'sync' && (
                <div className="mt-2 sm:mt-6 max-w-2xl px-1 sm:px-0">
                    <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-md mr-4">Экспорт (Backup)</button>
                    <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 text-white rounded-md">Импорт (Restore)</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
            )}
        </div>
    );
};

export default AdminPage;
