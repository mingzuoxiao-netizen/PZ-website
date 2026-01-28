import { useCallback, useMemo } from "react";
import { adminFetch } from "../utils/adminFetch";
import { factoryFetch } from "../utils/factoryFetch";
import { extractKeyFromUrl } from "../utils/imageResolver";

type Role = "ADMIN" | "FACTORY";

type PublishMode =
  | "none" // 不自动发布
  | "products" // 自动 publish/products
  | "all"; // 自动 publish/products + publish site-config

export type UseProductImageActionsOptions = {
  role: Role;
  /**
   * ADMIN 默认开启 products 自动同步，确保官网实时更新
   */
  autoPublish?: PublishMode;

  /**
   * 更新产品数据的接口路径生成器
   */
  updateProductEndpoint?: (id: string) => string;

  /**
   * A版原则：严禁物理删除云端资源，仅移除 DB 关联
   */
  allowCloudDelete?: boolean;
};

type ProductLike = {
  id: string;
  images?: string[];
  [k: string]: any;
};

function uniqKeepOrder(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const v = String(s || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function removeOne(arr: string[], target: string) {
  const t = String(target || "").trim();
  return arr.filter((x) => String(x || "").trim() !== t);
}

export function useProductImageActions(opts: UseProductImageActionsOptions) {
  const {
    role,
    autoPublish = role === "ADMIN" ? "products" : "none",
    updateProductEndpoint,
    allowCloudDelete = false,
  } = opts;

  const api = useMemo(() => {
    return role === "ADMIN" ? adminFetch : factoryFetch;
  }, [role]);

  const endpointForUpdate = useMemo(() => {
    if (updateProductEndpoint) return updateProductEndpoint;
    return (id: string) =>
      role === "ADMIN" ? `admin/products/${id}` : `factory/products/${id}`;
  }, [role, updateProductEndpoint]);

  /**
   * 上传图片：调用 /api/upload-image
   */
  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const fd = new FormData();
      fd.append("file", file);

      const res = await api<{ url?: string; key?: string; success?: boolean }>(
        "upload-image",
        { method: "POST", body: fd }
      );

      const url = res?.url;
      if (!url) throw new Error("Upload failed: missing url in response");
      return url;
    },
    [api]
  );

  /**
   * 发布闭环：Admin 操作后自动触发线上同步
   */
  const publish = useCallback(async () => {
    if (role !== "ADMIN") return;
    if (autoPublish === "none") return;

    if (autoPublish === "products" || autoPublish === "all") {
      await adminFetch("admin/publish/products", { method: "POST" });
    }
    if (autoPublish === "all") {
      await adminFetch("admin/publish", { method: "POST" });
    }
  }, [autoPublish, role]);

  /**
   * 从产品档案中移除图片引用
   */
  const removeImageFromProduct = useCallback(
    async (product: ProductLike, urlToRemove: string) => {
      if (!product?.id) throw new Error("Missing product.id");

      const current = Array.isArray(product.images) ? product.images : [];
      const nextImages = removeOne(current, urlToRemove);
      const payload = { ...product, images: nextImages };

      await api(endpointForUpdate(product.id), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await publish();
      return payload;
    },
    [api, endpointForUpdate, publish]
  );

  /**
   * 向产品档案添加图片
   */
  const addImagesToProduct = useCallback(
    async (
      product: ProductLike,
      newUrls: string[],
      singleMode: boolean = false
    ) => {
      if (!product?.id) throw new Error("Missing product.id");

      const current = Array.isArray(product.images) ? product.images : [];
      const merged = singleMode ? [newUrls[0]].filter(Boolean) : uniqKeepOrder([...current, ...newUrls]);
      const payload = { ...product, images: merged };

      await api(endpointForUpdate(product.id), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await publish();
      return payload;
    },
    [api, endpointForUpdate, publish]
  );

  /**
   * 重新排序图片
   */
  const reorderProductImages = useCallback(
    async (product: ProductLike, nextImages: string[]) => {
      if (!product?.id) throw new Error("Missing product.id");

      const payload = { ...product, images: uniqKeepOrder(nextImages) };

      await api(endpointForUpdate(product.id), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await publish();
      return payload;
    },
    [api, endpointForUpdate, publish]
  );

  /**
   * 云端删除安全闸
   */
  const deleteCloudObject = useCallback(
    async (url: string) => {
      if (!allowCloudDelete) {
        const key = extractKeyFromUrl(url);
        throw new Error(
          `Cloud delete disabled (A mode). Reference removed only. (key=${key ?? "n/a"})`
        );
      }
      throw new Error("Safety Protocol: Manual GC required for cloud deletion.");
    },
    [allowCloudDelete]
  );

  return {
    uploadImage,
    removeImageFromProduct,
    addImagesToProduct,
    reorderProductImages,
    publish,
    deleteCloudObject,
  };
}
