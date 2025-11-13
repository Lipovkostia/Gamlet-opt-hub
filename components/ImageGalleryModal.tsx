import React, { useState, useEffect, useCallback } from 'react';

interface ImageGalleryModalProps {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ imageUrls, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1));
  }, [imageUrls.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1));
  }, [imageUrls.length]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === 0) return;
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) { // Swiped left
      goToNext();
      setTouchStartX(0); // Reset after swipe
    } else if (diff < -50) { // Swiped right
      goToPrevious();
      setTouchStartX(0); // Reset after swipe
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrevious, onClose]);

  // Add a simple fade-in animation using a style tag
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 modal-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Gallery"
    >
      <style>{styles}</style>
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute top-4 right-4 text-white p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 z-10"
        aria-label="Close gallery"
      >
        <XIcon className="w-6 h-6" />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center" 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Previous Button */}
        <button 
          onClick={goToPrevious} 
          className="absolute left-0 md:left-4 p-2 bg-black bg-opacity-40 text-white rounded-full hover:bg-opacity-60 transition-opacity"
          aria-label="Previous image"
        >
          <ArrowLeftIcon className="w-8 h-8"/>
        </button>

        {/* Image */}
        <img 
          src={imageUrls[currentIndex]} 
          alt={`Image ${currentIndex + 1} of ${imageUrls.length}`} 
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        
        {/* Counter */}
        <div className="absolute bottom-4 text-white text-sm bg-black bg-opacity-60 px-2 py-1 rounded-md">
            {currentIndex + 1} / {imageUrls.length}
        </div>

        {/* Next Button */}
        <button 
          onClick={goToNext} 
          className="absolute right-0 md:right-4 p-2 bg-black bg-opacity-40 text-white rounded-full hover:bg-opacity-60 transition-opacity"
          aria-label="Next image"
        >
          <ArrowRightIcon className="w-8 h-8"/>
        </button>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
