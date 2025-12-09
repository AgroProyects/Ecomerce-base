'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariantSelector } from './VariantSelector';
import { useCart } from '@/lib/cart';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '@/types/database';

interface ProductDetailsWithVariantsProps {
  product: Product;
  variants: ProductVariant[];
}

export function ProductDetailsWithVariants({
  product,
  variants,
}: ProductDetailsWithVariantsProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(product.images?.[0] || '');

  const hasVariants = variants.length > 0;

  // Precio efectivo (variante o producto)
  const effectivePrice = selectedVariant?.price_override || product.price;

  // Stock disponible
  const availableStock = hasVariants
    ? selectedVariant?.stock || 0
    : product.stock || 0;

  const canAddToCart = hasVariants
    ? selectedVariant !== null && availableStock > 0
    : availableStock > 0;

  const handleVariantChange = (variant: ProductVariant | null) => {
    setSelectedVariant(variant);

    // Cambiar imagen si hay imágenes del producto
    if (product.images?.[0]) {
      setCurrentImage(product.images[0]);
    }

    // Reset cantidad
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) {
      toast.error('No disponible para agregar al carrito');
      return;
    }

    if (hasVariants && !selectedVariant) {
      toast.error('Por favor selecciona todas las opciones');
      return;
    }

    const variantAttributes = selectedVariant?.attributes as Array<{
      name: string;
      value: string;
    }> | undefined;
    const variantName = variantAttributes
      ?.map((attr) => attr.value)
      .join(' / ');

    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id || null,
      name: product.name,
      price: effectivePrice,
      image_url: currentImage,
      variant_name: variantName || null,
      max_stock: availableStock,
      quantity,
    });

    toast.success('Agregado al carrito');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Imágenes */}
      <div className="space-y-4">
        {/* Imagen principal */}
        <div className="aspect-square relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* Miniaturas */}
        {product.images && product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(image)}
                className={`aspect-square relative rounded-md overflow-hidden border-2 transition-all ${
                  currentImage === image
                    ? 'border-zinc-900 dark:border-white'
                    : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="space-y-6">
        {/* Título y precio */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              ${effectivePrice.toFixed(2)}
            </span>
            {product.compare_price && product.compare_price > effectivePrice && (
              <span className="text-xl text-zinc-500 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Descripción */}
        {product.description && (
          <div className="prose prose-sm dark:prose-invert">
            <p>{product.description}</p>
          </div>
        )}

        {/* Selector de variantes */}
        {hasVariants && (
          <VariantSelector
            variants={variants}
            onVariantChange={handleVariantChange}
          />
        )}

        {/* Cantidad */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span className="text-lg font-medium w-12 text-center">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= availableStock}
            >
              +
            </Button>
            <span className="text-sm text-zinc-500 ml-2">
              {availableStock} disponibles
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {availableStock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1">
              <Heart className="h-5 w-5 mr-2" />
              Favoritos
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <Share2 className="h-5 w-5 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="border-t pt-6 space-y-2 text-sm">
          {selectedVariant?.sku && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                SKU Variante:
              </span>
              <span className="font-medium">{selectedVariant.sku}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Disponibilidad:
            </span>
            <span
              className={
                availableStock > 0
                  ? 'text-green-600 dark:text-green-400 font-medium'
                  : 'text-red-600 dark:text-red-400 font-medium'
              }
            >
              {availableStock > 0 ? 'En Stock' : 'Agotado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
