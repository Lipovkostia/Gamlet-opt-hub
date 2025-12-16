
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import { AuthProvider } from './contexts/AuthContext';
import { db, doc, getDoc } from './lib/firebase';

const SLUG_TO_ROLE: Record<string, string> = {
    'retail': 'Розничный',
    'vip': 'постоянный',
    'wholesale': 'оптовый',
    'big-wholesale': 'крупный опт',
    'mid-wholesale': 'средний опт'
};

const RootComponent: React.FC = () => {
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopName, setShopName] = useState<string>('Магазин');
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);

    useEffect(() => {
        // --- Smart Route Parsing for Short Links (/join/...) ---
        const path = window.location.pathname;
        const joinMatch = path.match(/^\/join\/([^\/]+)\/([^\/]+)/);

        if (joinMatch) {
            const [, sid, roleSlug] = joinMatch;
            const role = SLUG_TO_ROLE[roleSlug] || decodeURIComponent(roleSlug);
            
            // We instantly rewrite the URL to the query param format so App.tsx and AuthModal work as expected
            // This avoids a full reload but aligns the state with the app's existing architecture.
            const newUrl = `${window.location.origin}/?shopId=${sid}&registerType=${encodeURIComponent(role)}`;
            window.history.replaceState(null, '', newUrl);
            
            // Now allow the standard logic below to pick up the `sid` (or query param)
            // But we must update the search params manually for the logic below if it uses window.location
        }
        // -----------------------------------------------------

        // Simple routing based on query params (now populated by rewrite or direct access)
        const params = new URLSearchParams(window.location.search);
        const sid = params.get('shopId');

        const fetchShopMetadata = async (id: string) => {
             if (!db) {
                 setShopId(id);
                 setIsLoading(false);
                 return;
             }
             try {
                 const shopRef = doc(db, 'shops', id);
                 const shopSnap = await getDoc(shopRef);
                 
                 if (shopSnap.exists()) {
                     setShopId(id);
                     setShopName(shopSnap.data().name || 'Магазин');
                 } else {
                     setIsNotFound(true);
                 }
             } catch (e) {
                 console.error("Error fetching shop metadata", e);
                 // Fallback to allow showing the app anyway (maybe offline/cache)
                 setShopId(id);
             } finally {
                 setIsLoading(false);
             }
        };

        if (sid) {
            fetchShopMetadata(sid);
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleShopCreated = (id: string, name: string) => {
        setShopId(id);
        setShopName(name);
        
        // Update URL without reloading the page
        const newUrl = `${window.location.origin}?shopId=${id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (isNotFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-lg text-gray-600 mb-6">Магазин не найден.</p>
                <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Создать свой магазин</a>
            </div>
        );
    }

    if (!shopId) {
        return <LandingPage onShopCreated={handleShopCreated} />;
    }

    return (
        <React.StrictMode>
            <AuthProvider shopId={shopId}>
                <App shopId={shopId} shopName={shopName} />
            </AuthProvider>
        </React.StrictMode>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<RootComponent />);
