import React from 'react'
import { ExtensionProvider } from '@looker/extension-sdk-react'
import { hot } from 'react-hot-loader/root'
import { ComponentsProvider, SpaceVertical, Box, Flex } from '@looker/components'
import { MemoryRouter } from 'react-router-dom'
import { FolderNavigation } from './Sidebar/FolderNavigation'
import AppProvider from './AppContext'
import { EmbedView } from './EmbedView'

export const App = hot(() => (
  <ExtensionProvider>
    <AppProvider>
      <ComponentsProvider>
        {/* @ts-ignore */}
        <MemoryRouter>
          <FolderNavigation />
          <Box p="u3" borderBottom="1px solid key" display="grid" height="100%">
            <EmbedView />
          </Box>
        </MemoryRouter>
      </ComponentsProvider>
    </AppProvider>
  </ExtensionProvider>
))
