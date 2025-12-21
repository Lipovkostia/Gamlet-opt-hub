
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { Product, CartItem, Order, ProductPortion, ProductStatus, ProductUnit, ProductPackaging, User, OrderStatus, ProductBadge, CustomerType, ALL_CUSTOMER_TYPES, Badge } from './types';
import CategoryDropdown from './components/CategoryDropdown';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import AccountModal from './components/AccountModal';
import AdminPage from './components/AdminPanel';
import ImageGalleryModal from './components/ImageGalleryModal';
import { AuthContext } from './contexts/AuthContext';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from './lib/firebase';

const INITIAL_CATEGORIES = [
  'Твердые',
  'Мягкие',
  'С плесенью',
  'Козьи и овечьи'
];

// Icons
const TruckIcon: React.FC<{ className?: string; itemCount?: number }> = ({ className, itemCount = 0 }) => {
    const MAX_BOXES = 15;
    const colors = ['#FBBF24', '#34D399', '#60A5FA', '#F87171', '#A78BFA'];
    const renderBoxes = () => {
        const boxes = [];
        const numBoxes = Math.min(itemCount, MAX_BOXES);
        const bedX = 1.5;
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
                <rect key={i} x={x} y={y} width={boxSize} height={boxSize} fill={colors[i % colors.length]} rx="0.2"/>
            );
        }
        return boxes;
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            {renderBoxes()}
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

const OrdersIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
        const timer = setTimeout(onAnimationEnd, 500); 
        return () => clearTimeout(timer);
    }, [endRect, onAnimationEnd, startRect]);

    return <div style={style} />;
};

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return hash.toString();
};

// Define Admin Tab type here to share/use in state
type AdminTabType = 'pricelist' | 'products_master' | 'add' | 'table' | 'orders' | 'import' | 'customers' | 'importSheets' | 'wholesale_pricelist' | 'visibility' | 'badges' | 'sync' | 'moysklad';

interface AppProps {
    shopId: string;
    shopName: string;
}

