import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react'

export type ContentType = 'dashboard' | 'look'

export interface SelectedContent {
  type: ContentType
  id: string
}

interface AppContextProps {
  selectedContent: SelectedContent | null
  selectContent: (type: ContentType, id: string) => void
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null)

  const selectContent = useCallback((type: ContentType, id: string) => {
    setSelectedContent({ type, id })
  }, [])

  const value = useMemo(() => ({
    selectedContent,
    selectContent
  }), [selectedContent, selectContent])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppProvider
