/**
 * Cross-version Chrome sidePanel utility
 * Handles compatibility across different Chrome versions
 */

export const SidePanelUtil = {
  /**
   * Open the side panel - works across all supported Chrome versions
   * @param tabId - The active tab ID
   */
  async open(tabId: number): Promise<void> {
    try {
      // Try the standard open method first
      if (chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId });
      }
    } catch (error) {
      console.error('Error opening side panel:', error);
    }
  },

  /**
   * Toggle side panel - use with caution, not available in all Chrome versions
   * Falls back to open() if toggle is not available
   * @param tabId - The active tab ID
   */
  async toggle(tabId: number): Promise<void> {
    try {
      // Chrome 123+ has toggle method
      const sidePanel = chrome.sidePanel as any;
      if (sidePanel && sidePanel.toggle && typeof sidePanel.toggle === 'function') {
        await sidePanel.toggle({ tabId });
      } else {
        // Fallback to open for older Chrome versions
        await this.open(tabId);
      }
    } catch (error) {
      console.error('Error toggling side panel:', error);
    }
  },
};
