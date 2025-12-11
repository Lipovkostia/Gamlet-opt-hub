
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, Order, User, OrderStatus, CustomerType } from '../types';
import ProductList from './ProductList';
import CategoryDropdown from './CategoryDropdown';
import ProductTable from './ProductTable';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import WholesaleProductTable from './WholesaleProductTable';
import VisibilityMatrix from './VisibilityMatrix';


// Make TypeScript aware of the XLSX library loaded from the CDN
declare var XLSX: any;

interface AdminPageProps {
    shopId: string;
    products: Product[];
    allCategories: string[];
    orders: Order[];
    allUsers: User[];
    roles: string[];
    onAddProduct: (product: Omit<Product, 'id' | 'status'>) => Promise<void>;
    onBulkAddProducts: (products: Omit<Product, 'id' | 'status'>[]) => void;
    onDeleteProduct: (productId: string) => void;
    onCycleStatus: (productId: string) => void;
    onUpdatePortions: (productId: string, portion: ProductPortion) => void;
    onUpdatePrices: (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdateProductPriceTiers: (productId: string, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: string, costPrice?: number) => void;
    onUpdateUspPrices: (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; }) => void;
    onBulkUpdateUspPrices: (updates: { productId: string; usp1Price?: number; }[]) => void;
    onBulkUpdateWholesalePrices: (updates: { productId: string; newPrice: number; }[]) => void;
    onUpdateUspMarkupFlags: (productId: string, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUnitValue: (productId: string, newUnitValue: number) => void;
    onUpdateDetails: (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateImages: (productId: string, newImageUrls: string[]) => void;
    onUpdateCategories: (productId: string, newCategories: string[]) => void;
    onUpdateVisibility: (productId: string, visibleToRoles: CustomerType[]) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onAddUser: (email: string, password: string) => 'success' | 'exists';
    onDeleteUser: (userId: string) => void;
    onUpdateUserByAdmin: (userId: string, updates: Partial<User> & { newPassword?: string }) => void;
    onCycleBadge: (productId: string) => void;
    onImportData: (data: { products: Product[], users: User[], orders: Order[] }) => void;
    onAddRole: (role: string) => void;
    onDeleteRole: (role: string) => void;
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'головка', упаковка: 'упаковка', штука: 'штука', банка: 'банка', ящик: 'ящик' };
const unitOptions: ProductUnit[] = ['kg', 'g', 'pcs', 'l'];
const packagingOptions: ProductPackaging[] = ['головка', 'упаковка', 'штука', 'банка', 'ящик'];

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

const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { shopId, products, allCategories, orders, allUsers, roles, onAddProduct, onBulkAddProducts, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateProductPriceTiers, onUpdateProductCostPrice, onUpdateUspPrices, onBulkUpdateUspPrices, onBulkUpdateWholesalePrices, onUpdateUspMarkupFlags, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onUpdateCategories, onUpdateVisibility, onUpdateOrderStatus, onAddUser, onDeleteUser, onUpdateUserByAdmin, onCycleBadge, onImportData, onAddRole, onDeleteRole } = props;
    const [activeTab, setActiveTab] = useState<'pricelist' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist' | 'visibility' | 'sync'>('pricelist');
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
    
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isTableHelpVisible, setIsTableHelpVisible] = useState(false);
    const [isIdInfoVisible, setIsIdInfoVisible] = useState(false);

