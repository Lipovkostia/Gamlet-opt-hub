
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
    activeTab: AdminTabType;
    onTabChange: (tab: AdminTabType) => void;
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
    onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
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

const RefreshIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const LockClosedIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

const LockOpenIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
    </svg>
);

const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { shopId, activeTab, onTabChange, products, allCategories, orders, allUsers, roles, badges, onAddProduct, onBulkAddProducts, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateProductPriceTiers, onUpdateProductCostPrice, onUpdateUspPrices, onBulkUpdateUspPrices, onBulkUpdateWholesalePrices, onUpdateUspMarkupFlags, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onUpdateCategories, onUpdateVisibility, onUpdateOrderStatus, onAddUser, onDeleteUser, onUpdateUserByAdmin, onCycleBadge, onImportData, onAddRole, onDeleteRole, onAddBadge, onDeleteBadge, onUpdateTierPortions, onUpdateTierPriceOverrides, onUpdateProduct } = props;
    
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

    // MoySklad state with persistence
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
    const [msRefreshInterval, setMsRefreshInterval] = useState(() => parseInt(localStorage.getItem('ms_refresh_interval') || '5', 10));
    const [msIsConnected, setMsIsConnected] = useState<boolean | null>(null);

    // Mapping State
    const [msMapping, setMsMapping] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem('ms_mapping');
            return saved ? JSON.parse(saved) : {
                name: 'name',
                categories: 'categories',
                buyPrice: 'costPrice',
                salePrice: 'pricePerUnit',
                description: 'description',
                weight: 'unitValue',
                images: 'imageUrls'
            };
        } catch(e) { return {}; }
    });

    // Sync State (Locked IDs)
    const [msLockedIds, setMsLockedIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('ms_locked_ids');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch(e) { return new Set(); }
    });

    const [msFields, setMsFields] = useState(() => {
        try {
            const saved = localStorage.getItem('ms_fields');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return {
            name: true,
            buyPrice: true,
            salePrice: true,
            article: false,
            code: false,
            description: true,
            uom: true,
            weight: true,
            volume: false,
            barcodes: false,
            images: true,
            categories: true,
        };
    });
    // MoySklad Selection State
    const [selectedMsIds, setSelectedMsIds] = useState<Set<string>>(new Set());

    // Main Table Selection State
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // Persistence Effects
    useEffect(() => { localStorage.setItem('ms_login', msLogin); }, [msLogin]);
    useEffect(() => { localStorage.setItem('ms_password', msPassword); }, [msPassword]);
    useEffect(() => { localStorage.setItem('ms_useProxy', String(msUseProxy)); }, [msUseProxy]);
    useEffect(() => { localStorage.setItem('ms_autoRefresh', String(msAutoRefresh)); }, [msAutoRefresh]);
    useEffect(() => { localStorage.setItem('ms_refresh_interval', String(msRefreshInterval)); }, [msRefreshInterval]);
    useEffect(() => { localStorage.setItem('ms_fields', JSON.stringify(msFields)); }, [msFields]);
    useEffect(() => { localStorage.setItem('ms_mapping', JSON.stringify(msMapping)); }, [msMapping]);
    useEffect(() => { localStorage.setItem('ms_locked_ids', JSON.stringify(Array.from(msLockedIds))); }, [msLockedIds]);
    useEffect(() => { 
        try {
            localStorage.setItem('ms_data_cache', JSON.stringify(msData)); 
        } catch(e) {
            console.error("Failed to save MS data to local storage", e);
        }
    }, [msData]);

    // Badge state
    const [badgeText, setBadgeText] = useState('');
    const [badgeColor, setBadgeColor] = useState('bg-red-500');

    // State for Google Sheets import
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetRow, setSheetRow] = useState('2');
    const [importError, setImportError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // State for Excel import
    const [uploadMessage, setUploadMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // State for admin's own category filter
    const [adminSelectedCategory, setAdminSelectedCategory] = useState<string | 'all'>('all');
    const [previewRole, setPreviewRole] = useState<string | null>(null);
    const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
    
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isTableHelpVisible, setIsTableHelpVisible] = useState(false);
    const [isIdInfoVisible, setIsIdInfoVisible] = useState(false);

    // New states for table filtering
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableFilterCategory, setTableFilterCategory] = useState<string | 'all'>('all');
    const [tableFilterStatus, setTableFilterStatus] = useState<ProductStatus | 'all'>('all');
    const [isTableFilterVisible, setIsTableFilterVisible] = useState(false);
    const [isMasterFilterVisible, setIsMasterFilterVisible] = useState(false); // State for master list filter visibility
    
    // Table Column Visibility
    const [visibleTableColumns, setVisibleTableColumns] = useState<string[]>(TABLE_COLUMNS_OPTIONS.map(c => c.key));
    // Updated initial state for master columns to exclude price, markup, portions and special by default
    const [visibleMasterColumns, setVisibleMasterColumns] = useState<string[]>(
        TABLE_COLUMNS_OPTIONS.map(c => c.key).filter(k => !['price', 'markup', 'portions', 'special'].includes(k))
    );
    
    // State for USP markups
    const [uspMarkups, setUspMarkups] = useState({ usp1: '' });
    
    // Active Role Tab for Price List Table
    const [activePriceListRole, setActivePriceListRole] = useState<string>('Базовый (Розничный)');

    // Ref for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null); // For JSON import
    const imageFileInputRef = useRef<HTMLInputElement>(null); // For Image upload
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const roleSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Cleanup camera stream on unmount or tab switch
        return () => {
            stopCamera();
        };
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

        // Filter by Category
        if (adminSelectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categories.includes(adminSelectedCategory));
        }

        // Filter by Preview Role (Visibility)
        if (previewRole) {
            filtered = filtered.filter(p => {
                // If visibleToRoles is undefined or empty, it's visible to everyone
                if (!p.visibleToRoles || p.visibleToRoles.length === 0) {
                    return true;
                }
                return p.visibleToRoles.includes(previewRole);
            });
        }

        return filtered;
    }, [adminSelectedCategory, products, previewRole]);
    
    const filteredTableProducts = useMemo(() => {
        return products
            .filter(product => {
                // Search term filter (name or description)
                if (tableSearchTerm === '') {
                    return true;
                }
                const searchTermLower = tableSearchTerm.toLowerCase();
                return (
                    product.name.toLowerCase().includes(searchTermLower) ||
                    product.description.toLowerCase().includes(searchTermLower)
                );
            })
            .filter(product => {
                // Category filter
                if (tableFilterCategory === 'all') {
                    return true;
                }
                return product.categories.includes(tableFilterCategory);
            })
            .filter(product => {
                // Status filter
                if (tableFilterStatus === 'all') {
                    return true;
                }
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

                // Only add to updates if at least one price was calculated
                if (Object.keys(newPrices).length > 1) {
                    updates.push(newPrices);
                }
            }
        });

        if (updates.length > 0) {
            onBulkUpdateUspPrices(updates);
            alert(`${updates.length} товаров обновлено.`);
        } else {
            alert('Нет товаров для обновления. Убедитесь, что у отфильтрованных товаров указана себестоимость, задан процент наценки и они используют общую наценку (%).');
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
        // Toggle based on visible products
        const visibleIds = filteredTableProducts.map(p => p.id);
        const allSelected = visibleIds.every(id => selectedProductIds.has(id));

        if (allSelected) {
            // Deselect visible
            setSelectedProductIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            // Select visible
            setSelectedProductIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    const handleBulkDeleteProducts = () => {
        if (selectedProductIds.size === 0) return;
        if (window.confirm(`Вы уверены, что хотите удалить выбранные товары (${selectedProductIds.size})? Это действие нельзя отменить.`)) {
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
        setName('');
        setDescription('');
        setPricePerUnit('');
        setUnitValue('');
        setUnit('kg');
        setPackaging('головка');
        setImageUrls('');
        setUploadedImages([]);
        setAllowHalf(false);
        setAllowQuarter(false);
        setSelectedCategories(new Set());
        setNewCategory('');
        stopCamera();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const manualUrls = imageUrls.split(',').map(url => url.trim()).filter(url => url);
        const finalImageUrls = [...manualUrls, ...uploadedImages];

        if (finalImageUrls.length === 0) {
            alert("Пожалуйста, добавьте хотя бы одно изображение (ссылку или файл).");
            return;
        }

        const allowedPortions: ProductPortion[] = ['whole'];
        if (packaging === 'головка') {
          if (allowHalf) allowedPortions.push('half');
          if (allowQuarter) allowedPortions.push('quarter');
        }

        const newProduct: Omit<Product, 'id' | 'status'> = {
            name,
            description,
            pricePerUnit: parseFloat(pricePerUnit) || 0,
            unitValue: parseFloat(unitValue) || 0,
            unit,
            packaging,
            categories: Array.from(selectedCategories),
            imageUrls: finalImageUrls,
            allowedPortions,
            priceOverridesPerUnit: {}, // Initially no overrides
            usp1UseGlobalMarkup: true,
        };

        setIsSubmitting(true);
        try {
            await onAddProduct(newProduct);
            alert('Товар успешно добавлен!');
            resetForm();
            onTabChange('pricelist'); // Switch tab to view the new product
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Ошибка при добавлении товара. Возможно, размер изображений слишком велик.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleToggleTableColumn = (key: string) => {
        setVisibleTableColumns(prev => {
            if (prev.includes(key)) {
                // Prevent hiding all columns
                if (prev.length <= 1) return prev;
                return prev.filter(c => c !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleToggleMasterColumn = (key: string) => {
        setVisibleMasterColumns(prev => {
            if (prev.includes(key)) {
                // Prevent hiding all columns
                if (prev.length <= 1) return prev;
                return prev.filter(c => c !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleCreateBadge = (e: React.FormEvent) => {
        e.preventDefault();
        if (badgeText.length > 5) return;
        if (!badgeText.trim()) return;
        
        onAddBadge(badgeText.trim(), badgeColor);
        setBadgeText('');
    };

    // Helper to compress images before upload (client-side resize)
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Resize to reasonable max dimensions
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
                    if (!ctx) {
                         reject(new Error("Canvas context error"));
                         return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG 0.7 quality to save space
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
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
                // Use compressImage instead of raw file conversion
                const base64Promises = files.map(compressImage);
                const newBase64Urls = await Promise.all(base64Promises);
                setUploadedImages(prev => [...prev, ...newBase64Urls]);
            } catch (error) {
                console.error("Error compressing/loading images:", error);
                alert("Не удалось обработать изображения.");
            }
            // Reset input so same file can be selected again if needed
            event.target.value = '';
        }
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
            alert("Не удалось получить доступ к камере. Проверьте разрешения.");
        }
    };

    const handleTakePicture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Cap resolution for camera pictures too
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
            // Use JPEG compression
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setUploadedImages(prev => [...prev, dataUrl]);
        }
        stopCamera();
    };

    const handleDeleteUploadedImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddImageFromFileClick = () => {
        imageFileInputRef.current?.click();
    };
    
    const handleGoogleSheetImport = async () => {
        if (!sheetUrl) {
            setImportError('Пожалуйста, вставьте URL.');
            return;
        }
        setIsImporting(true);
        setImportError('');
        try {
            // Transform Google Sheet URL to a direct CSV download link
            const csvUrl = sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=');
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные. Проверьте URL и права доступа (должна быть "Опубликовано в Интернете").');
            }
            const csvText = await response.text();
            const rows = csvText.split(/\r\n|\n/);
            const rowIndex = parseInt(sheetRow, 10) - 1;

            if (rowIndex < 0 || rowIndex >= rows.length) {
                throw new Error(`Строка ${sheetRow} не найдена в таблице.`);
            }

            const rowData = rows[rowIndex].split(',');

            // Expecting: Название, Цена за кг, Описание
            if (rowData.length < 3) {
                 throw new Error('В указанной строке меньше 3 колонок. Ожидаемый формат: Название, Цена за кг, Описание.');
            }

            const [importedName, importedPrice, ...importedDescParts] = rowData;
            const importedDesc = importedDescParts.join(','); // Join back if description had commas

            setName(importedName.trim());
            setPricePerUnit(importedPrice.trim().replace(/[^0-9.]/g, ''));
            setDescription(importedDesc.trim());
            setUnit('kg'); // Importer is hardcoded for kg

        } catch (error: any) {
            setImportError(error.message || 'Произошла неизвестная ошибка.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadGSheetTemplate = () => {
        const headers = ['Название', 'Цена за кг', 'Описание'];
        const exampleRow = ['Сыр Бри', '2200', 'Французский мягкий сыр с корочкой из белой плесени.'];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 60 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'GSheets_Template');
        XLSX.writeFile(wb, 'шаблон_import_gsheets.xlsx');
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Название', 'Описание', 'Цена за ед.', 'Значение ед.',
            'Ед. изм. (kg, g, pcs, l)', 'Вид (головка, упаковка, штука, банка, ящик)',
            'Категории (через ;)', 'URL изображений (через ;)',
            'Продавать половинками (да/нет)', 'Продавать четвертинками (да/нет)'
        ];
        const exampleRow = [
            'Сыр Чеддер', 'Классический английский сыр', '2000', '4.5',
            'kg', 'головка', 'Твердые', 'https://picsum.photos/id/1/200/300;https://picsum.photos/id/2/200/300',
            'да', 'нет'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
            { wch: 30 }, { wch: 50 }, { wch: 30 }, { wch: 50 },
            { wch: 30 }, { wch: 35 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        XLSX.writeFile(wb, 'шаблон_товаров.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadMessage('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawJson = XLSX.utils.sheet_to_json(worksheet);
                
                const productsToAdd: Omit<Product, 'id' | 'status'>[] = [];
                let errors = 0;
                let errorDetails: string[] = [];

                // Helper to normalize keys (fuzzy match)
                const findKey = (row: any, ...candidates: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const candidate of candidates) {
                        const found = rowKeys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
                        if (found) return found;
                    }
                    return null;
                }

                // Helper to get value
                const getValue = (row: any, ...candidates: string[]) => {
                    const key = findKey(row, ...candidates);
                    return key ? row[key] : undefined;
                }

                // Helper to parse numbers (supports "2,5", "2 500", etc.)
                const parseNum = (val: any): number => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        // Replace comma with dot, remove spaces
                        const clean = val.replace(/,/g, '.').replace(/\s/g, '');
                        const num = parseFloat(clean);
                        return isNaN(num) ? NaN : num;
                    }
                    return NaN;
                }

                rawJson.forEach((row: any, index: number) => {
                   const rowNum = index + 2; 
                   try {
                        const nameKey = findKey(row, 'Название', 'Name');
                        const name = row[nameKey!]?.toString().trim();
                        if (!name) throw new Error('Отсутствует название');
                        
                        const priceRaw = getValue(row, 'Цена за ед.', 'Price');
                        let pricePerUnit = parseNum(priceRaw);
                        if (isNaN(pricePerUnit)) pricePerUnit = 0;

                        const unitValueRaw = getValue(row, 'Значение ед.', 'Unit Value');
                        let unitValue = parseNum(unitValueRaw);
                        if (isNaN(unitValue)) unitValue = 1;

                        const unitRaw = getValue(row, 'Ед. изм. (kg, g, pcs, l)', 'Ед. изм.', 'Unit')?.toString().trim().toLowerCase();
                        let unit = unitRaw as ProductUnit;
                        if (unitRaw === 'кг') unit = 'kg';
                        if (unitRaw === 'гр' || unitRaw === 'г') unit = 'g';
                        if (unitRaw === 'шт') unit = 'pcs';
                        if (unitRaw === 'л') unit = 'l';

                        if (!unitOptions.includes(unit)) {
                            unit = 'kg'; 
                        }
                        
                        const packagingRaw = getValue(row, 'Вид (головка, упаковка, штука, банка, ящик)', 'Вид', 'Packaging')?.toString().trim().toLowerCase();
                        let packaging = packagingRaw as ProductPackaging;
                        
                        if (!packagingOptions.includes(packaging)) {
                             if (unit === 'kg') packaging = 'головка';
                             else if (unit === 'pcs') packaging = 'штука';
                             else packaging = 'упаковка';
                        }

                        const allowedPortions: ProductPortion[] = ['whole'];
                        if (packaging === 'головка') {
                            const halfRaw = getValue(row, 'Продавать половинками (да/нет)', 'Half')?.toString().toLowerCase();
                            if (halfRaw === 'да' || halfRaw === 'yes' || halfRaw === 'true' || halfRaw === '1') {
                                allowedPortions.push('half');
                            }
                            const quarterRaw = getValue(row, 'Продавать четвертинками (да/нет)', 'Quarter')?.toString().toLowerCase();
                            if (quarterRaw === 'да' || quarterRaw === 'yes' || quarterRaw === 'true' || quarterRaw === '1') {
                                allowedPortions.push('quarter');
                            }
                        }
                        
                        const categoriesRaw = getValue(row, 'Категории (через ;)', 'Categories')?.toString();
                        const categories = categoriesRaw ? categoriesRaw.split(';').map((c: string) => c.trim()).filter(Boolean) : [];

                        const imagesRaw = getValue(row, 'URL изображений (через ;)', 'Images')?.toString();
                        const images = imagesRaw ? imagesRaw.split(';').map((url: string) => url.trim()).filter(Boolean) : [];

                        const desc = getValue(row, 'Описание', 'Description')?.toString().trim() || '';

                        const product: Omit<Product, 'id' | 'status'> = {
                            name,
                            description: desc,
                            pricePerUnit,
                            unitValue,
                            unit,
                            packaging,
                            categories,
                            imageUrls: images,
                            allowedPortions,
                            priceOverridesPerUnit: {},
                            usp1UseGlobalMarkup: true,
                        };
                        productsToAdd.push(product);

                   } catch(err: any) {
                       console.warn(`Row ${rowNum} error: ${err.message}`, row);
                       errors++;
                       if (errorDetails.length < 5) {
                           errorDetails.push(`Строка ${rowNum}: ${err.message}`);
                       }
                   }
                });

                if (productsToAdd.length > 0) {
                    onBulkAddProducts(productsToAdd);
                    let msg = `Обработка завершена. Добавлено товаров: ${productsToAdd.length}.`;
                    if (errors > 0) {
                        msg += ` Не загружено строк: ${errors}.`;
                        if (errorDetails.length > 0) {
                            msg += ` Примеры ошибок: ${errorDetails.join('; ')}`;
                        }
                    }
                    setUploadMessage(msg);
                } else {
                    let msg = `Ни одного товара не добавлено. Ошибок: ${errors}.`;
                    if (errorDetails.length > 0) {
                        msg += ` Примеры: ${errorDetails.join('; ')}`;
                    }
                    setUploadMessage(msg);
                }

            } catch (error) {
                console.error("Ошибка при обработке Excel файла:", error);
                setUploadMessage('Критическая ошибка при чтении файла. Убедитесь, что это корректный .xlsx файл.');
            } finally {
                setIsUploading(false);
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleExport = () => {
        const dataToExport = {
            products: products,
            orders: orders,
            users: allUsers,
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `opt-hub-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Вы уверены, что хотите импортировать данные? Это перезапишет ВСЕ текущие товары, заказы и пользователей. Рекомендуется сначала сделать экспорт (резервную копию).")) {
            if (event.target) event.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Не удалось прочитать файл.');
                const data = JSON.parse(text);

                // Basic validation
                if (!data.products || !data.users || !data.orders) {
                    throw new Error('Неверный формат файла. Отсутствуют необходимые поля: products, users, orders.');
                }
                
                onImportData(data);

            } catch (error: any) {
                alert(`Ошибка при импорте: ${error.message}`);
            } finally {
                if (event.target) event.target.value = ''; // Reset input
            }
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
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleAddNewCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !selectedCategories.has(trimmed)) {
            setSelectedCategories(prev => {
                const newSet = new Set(prev);
                newSet.add(trimmed);
                return newSet;
            });
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

    const copyShopId = () => {
        navigator.clipboard.writeText(shopId);
        alert('ID магазина скопирован!');
    }

    // --- MoySklad Logic ---

    // Map MS Row to Product updates/add
    const mapMsItemToProduct = useCallback((item: any): Omit<Product, 'id' | 'status'> => {
        // Logic to normalize Unit (UOM)
        let unit: ProductUnit = 'pcs'; 
        const uomName = item.uom?.toLowerCase() || '';
        if (uomName.includes('кг') || uomName.includes('kg')) unit = 'kg';
        else if (uomName.includes('л') || uomName.includes('l')) unit = 'l';
        else if (uomName.includes('г') || uomName.includes('g')) unit = 'g';
        else if (uomName.includes('шт') || uomName.includes('pcs')) unit = 'pcs';

        let packaging: ProductPackaging = 'штука';
        if (unit === 'kg') packaging = 'головка';
        else if (unit === 'l') packaging = 'банка';

        const allowedPortions: ProductPortion[] = ['whole'];
        if (packaging === 'головка') {
            allowedPortions.push('half');
            allowedPortions.push('quarter');
        }

        const baseProduct: any = {
            name: item.name || '',
            description: (item.description && item.description !== '-') ? item.description : '',
            pricePerUnit: item.salePrice || 0,
            costPrice: item.buyPrice || 0,
            unitValue: item.weight > 0 ? item.weight : 1,
            unit: unit,
            packaging: packaging,
            categories: (item.category && item.category !== '-') ? [item.category] : [],
            imageUrls: item.images || [],
            allowedPortions: allowedPortions,
            priceOverridesPerUnit: {},
            usp1UseGlobalMarkup: true,
        };

        // Apply Custom Mappings
        Object.entries(msMapping).forEach(([msField, targetField]) => {
            if (!targetField) return;
            let value = (item as any)[msField];
            
            // Only apply if value exists to avoid 'undefined' in Firestore
            if (value === undefined || value === null) return;

            // Special conversion for prices
            if (targetField === 'pricePerUnit' || targetField === 'costPrice' || targetField === 'unitValue') {
                value = parseFloat(value) || 0;
            }
            if (targetField === 'categories') {
                value = value !== '-' ? [value] : [];
            }
            if (targetField === 'imageUrls') {
                value = Array.isArray(value) ? value : [];
            }

            baseProduct[targetField] = value;
        });

        // Forced overwrite of msId to ensure it's ALWAYS present regardless of mapping
        baseProduct.msId = item.id;

        return baseProduct as Omit<Product, 'id' | 'status'>;
    }, [msMapping]);

    const performAutoSync = useCallback(async (freshData: any[]) => {
        const lockedItems = freshData.filter(item => msLockedIds.has(item.id));
        if (lockedItems.length === 0) return;

        const updates: {id: string, updates: Partial<Product>}[] = [];
        const toAdd: Omit<Product, 'id' | 'status'>[] = [];

        lockedItems.forEach(msItem => {
            const existing = products.find(p => p.msId === msItem.id);
            const mapped = mapMsItemToProduct(msItem);

            if (existing) {
                // Check if anything actually changed to avoid redundant DB writes
                const hasChanged = 
                    existing.name !== mapped.name || 
                    existing.description !== mapped.description ||
                    existing.pricePerUnit !== mapped.pricePerUnit ||
                    existing.costPrice !== mapped.costPrice ||
                    existing.unitValue !== mapped.unitValue;

                if (hasChanged) {
                    updates.push({ id: existing.id, updates: mapped });
                }
            } else {
                toAdd.push(mapped);
            }
        });

        if (updates.length > 0) {
            console.log(`Auto-sync: updating ${updates.length} products`);
            await Promise.all(updates.map(u => onUpdateProduct(u.id, u.updates)));
        }
        if (toAdd.length > 0) {
            console.log(`Auto-sync: adding ${toAdd.length} new products`);
            onBulkAddProducts(toAdd);
        }
    }, [msLockedIds, products, mapMsItemToProduct, onUpdateProduct, onBulkAddProducts]);

    const handleLoadMoySklad = useCallback(async (isSilent = false) => {
        setMsError('');
        if (!isSilent) {
            setMsLoading(true);
            if (!isSilent) setSelectedMsIds(new Set());
        }

        if (!msLogin || !msPassword) {
            setMsError('Введите логин и пароль.');
            setMsIsConnected(false);
            if (!isSilent) setMsLoading(false);
            return;
        }

        try {
            const auth = btoa(`${msLogin}:${msPassword}`);
            const limit = 1000;
            const targetUrl = `https://api.moysklad.ru/api/remap/1.2/entity/product?limit=${limit}&expand=uom,productFolder,images&t=${Date.now()}`;
            
            const fetchUrl = msUseProxy 
                ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` 
                : targetUrl;

            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('Ошибка авторизации. Проверьте логин и пароль.');
                throw new Error(`Ошибка сервера: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data && data.rows) {
                const processed = data.rows.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    buyPrice: item.buyPrice ? item.buyPrice.value / 100 : 0,
                    salePrice: (item.salePrices && item.salePrices.length > 0) ? item.salePrices[0].value / 100 : 0,
                    article: item.article || '-',
                    code: item.code || '-',
                    description: item.description || '-',
                    uom: item.uom?.name || '-',
                    weight: item.weight || 0,
                    volume: item.volume || 0,
                    barcodes: item.barcodes ? item.barcodes.map((b: any) => Object.values(b)[0]).join(', ') : '-',
                    category: item.productFolder?.name || '-',
                    images: item.images?.rows?.map((img: any) => img.miniature?.href || img.downloadHref).filter(Boolean) || []
                }));
                setMsData(processed);
                setMsIsConnected(true);

                // Run Auto-Sync logic
                performAutoSync(processed);

            } else {
                setMsData([]);
                setMsIsConnected(true);
            }

        } catch (error: any) {
            console.error("MoySklad Error:", error);
            setMsError(error.message || 'Ошибка подключения.');
            setMsIsConnected(false);
        } finally {
            if (!isSilent) setMsLoading(false);
        }
    }, [msLogin, msPassword, msUseProxy, performAutoSync]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (msAutoRefresh && activeTab === 'moysklad' && msLogin && msPassword) {
            interval = setInterval(() => {
                handleLoadMoySklad(true); 
            }, msRefreshInterval * 1000);
        }
        return () => clearInterval(interval);
    }, [msAutoRefresh, msRefreshInterval, activeTab, msLogin, msPassword, handleLoadMoySklad]);

    const handleMsToggleRow = (id: string) => {
        setSelectedMsIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleMsToggleAll = () => {
        if (selectedMsIds.size === msData.length) {
            setSelectedMsIds(new Set());
        } else {
            setSelectedMsIds(new Set(msData.map(item => item.id)));
        }
    };

    const handleMsToggleLock = (id: string) => {
        setMsLockedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAddSelectedToCatalog = async () => {
        if (selectedMsIds.size === 0) return;

        setMsLoading(true);
        const selectedItems = msData.filter(item => selectedMsIds.has(item.id));
        const productsToProcess = selectedItems.map(item => mapMsItemToProduct(item));

        const updates: Promise<void>[] = [];
        const toAdd: any[] = [];

        productsToProcess.forEach(p => {
            const existing = products.find(ep => ep.msId === p.msId);
            if (existing) {
                updates.push(onUpdateProduct(existing.id, p));
            } else {
                toAdd.push(p);
            }
        });

        try {
            if (updates.length > 0) {
                await Promise.all(updates);
            }
            if (toAdd.length > 0) {
                // Ensure bulk add is properly awaited if it's async
                await onBulkAddProducts(toAdd);
            }
            alert(`Синхронизация завершена.\nОбновлено: ${updates.length}\nДобавлено новых: ${toAdd.length}`);
            setSelectedMsIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Произошла ошибка при сохранении данных.');
        } finally {
            setMsLoading(false);
        }
    };

    const handleAddAsNew = async () => {
        if (selectedMsIds.size === 0) return;
        
        setMsLoading(true);
        const selectedItems = msData.filter(item => selectedMsIds.has(item.id));
        const productsToCreate = selectedItems.map(item => {
            const p = mapMsItemToProduct(item);
            // Ensure we remove any existing ID-like fields if any mapping accidentally added them
            return p;
        });

        try {
            await onBulkAddProducts(productsToCreate);
            alert(`Успешно добавлено ${productsToCreate.length} новых товаров в справочник.`);
            setSelectedMsIds(new Set());
        } catch (e) {
            console.error(e);
            alert('Ошибка при добавлении новых товаров.');
        } finally {
            setMsLoading(false);
        }
    }

    const msSourceFields = [
        { key: 'images', label: 'Фото' },
        { key: 'name', label: 'Наименование' },
        { key: 'categories', label: 'Категория' },
        { key: 'buyPrice', label: 'Себестоимость' },
        { key: 'salePrice', label: 'Цена' },
        { key: 'article', label: 'Артикул' },
        { key: 'code', label: 'Код' },
        { key: 'description', label: 'Описание' },
        { key: 'uom', label: 'Ед. изм.' },
        { key: 'weight', label: 'Вес' },
    ];

    const targetFields = [
        { key: '', label: 'Не импортировать' },
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
        { key: 'pricePerUnit', label: 'Цена продажи' },
        { key: 'costPrice', label: 'Себестоимость' },
        { key: 'unitValue', label: 'Значение ед.' },
        { key: 'categories', label: 'Категория' },
        { key: 'imageUrls', label: 'Изображения' },
    ];

    return (
        <div className="bg-white rounded-none sm:rounded-lg shadow-none sm:shadow-sm px-0 py-2 sm:p-6 relative w-full">
            <div className="mb-2 sm:mb-4 px-1 sm:px-0">
                <button 
                    onClick={() => setIsIdInfoVisible(!isIdInfoVisible)}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Показать информацию об ID"
                >
                    <span>ID магазина: {shopId}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${isIdInfoVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 11(1.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isIdInfoVisible && (
                <div className="mb-2 sm:mb-6 p-2 sm:p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            ID магазина (Административный)
                        </h3>
                        <p className="text-xs text-indigo-700 mt-1">
                            Используйте этот ID для входа в панель управления с другого устройства. <span className="font-bold text-red-600">Держите его в секрете</span> и не сообщайте покупателям.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <code className="flex-grow sm:flex-grow-0 px-3 py-2 bg-white border border-indigo-200 rounded text-sm font-mono text-gray-700 select-all">
                            {shopId}
                        </code>
                        <button 
                            onClick={copyShopId}
                            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            title="Копировать ID"
                        >
                            <CopyIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="border-b">
                 <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-2 sm:pb-4 px-2 sm:-mx-6 sm:px-6" role="tablist" aria-orientation="horizontal">
                    <TabButton tabId="pricelist">Каталог</TabButton>
                    <TabButton tabId="products_master">Товары</TabButton>
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
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Управление товарами</h3>
                        
                        <div className="relative" ref={roleSelectorRef}>
                            <button 
                                onClick={() => setIsRoleSelectorOpen(!isRoleSelectorOpen)} 
                                className={`p-1 rounded-full hover:bg-gray-100 ${previewRole ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
                                title="Предпросмотр для роли"
                            >
                                <UsersIcon className="w-5 h-5" />
                            </button>
                            {isRoleSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b bg-gray-50">
                                        Предпросмотр для роли
                                    </div>
                                    <button 
                                        onClick={() => { setPreviewRole(null); setIsRoleSelectorOpen(false); }}
                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${!previewRole ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        Администратор (Все)
                                    </button>
                                    {roles.map(role => (
                                        <button 
                                            key={role}
                                            onClick={() => { setPreviewRole(role); setIsRoleSelectorOpen(false); }}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 ${previewRole === role ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsHelpVisible(!isHelpVisible)} className="text-gray-400 hover:text-gray-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    {previewRole && (
                        <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-md flex items-center justify-between">
                            <span className="text-sm text-indigo-800">
                                Режим просмотра: <b>{previewRole}</b>
                            </span>
                            <button onClick={() => setPreviewRole(null)} className="text-xs text-indigo-500 hover:text-indigo-700">
                                Сбросить
                            </button>
                        </div>
                    )}

                     <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isHelpVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                             <p className="text-sm text-gray-600 pb-4">
                                <b>Изображения:</b> нажмите на фото товара, чтобы открыть галерею и управлять ей (добавлять, удалять).<br/>
                                <b>Детали:</b> нажмите на название товара, чтобы изменить его название, описание, ед. изм., вид и категории.<br/>
                                <b>Статус:</b> кнопка <b className="text-red-500">Стоп</b>/<b>Глаз</b> циклически меняет статус (Доступен → Нет в наличии → Скрыт).<br/>

                                <b>Порции (для кг):</b> нажимайте на иконки, чтобы включить/выключить продажу (четверть/половина).<br/>
                                <b>Цены и значение:</b> нажмите на цену (₽/ед.изм) или значение (Х ед.изм/вид), чтобы их изменить.
                             </p>
                        </div>
                     </div>
                     
                     <div className="mb-6">
                        <CategoryDropdown
                            categories={adminCategories}
                            selectedCategory={adminSelectedCategory}
                            onSelectCategory={setAdminSelectedCategory}
                            displayAsIconButton={true}
                        />
                     </div>
                     <ProductList
                        products={adminFilteredProducts}
                        onAddToCart={() => {}} // Dummy function, not used in admin view
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

            {activeTab === 'moysklad' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-700">Интеграция с МойСклад</h3>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-200">
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                    msIsConnected === true ? 'bg-green-500 animate-pulse' : 
                                    msIsConnected === false ? 'bg-red-500' : 
                                    (msLogin && msPassword) ? 'bg-yellow-500' : 'bg-gray-300'
                                }`}></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    {msIsConnected === true ? 'Активна' : msIsConnected === false ? 'Ошибка' : 'Ожидание'}
                                </span>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleLoadMoySklad(false)} 
                            disabled={msLoading}
                            className="bg-indigo-600 text-white text-xs font-bold py-2 px-4 rounded-full hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <RefreshIcon className={`w-3.5 h-3.5 ${msLoading ? 'animate-spin' : ''}`} />
                            Обновить данные сейчас
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Connection Card */}
                        <div className="bg-white p-4 border rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1 rounded-full"><CloudDownloadIcon className="w-4 h-4"/></span>
                                Подключение
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Логин (Email)</label>
                                    <input 
                                        type="text" 
                                        value={msLogin} 
                                        onChange={e => { setMsLogin(e.target.value); setMsIsConnected(null); }} 
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                        placeholder="admin@example"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Пароль</label>
                                    <input 
                                        type="password" 
                                        value={msPassword} 
                                        onChange={e => { setMsPassword(e.target.value); setMsIsConnected(null); }} 
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="useProxy"
                                        checked={msUseProxy}
                                        onChange={e => setMsUseProxy(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="useProxy" className="text-xs text-gray-500">
                                        Использовать CORS-прокси (рекомендуется для работы из браузера)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Fields Config Card */}
                        <div className="bg-white p-4 border rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Настройка обновления</h4>
                            
                            <div className="space-y-4">
                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="msAutoRefresh"
                                                checked={msAutoRefresh}
                                                onChange={e => setMsAutoRefresh(e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <label htmlFor="msAutoRefresh" className="text-sm font-bold text-indigo-900">
                                                Авто-обновление
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-indigo-700">Интервал:</span>
                                        <div className="flex items-center bg-white border border-indigo-200 rounded-md overflow-hidden">
                                            <input 
                                                type="number" 
                                                min="1"
                                                max="3600"
                                                value={msRefreshInterval}
                                                onChange={e => setMsRefreshInterval(Math.max(1, parseInt(e.target.value, 10) || 5))}
                                                className="w-16 px-2 py-1 text-xs text-center focus:outline-none border-r border-indigo-100"
                                            />
                                            <span className="px-2 text-[10px] font-bold text-gray-400 uppercase">сек.</span>
                                        </div>
                                        <span className="text-[10px] text-indigo-400 italic leading-tight">
                                            Синхронизация "замочков" <br/>будет срабатывать автоматически.
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 grid grid-cols-2 gap-x-4">
                                    {msSourceFields.map(f => (
                                        <div key={f.key} className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={msFields[f.key as keyof typeof msFields]} 
                                                onChange={e => setMsFields(prev => ({...prev, [f.key]: e.target.checked}))} 
                                                className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 text-[11px] text-gray-600 truncate">{f.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    {msError && (
                        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
                            {msError}
                        </div>
                    )}

                    {msData.length > 0 && (
                        <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
                            <div className="p-3 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                                <span className="font-semibold text-gray-700 text-sm">Найдено в МойСклад: {msData.length}</span>
                                {selectedMsIds.size > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-indigo-600 font-bold">Выбрано: {selectedMsIds.size}</span>
                                        <button 
                                            onClick={handleAddSelectedToCatalog}
                                            disabled={msLoading}
                                            className="bg-indigo-600 text-white text-[10px] font-bold py-1.5 px-3 rounded hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                                            title="Обновит те товары, что уже есть, или создаст недостающие"
                                        >
                                            Синхронизировать выбранные
                                        </button>
                                        <button 
                                            onClick={handleAddAsNew}
                                            disabled={msLoading}
                                            className="bg-green-600 text-white text-[10px] font-bold py-1.5 px-3 rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                            title="Принудительно создаст новые карточки товаров"
                                        >
                                            Добавить как новые
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto max-h-[600px] border-t">
                                <table className="min-w-full text-[11px] text-left text-gray-500 table-fixed border-collapse">
                                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 border-b">
                                        {/* Column Mapper Row */}
                                        <tr className="bg-indigo-50/50">
                                            <th className="px-2 py-2 border-r w-8 bg-indigo-50"></th>
                                            <th className="px-2 py-2 border-r w-8 bg-indigo-50"></th>
                                            {msSourceFields.filter(f => msFields[f.key as keyof typeof msFields]).map(f => (
                                                <th key={`map-${f.key}`} className="px-2 py-2 border-r bg-indigo-50">
                                                    <select 
                                                        value={msMapping[f.key] || ''} 
                                                        onChange={(e) => setMsMapping(prev => ({...prev, [f.key]: e.target.value}))}
                                                        className="w-full bg-white border border-indigo-200 rounded text-[9px] px-1 py-0.5 font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500"
                                                    >
                                                        {targetFields.map(tf => (
                                                            <option key={tf.key} value={tf.key}>{tf.label}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                            ))}
                                            <th className="bg-indigo-50"></th>
                                        </tr>
                                        {/* Real Headers */}
                                        <tr>
                                            <th className="px-2 py-3 w-8 border-r text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={msData.length > 0 && selectedMsIds.size === msData.length}
                                                    onChange={handleMsToggleAll}
                                                    className="h-3 w-3 text-indigo-600 border-gray-300 rounded"
                                                />
                                            </th>
                                            <th className="px-2 py-3 w-8 border-r text-center" title="Автоматическая синхронизация (замочек)">
                                                <LockClosedIcon className="w-3 h-3 mx-auto text-indigo-400" />
                                            </th>
                                            {msSourceFields.filter(f => msFields[f.key as keyof typeof msFields]).map(f => (
                                                <th key={f.key} className="px-2 py-3 border-r font-bold truncate">{f.label}</th>
                                            ))}
                                            <th className="px-2 py-3 w-32 font-bold">Связь в каталоге</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {msData.map((item) => {
                                            const isLocked = msLockedIds.has(item.id);
                                            const linkedProduct = products.find(p => p.msId === item.id);
                                            return (
                                                <tr key={item.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedMsIds.has(item.id) ? 'bg-indigo-50/30' : ''} ${isLocked ? 'bg-blue-50/20' : ''}`}>
                                                    <td className="px-2 py-2 border-r text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedMsIds.has(item.id)}
                                                            onChange={() => handleMsToggleRow(item.id)}
                                                            className="h-3 w-3 text-indigo-600 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 border-r text-center">
                                                        <button 
                                                            onClick={() => handleMsToggleLock(item.id)}
                                                            className={`p-1 rounded-full transition-all transform active:scale-90 ${isLocked ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-300 hover:text-gray-500'}`}
                                                            title={isLocked ? "Авто-синхронизация включена" : "Включить авто-синхронизацию"}
                                                        >
                                                            {isLocked ? <LockClosedIcon className="w-3.5 h-3.5" /> : <LockOpenIcon className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </td>
                                                    
                                                    {msFields.images && (
                                                        <td className="px-2 py-2 border-r text-center">
                                                            {item.images && item.images.length > 0 ? (
                                                                <img src={item.images[0]} alt="p" className="w-6 h-6 rounded object-cover border mx-auto shadow-xs" />
                                                            ) : <span className="text-gray-300">—</span>}
                                                        </td>
                                                    )}
                                                    {msFields.name && <td className="px-2 py-2 border-r font-medium text-gray-900 truncate" title={item.name}>{item.name}</td>}
                                                    {msFields.categories && <td className="px-2 py-2 border-r"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-medium text-gray-600">{item.category}</span></td>}
                                                    {msFields.buyPrice && <td className="px-2 py-2 border-r whitespace-nowrap">{item.buyPrice.toLocaleString('ru-RU')} ₽</td>}
                                                    {msFields.salePrice && <td className="px-2 py-2 border-r whitespace-nowrap">{item.salePrice.toLocaleString('ru-RU')} ₽</td>}
                                                    {msFields.article && <td className="px-2 py-2 border-r truncate">{item.article}</td>}
                                                    {msFields.code && <td className="px-2 py-2 border-r truncate">{item.code}</td>}
                                                    {msFields.description && <td className="px-2 py-2 border-r truncate text-gray-400" title={item.description}>{item.description}</td>}
                                                    {msFields.uom && <td className="px-2 py-2 border-r">{item.uom}</td>}
                                                    {msFields.weight && <td className="px-2 py-2 border-r">{item.weight}</td>}
                                                    
                                                    <td className="px-2 py-2">
                                                        {linkedProduct ? (
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 uppercase tracking-tighter">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                                Связан
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">Не привязан</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'products_master' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Все товары (Справочник)</h3>
                        <button
                            onClick={() => setIsMasterFilterVisible(!isMasterFilterVisible)}
                            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                            aria-expanded={isMasterFilterVisible}
                            title="Фильтры и поиск"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isMasterFilterVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <div className="mb-4 bg-gray-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Search Input */}
                                    <div>
                                        <label htmlFor="master-search" className="block text-sm font-medium text-gray-700">Поиск</label>
                                        <input
                                            type="text"
                                            id="master-search"
                                            placeholder="Название или описание..."
                                            value={tableSearchTerm}
                                            onChange={(e) => setTableSearchTerm(e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    {/* Category Filter */}
                                    <div>
                                        <CategoryDropdown
                                            categories={allCategories}
                                            selectedCategory={tableFilterCategory}
                                            onSelectCategory={setTableFilterCategory}
                                            label="Категория"
                                        />
                                    </div>
                                    {/* Status Filter */}
                                    <div>
                                        <label htmlFor="master-status-filter" className="block text-sm font-medium text-gray-700">Статус</label>
                                        <select
                                            id="master-status-filter"
                                            value={tableFilterStatus}
                                            onChange={(e) => setTableFilterStatus(e.target.value as ProductStatus | 'all')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="all">Все статусы</option>
                                            <option value={ProductStatus.Available}>Доступен</option>
                                            <option value={ProductStatus.OutOfStock}>Нет в наличии</option>
                                            <option value={ProductStatus.Hidden}>Скрыт</option>
                                        </select>
                                    </div>
                                    
                                    {/* Column Selection for Master */}
                                    <div className="md:col-span-3 pt-4 border-t mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Отображаемые столбцы</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {/* Filtered to remove Price, Markup, Portions and Special from master view options */}
                                            {TABLE_COLUMNS_OPTIONS.filter(c => !['price', 'markup', 'portions', 'special'].includes(c.key)).map((col) => (
                                                <div key={col.key} className="flex items-center">
                                                    <input
                                                        id={`master-col-toggle-${col.key}`}
                                                        type="checkbox"
                                                        checked={visibleMasterColumns.includes(col.key)}
                                                        onChange={() => handleToggleMasterColumn(col.key)}
                                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                        disabled={visibleMasterColumns.length <= 1 && visibleMasterColumns.includes(col.key)}
                                                    />
                                                    <label htmlFor={`master-col-toggle-${col.key}`} className="ml-2 text-sm text-gray-600 cursor-pointer select-none">
                                                        {col.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedProductIds.size > 0 && (
                        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-700 text-sm">Выбрано: {selectedProductIds.size}</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleBulkDeleteProducts}
                                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Удалить выбранные
                                </button>
                            </div>
                        </div>
                    )}

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
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Редактирование прайс-листа</h3>
                        <button onClick={() => setIsTableHelpVisible(!isTableHelpVisible)} className="text-gray-400 hover:text-gray-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                     <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isTableHelpVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                             <p className="text-sm text-gray-600 pb-4">
                                Выберите вкладку с типом цен, который хотите отредактировать. <br/>
                                <b>Базовый:</b> основные розничные цены. <br/>
                                <b>Роли (Опт и др.):</b> цены, специфичные для группы клиентов.
                             </p>
                        </div>
                     </div>

                    <div className="mb-4">
                        {/* Price Type Tabs */}
                        <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-gray-200 mb-4">
                            {['Базовый (Розничный)', ...roles.filter(r => r !== 'Розничный')].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setActivePriceListRole(role)}
                                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                                        activePriceListRole === role 
                                        ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsTableFilterVisible(!isTableFilterVisible)}
                            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                            aria-expanded={isTableFilterVisible}
                            aria-controls="table-filters-panel"
                            title="Фильтры и поиск"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div
                            id="table-filters-panel"
                            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isTableFilterVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                            <div className="overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border">
                                    {/* Search Input */}
                                    <div>
                                        <label htmlFor="table-search" className="block text-sm font-medium text-gray-700">Поиск</label>
                                        <input
                                            type="text"
                                            id="table-search"
                                            placeholder="Название или описание..."
                                            value={tableSearchTerm}
                                            onChange={(e) => setTableSearchTerm(e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    {/* Category Filter */}
                                    <div>
                                        <CategoryDropdown
                                            categories={allCategories}
                                            selectedCategory={tableFilterCategory}
                                            onSelectCategory={setTableFilterCategory}
                                            label="Категория"
                                        />
                                    </div>
                                    {/* Status Filter */}
                                    <div>
                                        <label htmlFor="table-status-filter" className="block text-sm font-medium text-gray-700">Статус</label>
                                        <select
                                            id="table-status-filter"
                                            value={tableFilterStatus}
                                            onChange={(e) => setTableFilterStatus(e.target.value as ProductStatus | 'all')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="all">Все статусы</option>
                                            <option value={ProductStatus.Available}>Доступен</option>
                                            <option value={ProductStatus.OutOfStock}>Нет в наличии</option>
                                            <option value={ProductStatus.Hidden}>Скрыт</option>
                                        </select>
                                    </div>
                                    
                                    {/* Column Selection */}
                                    <div className="md:col-span-3 pt-4 border-t mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Отображаемые столбцы</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {TABLE_COLUMNS_OPTIONS.map((col) => (
                                                <div key={col.key} className="flex items-center">
                                                    <input
                                                        id={`col-toggle-${col.key}`}
                                                        type="checkbox"
                                                        checked={visibleTableColumns.includes(col.key)}
                                                        onChange={() => handleToggleTableColumn(col.key)}
                                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                        disabled={visibleTableColumns.length <= 1 && visibleTableColumns.includes(col.key)}
                                                    />
                                                    <label htmlFor={`col-toggle-${col.key}`} className="ml-2 text-sm text-gray-600 cursor-pointer select-none">
                                                        {col.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ProductTable
                        key={activePriceListRole} // Force re-render when switching tabs to reset internal row states
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

            {activeTab === 'badges' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Управление метками товаров</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Создавайте метки, которые будут отображаться поверх фотографий товаров (например, "ХИТ", "NEW", "-15%").
                    </p>

                    <div className="bg-white border rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Создать новую метку</h4>
                        <form onSubmit={handleCreateBadge} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="badgeText" className="block text-xs font-medium text-gray-500 mb-1">Текст (макс. 5)</label>
                                <input
                                    type="text"
                                    id="badgeText"
                                    maxLength={5}
                                    value={badgeText}
                                    onChange={(e) => setBadgeText(e.target.value)}
                                    placeholder="ХИТ"
                                    className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Цвет фона</label>
                                <div className="flex flex-wrap gap-2 max-w-md">
                                    {BADGE_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setBadgeColor(color)}
                                            className={`w-8 h-8 rounded-full ${color} ${badgeColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'} shadow-sm border border-black/10 transition-transform`}
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={!badgeText}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {badges.map(badge => (
                            <div key={badge.id} className="relative bg-white border rounded-lg p-4 flex flex-col items-center justify-center gap-2 group">
                                <div className={`px-3 py-1 rounded text-white text-xs font-bold uppercase ${badge.color}`}>
                                    {badge.text}
                                </div>
                                <span className="text-xs text-gray-400">{badge.color.replace('bg-', '').replace('-500', '')}</span>
                                <button 
                                    onClick={() => { if(window.confirm('Удалить метку?')) onDeleteBadge(badge.id) }}
                                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {badges.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Меток пока нет.</p>
                    )}
                </div>
            )}

            {activeTab === 'wholesale_pricelist' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Оптовый прайс-лист</h3>
                     <p className="text-sm text-gray-600 pb-4">
                        Вносите оптовые цены для разных типов покупателей. Кнопка "Сохранить" для каждой строки становится активной после внесения изменений.
                     </p>
                    <WholesaleProductTable
                        products={products}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateProductCostPrice={onUpdateProductCostPrice}
                        onUpdateUspPrices={onUpdateUspPrices}
                        onBulkUpdateWholesalePrices={onBulkUpdateWholesalePrices}
                        roles={roles}
                    />
                </div>
            )}

            {activeTab === 'visibility' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Настройка видимости товаров</h3>
                    <p className="text-sm text-gray-600 pb-4">
                        Управляйте тем, какие товары видны для конкретных ролей покупателей.
                    </p>
                    <VisibilityMatrix
                        products={products}
                        onUpdateVisibility={onUpdateVisibility}
                        roles={roles}
                    />
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <AdminOrders
                        orders={orders}
                        users={allUsers}
                        onUpdateStatus={onUpdateOrderStatus}
                    />
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <AdminCustomers
                        shopId={shopId}
                        users={allUsers}
                        orders={orders}
                        onAddUser={onAddUser}
                        onDeleteUser={onDeleteUser}
                        onUpdateUserByAdmin={onUpdateUserByAdmin}
                        roles={roles}
                        onAddRole={onAddRole}
                        onDeleteRole={onDeleteRole}
                    />
                </div>
            )}

            {activeTab === 'add' && (
                <div className="divide-y divide-gray-200 mt-2 sm:mt-6 px-1 sm:px-0">
                    {/* Add Product Form */}
                    <div className="pb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Добавить нового товара вручную</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Ед. изм.</label>
                                    <select id="unit" value={unit} onChange={e => setUnit(e.target.value as ProductUnit)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                        {unitOptions.map(u => <option key={u} value={u}>{unitDisplayMap[u]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="packaging" className="block text-sm font-medium text-gray-700">Вид</label>
                                    <select id="packaging" value={packaging} onChange={e => setPackaging(e.target.value as ProductPackaging)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                        {packagingOptions.map(p => <option key={p} value={p}>{packagingDisplayMap[p]}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700">Цена за {unitDisplayMap[unit]} (₽)</label>
                                    <input type="number" id="pricePerUnit" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                                <div>
                                    <label htmlFor="unitValue" className="block text-sm font-medium text-gray-700">{unitValueLabel}</label>
                                    <input type="number" step="0.01" id="unitValue" value={unitValue} onChange={e => setUnitValue(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                </div>
                            </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Категории</label>
                                <div className="mt-2 space-y-2 border p-3 rounded-md max-h-48 overflow-y-auto">
                                    {allPossibleCategories.map(cat => (
                                        <div key={cat} className="flex items-center">
                                            <input 
                                                id={`cat-add-${cat}`}
                                                type="checkbox" 
                                                checked={selectedCategories.has(cat)} 
                                                onChange={() => handleCategoryToggle(cat)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`cat-add-${cat}`} className="ml-2 block text-sm text-gray-900">{cat}</label>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newCategory} 
                                        onChange={e => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); } }}
                                        placeholder="Новая категория"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddNewCategory}
                                        className="px-3 py-2 bg-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 flex-shrink-0"
                                    >
                                        Добавить
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
                                
                                <div className="space-y-3">
                                    {/* Uploaded Images Preview */}
                                    {uploadedImages.length > 0 && (
                                        <div className="flex space-x-2 overflow-x-auto pb-2 border p-2 rounded-md">
                                            {uploadedImages.map((url, index) => (
                                                <div key={index} className="relative flex-shrink-0 group">
                                                    <img src={url} alt={`Uploaded ${index}`} className="h-20 w-20 object-cover rounded-lg border" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteUploadedImage(index)} 
                                                        className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {!isCameraActive && (
                                        <div className="flex flex-wrap gap-2">
                                             <input 
                                                type="file" 
                                                ref={imageFileInputRef} 
                                                onChange={handleImageFileSelect} 
                                                accept="image/*" 
                                                multiple 
                                                className="hidden" 
                                             />
                                             <button 
                                                type="button"
                                                onClick={handleAddImageFromFileClick}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                             >
                                                <PlusIcon className="w-5 h-5" />
                                                <span>Загрузить фото</span>
                                             </button>
                                             <button 
                                                type="button"
                                                onClick={handleOpenCamera}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                             >
                                                <CameraIcon className="w-5 h-5" />
                                                <span>Сделать снимок</span>
                                             </button>
                                        </div>
                                    )}

                                    {/* Camera Interface */}
                                    {isCameraActive && (
                                        <div className="flex flex-col items-center gap-2 p-2 border rounded-md bg-gray-50">
                                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm h-48 object-cover rounded-lg bg-black"></video>
                                            <canvas ref={canvasRef} className="hidden"></canvas>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={handleTakePicture} 
                                                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                >
                                                    Снять
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={stopCamera} 
                                                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <label htmlFor="imageUrls" className="block text-xs font-medium text-gray-500">или укажите ссылки (через запятую)</label>
                                        <input 
                                            type="text" 
                                            id="imageUrls" 
                                            value={imageUrls} 
                                            onChange={e => setImageUrls(e.target.value)} 
                                            placeholder="https://example.com/image.jpg"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {packaging === 'головка' && (
                                <div>
                                    <span className="block text-sm font-medium text-gray-700">Опции продажи (для головок)</span>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center">
                                            <input id="allowHalf" type="checkbox" checked={allowHalf} onChange={e => setAllowHalf(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                            <label htmlFor="allowHalf" className="ml-2 block text-sm text-gray-900">Разрешить продажу половинками</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="allowQuarter" type="checkbox" checked={allowQuarter} onChange={e => setAllowQuarter(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                            <label htmlFor="allowQuarter" className="ml-2 block text-sm text-gray-900">Разрешить продажу четвертинками</label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                                    {isSubmitting ? 'Добавление...' : 'Добавить товар'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {activeTab === 'import' && (
                 <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Массовый импорт из Excel</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Скачайте шаблон, заполните его и загрузите файл для добавления сразу нескольких товаров.
                    </p>
                    <div className="flex items-center gap-4">
                         <button 
                            onClick={handleDownloadTemplate} 
                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Скачать шаблон
                          </button>
                         <label 
                            htmlFor="excel-upload" 
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}`}
                          >
                            {isUploading ? 'Обработка...' : 'Загрузить файл'}
                         </label>
                         <input id="excel-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" disabled={isUploading} />
                    </div>
                    {uploadMessage && <p className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded-md whitespace-pre-wrap">{uploadMessage}</p>}
                </div>
            )}

            {activeTab === 'importSheets' && (
                 <div className="mt-2 sm:mt-6 px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Импорт из Google Sheets</h3>
                    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-sm text-gray-600">
                                <b>Как использовать:</b><br/>
                                1. В Google Sheets: <b>Файл &gt; Поделиться &gt; Опубликовать в Интернете</b>.<br/>
                                2. Выберите лист и формат <b>"Comma-separated values (.csv)"</b>, нажмите "Опубликовать".<br/>
                                3. Скопируйте и вставьте полученную ссылку ниже.<br/>
                                4. Ожидаемый порядок колонок: <b>A - Название, B - Цена за кг, C - Описание</b>. (Импортер работает только для товаров в кг).
                            </p>
                             <button 
                                onClick={handleDownloadGSheetTemplate} 
                                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap flex-shrink-0"
                              >
                                Скачать шаблон для заполнения
                              </button>
                        </div>
                        <div>
                            <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700">URL из Google Sheets (.csv)</label>
                            <input type="url" id="sheetUrl" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label htmlFor="sheetRow" className="block text-sm font-medium text-gray-700">Номер строки для импорта</label>
                                <input type="number" id="sheetRow" value={sheetRow} onChange={e => setSheetRow(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                            </div>
                            <button type="button" onClick={handleGoogleSheetImport} disabled={isImporting} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400">
                                {isImporting ? 'Загрузка...' : 'Загрузить данные'}
                            </button>
                        </div>
                        {importError && <p className="text-red-500 text-sm mt-2">{importError}</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'sync' && (
                <div className="mt-2 sm:mt-6 max-w-2xl px-1 sm:px-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Экспорт и Импорт данных</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Эта функция позволяет сохранить все данные приложения (товары, заказы, покупатели) в один файл. Этот файл можно использовать для создания резервной копии или для переноса данных на другое устройство, чтобы продолжить работу.
                    </p>
        
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-gray-700">Экспорт данных</h4>
                            <p className="text-sm text-gray-600 mt-1 mb-3">
                                Сохранить все текущие данные в файл JSON.
                            </p>
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Скачать файл с данными
                            </button>
                        </div>
        
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-gray-700">Импорт данных</h4>
                            <p className="text-sm text-gray-600 mt-1 mb-3">
                                <span className="font-bold text-red-600">Внимание:</span> Загрузка файла перезапишет все существующие данные в приложении. Рекомендуется сначала сделать экспорт для создания резервной копии.
                            </p>
                            <button
                                onClick={handleImportClick}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Загрузить файл с данными
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json,application/json"
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
