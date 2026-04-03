import { Favorite, StorageData } from '../types';

const STORAGE_KEY = 'sideui_favorites';

export class StorageManager {
  /**
   * Get all favorites from Chrome storage
   */
  static async getFavorites(): Promise<Favorite[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data: StorageData = result[STORAGE_KEY] || { favorites: [] };
        resolve(data.favorites);
      });
    });
  }

  /**
   * Add a new favorite
   */
  static async addFavorite(
    url: string,
    title: string,
    favicon?: string
  ): Promise<Favorite> {
    const favorites = await this.getFavorites();
    const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFavorite: Favorite = {
      id,
      url,
      title: title || new URL(url).hostname,
      addedAt: Date.now(),
      favicon,
    };

    favorites.push(newFavorite);
    await this.saveFavorites(favorites);
    return newFavorite;
  }

  /**
   * Remove a favorite by ID
   */
  static async removeFavorite(id: string): Promise<void> {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter((fav) => fav.id !== id);
    await this.saveFavorites(filtered);
  }

  /**
   * Clear all favorites
   */
  static async clearAllFavorites(): Promise<void> {
    await this.saveFavorites([]);
  }

  /**
   * Save favorites to storage
   */
  private static async saveFavorites(favorites: Favorite[]): Promise<void> {
    return new Promise((resolve) => {
      const data: StorageData = { favorites };
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        resolve();
      });
    });
  }
}
