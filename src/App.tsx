import React from 'react'
import { ExtensionProvider } from '@looker/extension-sdk-react'
import { hot } from 'react-hot-loader/root'
import { ComponentsProvider } from '@looker/components'
import { MemoryRouter } from 'react-router-dom'
import AppProvider from './AppContext'
import useExtensionSdk from './hooks/useExtensionSdk'
import { RouteHandler } from './RouteHandler'

const AppContent = () => {
  const extensionSdk = useExtensionSdk()
  // Get initial route from SDK, fallback to '/'
  // The route might come in as /folders/123, which is what we want
  const initialRoute = extensionSdk.lookerHostData?.route || '/'

  return (
    // @ts-ignore
    <MemoryRouter initialEntries={[initialRoute]}>
      <RouteHandler />
    </MemoryRouter>
  )
}

export const App = hot(() => (
  <ExtensionProvider>
    <AppProvider>
      <ComponentsProvider>
        <AppContent />
      </ComponentsProvider>
    </AppProvider>
  </ExtensionProvider>
))
