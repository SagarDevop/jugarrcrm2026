import { create } from 'zustand';

interface ChatStoreState {
  hasUnread: boolean;
  unreadCount: number;
  setHasUnread: (hasUnread: boolean) => void;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  markAsRead: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  hasUnread: false,
  unreadCount: 0,
  setHasUnread: (hasUnread) => set({ hasUnread }),
  setUnreadCount: (count) => set({ unreadCount: count, hasUnread: count > 0 }),
  incrementUnread: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      hasUnread: true,
    })),
  markAsRead: () => set({ hasUnread: false, unreadCount: 0 }),
}));
