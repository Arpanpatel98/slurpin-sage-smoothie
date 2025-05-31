import { useState, useEffect } from 'react';

// Cache for storing loaded images
const imageCache = new Map();

export const useImageLoader = (imageUrl, defaultImageUrl) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no image URL provided, use default
    if (!imageUrl) {
      setImageSrc(defaultImageUrl);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (imageCache.has(imageUrl)) {
      setImageSrc(imageCache.get(imageUrl));
      setIsLoading(false);
      return;
    }

    // Create a new image object
    const img = new Image();
    
    img.onload = () => {
      // Store in cache
      imageCache.set(imageUrl, imageUrl);
      setImageSrc(imageUrl);
      setIsLoading(false);
    };

    img.onerror = () => {
      console.warn(`Failed to load image: ${imageUrl}`);
      // Store default image in cache for this URL
      imageCache.set(imageUrl, defaultImageUrl);
      setImageSrc(defaultImageUrl);
      setError('Failed to load image');
      setIsLoading(false);
    };

    // Start loading the image
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, defaultImageUrl]);

  return { imageSrc, isLoading, error };
}; 