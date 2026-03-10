import React, { useEffect, useCallback } from 'react';

const ImageLightbox = ({ src, alt, onClose }) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close" onClick={onClose} aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <img src={src} alt={alt} className="lightbox-image" />
                <p className="lightbox-caption">{alt}</p>
            </div>
        </div>
    );
};

export default ImageLightbox;
