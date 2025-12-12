
export const API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";
export const CDN_DOMAIN = "https://cdn.peng-zhan.com/";

/**
 * Deletes an image from Cloudflare R2 bucket via the Worker API.
 * It converts the full CDN URL back to the storage key.
 */
export async function deleteImageFromR2(url: string) {
    if (!url) return;

    try {
        // Send to Worker (supports multiple)
        await fetch(`${API_BASE}/delete-images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keys: [url] })
        });

        console.log("[R2] Deleted:", url);
    } catch (err) {
        console.warn("[R2] Delete failed:", url, err);
    }
}

/**
 * Client-side image processor
 * Resizes and center-crops image to target aspect ratio.
 * Converts to JPEG for consistency and compression.
 */
export const processImage = (file: File, aspect: number, maxWidth: number = 2000): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            resolve(file); // Fallback if canvas fails
            return;
        }

        let srcW = img.width;
        let srcH = img.height;
        let srcX = 0;
        let srcY = 0;

        // Calculate Crop (Center Weighted)
        const srcAspect = srcW / srcH;
        
        if (srcAspect > aspect) {
            // Image is wider than target -> Crop sides
            const newW = srcH * aspect;
            srcX = (srcW - newW) / 2;
            srcW = newW;
        } else {
            // Image is taller than target -> Crop top/bottom
            const newH = srcW / aspect;
            srcY = (srcH - newH) / 2;
            srcH = newH;
        }

        // Resize logic (Downscale only)
        let dstW = srcW;
        let dstH = srcH;
        
        if (dstW > maxWidth) {
            dstW = maxWidth;
            dstH = maxWidth / aspect;
        }

        canvas.width = dstW;
        canvas.height = dstH;

        // Draw white background first (for transparent PNGs converted to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, dstW, dstH);

        // Draw Image
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);

        // Convert back to file
        canvas.toBlob((blob) => {
            if (blob) {
                // Rename extension to .jpg
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                const processedFile = new File([blob], newName, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                });
                resolve(processedFile);
            } else {
                resolve(file);
            }
        }, 'image/jpeg', 0.85); // 85% Quality
      };
      img.onerror = (e) => {
          console.warn("Image load failed, uploading original", e);
          resolve(file);
      };
    };
    reader.onerror = (e) => {
        console.warn("FileReader failed, uploading original", e);
        resolve(file);
    };
  });
};
