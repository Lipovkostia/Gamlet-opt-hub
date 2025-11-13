import React, { useState, useMemo } from 'react';
import { CartItem, ProductPortion, ProductUnit } from '../types';

interface CartProps {
  cartItems: CartItem[];
  onRemoveItem: (cartId: string) => void;
  onUpdateItemQuantity: (cartId: string, newQuantity: number) => void;
  onClearCart: () => void;
  onClose: () => void;
  onPlaceOrder: () => 'placed' | undefined;
}

const TruckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 17h2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 17h5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 17h2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 12h12v5H1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 12l3-4h5v9h-8v-5z" />
        <circle cx="5" cy="19" r="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="19" r="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Cart: React.FC<CartProps> = ({ cartItems, onRemoveItem, onUpdateItemQuantity, onClearCart, onClose, onPlaceOrder }) => {
  const [orderStatus, setOrderStatus] = useState<'idle' | 'placed'>('idle');

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const handlePlaceOrderClick = () => {
    if (cartItems.length === 0) return;
    
    const status = onPlaceOrder();

    if (status === 'placed') {
      setOrderStatus('placed');
      setTimeout(() => {
        onClearCart();
        setOrderStatus('idle');
        onClose();
      }, 3000);
    }
  };
  
  const getPortionLabel = (portion: ProductPortion) => {
    switch (portion) {
        case 'half': return ' (Половинка)';
        case 'quarter': return ' (Четвертинка)';
        default: return '';
    }
  };
  
  const totalWeight = useMemo(() => {
    const total = cartItems.reduce((sum, item) => {
        let weightInKg = 0;
        if (item.unit === 'kg') weightInKg = item.unitValue;
        if (item.unit === 'g') weightInKg = item.unitValue / 1000;
        return sum + (weightInKg * item.quantity);
    }, 0);
    return total > 0 ? `Общий вес: ~${total.toFixed(2)} кг` : null;
  }, [cartItems]);


  if (orderStatus === 'placed') {
    return (
        <div className="flex flex-col h-full p-6 text-center justify-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-gray-800">Заказ успешно оформлен!</h3>
            <p className="text-gray-600 mt-2">Спасибо за вашу покупку. Подробности можно посмотреть в личном кабинете.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TruckIcon className="w-7 h-7" />
            Корзина
        </h2>
        <button onClick={onClose} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span className="sr-only">Закрыть корзину</span>
            <XIcon className="w-6 h-6"/>
        </button>
      </div>
      
      {/* Cart Body */}
      <div className="flex-grow overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <TruckIcon className="w-20 h-20 text-gray-300 mb-4"/>
              <p className="text-lg">Ваша корзина пуста</p>
              <p className="text-sm">Добавьте товары из каталога, чтобы сделать заказ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.cartId} className="flex items-center gap-4">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.name}{getPortionLabel(item.portion)}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center border border-gray-200 rounded-md">
                           <button 
                                onClick={() => onUpdateItemQuantity(item.cartId, item.quantity - 1)}
                                className="px-2 py-0.5 text-xl font-semibold text-gray-600 hover:bg-gray-100 rounded-l-md focus:outline-none"
                                aria-label={`Уменьшить количество ${item.name}`}
                           >
                               -
                           </button>
                           <span className="px-3 text-sm font-medium text-gray-800 tabular-nums">{item.quantity}</span>
                           <button 
                                onClick={() => onUpdateItemQuantity(item.cartId, item.quantity + 1)}
                                className="px-2 py-0.5 text-xl font-semibold text-gray-600 hover:bg-gray-100 rounded-r-md focus:outline-none"
                                aria-label={`Увеличить количество ${item.name}`}
                           >
                               +
                           </button>
                        </div>
                         <button onClick={() => onRemoveItem(item.cartId)} className="ml-5 text-gray-400 hover:text-red-600" aria-label={`Удалить ${item.name} из корзины`}>
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                <div className="text-right ml-auto flex-shrink-0">
                     <p className="font-semibold text-gray-800 whitespace-nowrap">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</p>
                     <p className="text-sm text-gray-500 whitespace-nowrap">{item.price.toLocaleString('ru-RU')} ₽ / шт.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="border-t p-4 flex-shrink-0 bg-white shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.05)]">
           <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-gray-600">{totalWeight}</span>
             <button onClick={onClearCart} className="text-sm text-red-500 hover:underline">Очистить корзину</button>
           </div>
          <div className="flex justify-between items-center text-lg font-bold text-gray-800">
            <span>Итого:</span>
            <span>{total.toLocaleString('ru-RU')} ₽</span>
          </div>
          <button
            onClick={handlePlaceOrderClick}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg mt-4 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            disabled={cartItems.length === 0}
          >
            Оформить заказ
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;