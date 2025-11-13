import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { Product, CartItem, Order, OrderItem, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, User, OrderStatus, ProductBadge, CustomerType } from './types';
import CategoryDropdown from './components/CategoryDropdown';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import AccountModal from './components/AccountModal';
import AdminPage from './components/AdminPanel';
import ImageGalleryModal from './components/ImageGalleryModal';
import { AuthContext } from './contexts/AuthContext';

const INITIAL_CATEGORIES = [
  'Твердые',
  'Мягкие',
  'С плесенью',
  'Козьи и овечьи'
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Пармезан', pricePerUnit: 2500, categories: ['Твердые'], imageUrls: ['https://picsum.photos/id/282/400/300', 'https://picsum.photos/id/283/400/300', 'https://picsum.photos/id/284/400/300'], unitValue: 5.3, unit: 'kg', packaging: 'головка', description: 'Итальянский твердый сыр долгого созревания. Обладает ломкой текстурой и пикантным вкусом.', allowedPortions: ['whole', 'half', 'quarter'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 1800, usp1Price: 2600, usp1UseGlobalMarkup: false },
  { id: 2, name: 'Гауда', pricePerUnit: 1800, categories: ['Твердые'], imageUrls: ['https://picsum.photos/id/431/400/300', 'https://picsum.photos/id/432/400/300', 'https://picsum.photos/id/433/400/300'], unitValue: 2.1, unit: 'kg', packaging: 'головка', description: 'Популярный голландский сыр с мягким сливочным вкусом. Идеален для бутербродов и закусок.', allowedPortions: ['whole', 'half'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 1200, usp1UseGlobalMarkup: true },
  { id: 3, name: 'Бри', pricePerUnit: 2200, categories: ['Мягкие'], imageUrls: ['https://picsum.photos/id/435/400/300', 'https://picsum.photos/id/436/400/300', 'https://picsum.photos/id/437/400/300'], unitValue: 1.2, unit: 'kg', packaging: 'головка', description: 'Французский мягкий сыр с корочкой из белой плесени. Имеет нежный грибной аромат.', allowedPortions: ['whole'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 1600, usp1UseGlobalMarkup: true },
  { id: 4, name: 'Камамбер', pricePerUnit: 480, categories: ['Мягкие'], imageUrls: ['https://picsum.photos/id/312/400/300', 'https://picsum.photos/id/313/400/300', 'https://picsum.photos/id/314/400/300'], unitValue: 1, unit: 'pcs', packaging: 'упаковка', description: 'Знаменитый французский сыр с кремовой текстурой и насыщенным вкусом. Часто запекают целиком.', allowedPortions: ['whole'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 350, usp1UseGlobalMarkup: true, badge: 'ХИТ' },
  { id: 5, name: 'Рокфор', pricePerUnit: 3500, categories: ['С плесенью', 'Козьи и овечьи'], imageUrls: ['https://picsum.photos/id/1060/400/300', 'https://picsum.photos/id/1061/400/300'], unitValue: 3.5, unit: 'kg', packaging: 'головка', description: 'Овечий сыр с голубой плесенью из Франции. Отличается острым, соленым вкусом и ярким ароматом.', allowedPortions: ['whole', 'half', 'quarter'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 2800, usp1UseGlobalMarkup: true },
  { id: 6, name: 'Горгонзола', pricePerUnit: 3200, categories: ['С плесенью'], imageUrls: ['https://picsum.photos/id/1080/400/300', 'https://picsum.photos/id/1081/400/300', 'https://picsum.photos/id/1082/400/300'], unitValue: 1.5, unit: 'kg', packaging: 'головка', description: 'Итальянский голубой сыр. Бывает двух видов: сладкий (dolce) и пикантный (piccante).', allowedPortions: ['whole', 'half'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 2500, usp1UseGlobalMarkup: true },
  { id: 7, name: 'Шевр', pricePerUnit: 560, categories: ['Козьи и овечьи'], imageUrls: ['https://picsum.photos/id/203/400/300', 'https://picsum.photos/id/204/400/300'], unitValue: 1, unit: 'pcs', packaging: 'штука', description: 'Французский козий сыр с характерной кислинкой и нежной, творожистой текстурой.', allowedPortions: ['whole'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 400, usp1UseGlobalMarkup: true },
  { id: 8, name: 'Фета', pricePerUnit: 300, categories: ['Козьи и овечьи'], imageUrls: ['https://picsum.photos/id/375/400/300', 'https://picsum.photos/id/376/400/300', 'https://picsum.photos/id/377/400/300'], unitValue: 200, unit: 'g', packaging: 'упаковка', description: 'Греческий рассольный сыр из овечьего молока. Незаменимый ингредиент греческого салата.', allowedPortions: ['whole'], status: ProductStatus.Available, priceOverridesPerUnit: {}, costPrice: 200, usp1UseGlobalMarkup: true },
];


const TruckIcon: React.FC<{ className?: string; itemCount?: number }> = ({ className, itemCount = 0 }) => {
    const MAX_BOXES = 15; // 5 columns, 3 rows
    const colors = ['#FBBF24', '#34D399', '#60A5FA', '#F87171', '#A78BFA'];

    const renderBoxes = () => {
        const boxes = [];
        const numBoxes = Math.min(itemCount, MAX_BOXES);
        
        const bedX = 1.5;
        const bedWidth = 11;
        const bedHeight = 4;
        const bedBottomY = 16.5;

        const boxSize = 2;
        const boxSpacing = 0.2;
        const cols = 5;
        
        for (let i = 0; i < numBoxes; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const x = bedX + col * (boxSize + boxSpacing);
            const y = bedBottomY - (row + 1) * (boxSize + boxSpacing) + boxSpacing;

            boxes.push(
                <rect 
                    key={i} 
                    x={x} 
                    y={y} 
                    width={boxSize} 
                    height={boxSize} 
                    fill={colors[i % colors.length]}
                    rx="0.2"
                />
            );
        }
        return boxes;
    };

    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            {/* Render boxes inside the cargo area */}
            {renderBoxes()}
            
            {/* Truck outline */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 17h2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 17h5.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 17h2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12h12v5H1z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 12l3-4h5v9h-8v-5z" />
            <circle cx="5" cy="19" r="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="19" r="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};


const UserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const AdminIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ImageOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
  </svg>
);

interface FlyingItemProps {
  imageUrl: string;
  startRect: DOMRect;
  endRect?: DOMRect;
  onAnimationEnd: () => void;
}

const FlyingItem: React.FC<FlyingItemProps> = ({ imageUrl, startRect, endRect, onAnimationEnd }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '0.375rem',
        zIndex: 1000,
        opacity: 1,
        transition: 'transform 0.5s cubic-bezier(0.5, -0.5, 1, 1), opacity 0.5s ease-out',
    });

    useEffect(() => {
        if (!endRect) return;

        const x = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
        const y = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
        
        requestAnimationFrame(() => {
            setStyle(s => ({
                ...s,
                transform: `translate(${x}px, ${y}px) scale(0.1)`,
                opacity: 0,
            }));
        });
        
        const timer = setTimeout(onAnimationEnd, 500); // Animation duration
        return () => clearTimeout(timer);
    }, [endRect, onAnimationEnd, startRect]);

    return <div style={style} />;
};

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};


const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        let parsed = JSON.parse(savedProducts);
        // Migration for users with old data structures
        if (parsed.length > 0 && (parsed[0].hasOwnProperty('isVisible') || parsed[0].hasOwnProperty('pricePerKg'))) {
            return parsed.map((p: any) => {
                const { isPromotion, ...rest } = p;
                return {
                    id: p.id,
                    name: p.name,
                    pricePerUnit: p.pricePerUnit || p.pricePerKg || 0,
                    categories: p.categories || (p.category ? [p.category] : []),
                    imageUrls: p.imageUrls || [],
                    unitValue: p.unitValue || p.weight || 1,
                    unit: p.unit || 'kg',
                    packaging: p.packaging || 'головка',
                    description: p.description || '',
                    allowedPortions: p.allowedPortions || ['whole'],
                    status: p.hasOwnProperty('isVisible') ? (p.isVisible ? ProductStatus.Available : ProductStatus.Hidden) : (p.status || ProductStatus.Available),
                    priceOverridesPerUnit: p.priceOverridesPerUnit || p.priceOverridesPerKg || p.portionPrices || {},
                    costPrice: p.costPrice,
                    usp1Price: p.usp1Price,
                    usp1UseGlobalMarkup: p.usp1UseGlobalMarkup !== false,
                    badge: p.badge || (isPromotion ? 'ХИТ' : undefined),
                    priceTiers: p.priceTiers || {},
                };
            });
        }
         // ensure new structure exists on clean data
        return parsed.map((p: any) => {
          const { isPromotion, ...rest } = p;
          return {
            ...rest, 
            badge: p.badge || (isPromotion ? 'ХИТ' : undefined),
            priceOverridesPerUnit: p.priceOverridesPerUnit || {},
            usp1UseGlobalMarkup: p.usp1UseGlobalMarkup !== false,
            priceTiers: p.priceTiers || {},
          }
        });
    }
    return INITIAL_PRODUCTS.map(p => ({...p, priceTiers: p.priceTiers || {} }));
  });
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [view, setView] = useState<'shop' | 'admin'>('shop');
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [galleryModalInfo, setGalleryModalInfo] = useState<{images: string[], index: number} | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(() => {
      const uniqueCategories = new Set(INITIAL_CATEGORIES);
      products.forEach(p => p.categories.forEach(c => uniqueCategories.add(c)));
      return Array.from(uniqueCategories).sort();
  });
  const [flyingItems, setFlyingItems] = useState<{ id: number; imageUrl: string; startRect: DOMRect }[]>([]);
  const [showProductImages, setShowProductImages] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, logout, updateUserDetails, changePassword } = useContext(AuthContext);
  
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    // If user is not an admin, force shop view
    if (view === 'admin' && !currentUser?.isAdmin) {
      setView('shop');
    }
  }, [view, currentUser]);
  
  useEffect(() => {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      const parsedOrders: Order[] = JSON.parse(savedOrders);
      // Add default status to old orders for migration
      const ordersWithStatus = parsedOrders.map(o => ({...o, status: o.status || OrderStatus.New }));
      setOrders(ordersWithStatus);
    }
    
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        let users: User[] = JSON.parse(savedUsers);
        // Migration for customerType
        users = users.map(u => ({ ...u, customerType: u.customerType || 'Розничный' }));
        setAllUsers(users);
    }
  }, []);
  
  useEffect(() => {
    if (isSearchVisible) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isSearchVisible]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(order => order.userId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, currentUser]);

  const totalItemsInCart = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalCartSum = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const totalCartWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => {
        let weightInKg = 0;
        if (item.unit === 'kg') weightInKg = item.unitValue;
        if (item.unit === 'g') weightInKg = item.unitValue / 1000;
        return sum + (weightInKg * item.quantity);
    }, 0);
  }, [cartItems]);

  const filteredProducts = useMemo(() => {
    const visibleProducts = products.filter(p => p.status !== ProductStatus.Hidden);

    let filtered = visibleProducts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categories.includes(selectedCategory));
    }
    
    if (searchTerm.trim() !== '') {
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(lowercasedSearchTerm) || 
            p.description.toLowerCase().includes(lowercasedSearchTerm)
        );
    }
    
    return filtered;
  }, [selectedCategory, products, searchTerm]);
  
  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  const handleAddToCart = (product: Product, portion: ProductPortion, startRect?: DOMRect) => {
    if (startRect) {
        setFlyingItems(prev => [...prev, {
            id: Date.now(),
            imageUrl: product.imageUrls[0],
            startRect,
        }]);
    }
    const cartItemId = `${product.id}-${portion}`;

    const getPriceInfoForPortion = (p: Product, por: ProductPortion) => {
      const basePricePerUnit = p.pricePerUnit || 0;
      const baseUnitValue = p.unitValue || 0;
      let effectivePricePerUnit = basePricePerUnit;
      let portionValue = 0;

      switch (por) {
          case 'whole':
              effectivePricePerUnit = basePricePerUnit;
              portionValue = baseUnitValue;
              break;
          case 'half':
              effectivePricePerUnit = p.priceOverridesPerUnit?.half ?? basePricePerUnit;
              portionValue = baseUnitValue / 2;
              break;
          case 'quarter':
              effectivePricePerUnit = p.priceOverridesPerUnit?.quarter ?? basePricePerUnit;
              portionValue = baseUnitValue / 4;
              break;
      }
      return { price: effectivePricePerUnit * portionValue, unitValue: portionValue };
    };

    setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.cartId === cartItemId);

        if (existingItem) {
            return prevItems.map(item =>
                item.cartId === cartItemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            const { price, unitValue } = getPriceInfoForPortion(product, portion);
            const newCartItem: CartItem = {
                cartId: cartItemId,
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrls[0],
                unit: product.unit,
                portion: portion,
                quantity: 1,
                price: price,
                unitValue: unitValue,
            };
            return [...prevItems, newCartItem];
        }
    });
  };

  const handleUpdateCartItemQuantity = (cartId: string, newQuantity: number) => {
    setCartItems(prevItems => {
        if (newQuantity <= 0) {
            return prevItems.filter(item => item.cartId !== cartId);
        }
        return prevItems.map(item =>
            item.cartId === cartId
                ? { ...item, quantity: newQuantity }
                : item
        );
    });
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handlePlaceOrder = (): 'placed' | undefined => {
    if (!currentUser) {
        setIsCartOpen(false);
        handleOpenAuthModal('login');
        return;
    }
    
    const getPortionName = (portion: ProductPortion) => {
        if (portion === 'half') return ' (Половинка)';
        if (portion === 'quarter') return ' (Четвертинка)';
        return '';
    };

    const newOrder: Order = {
        id: new Date().toISOString(),
        userId: currentUser.id,
        date: new Date().toISOString(),
        status: OrderStatus.New,
        items: cartItems.map(item => ({
            productId: item.id,
            name: `${item.name}${getPortionName(item.portion)}`,
            quantity: item.unitValue * item.quantity,
            price: item.price * item.quantity,
        })),
        totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        totalWeight: cartItems.reduce((sum, item) => {
            let weightInKg = 0;
            if (item.unit === 'kg') weightInKg = item.unitValue;
            if (item.unit === 'g') weightInKg = item.unitValue / 1000;
            return sum + (weightInKg * item.quantity);
        }, 0),
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    return 'placed';
  };
  
    const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        const updatedOrders = orders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
    };

  const updateGlobalCategories = (newCats: string[]) => {
    setAllCategories(prevGlobalCats => {
        const updatedCategorySet = new Set(prevGlobalCats);
        newCats.forEach(c => {
            if (c && c.trim()) {
                updatedCategorySet.add(c.trim());
            }
        });
        return Array.from(updatedCategorySet).sort();
    });
  };

  const handleAddNewProduct = (newProductData: Omit<Product, 'id' | 'status'>) => {
    setProducts(prevProducts => {
        const newProduct: Product = {
            ...newProductData,
            id: Date.now(), // Simple ID generation
            status: ProductStatus.Available,
        };
        return [...prevProducts, newProduct];
    });
    updateGlobalCategories(newProductData.categories);
  };
  
  const handleBulkAddProducts = (newProductsData: Omit<Product, 'id' | 'status'>[]) => {
    const newProducts: Product[] = newProductsData.map((p, i) => ({
        ...p,
        id: Date.now() + i, // Simple unique ID generation for bulk import
        status: ProductStatus.Available,
    }));

    setProducts(prevProducts => [...prevProducts, ...newProducts]);

    const allNewCategories = newProductsData.flatMap(p => p.categories);
    updateGlobalCategories(allNewCategories);
  };

  const handleDeleteProduct = (productId: number) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return; 

    const isConfirmed = window.confirm(`Точно хотите удалить товар "${productToDelete.name}"? Это действие необратимо.`);
    if (isConfirmed) {
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    }
  };

  const handleCycleProductStatus = (productId: number) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          let newStatus: ProductStatus;
          switch (p.status) {
            case ProductStatus.Available:
              newStatus = ProductStatus.OutOfStock;
              break;
            case ProductStatus.OutOfStock:
              newStatus = ProductStatus.Hidden;
              break;
            case ProductStatus.Hidden:
              newStatus = ProductStatus.Available;
              break;
            default:
              newStatus = p.status;
          }
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const handleUpdateProductPortions = (productId: number, portion: ProductPortion) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          // 'whole' is always required and cannot be toggled off.
          if (portion === 'whole') return p; 

          const newPortions = p.allowedPortions.includes(portion)
            ? p.allowedPortions.filter(item => item !== portion)
            : [...p.allowedPortions, portion];
          
          return { ...p, allowedPortions: newPortions };
        }
        return p;
      })
    );
  };
  
  const handleUpdateProductPrices = (productId: number, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => {
    setProducts(prevProducts =>
        prevProducts.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    pricePerUnit: newPrices.pricePerUnit,
                    priceOverridesPerUnit: newPrices.priceOverridesPerUnit,
                };
            }
            return p;
        })
    );
  };

  const handleUpdateProductPriceTiers = (productId: number, newPriceTiers: Product['priceTiers']) => {
    setProducts(prevProducts =>
        prevProducts.map(p => {
            if (p.id === productId) {
                return { ...p, priceTiers: newPriceTiers };
            }
            return p;
        })
    );
  };

  const handleUpdateProductCostPrice = (productId: number, newCostPrice?: number) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, costPrice: newCostPrice } : p
        )
    );
  };

  const handleUpdateProductUspPrices = (productId: number, newUspPrices: { costPrice?: number; usp1Price?: number; }) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, ...newUspPrices } : p
        )
    );
  };
  
  const handleBulkUpdateUspPrices = (updates: { productId: number; usp1Price?: number; }[]) => {
    const updateMap = new Map(updates.map(u => [u.productId, u]));
    setProducts(prevProducts =>
        prevProducts.map(p => {
            const update = updateMap.get(p.id);
            if (update) {
                return { ...p, ...update };
            }
            return p;
        })
    );
  };

  const handleBulkUpdateWholesalePrices = (updates: { productId: number; newPrice: number; }[]) => {
    const updateMap = new Map(updates.map(u => [u.productId, u.newPrice]));
    setProducts(prevProducts =>
        prevProducts.map(p => {
            if (updateMap.has(p.id)) {
                const newPrice = updateMap.get(p.id)!;
                const newPriceTiers = { ...(p.priceTiers || {}), 'оптовый': newPrice };
                return { ...p, priceTiers: newPriceTiers };
            }
            return p;
        })
    );
  };

  const handleUpdateProductUspMarkupFlags = (productId: number, flags: { usp1UseGlobalMarkup?: boolean; }) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, ...flags } : p
        )
    );
  };

  const handleUpdateProductUnitValue = (productId: number, newUnitValue: number) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, unitValue: newUnitValue } : p
        )
    );
  };

  const handleUpdateProductDetails = (productId: number, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging }) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, ...newDetails } : p
      )
    );
  };

  const handleUpdateProductImages = (productId: number, newImageUrls: string[]) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, imageUrls: newImageUrls } : p
      )
    );
  };
  
  const handleUpdateProductCategories = (productId: number, newCategories: string[]) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, categories: newCategories } : p
      )
    );
    updateGlobalCategories(newCategories);
  };

  const badgeCycle: (ProductBadge | undefined)[] = [undefined, 'ХИТ', 'акция', 'мало', 'много'];

  const handleCycleProductBadge = (productId: number) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          const currentBadgeIndex = badgeCycle.findIndex(b => b === p.badge);
          const nextBadgeIndex = (currentBadgeIndex + 1) % badgeCycle.length;
          return { ...p, badge: badgeCycle[nextBadgeIndex] };
        }
        return p;
      })
    );
  };

  const handleOpenGalleryModal = (images: string[], index: number) => {
    setGalleryModalInfo({ images, index });
  };

  const handleCloseGalleryModal = () => {
      setGalleryModalInfo(null);
  };
  
  const handleAnimationEnd = (id: number) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleAddUser = (email: string, password: string): 'success' | 'exists' => {
    if (allUsers.some(u => u.email === email)) {
      return 'exists';
    }
    const newUser: User = {
      id: Date.now(),
      email,
      passwordHash: simpleHash(password),
      isAdmin: false,
      customerType: 'Розничный',
    };
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return 'success';
  };

  const handleDeleteUser = (userId: number) => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.isAdmin) {
        alert('Нельзя удалить администратора.');
        return;
    }

    const isConfirmed = window.confirm(`Точно хотите удалить пользователя "${userToDelete.email}"? Это действие необратимо.`);
    if (isConfirmed) {
        const updatedUsers = allUsers.filter(u => u.id !== userId);
        setAllUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  const handleUpdateUserByAdmin = (userId: number, updates: Partial<User> & { newPassword?: string }) => {
    const { newPassword, ...otherUpdates } = updates;
    
    setAllUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user, ...otherUpdates };
          if (newPassword) {
            updatedUser.passwordHash = simpleHash(newPassword);
          }
          return updatedUser;
        }
        return user;
      });
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  };

  const handleImportData = (data: { products: Product[]; users: User[]; orders: Order[] }) => {
    try {
        if (!Array.isArray(data.products) || !Array.isArray(data.users) || !Array.isArray(data.orders)) {
            throw new Error('Неверный формат данных в файле.');
        }

        // Apply same migration logic as on initial load to ensure compatibility
        const migratedUsers = data.users.map(u => ({ ...u, customerType: u.customerType || 'Розничный' }));
        const migratedOrders = data.orders.map(o => ({ ...o, status: o.status || OrderStatus.New }));
        const migratedProducts = data.products.map((p: any) => {
            const { isPromotion, ...rest } = p;
            return {
                ...rest,
                badge: p.badge || (isPromotion ? 'ХИТ' : undefined),
                priceOverridesPerUnit: p.priceOverridesPerUnit || {},
                usp1UseGlobalMarkup: p.usp1UseGlobalMarkup !== false,
                priceTiers: p.priceTiers || {},
            };
        });

        // Directly update localStorage
        localStorage.setItem('products', JSON.stringify(migratedProducts));
        localStorage.setItem('users', JSON.stringify(migratedUsers));
        localStorage.setItem('orders', JSON.stringify(migratedOrders));
        
        alert('Данные успешно импортированы! Страница будет перезагружена для применения всех изменений.');
        
        // Reload the page to re-initialize all state from the new localStorage data
        window.location.reload();

    } catch (error: any) {
        alert(`Ошибка импорта: ${error.message}`);
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button
                    ref={cartIconRef}
                    onClick={() => setIsCartOpen(true)}
                    className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
                    aria-label={`Открыть корзину, ${totalItemsInCart} шт.`}
                >
                    <TruckIcon className="w-10 h-10" itemCount={cartItems.length}/>
                    {totalItemsInCart > 0 && (
                        <span className="absolute -top-2 -right-3 flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                            {totalItemsInCart}
                        </span>
                    )}
                </button>
                {cartItems.length > 0 && (
                     <div className="space-y-0.5 text-xs sm:text-sm text-gray-600 border-l border-gray-200 pl-2 sm:pl-4 min-w-[120px]">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Позиций:</span>
                            <span className="font-semibold">{cartItems.length}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Вес:</span>
                            <span className="font-semibold">~{totalCartWeight.toFixed(2)} кг</span>
                        </div>
                         <div className="flex justify-between gap-2">
                             <span className="text-gray-500">Сумма:</span>
                             <span className="font-semibold">{totalCartSum.toLocaleString('ru-RU')} ₽</span>
                         </div>
                    </div>
                )}
            </div>
            
          <div className="flex items-center gap-4">
             {currentUser ? (
                 <div className="flex items-center gap-4">
                    {currentUser.isAdmin && (
                        <button onClick={() => setView(view === 'admin' ? 'shop' : 'admin')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600" aria-label="Админ панель">
                            <AdminIcon className="w-6 h-6"/>
                            <span className="hidden sm:inline">{view === 'admin' ? 'В магазин' : 'Админ панель'}</span>
                        </button>
                    )}
                     <button onClick={() => setAccountModalOpen(true)} className="text-gray-600 hover:text-indigo-600 focus:outline-none" aria-label="Личный кабинет">
                         <UserIcon className="w-8 h-8"/>
                     </button>
                     <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-indigo-600">Выйти</button>
                 </div>
             ) : (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenAuthModal('login')} className="text-sm font-medium text-gray-600 hover:text-indigo-600">Войти</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => handleOpenAuthModal('register')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Регистрация</button>
                </div>
             )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
         {view === 'admin' && currentUser?.isAdmin ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Панель управления</h1>
              <AdminPage 
                products={products}
                allCategories={allCategories}
                orders={orders}
                allUsers={allUsers}
                onAddProduct={handleAddNewProduct}
                onBulkAddProducts={handleBulkAddProducts}
                onDeleteProduct={handleDeleteProduct}
                onCycleStatus={handleCycleProductStatus}
                onUpdatePortions={handleUpdateProductPortions}
                onUpdatePrices={handleUpdateProductPrices}
                onUpdateProductPriceTiers={handleUpdateProductPriceTiers}
                onUpdateProductCostPrice={handleUpdateProductCostPrice}
                onUpdateUspPrices={handleUpdateProductUspPrices}
                onBulkUpdateUspPrices={handleBulkUpdateUspPrices}
                onBulkUpdateWholesalePrices={handleBulkUpdateWholesalePrices}
                onUpdateUspMarkupFlags={handleUpdateProductUspMarkupFlags}
                onUpdateUnitValue={handleUpdateProductUnitValue}
                onUpdateDetails={handleUpdateProductDetails}
                onUpdateImages={handleUpdateProductImages}
                onUpdateCategories={handleUpdateProductCategories}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUserByAdmin={handleUpdateUserByAdmin}
                onCycleBadge={handleCycleProductBadge}
                onImportData={handleImportData}
              />
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-row items-center gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <CategoryDropdown
                            categories={allCategories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            displayAsIconButton={true}
                        />
                        <button
                            onClick={() => setShowProductImages(s => !s)}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0"
                            aria-label={showProductImages ? "Скрыть изображения товаров" : "Показать изображения товаров"}
                            title={showProductImages ? "Скрыть изображения" : "Показать изображения"}
                        >
                            {showProductImages ? <ImageOffIcon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    {isSearchVisible ? (
                        <div className="relative w-full flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Поиск по названию или описанию..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onBlur={() => setIsSearchVisible(false)}
                                className="block w-full bg-gray-100 border border-transparent rounded-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                aria-label="Поиск по товарам"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-end w-full flex-1">
                            <button
                                onClick={() => setIsSearchVisible(true)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                aria-label="Открыть поиск"
                                title="Поиск"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
              </div>
              <ProductList 
                products={filteredProducts} 
                onAddToCart={handleAddToCart}
                onOpenGalleryModal={handleOpenGalleryModal}
                showProductImages={showProductImages}
              />
            </>
          )}
      </main>

      {/* Cart Overlay */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} aria-hidden="true"></div>
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <Cart
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onUpdateItemQuantity={handleUpdateCartItemQuantity}
            onClearCart={handleClearCart}
            onClose={() => setIsCartOpen(false)}
            onPlaceOrder={handlePlaceOrder}
          />
      </div>

      {isAuthModalOpen && (
          <AuthModal
              mode={authMode}
              onClose={() => setAuthModalOpen(false)}
              onSwitchMode={(newMode) => setAuthMode(newMode)}
          />
      )}

      {isAccountModalOpen && currentUser && (
          <AccountModal
            user={currentUser}
            orders={userOrders}
            onClose={() => setAccountModalOpen(false)}
            onUpdateDetails={updateUserDetails}
            onChangePassword={changePassword}
          />
      )}

      {galleryModalInfo && (
          <ImageGalleryModal 
              imageUrls={galleryModalInfo.images}
              initialIndex={galleryModalInfo.index}
              onClose={handleCloseGalleryModal}
          />
      )}
      
      {flyingItems.map(item => (
          <FlyingItem
              key={item.id}
              imageUrl={item.imageUrl}
              startRect={item.startRect}
              endRect={cartIconRef.current?.getBoundingClientRect()}
              onAnimationEnd={() => handleAnimationEnd(item.id)}
          />
      ))}
    </div>
  );
};

export default App;