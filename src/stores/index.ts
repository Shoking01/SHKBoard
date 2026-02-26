import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
}

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
)

interface BoardState {
  boards: any[]
  currentBoard: any | null
  setBoards: (boards: any[]) => void
  setCurrentBoard: (board: any | null) => void
  addBoard: (board: any) => void
  updateBoard: (id: string, board: any) => void
  deleteBoard: (id: string) => void
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      boards: [],
      currentBoard: null,
      setBoards: (boards) => set({ boards }),
      setCurrentBoard: (board) => set({ currentBoard: board }),
      addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
      updateBoard: (id, board) =>
        set((state) => ({
          boards: state.boards.map((b) => (b.id === id ? { ...b, ...board } : b)),
        })),
      deleteBoard: (id) =>
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
        })),
    }),
    {
      name: 'board-storage',
    }
  )
)
