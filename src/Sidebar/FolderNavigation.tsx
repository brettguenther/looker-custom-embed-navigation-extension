import React, { useState } from 'react'
import {
  Tree,
  TreeItem,
  Tabs2,
  Tab2,
  InputSearch,
  SpaceVertical,
  Spinner,
  Button,
  Span,
  Box,
  Popover
} from '@looker/components'
import { Folder, Dashboard, Visibility } from '@styled-icons/material'
import useSdk from '../hooks/useSdk'
import useSWR from 'swr'
import { useDebounce } from '../hooks/useDebounce'
import { IFolder, IDashboard, ILook } from '@looker/sdk'
import { useAppContext } from '../AppContext'

interface FolderTreeProps {
  folder_id: string
  folder_name?: string
  default_open?: boolean
  flatten?: boolean
}

const FolderTree = ({ folder_id, folder_name, default_open = false, flatten = false }: FolderTreeProps) => {
  const sdk = useSdk()
  const { selectContent } = useAppContext()

  // If we don't have the name from parent, we might need to fetch folder metadata.
  // Ideally parent passes name. If flatten=true, we might generally need to fetch to be safe or rely on what's passed.
  // For 'personal' folder, we often need to fetch to get the real ID if we passed "personal", or just rely on 'personal'.
  // But search_folders needs ID. 'personal' string usually works for sdk.folder('personal').
  // Let's rely on SWR caching.

  const { data: folder } = useSWR(
    !folder_name ? ['folder', folder_id] : null,
    () => sdk.ok(sdk.folder(folder_id))
  )

  const name = folder_name || folder?.name

  // Fetch content to determine counts and children
  const { data: children } = useSWR(['folder_children', folder_id], () => sdk.ok(sdk.search_folders({ parent_id: folder_id })))
  const { data: dashboards } = useSWR(['folder_dashboards', folder_id], () => sdk.ok(sdk.search_dashboards({ folder_id })))
  const { data: looks } = useSWR(['folder_looks', folder_id], () => sdk.ok(sdk.search_looks({ folder_id })))

  // Loading state: If we need name and don't have it, or if we are loading content
  // Actually, for Tree item, we want to show the Name immediately if possible.
  // If we don't have name (root or loose node), wait for folder.
  if (!name && !folder) {
    return (
      <Box p="u2" display="flex" justifyContent="center">
        <Spinner size={20} />
      </Box>
    )
  }

  const contentCount = (dashboards?.length || 0) + (looks?.length || 0)
  const hasChildren = (children && children.length > 0) || contentCount > 0

  const items = (
    <>
      {/* Subfolders */}
      {children?.map((child) => (
        <FolderTree key={child.id} folder_id={child.id!} folder_name={child.name!} />
      ))}

      {/* Dashboards */}
      {dashboards?.map((dashboard: IDashboard) => (
        <TreeItem
          key={`dashboard-${dashboard.id}`}
          icon={<Dashboard />}
          onClick={() => selectContent('dashboard', dashboard.id!)}
        >
          {dashboard.title}
        </TreeItem>
      ))}

      {/* Looks */}
      {looks?.map((look: ILook) => (
        <TreeItem
          key={`look-${look.id}`}
          icon={<Visibility />}
          onClick={() => selectContent('look', String(look.id!))}
        >
          {look.title}
        </TreeItem>
      ))}
    </>
  )

  if (flatten) {
    // If flattened, we just return the items without the wrapper Tree/TreeItem
    if (!children && !dashboards && !looks) {
      return (
        <Box p="u4" display="flex" justifyContent="center">
          <Spinner size={30} />
        </Box>
      )
    }
    return items
  }

  if (!hasChildren) {
    return (
      <TreeItem
        icon={<Folder />}
        detail={contentCount > 0 ? String(contentCount) : undefined}
      >
        <Span>{name}</Span>
      </TreeItem>
    )
  }

  return (
    <Tree
      label={<Span>{name}</Span>}
      defaultOpen={default_open}
      icon={<Folder />}
      detail={String(contentCount)}
    >
      {items}
    </Tree>
  )
}

interface FolderNavigationProps {
  sharedFolderId?: string
}

export const FolderNavigation = ({ sharedFolderId = "1" }: FolderNavigationProps) => {
  const sdk = useSdk()
  const [isOpen, setIsOpen] = useState(false)

  // Search State
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce<string>(search, 500)

  const { data: debounced_search_folders, isLoading: isSearchLoading } = useSWR(
    debouncedSearch ? ['search_folders', debouncedSearch] : null,
    () => sdk.ok(sdk.search_folders({ name: debouncedSearch }))
  )

  const { data: my_personal_folder } = useSWR('personal_folder', () => sdk.ok(sdk.folder('personal')))

  const content = (
    <Tabs2>
      <Tab2 id="my_personal_folder" label="My Personal Folder">
        {/* Flattened Personal Folder View */}
        {my_personal_folder?.id ? (
          <SpaceVertical gap="none">
            <FolderTree
              folder_id={my_personal_folder.id}
              folder_name={my_personal_folder.name} 
              default_open={true}
              flatten={true} 
            />
          </SpaceVertical>
        ) : (
          <Box p="u4" display="flex" justifyContent="center">
            <Spinner size={30} />
          </Box>
        )}
      </Tab2>
      <Tab2 id="shared_folder" label="Shared Folder">
        <FolderTree folder_id={sharedFolderId} default_open={true} />
      </Tab2>
      <Tab2 id="search" label="Search">
        <SpaceVertical gap="u3" width="100%">
          <InputSearch
            autoFocus
            value={search}
            placeholder="Search for a folder"
            onChange={(value: string) => {
              setSearch(value)
            }}
          />
          {isSearchLoading && (
            <Box display="flex" justifyContent="center">
              <Spinner size={30} />
            </Box>
          )}
          {!debounced_search_folders?.length &&
            !isSearchLoading &&
            debouncedSearch.length ? (
            <Span>No folders found</Span>
          ) : null}
          {!!debounced_search_folders?.length && (
            <SpaceVertical gap="none" width="100%">
              {debounced_search_folders.map((folder: IFolder) => (
                <FolderTree
                  key={folder.id}
                  folder_id={folder.id!}
                  folder_name={folder.name!}
                  default_open={false}
                />
              ))}
            </SpaceVertical>
          )}
        </SpaceVertical>
      </Tab2>
    </Tabs2>
  )

  return (
    <Popover content={content} isOpen={isOpen} setOpen={setIsOpen}>
      <Button iconBefore={<Folder />}>Navigate</Button>
    </Popover>
  )
}
