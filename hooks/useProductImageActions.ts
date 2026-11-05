import { adminFetch } from "../utils/adminFetch";

/**
 * Product media changes are local draft edits until ProductForm saves the
 * complete product. Never use the legacy remove-image or partial PUT routes
 * here: they can bypass review guards or overwrite unrelated product fields.
 *
 * Uploaded images are placed in R2, but are not attached to a product until
 * the user saves the draft. Removing an image never deletes the R2 object.
 */
export function useProductImageActions({
  images,
  setImages,
}: {
  images: string[];
  setImages: (imgs: string[]) => void;
}) {
  const removeImage = async (url: string): Promise<void> => {
    if (!images.includes(url)) return;
    setImages(images.filter(image => image !== url));
  };

  const reorderImages = (next: string[]): void => {
    setImages(next);
  };

  const setMainImage = (index: number): void => {
    if (index <= 0 || index >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    reorderImages(next);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await adminFetch<{ url: string }>("upload-image", { method: "POST", body: fd });
    if (!res.url || typeof res.url !== "string") {
      throw new Error("Image upload did not return a URL");
    }
    return res.url;
  };

  return { removeImage, reorderImages, setMainImage, uploadImage };
}
