import React, { useEffect, useRef, useState, useContext } from 'react'
import { LookerEmbedSDK } from '@looker/embed-sdk'
import useExtensionSdk from './hooks/useExtensionSdk'
import { Box, MessageBar, Spinner } from '@looker/components'
import { useAppContext } from './AppContext'
import styled from 'styled-components'

const EmbedContainer = styled.div`
  width: 100%;
  height: 100%;
  & > iframe {
    width: 100%;
    height: 100%;
    display: block;
    border: none;
  }
`

export const EmbedView = () => {
  const extensionSdk = useExtensionSdk();
  const { selectedContent } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const embedContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedContent || !embedContainerRef.current) return

    setLoading(true)
    setError(null)

    // Clear previous content
    embedContainerRef.current.innerHTML = ''

    const { type, id } = selectedContent
    let embedBuilder

    const hostUrl = extensionSdk.lookerHostData?.hostUrl

    if (!hostUrl) {
      setError('Failed to load content. Please ensure you have permission to view this item.')
      setLoading(false)
      return
    }

    LookerEmbedSDK.init(hostUrl)

    if (type === 'dashboard') {
      embedBuilder = LookerEmbedSDK.createDashboardWithId(id)
    } else if (type === 'look') {
      embedBuilder = LookerEmbedSDK.createLookWithId(Number(id))
    }

    if (embedBuilder) {
      const paramsObj: any = {
        embed_domain: hostUrl
      }
      embedBuilder
        .appendTo(embedContainerRef.current)
        .withClassName('looker-embed')
        .withParams(paramsObj)
        .on('dashboard:loaded', () => setLoading(false))
        .on('dashboard:run:start', () => setLoading(false))
        .on('look:run:start', () => setLoading(false))
        .on('look:ready', () => setLoading(false))
        .on('*', (event: any) => console.log('Embed event:', JSON.stringify(event)))
        .build()
        .connect()
        // .then(() => setLoading(false))
        .catch((err) => {
          console.error('Embed error:', err)
          setError('Failed to load content. Please ensure you have permission to view this item.')
          setLoading(false)
        })
    }
  }, [selectedContent])

  if (!selectedContent) {
    return (
      <Box p="u8" width="100%" display="flex" justifyContent="center">
        <MessageBar intent="info">Select a dashboard or look from the folder navigation to view it here.</MessageBar>
      </Box>
    )
  }

  return (
    <Box width="100%" height="100%" position="relative" p="u4">
      {loading && (
        <Box position="absolute" top="0" left="0" right="0" display="flex" justifyContent="center" mt="u10" zIndex={1}>
          <Spinner />
        </Box>
      )}
      {error && (
        <MessageBar intent="critical">{error}</MessageBar>
      )}
      <EmbedContainer ref={embedContainerRef} />
    </Box>
  )
}
