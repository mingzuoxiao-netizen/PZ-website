
import { resolveImage } from './imageResolver';

/**
 * Unified asset resolver - ensures visibility of uploaded files.
 */

export type AssetInput = string | null | undefined;

/**
 * Directly returns the URL provided by the Snapshot, 
 * with fallback logic for relative paths.
 */
export function getAssetUrl(asset: AssetInput): string {
  return resolveImage(asset);
}
