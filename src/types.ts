// Types for storage and URL management
export interface Favorite {
  id: string;
  url: string;
  title: string;
  addedAt: number;
  favicon?: string;
}

export interface StorageData {
  favorites: Favorite[];
}

// Message types for communication between different parts
export interface Message {
  type: string;
  payload?: any;
}

export const MessageTypes = {
  ADD_FAVORITE: 'ADD_FAVORITE',
  REMOVE_FAVORITE: 'REMOVE_FAVORITE',
  GET_FAVORITES: 'GET_FAVORITES',
  FAVORITES_UPDATED: 'FAVORITES_UPDATED',
  OPEN_URL: 'OPEN_URL',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
} as const;
