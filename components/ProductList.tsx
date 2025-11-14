

import React, { useState } from 'react';
import { Product, ProductPortion, ProductPackaging, ProductUnit } from '../types';
import ProductItem from './ProductItem';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product, portion: ProductPortion, startRect?: DOMRect) => void;
  isAdminView?: boolean;
  onDeleteProduct?: (productId: string) => void;
  onCycleStatus?: (productId: string) => void;
  onUpdatePortions?: (productId: string, portion: ProductPortion) => void;
  onUpdatePrices?: (productId: string, newPrices: { pricePerUnit: number, priceOverridesPerUnit: Product['priceOverridesPerUnit'] }) => void;
  onUpdateUnitValue?: (productId: string, newUnitValue: number) => void;
  onUpdateDetails?: (productId: string, newDetails: { name: string; description: string; unit: ProductUnit; packaging: ProductPackaging; }) => void;
  onUpdateImages?: (productId: string, newImageUrls: string[]) => void;
  onOpenGalleryModal?: (imageUrls: string[], index: number) => void;
  showProductImages?: boolean;
  allCategories?: string[];
  onUpdateCategories?: (productId: string, newCategories: string[]) => void;
  onCycleBadge?: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAddToCart, isAdminView = false, onDeleteProduct, onCycleStatus, onUpdatePortions, onUpdatePrices, onUpdateUnitValue, onUpdateDetails, onUpdateImages, onOpenGalleryModal, showProductImages = true, allCategories, onUpdateCategories, onCycleBadge }) => {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [galleryProductId, setGalleryProductId] = useState<string | null>(null);

  const handleToggleExpand = (productId: string) => {
    if (galleryProductId === productId) {
      setGalleryProductId(null); // Закрыть галерею, если открывается описание
    }
    setExpandedProductId(currentId => (currentId === productId ? null : productId));
  };
  
  const handleToggleGallery = (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null); // Закрыть описание, если открывается галерея
    }
    setGalleryProductId(currentId => (currentId === productId ? null : productId));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="divide-y divide-gray-200">
        {products.length > 0 ? (
          products.map(product => (
            <ProductItem 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
              isExpanded={product.id === expandedProductId}
              onToggleExpand={handleToggleExpand}
              isGalleryOpen={product.id === galleryProductId}
              onToggleGallery={handleToggleGallery}
              isAdminView={isAdminView}
              onDeleteProduct={onDeleteProduct}
              onCycleStatus={onCycleStatus}
              onUpdatePortions={onUpdatePortions}
              onUpdatePrices={onUpdatePrices}
              onUpdateUnitValue={onUpdateUnitValue}
              onUpdateDetails={onUpdateDetails}
              onUpdateImages={onUpdateImages}
              onOpenGalleryModal={onOpenGalleryModal}
              showProductImages={showProductImages}
              allCategories={allCategories}
              onUpdateCategories={onUpdateCategories}
              onCycleBadge={onCycleBadge}
            />
          ))
        ) : (
          <p className="p-6 text-center text-gray-500">Товары в этой категории не найдены.</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;