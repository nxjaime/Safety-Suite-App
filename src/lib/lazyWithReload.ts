import { lazy } from 'react';
import type { ComponentType } from 'react';

const CHUNK_RELOAD_KEY = 'safetyhub:chunk-reload-attempted';

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message);
};

export const lazyWithReload = <T extends ComponentType<object>>(
  importer: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const component = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return component;
    } catch (error) {
      if (
        typeof window !== 'undefined' &&
        isChunkLoadError(error) &&
        sessionStorage.getItem(CHUNK_RELOAD_KEY) !== 'true'
      ) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
        window.location.reload();
      }

      throw error;
    }
  });
};
