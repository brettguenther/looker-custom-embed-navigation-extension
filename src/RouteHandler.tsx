import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppContext } from './AppContext'
import { FolderNavigation } from './Sidebar/FolderNavigation'
import { Box } from '@looker/components'
import { EmbedView } from './EmbedView'

export const RouteHandler = () => {
  const location = useLocation()
  const { selectContent } = useAppContext()
  const [sharedFolderId, setSharedFolderId] = useState<string>('1')

  useEffect(() => {
    const path = location.pathname

    // Parse Shared Folder ID
    // Matches /folders/123
    const folderMatch = path.match(/\/folders\/(\d+)/)
    if (folderMatch) {
      setSharedFolderId(folderMatch[1])
    }

    // Parse Content (Dashboard or Look)
    // Matches /dashboards/123 or /looks/123
    const dashboardMatch = path.match(/\/dashboards\/(\d+)/)
    const lookMatch = path.match(/\/looks\/(\d+)/)

    if (dashboardMatch) {
      selectContent('dashboard', dashboardMatch[1])
    } else if (lookMatch) {
      selectContent('look', lookMatch[1])
    }
  }, [location.pathname, selectContent])

  return (
    <>
      <FolderNavigation sharedFolderId={sharedFolderId} />
      <Box p="u3" borderBottom="1px solid key" display="grid" height="100%">
        <EmbedView />
      </Box>
    </>
  )
}