    // New states for table filtering
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableFilterCategory, setTableFilterCategory] = useState<string | 'all'>('all');
    const [tableFilterStatus, setTableFilterStatus] = useState<ProductStatus | 'all'>('all');
    const [isTableFilterVisible, setIsTableFilterVisible] = useState(false);
    
    // State for USP markups
    const [uspMarkups, setUspMarkups] = useState({ usp1: '' });

    // Ref for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null); // For JSON import
    const imageFileInputRef = useRef<HTMLInputElement>(null); // For Image upload
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Cleanup camera stream on unmount or tab switch
        return () => {
            stopCamera();
        };
    }, [activeTab]);

    const adminCategories = useMemo(() => [
        ...new Set(products.map(p => p.categories).flat())
    ].sort(), [products]);

    const adminFilteredProducts = useMemo(() => {
        // In admin view, we only filter by category, not by visibility status
        if (adminSelectedCategory === 'all') {
            return products;
        }
        return products.filter(p => p.categories.includes(adminSelectedCategory));
    }, [adminSelectedCategory, products]);
    
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
        if (unit === 'kg') {
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
            setActiveTab('pricelist'); // Switch tab to view the new product
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Ошибка при добавлении товара. Возможно, размер изображений слишком велик.");
        } finally {
            setIsSubmitting(false);
        }
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
        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 30 }, { wch: 15 }, { wch: 60 }
        ];
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

                rawJson.forEach((row: any) => {
                   try {
                        const name = row['Название']?.toString().trim();
                        if (!name) throw new Error('Отсутствует название');
                        
                        const pricePerUnit = parseFloat(row['Цена за ед.']);
                        if (isNaN(pricePerUnit)) throw new Error('Неверная цена');

                        const unitValue = parseFloat(row['Значение ед.']);
                        if (isNaN(unitValue)) throw new Error('Неверное значение ед.');

                        const unit = row['Ед. изм. (kg, g, pcs, l)']?.toString().trim() as ProductUnit;
                        if (!unitOptions.includes(unit)) throw new Error('Неверная ед. изм.');
                        
                        const packaging = row['Вид (головка, упаковка, штука, банка, ящик)']?.toString().trim() as ProductPackaging;
                        if (!packagingOptions.includes(packaging)) throw new Error('Неверный вид');

                        const allowedPortions: ProductPortion[] = ['whole'];
                        if (unit === 'kg') {
                            if (row['Продавать половинками (да/нет)']?.toString().toLowerCase() === 'да') {
                                allowedPortions.push('half');
                            }
                            if (row['Продавать четвертинками (да/нет)']?.toString().toLowerCase() === 'да') {
                                allowedPortions.push('quarter');
                            }
                        }
                        
                        const product: Omit<Product, 'id' | 'status'> = {
                            name,
                            description: row['Описание']?.toString().trim() || '',
                            pricePerUnit,
                            unitValue,
                            unit,
                            packaging,
                            categories: row['Категории (через ;)']?.toString().split(';').map((c: string) => c.trim()).filter(Boolean) || [],
                            imageUrls: row['URL изображений (через ;)']?.toString().split(';').map((url: string) => url.trim()).filter(Boolean) || [],
                            allowedPortions,
                            priceOverridesPerUnit: {},
                            usp1UseGlobalMarkup: true,
                        };
                        productsToAdd.push(product);

                   } catch(err: any) {
                       console.warn(`Пропуск строки из-за ошибки: ${err.message}`, row);
                       errors++;
                   }
                });

                if (productsToAdd.length > 0) {
                    onBulkAddProducts(productsToAdd);
                }
                
                setUploadMessage(`Обработка завершена. Добавлено товаров: ${productsToAdd.length}. Строк с ошибками: ${errors}.`);

            } catch (error) {
                console.error("Ошибка при обработке Excel файла:", error);
                setUploadMessage('Ошибка при чтении файла. Убедитесь, что это корректный .xlsx файл.');
            } finally {
                setIsUploading(false);
                 // Reset file input value to allow re-uploading the same file
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

    const TabButton: React.FC<{tabId: 'pricelist' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist' | 'visibility' | 'sync', children: React.ReactNode}> = ({tabId, children}) => {
        const isActive = activeTab === tabId;
        return (
            <button
                onClick={() => setActiveTab(tabId)}
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


    return (
        <div className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="mb-4">
                <button 
                    onClick={() => setIsIdInfoVisible(!isIdInfoVisible)}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Показать информацию об ID"
                >
                    <span>ID магазина: {shopId}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${isIdInfoVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isIdInfoVisible && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                 <div className="flex items-center space-x-3 overflow-x-auto pb-4 -mx-6 px-6" role="tablist" aria-orientation="horizontal">
                    <TabButton tabId="pricelist">Каталог</TabButton>
                    <TabButton tabId="table">Прайс лист таблицей</TabButton>
                    <TabButton tabId="wholesale_pricelist">Оптовый прайс</TabButton>
                    <TabButton tabId="visibility">Настройка видимости</TabButton>
                    <TabButton tabId="orders">Заказы</TabButton>
                    <TabButton tabId="customers">Покупатели</TabButton>
                    <TabButton tabId="add">Добавить товар</TabButton>
                    <TabButton tabId="import">Импорт Excel</TabButton>
                    <TabButton tabId="importSheets">Импорт Sheets</TabButton>
                    <TabButton tabId="sync">Экспорт/Импорт</TabButton>
                </div>
            </div>

            {activeTab === 'pricelist' && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Управление товарами</h3>
                        <button onClick={() => setIsHelpVisible(!isHelpVisible)} className="text-gray-400 hover:text-gray-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

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
                     />
                </div>
            )}
            
            {activeTab === 'table' && (
                <div className="mt-6">
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
                                Вносите изменения прямо в таблицу. Кнопка "Сохранить" для каждой строки становится активной после внесения изменений.
                             </p>
                        </div>
                     </div>

                    <div className="mb-4">
                        <button
                            onClick={() => setIsTableFilterVisible(!isTableFilterVisible)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            aria-expanded={isTableFilterVisible}
                            aria-controls="table-filters-panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            <span>Фильтры и поиск</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform ${isTableFilterVisible ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
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
                    />
                </div>
            )}

            {activeTab === 'wholesale_pricelist' && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Оптовый прайс-лист</h3>
                     <p className="text-sm text-gray-600 pb-4">
                        Вносите оптовые цены для разных типов покупателей. Кнопка "Сохранить" для каждой строки становится активной после внесения изменений.
                     </p>
                    <WholesaleProductTable
                        products={products}
                        onUpdatePriceTiers={onUpdateProductPriceTiers}
                        onUpdateProductCostPrice={onUpdateProductCostPrice}
                        onBulkUpdateWholesalePrices={onBulkUpdateWholesalePrices}
                        roles={roles}
                    />
                </div>
            )}

            {activeTab === 'visibility' && (
                <div className="mt-6">
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
                <div className="mt-6">
                    <AdminOrders
                        orders={orders}
                        users={allUsers}
                        onUpdateStatus={onUpdateOrderStatus}
                    />
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="mt-6">
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
                <div className="divide-y divide-gray-200">
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
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            
                            {unit === 'kg' && (
                                <div>
                                    <span className="block text-sm font-medium text-gray-700">Опции продажи (для кг)</span>
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
                 <div className="mt-6">
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
                    {uploadMessage && <p className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded-md">{uploadMessage}</p>}
                </div>
            )}

            {activeTab === 'importSheets' && (
                 <div className="mt-6">
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
                <div className="mt-6 max-w-2xl">
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
