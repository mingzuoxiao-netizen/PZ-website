import { adminFetch } from "../utils/adminFetch";

export function useProductImageActions({
  productId,
  images,
  setImages,
  role,
}: {
  productId?: string;
  images: string[];
  setImages: (imgs: string[]) => void;
  role: 'ADMIN' | 'FACTORY';
}) {
  const autoPublish = role === 'ADMIN';

  const removeImage = async (url: string) => {
    // 1. Update UI immediately
    const next = images.filter(i => i !== url);
    setImages(next);

    // 2. Drafts don't touch the backend
    if (!productId) return;

    // 3. Notify backend for reference removal (Side effects handled by backend)
    const prefix = role === 'ADMIN' ? 'admin' : 'factory';
    await adminFetch(`${prefix}/products/${productId}/remove-image`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        autoPublish,
      }),
    });
  };

  const reorderImages = async (next: string[]) => {
    // 1. Update UI immediately
    setImages(next);

    // 2. Drafts don't touch the backend
    if (!productId) return;

    // 3. Notify backend for order update
    const prefix = role === 'ADMIN' ? 'admin' : 'factory';
    await adminFetch(`${prefix}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        images: next,
        autoPublish,
      }),
    });
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    reorderImages(next);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await adminFetch("upload-image", { method: "POST", body: fd });
    return res.url;
  };

  return { removeImage, reorderImages, setMainImage, uploadImage };
}