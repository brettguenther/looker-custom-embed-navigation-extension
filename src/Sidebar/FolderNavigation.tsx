import React, { useState } from 'react'
import {
  Tree,
  TreeItem,
  Tabs2,
  Tab2,
  InputSearch,
  SpaceVertical,
  Spinner,
  Text,
  Popover,
  Button,
  Span,
  Box
} from '@looker/components'
import { Folder, Dashboard, Visibility } from '@styled-icons/material'
import useSdk from '../hooks/useSdk'
import useExtensionSdk from '../hooks/useExtensionSdk'
import useSWR from 'swr'
import { useLocation } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { IFolder, IDashboard, ILook } from '@looker/sdk'
import { useAppContext } from '../AppContext'

const FolderTree = ({ folder_id, default_open = false }: { folder_id: string, default_open?: boolean }) => {
  const sdk = useSdk()
  const { selectContent } = useAppContext()

  const { data: folder } = useSWR(['folder', folder_id], () => sdk.ok(sdk.folder(folder_id)))
  const { data: children } = useSWR(['folder_children', folder_id], () => sdk.ok(sdk.search_folders({ parent_id: folder_id })))

  const { data: dashboards } = useSWR(['folder_dashboards', folder_id], () => sdk.ok(sdk.search_dashboards({ folder_id })))
  const { data: looks } = useSWR(['folder_looks', folder_id], () => sdk.ok(sdk.search_looks({ folder_id })))

  if (!folder) return <Spinner size={20} />

  const hasChildren = (children && children.length > 0) || (dashboards && dashboards.length > 0) || (looks && looks.length > 0)

  const label = <Span>{folder.name}</Span>

  if (!hasChildren) {
    return (
      <TreeItem
        icon={<Folder />}
        detail={folder.id}
      >
        {label}
      </TreeItem>
    )
  }

  return (
    <Tree
      label={label}
      defaultOpen={default_open}
      icon={<Folder />}
      detail={folder.id}
    >
      {/* Subfolders */}
      {children?.map((child) => (
        <FolderTree key={child.id} folder_id={child.id!} />
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
    </Tree>
  )
}

export const FolderNavigation = () => {
  const sdk = useSdk()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const sharedRootId = queryParams.get("shared_folder") || "1"
  const [isOpen, setIsOpen] = useState(false)

  // Search State
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce<string>(search, 500)
  const { selectContent } = useAppContext()

  const { data: debounced_search_folders, isLoading: isSearchLoading } = useSWR(
    debouncedSearch ? ['search_folders', debouncedSearch] : null,
    () => sdk.ok(sdk.search_folders({ name: debouncedSearch }))
  )

  const { data: my_personal_folder } = useSWR('personal_folder', () => sdk.ok(sdk.folder('personal')))

  const content = (
    <Tabs2>
      <Tab2 value="my_personal_folder" label="My Personal Folder">
        {my_personal_folder?.id && (
          <FolderTree
            folder_id={my_personal_folder.id}
            default_open={true}
          />
        )}
      </Tab2>
      <Tab2 value="shared_folder" label="Shared Folder">
        <FolderTree folder_id={sharedRootId} default_open={true} />
      </Tab2>
      <Tab2 value="search" label="Search">
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
