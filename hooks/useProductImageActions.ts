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
    // Keep the visible image until the server confirms reference removal.
    const next = images.filter(i => i !== url);
    if (!productId) { setImages(next); return; }

    // Stored products are changed via an audited, role-aware endpoint.
    const prefix = role === 'ADMIN' ? 'admin' : 'factory';
    await adminFetch(`${prefix}/products/${productId}/remove-image`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        autoPublish,
      }),
    });
    setImages(next);
  };

  // Reordering is local until the user clicks Save; never send a partial PUT
  // because the product update endpoint requires the complete product payload.
  const reorderImages = async (next: string[]) => {
    setImages(next);
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