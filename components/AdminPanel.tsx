import React, { useState, useMemo } from 'react';
import { Product, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, Order, User, OrderStatus } from '../types';
import ProductList from './ProductList';
import CategoryDropdown from './CategoryDropdown';
import ProductTable from './ProductTable';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import WholesaleProductTable from './WholesaleProductTable';


// Make TypeScript aware of the XLSX library loaded from the CDN
declare var XLSX: any;

interface AdminPageProps {
    products: Product[];
    allCategories: string[];
    orders: Order[];
    allUsers: User[];
    onAddProduct: (product: Omit<Product, 'id' | 'status'>) => void;
    onBulkAddProducts: (products: Omit<Product, 'id' | 'status'>[]) => void;
    onDeleteProduct: (productId: number) => void;
    onCycleStatus: (productId: number) => void;
    onUpdatePortions: (productId: number, portion: ProductPortion) => void;
    onUpdatePrices: (productId: number, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
    onUpdateProductPriceTiers: (productId: number, priceTiers: Product['priceTiers']) => void;
    onUpdateProductCostPrice: (productId: number, costPrice?: number) => void;
    onUpdateUspPrices: (productId: number, newUspPrices: { costPrice?: number; usp1Price?: number; }) => void;
    onBulkUpdateUspPrices: (updates: { productId: number; usp1Price?: number; }[]) => void;
    onBulkUpdateWholesalePrices: (updates: { productId: number; newPrice: number; }[]) => void;
    onUpdateUspMarkupFlags: (productId: number, flags: { usp1UseGlobalMarkup?: boolean; }) => void;
    onUpdateUnitValue: (productId: number, newUnitValue: number) => void;
    onUpdateDetails: (productId: number, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
    onUpdateImages: (productId: number, newImageUrls: string[]) => void;
    onUpdateCategories: (productId: number, newCategories: string[]) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
    onAddUser: (email: string, password: string) => 'success' | 'exists';
    onDeleteUser: (userId: number) => void;
    onUpdateUserByAdmin: (userId: number, updates: Partial<User> & { newPassword?: string }) => void;
    onCycleBadge: (productId: number) => void;
}

const unitDisplayMap: Record<ProductUnit, string> = { kg: 'кг', g: 'гр', pcs: 'шт', l: 'л' };
const packagingDisplayMap: Record<ProductPackaging, string> = { головка: 'головка', упаковка: 'упаковка', штука: 'штука', банка: 'банка', ящик: 'ящик' };
const unitOptions: ProductUnit[] = ['kg', 'g', 'pcs', 'l'];
const packagingOptions: ProductPackaging[] = ['головка', 'упаковка', 'штука', 'банка', 'ящик'];

const AdminPage: React.FC<AdminPageProps> = ({ products, allCategories, orders, allUsers, onAddProduct, onBulkAddProducts, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateProductPriceTiers, onUpdateProductCostPrice, onUpdateUspPrices, onBulkUpdateUspPrices, onBulkUpdateWholesalePrices, onUpdateUspMarkupFlags, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onUpdateCategories, onUpdateOrderStatus, onAddUser, onDeleteUser, onUpdateUserByAdmin, onCycleBadge }) => {
    const [activeTab, setActiveTab] = useState<'pricelist' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist'>('pricelist');
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [unitValue, setUnitValue] =useState('');
    const [unit, setUnit] = useState<ProductUnit>('kg');
    const [packaging, setPackaging] = useState<ProductPackaging>('головка');
    const [imageUrls, setImageUrls] = useState('');
    const [allowHalf, setAllowHalf] = useState(false);
    const [allowQuarter, setAllowQuarter] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [newCategory, setNewCategory] = useState('');

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

    // New states for table filtering
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [tableFilterCategory, setTableFilterCategory] = useState<string | 'all'>('all');
    const [tableFilterStatus, setTableFilterStatus] = useState<ProductStatus | 'all'>('all');
    const [isTableFilterVisible, setIsTableFilterVisible] = useState(false);
    
    // State for USP markups
    const [uspMarkups, setUspMarkups] = useState({ usp1: '' });

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
        const updates: { productId: number; usp1Price?: number; }[] = [];
        const markup1 = parseFloat(uspMarkups.usp1);

        filteredTableProducts.forEach(product => {
            if (product.costPrice && product.costPrice > 0) {
                const newPrices: { productId: number; usp1Price?: number; } = { productId: product.id };
                
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


    const resetForm = () => {
        setName('');
        setDescription('');
        setPricePerUnit('');
        setUnitValue('');
        setUnit('kg');
        setPackaging('головка');
        setImageUrls('');
        setAllowHalf(false);
        setAllowQuarter(false);
        setSelectedCategories(new Set());
        setNewCategory('');
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
            imageUrls: imageUrls.split(',').map(url => url.trim()).filter(url => url),
            allowedPortions,
            priceOverridesPerUnit: {}, // Initially no overrides
            usp1UseGlobalMarkup: true,
        };

        onAddProduct(newProduct);
        alert('Товар успешно добавлен!');
        resetForm();
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
                // FIX: Removed the <any> generic type argument from sheet_to_json.
                // The XLSX variable is declared as `any`, so its methods are untyped
                // and cannot be called with type arguments.
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

    const TabButton: React.FC<{tabId: 'pricelist' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist', children: React.ReactNode}> = ({tabId, children}) => {
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


    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="border-b">
                 <div className="flex items-center space-x-3 overflow-x-auto pb-4 -mx-6 px-6" role="tablist" aria-orientation="horizontal">
                    <TabButton tabId="pricelist">Мой прайс</TabButton>
                    <TabButton tabId="table">Прайс лист таблицей</TabButton>
                    <TabButton tabId="wholesale_pricelist">Оптовый прайс</TabButton>
                    <TabButton tabId="orders">Заказы</TabButton>
                    <TabButton tabId="customers">Покупатели</TabButton>
                    <TabButton tabId="add">Добавить товар</TabButton>
                    <TabButton tabId="import">Импорт Excel</TabButton>
                    <TabButton tabId="importSheets">Импорт Sheets</TabButton>
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
                        uspMarkups={uspMarkups}
                        setUspMarkups={setUspMarkups}
                        onApplyMarkups={handleApplyMarkups}
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
                        users={allUsers}
                        orders={orders}
                        onAddUser={onAddUser}
                        onDeleteUser={onDeleteUser}
                        onUpdateUserByAdmin={onUpdateUserByAdmin}
                    />
                </div>
            )}

            {activeTab === 'add' && (
                <div className="divide-y divide-gray-200">
                    {/* Add Product Form */}
                    <div className="pb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6">Добавить новый товар вручную</h3>
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
                                <label htmlFor="imageUrls" className="block text-sm font-medium text-gray-700">URL изображений (через запятую)</label>
                                <input type="text" id="imageUrls" value={imageUrls} onChange={e => setImageUrls(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
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
                                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Добавить товар
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
        </div>
    );
};

export default AdminPage;