const App: React.FC<AppProps> = ({ shopId, shopName }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Registration & Auth State
  const [registrationType, setRegistrationType] = useState<CustomerType | null>(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('registerType') as CustomerType | null;
  });
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('registerType') ? 'register' : 'login';
  });

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [view, setView] = useState<'shop' | 'admin'>('shop');
  
  // Admin Panel Tab State (Lifted Up)
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTabType>('pricelist');

  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [galleryModalInfo, setGalleryModalInfo] = useState<{images: string[], index: number} | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [flyingItems, setFlyingItems] = useState<{ id: number; imageUrl: string; startRect: DOMRect }[]>([]);
  const [showProductImages, setShowProductImages] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [customerRoles, setCustomerRoles] = useState<string[]>(ALL_CUSTOMER_TYPES);
  const [badges, setBadges] = useState<Badge[]>([]);
  
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, logout, updateUserDetails, changePassword } = useContext(AuthContext);
  
  // Scoped collections with safety check for null db
  const productsCollection = useMemo(() => db ? collection(db, 'shops', shopId, 'products') : null, [shopId]);
  const ordersCollection = useMemo(() => db ? collection(db, 'shops', shopId, 'orders') : null, [shopId]);
  const usersCollection = useMemo(() => db ? collection(db, 'shops', shopId, 'users') : null, [shopId]);
  const badgesCollection = useMemo(() => db ? collection(db, 'shops', shopId, 'badges') : null, [shopId]);

  // Load Customer Roles and Badges
  useEffect(() => {
      const fetchShopData = async () => {
          if (!db || !badgesCollection) return;
          try {
              const shopRef = doc(db, 'shops', shopId);
              const shopSnap = await getDoc(shopRef);
              if (shopSnap.exists() && shopSnap.data().roles) {
                  setCustomerRoles(shopSnap.data().roles);
              } else {
                  if (currentUser?.isAdmin) {
                      await updateDoc(shopRef, { roles: ALL_CUSTOMER_TYPES });
                  }
                  setCustomerRoles(ALL_CUSTOMER_TYPES);
              }

              // Fetch Badges
              const badgesSnap = await getDocs(badgesCollection);
              const loadedBadges = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
              setBadges(loadedBadges);

          } catch (e) {
              console.error("Error fetching shop data/roles/badges", e);
          }
      };
      fetchShopData();
  }, [shopId, currentUser, badgesCollection]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (db && productsCollection) {
            const querySnapshot = await getDocs(productsCollection);
            const data: Product[] = querySnapshot.docs.map(doc => ({
                ...(doc.data() as Omit<Product, 'id'>),
                id: doc.id
            }));
            setProducts(data);
            
            const uniqueCategories = new Set(INITIAL_CATEGORIES);
            data.forEach(p => {
                if (Array.isArray(p.categories)) {
                    p.categories.forEach(c => uniqueCategories.add(c));
                }
            });
            setAllCategories(Array.from(uniqueCategories).sort());
        } else {
             throw new Error("Firebase not configured");
        }
      } catch (err) {
        console.warn('Using local mock data (Cloud DB unavailable/empty):', err);
        setProducts([]);
        setAllCategories(INITIAL_CATEGORIES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [shopId, productsCollection]);

  useEffect(() => {
      // Load orders and users if admin
      const fetchAdminData = async () => {
          if (currentUser?.isAdmin && db && ordersCollection && usersCollection) {
              try {
                  const ordersSnapshot = await getDocs(ordersCollection);
                  const ordersData = ordersSnapshot.docs.map(d => ({ ...d.data() as Order, id: d.id }));
                  setOrders(ordersData);

                  const usersSnapshot = await getDocs(usersCollection);
                  const usersData = usersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id }));
                  setAllUsers(usersData);
              } catch (e) {
                  console.error("Error fetching admin data", e);
              }
          }
      }
      fetchAdminData();
  }, [currentUser, shopId, ordersCollection, usersCollection]);

  useEffect(() => {
    // If user is not an admin, force shop view
    if (view === 'admin' && !currentUser?.isAdmin) {
      setView('shop');
    }
  }, [view, currentUser]);
  
  useEffect(() => {
    if (isSearchVisible) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isSearchVisible]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(order => order.userId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, currentUser]);

  const newOrdersCount = useMemo(() => {
      if (!currentUser?.isAdmin) return 0;
      return orders.filter(o => o.status === OrderStatus.New).length;
  }, [orders, currentUser]);

  const totalItemsInCart = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalCartSum = useMemo(() => {
    // Consistent rounding with Cart.tsx
    return cartItems.reduce((sum, item) => sum + Math.round(item.price * item.quantity), 0);
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
    const userRole = currentUser?.customerType || 'Розничный';
    // Filter out hidden products
    const visibleProducts = products.filter(p => p.status !== ProductStatus.Hidden);
    
    // Filter by Role Visibility
    // If visibleToRoles is undefined or empty, it's visible to everyone.
    // If it has roles, the user's role must be in it.
    const roleFiltered = visibleProducts.filter(p => {
        if (!p.visibleToRoles || p.visibleToRoles.length === 0) return true;
        return p.visibleToRoles.includes(userRole);
    });

    let filtered = roleFiltered;

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
  }, [selectedCategory, products, searchTerm, currentUser]);
  
  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    // Reset registration type when manually opening
    setRegistrationType(null); 
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
          case 'whole': effectivePricePerUnit = basePricePerUnit; portionValue = baseUnitValue; break;
          case 'half': effectivePricePerUnit = p.priceOverridesPerUnit?.half ?? basePricePerUnit; portionValue = baseUnitValue / 2; break;
          case 'quarter': effectivePricePerUnit = p.priceOverridesPerUnit?.quarter ?? basePricePerUnit; portionValue = baseUnitValue / 4; break;
      }
      return { price: effectivePricePerUnit * portionValue, unitValue: portionValue };
    };

    setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.cartId === cartItemId);
        if (existingItem) {
            return prevItems.map(item => item.cartId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
            const { price, unitValue } = getPriceInfoForPortion(product, portion);
            const newCartItem: CartItem = {
                cartId: cartItemId, id: product.id, name: product.name, imageUrl: product.imageUrls[0],
                unit: product.unit, portion: portion, quantity: 1, price: price, unitValue: unitValue,
            };
            return [...prevItems, newCartItem];
        }
    });
  };

  const handleUpdateCartItemQuantity = (cartId: string, newQuantity: number) => {
    setCartItems(prevItems => {
        if (newQuantity <= 0) return prevItems.filter(item => item.cartId !== cartId);
        return prevItems.map(item => item.cartId === cartId ? { ...item, quantity: newQuantity } : item);
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
        id: new Date().toISOString(), // Fallback ID, real one from firestore
        userId: currentUser.id,
        date: new Date().toISOString(),
        status: OrderStatus.New,
        items: cartItems.map(item => ({
            productId: item.id, 
            name: `${item.name}${getPortionName(item.portion)}`,
            quantity: item.unitValue * item.quantity, 
            price: Math.round(item.price * item.quantity), // Store line item TOTAL price, rounded
        })),
        // Consistent rounding: Sum of rounded line items
        totalAmount: cartItems.reduce((sum, item) => sum + Math.round(item.price * item.quantity), 0),
        totalWeight: cartItems.reduce((sum, item) => {
            let weightInKg = 0;
            if (item.unit === 'kg') weightInKg = item.unitValue;
            if (item.unit === 'g') weightInKg = item.unitValue / 1000;
            return sum + (weightInKg * item.quantity);
        }, 0),
    };

    // Add to Firestore
    if (db && ordersCollection) {
        addDoc(ordersCollection, newOrder).then(docRef => {
            const orderWithId = { ...newOrder, id: docRef.id };
            setOrders(prev => [orderWithId, ...prev]);
        });
    } else {
        const orderWithId = { ...newOrder, id: Date.now().toString() };
         setOrders(prev => [orderWithId, ...prev]);
    }
    
    return 'placed';
  };
  
    const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            if(db) {
                await updateDoc(doc(db, 'shops', shopId, 'orders', orderId), { status: newStatus });
            }
            const updatedOrders = orders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            );
            setOrders(updatedOrders);
        } catch(e) { console.error(e); }
    };

  const updateGlobalCategories = (newCats: string[]) => {
    setAllCategories(prevGlobalCats => {
        const updatedCategorySet = new Set(prevGlobalCats);
        newCats.forEach(c => { if (c && c.trim()) updatedCategorySet.add(c.trim()); });
        return Array.from(updatedCategorySet).sort();
    });
  };

  const handleProductUpdate = async (productId: string, update: Partial<Product> | any) => {
    try {
        if (db) {
            // Clean undefined values from update object before sending to Firestore
            const cleanUpdate: any = {};
            Object.keys(update).forEach(key => {
                if (update[key] !== undefined) {
                    cleanUpdate[key] = update[key];
                }
            });

            const productRef = doc(db, "shops", shopId, "products", productId);
            await updateDoc(productRef, cleanUpdate);
            setProducts(prevProducts => prevProducts.map(p => (p.id === productId ? { ...p, ...cleanUpdate } : p)));
        }
    } catch (err) { console.error("Firestore Update Error:", err); }
  };

  const handleAddNewProduct = async (newProductData: Omit<Product, 'id' | 'status'>) => {
    if (!db || !productsCollection) {
        alert("База данных недоступна");
        return;
    }
    try {
        const productToAdd = { ...newProductData, status: ProductStatus.Available };
        const docRef = await addDoc(productsCollection, productToAdd);
        const newProduct = { ...productToAdd, id: docRef.id };
        setProducts(prevProducts => [...prevProducts, newProduct]);
        updateGlobalCategories(newProductData.categories);
    } catch (err) {
        console.error(err);
        throw err; // Propagate error so UI can react (stop loading, show error)
    }
  };
  
  const handleBulkAddProducts = async (newProductsData: Omit<Product, 'id' | 'status'>[]) => {
    try {
        if (db && productsCollection) {
            const promises = newProductsData.map(p => 
                addDoc(productsCollection, { ...p, status: ProductStatus.Available })
            );
            const docRefs = await Promise.all(promises);
            const newProducts = newProductsData.map((p, i) => ({ 
                ...p, id: docRefs[i].id, status: ProductStatus.Available 
            }));
            
            setProducts(prevProducts => [...prevProducts, ...newProducts]);
            const allNewCategories = newProductsData.flatMap(p => p.categories);
            updateGlobalCategories(allNewCategories);
        }
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(`Удалить товар?`)) return;
    try {
        if (db) {
            await deleteDoc(doc(db, "shops", shopId, "products", productId));
            setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        }
    } catch (err) { console.error(err); }
  };

  // Helper wrappers
  const handleCycleProductStatus = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    let newStatus: ProductStatus;
    switch (product.status) {
        case ProductStatus.Available: newStatus = ProductStatus.OutOfStock; break;
        case ProductStatus.OutOfStock: newStatus = ProductStatus.Hidden; break;
        case ProductStatus.Hidden: newStatus = ProductStatus.Available; break;
        default: newStatus = product.status;
    }
    handleProductUpdate(productId, { status: newStatus });
  };
  const handleUpdateProductPortions = (productId: string, portion: ProductPortion) => {
    const product = products.find(p => p.id === productId);
    if (!product || portion === 'whole') return;
    const newPortions = product.allowedPortions.includes(portion) ? product.allowedPortions.filter(item => item !== portion) : [...product.allowedPortions, portion];
    handleProductUpdate(productId, { allowedPortions: newPortions });
  };
  const handleUpdateProductPrices = (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => handleProductUpdate(productId, newPrices);
  const handleUpdateProductPriceTiers = (productId: string, newPriceTiers: Product['priceTiers']) => handleProductUpdate(productId, { priceTiers: newPriceTiers });
  
  // New handlers for tier specific data
  const handleUpdateProductTierPortions = (productId: string, role: string, portions: ProductPortion[]) => {
      const product = products.find(p => p.id === productId);
      if(product) {
          const newTierPortions = { ...(product.tierPortions || {}), [role]: portions };
          handleProductUpdate(productId, { tierPortions: newTierPortions });
      }
  };
  const handleUpdateProductTierPriceOverrides = (productId: string, role: string, overrides: { half?: number; quarter?: number }) => {
      const product = products.find(p => p.id === productId);
      if(product) {
          const newTierPriceOverrides = { ...(product.tierPriceOverrides || {}), [role]: overrides };
          handleProductUpdate(productId, { tierPriceOverrides: newTierPriceOverrides });
      }
  };

  const handleUpdateProductCostPrice = (productId: string, newCostPrice?: number) => {
    // Explicitly update global cost price and recalculate all tiers
    handleUpdateProductUspPrices(productId, { costPrice: newCostPrice });
  };
  
  const handleUpdateProductUspPrices = (productId: string, newUspPrices: { costPrice?: number; usp1Price?: number; markupValue?: number; markupType?: 'percent' | 'fixed'; role?: string; }) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { role, costPrice, markupValue, markupType, ...others } = newUspPrices;
      let updatedPayload: any = { ...others };

      // 1. Determine the final Cost Price
      // Use hasOwnProperty to distinguish between explicitly passed 0 and missing costPrice
      const hasNewCost = newUspPrices.hasOwnProperty('costPrice');
      const finalCost = hasNewCost ? (costPrice ?? 0) : (product.costPrice || 0);
      
      if (hasNewCost) {
          updatedPayload.costPrice = costPrice === undefined ? 0 : costPrice;
      }

      // 2. Update markup rule for the specified role if provided
      const currentMarkups = { ...(product.tierMarkups || {}) };
      if (role) {
          // Construct markup object, ensuring we don't put undefined in required fields
          const existingRule = currentMarkups[role];
          const newRule: any = {
              type: markupType || existingRule?.type || 'percent'
          };
          // Only set value if it was provided or already exists
          if (markupValue !== undefined) {
              newRule.value = markupValue;
          } else if (existingRule?.value !== undefined) {
              newRule.value = existingRule.value;
          }

          currentMarkups[role] = newRule;
          updatedPayload.tierMarkups = currentMarkups;
      }

      // 3. FORCE recalculation of ALL prices that depend on markups
      const newTiers = { ...(product.priceTiers || {}) };
      let newBasePrice = product.pricePerUnit;

      Object.keys(currentMarkups).forEach(r => {
          const m = currentMarkups[r];
          // Recalculate only if there's a markup rule value and cost > 0
          if (m && m.value !== undefined && finalCost > 0) {
              const calculated = m.type === 'percent' 
                ? Math.round(finalCost * (1 + m.value / 100)) 
                : Math.round(finalCost + m.value);
              
              if (r === 'retail') {
                  newBasePrice = calculated;
              } else {
                  newTiers[r] = calculated;
              }
          }
      });

      updatedPayload.priceTiers = newTiers;
      updatedPayload.pricePerUnit = newBasePrice;

      handleProductUpdate(productId, updatedPayload);
  };

  const handleBulkUpdateUspPrices = (updates: { productId: string; usp1Price?: number; }[]) => updates.forEach(update => handleProductUpdate(update.productId, { usp1Price: update.usp1Price }));
  const handleBulkUpdateWholesalePrices = (updates: { productId: string; newPrice: number; }[]) => updates.forEach(update => {
        const product = products.find(p => p.id === update.productId);
        if(product) {
            // NOTE: Wholesale bulk update logic might need revisit for dynamic roles
            const newPriceTiers = { ...(product.priceTiers || {}), 'оптовый': update.newPrice };
            handleProductUpdate(update.productId, { priceTiers: newPriceTiers });
        }
    });
  const handleUpdateProductUspMarkupFlags = (productId: string, flags: { usp1UseGlobalMarkup?: boolean; }) => handleProductUpdate(productId, flags);
  const handleUpdateProductUnitValue = (productId: string, newUnitValue: number) => handleProductUpdate(productId, { unitValue: newUnitValue });
  const handleUpdateProductDetails = (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => handleProductUpdate(productId, newDetails);
  const handleUpdateProductImages = (productId: string, newImageUrls: string[]) => handleProductUpdate(productId, { imageUrls: newImageUrls });
  const handleUpdateProductCategories = (productId: string, newCategories: string[]) => {
    handleProductUpdate(productId, { categories: newCategories });
    updateGlobalCategories(newCategories);
  };
  const handleUpdateProductVisibility = (productId: string, visibleToRoles: CustomerType[]) => {
      handleProductUpdate(productId, { visibleToRoles });
  };

  // Default badges for legacy support or initialization
  const defaultBadges: string[] = ['ХИТ', 'акция', 'мало', 'много'];

  const handleCycleProductBadge = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Combine dynamic badge texts and null
    const badgeOptions = [null, ...badges.map(b => b.text)];
    // Fallback if badges is empty, use legacy
    const cycleOptions = badgeOptions.length > 1 ? badgeOptions : [null, ...defaultBadges];

    const currentBadge = product.badge || null;
    const currentBadgeIndex = cycleOptions.indexOf(currentBadge);
    
    const baseIndex = currentBadgeIndex === -1 ? 0 : currentBadgeIndex;
    const nextBadgeIndex = (baseIndex + 1) % cycleOptions.length;
    
    const nextBadge = cycleOptions[nextBadgeIndex];
    
    // Cast to any to bypass strict type check for null, as Firestore update handles null correctly
    handleProductUpdate(productId, { badge: nextBadge } as any);
  };

  const handleAddBadge = async (text: string, color: string) => {
      if(!db || !badgesCollection) return;
      const newBadge = { text, color };
      const docRef = await addDoc(badgesCollection, newBadge);
      setBadges(prev => [...prev, { id: docRef.id, ...newBadge }]);
  }

  const handleDeleteBadge = async (badgeId: string) => {
      if(!db) return;
      await deleteDoc(doc(db, 'shops', shopId, 'badges', badgeId));
      setBadges(prev => prev.filter(b => b.id !== badgeId));
  }

  const handleOpenGalleryModal = (images: string[], index: number) => setGalleryModalInfo({ images, index });
  const handleCloseGalleryModal = () => setGalleryModalInfo(null);
  const handleAnimationEnd = (id: number) => setFlyingItems(prev => prev.filter(item => item.id !== id));
  
  const handleAddUser = (email: string, password: string, role: string): 'success' | 'exists' => {
      // In multi-tenant, simple "check array" works for now, but strictly should be async check in AuthContext/DB
      // For Admin UI convenience:
      if (allUsers.some(u => u.email === email)) return 'exists';
      const newUser: User = {
        id: Date.now().toString(), email, passwordHash: simpleHash(password),
        isAdmin: false, customerType: role,
      };
      if(db && usersCollection) addDoc(usersCollection, newUser).then(ref => {
          newUser.id = ref.id;
          setAllUsers(prev => [...prev, newUser]);
      });
      return 'success';
  };

  const handleDeleteUser = async (userId: string) => {
      if(!db) return;
      await deleteDoc(doc(db, 'shops', shopId, 'users', userId));
      setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleUpdateUserByAdmin = async (userId: string, updates: Partial<User> & { newPassword?: string }) => {
    const { newPassword, ...otherUpdates } = updates;
    const updatePayload: any = { ...otherUpdates };
    if (newPassword) updatePayload.passwordHash = simpleHash(newPassword);
    
    if(db) await updateDoc(doc(db, 'shops', shopId, 'users', userId), updatePayload);

    setAllUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, ...otherUpdates, ...(newPassword ? { passwordHash: simpleHash(newPassword) } : {}) } : user));
  };

  const handleAddRole = async (newRole: string) => {
      if (!db || customerRoles.includes(newRole)) return;
      const updatedRoles = [...customerRoles, newRole];
      setCustomerRoles(updatedRoles);
      await updateDoc(doc(db, 'shops', shopId), { roles: updatedRoles });
  };

  const handleDeleteRole = async (role: string) => {
      if (!db || role === 'Розничный') return;
      const updatedRoles = customerRoles.filter(r => r !== role);
      setCustomerRoles(updatedRoles);
      await updateDoc(doc(db, 'shops', shopId), { roles: updatedRoles });
  };

  const handleImportData = async (data: { products: Product[]; users: User[]; orders: Order[] }) => {
     try {
        if (!Array.isArray(data.products)) throw new Error('Неверный формат данных');
        // Import products only for simplicity in this context
        const productsToImport = data.products.map(({ id, ...p}) => p); 
        await handleBulkAddProducts(productsToImport as Omit<Product, 'id' | 'status'>[]);
        alert('Импорт товаров завершен.');
    } catch (error: any) {
        alert(`Ошибка импорта: ${error.message}`);
    }
  };

  const handleAdminOrdersClick = () => {
      setView('admin');
      setAdminActiveTab('orders');
  };

  // --- Forced Registration Landing Page ---
  if (registrationType && !currentUser) {
      return (
          <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative" 
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop)' }}
          >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
              
              <div className="relative z-10 w-full max-w-md">
                  <div className="text-center mb-8">
                      {/* FIX: Fixed missing opening bracket for h1 tag. */}
                      <h1 className="text-3xl font-bold text-white mb-2 shadow-sm drop-shadow-md">{shopName}</h1>
                      <p className="text-gray-200 text-lg">Пожалуйста, зарегистрируйтесь для доступа к каталогу.</p>
                  </div>
                  
                  <AuthModal
                      mode={authMode}
                      onClose={() => {
                          // Clear registration flow on close
                          setRegistrationType(null);
                          const url = new URL(window.location.href);
                          url.searchParams.delete('registerType');
                          window.history.replaceState({}, '', url);
                      }}
                      onSwitchMode={setAuthMode}
                      predefinedCustomerType={registrationType}
                      inline={true}
                  />
                  
                  <div className="text-center mt-6">
                      <button 
                        onClick={() => {
                            setRegistrationType(null);
                            const url = new URL(window.location.href);
                            url.searchParams.delete('registerType');
                            window.history.replaceState({}, '', url);
                        }}
                        className="text-white/70 hover:text-white underline text-sm"
                      >
                          Продолжить как гость
                      </button>
                  </div>
              </div>
          </div>
      );
  }

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
                     <div className="space-y-0.5 text-xs sm:text-sm text-gray-600 border-l border-gray-200 pl-2 pl-4 min-w-[120px]">
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Позиций:</span>
                            <span className="font-semibold">{cartItems.length}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Сумма:</span>
                            {/* Round cart total display for consistency */}
                            <span className="font-semibold">{Math.round(totalCartSum).toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-gray-500">Вес:</span>
                            <span className="font-semibold">~{totalCartWeight.toFixed(2)} кг</span>
                        </div>
                    </div>
                )}
            </div>
            
          <div className="flex items-center gap-4">
             {currentUser ? (
                 <div className="flex items-center gap-4">
                    {currentUser.isAdmin && (
                        <>
                            <button
                                onClick={handleAdminOrdersClick}
                                className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
                                aria-label="Заказы"
                                title="Новые заказы"
                            >
                                <OrdersIcon className="w-8 h-8"/>
                                {newOrdersCount > 0 && (
                                    <span className="absolute -top-2 -right-2 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full border border-white">
                                        {newOrdersCount}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setView(view === 'admin' ? 'shop' : 'admin')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600" aria-label="Админ панель">
                                <AdminIcon className="w-6 h-6"/>
                                <span className="hidden sm:inline">{view === 'admin' ? 'В магазин' : 'Админ панель'}</span>
                            </button>
                        </>
                    )}
                     <button onClick={() => setAccountModalOpen(true)} className="text-gray-600 hover:text-indigo-600 focus:outline-none" aria-label="Личный кабинет">
                         <UserIcon className="w-8 h-8"/>
                     </button>
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
      
      <main className="container mx-auto px-px sm:px-4 py-4">
         {view === 'admin' && currentUser?.isAdmin ? (
            <>
              <AdminPage 
                shopId={shopId}
                activeTab={adminActiveTab}
                onTabChange={setAdminActiveTab}
                products={products}
                allCategories={allCategories}
                orders={orders}
                allUsers={allUsers}
                roles={customerRoles}
                badges={badges}
                onAddProduct={handleAddNewProduct}
                onBulkAddProducts={handleBulkAddProducts}
                onDeleteProduct={handleDeleteProduct}
                onCycleStatus={handleCycleProductStatus}
                onUpdatePortions={handleUpdateProductPortions}
                onUpdatePrices={handleUpdateProductPrices}
                onUpdateProductPriceTiers={handleUpdateProductPriceTiers}
                onUpdateTierPortions={handleUpdateProductTierPortions}
                onUpdateTierPriceOverrides={handleUpdateProductTierPriceOverrides}
                onUpdateProductCostPrice={handleUpdateProductCostPrice}
                onUpdateUspPrices={handleUpdateProductUspPrices}
                onBulkUpdateUspPrices={handleBulkUpdateUspPrices}
                onBulkUpdateWholesalePrices={handleBulkUpdateWholesalePrices}
                onUpdateUspMarkupFlags={handleUpdateProductUspMarkupFlags}
                onUpdateUnitValue={handleUpdateProductUnitValue}
                onUpdateDetails={handleUpdateProductDetails}
                onUpdateImages={handleUpdateProductImages}
                onUpdateCategories={handleUpdateProductCategories}
                onUpdateVisibility={handleUpdateProductVisibility}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUserByAdmin={handleUpdateUserByAdmin}
                onCycleBadge={handleCycleProductBadge}
                onImportData={handleImportData}
                onAddRole={handleAddRole}
                onDeleteRole={handleDeleteRole}
                onAddBadge={handleAddBadge}
                onDeleteBadge={handleDeleteBadge}
              />
            </>
          ) : (
            <>
              <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm mb-2 sm:mb-6">
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
                        >
                            {showProductImages ? <ImageOffIcon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    {isSearchVisible ? (
                        <div className="relative w-full flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                            />
                        </div>
                    ) : (
                        <div className="flex justify-end w-full flex-1">
                            <button
                                onClick={() => setIsSearchVisible(true)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
              </div>
              {isLoading && <p className="text-center text-gray-500">Загрузка витрины...</p>}
              {error && <p className="text-center text-red-500">Ошибка: {error}</p>}
              {!isLoading && !error && (
                <ProductList 
                  products={filteredProducts} 
                  onAddToCart={handleAddToCart}
                  onOpenGalleryModal={handleOpenGalleryModal}
                  showProductImages={showProductImages}
                  badges={badges}
                  cartItems={cartItems}
                />
              )}
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
              predefinedCustomerType={registrationType}
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
