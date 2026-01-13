import React, { useState } from 'react'
import {
  NavTree,
  NavTreeItem,
  Tabs2,
  Tab2,
  InputSearch,
  SpaceVertical,
  Spinner,
  Button,
  Span,
  Box,
  Popover,
  IconButton
} from '@looker/components'
import { Folder, Dashboard, Visibility, DriveFileMove } from '@styled-icons/material'
import useSdk from '../hooks/useSdk'
import useSWR from 'swr'
import { useDebounce } from '../hooks/useDebounce'
import { IFolder, IDashboard, ILook, IContentSearch } from '@looker/sdk'
import { useAppContext } from '../AppContext'
import { MoveContentDialog } from './MoveContentDialog'

interface FolderTreeProps {
  folder_id: string
  folder_name?: string
  default_open?: boolean
  flatten?: boolean
  onMove: (content: { id: string, type: 'dashboard' | 'look', title: string }) => void
}

const FolderTree = ({ folder_id, folder_name, default_open = false, flatten = false, onMove }: FolderTreeProps) => {
  const sdk = useSdk()
  const { selectContent } = useAppContext()

  const { data: folder } = useSWR(
    !folder_name ? ['folder', folder_id] : null,
    () => sdk.ok(sdk.folder(folder_id))
  )

  const name = folder_name || folder?.name

  const { data: childFolders } = useSWR(['folder_children', folder_id], () => sdk.ok(sdk.folder_children({ folder_id: folder_id, fields: "id,name,child_count" })))
  // TODO: include description as info bubble
  const { data: dashboards } = useSWR(['folder_dashboards', folder_id], () => sdk.ok(sdk.folder_dashboards(folder_id, "id,title")))
  // TODO: include description as info bubble
  const { data: looks } = useSWR(['folder_looks', folder_id], () => sdk.ok(sdk.folder_looks(folder_id, "id,title")))

  if (!name && !folder) {
    return (
      <Box p="u2" display="flex" justifyContent="center">
        <Spinner size={20} />
      </Box>
    )
  }

  const contentCount = (dashboards?.length || 0) + (looks?.length || 0)
  const hasChildFolders = (childFolders && childFolders.length > 0) || contentCount > 0

  const items = (
    <>
      {childFolders?.map((childFolder: IFolder) => (
        <FolderTree key={childFolder.id} folder_id={childFolder.id!} folder_name={childFolder.name!} onMove={onMove} />
      ))}
      {dashboards && dashboards.length > 0 && (
        <NavTree defaultOpen={false} label="Dashboards">
          {dashboards.map((dashboard: IDashboard) => (
            <NavTreeItem
              key={`dashboard-${dashboard.id}`}
              icon={<Dashboard />}
              onClick={() => selectContent('dashboard', dashboard.id!)}
              detail={
                <IconButton
                  icon={<DriveFileMove />}
                  label="Move"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onMove({ id: dashboard.id!, type: 'dashboard', title: dashboard.title! })
                  }}
                />
              }
            >
              {dashboard.title}
            </NavTreeItem>
          ))}
        </NavTree>
      )}
      {looks && looks.length > 0 && (
        <NavTree defaultOpen={false} label="Looks">
          {looks.map((look: ILook) => (
            <NavTreeItem
              key={`look-${look.id}`}
              icon={<Visibility />}
              onClick={() => selectContent('look', String(look.id!))}
              detail={
                <IconButton
                  icon={<DriveFileMove />}
                  label="Move"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onMove({ id: String(look.id!), type: 'look', title: look.title! })
                  }}
                />
              }
            >
              {look.title}
            </NavTreeItem>
          ))}
        </NavTree>
      )}
    </>
  )

  if (flatten) {
    if (!childFolders && !dashboards && !looks) {
      return (
        <Box p="u4" display="flex" justifyContent="center">
          <Spinner size={30} />
        </Box>
      )
    }
    return items
  }

  if (!hasChildFolders) {
    return (
      <NavTreeItem
        icon={<Folder />}
        detail={contentCount > 0 ? String(contentCount) : undefined}
      >
        <Span>{name}</Span>
      </NavTreeItem>
    )
  }

  return (
    <NavTree
      label={<Span>{name}</Span>}
      defaultOpen={default_open}
      icon={<Folder />}
      detail={String(contentCount)}
    >
      {items}
    </NavTree>
  )
}

interface FolderNavigationProps {
  sharedFolderId?: string
}

export const FolderNavigation = ({ sharedFolderId = "1" }: FolderNavigationProps) => {
  const sdk = useSdk()
  const { selectContent } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)
  const [moveContent, setMoveContent] = useState<{ id: string, type: 'dashboard' | 'look', title: string } | null>(null)

  const handleMove = (content: { id: string, type: 'dashboard' | 'look', title: string }) => {
    setMoveContent(content)
  }

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce<string>(search, 500)

  const { data: debounced_search_results, isLoading: isSearchLoading } = useSWR(
    debouncedSearch ? ['search_content', debouncedSearch] : null,
    () => sdk.ok(sdk.search_content({ terms: debouncedSearch, fields: "content_id,type,title,folder_id,folder_name" }))
  )

  const { data: my_personal_folder } = useSWR('personal_folder', () => sdk.ok(sdk.folder('personal', 'name,id,child_count,dashboards(id),looks(id)')))

  const hasPersonalContent = my_personal_folder && (
    (my_personal_folder.child_count || 0) > 0 ||
    (my_personal_folder.dashboards?.length || 0) > 0 ||
    (my_personal_folder.looks?.length || 0) > 0
  )

  const tabs = [
    hasPersonalContent ? (
      <Tab2 id="my_personal_folder" label="My Personal Folder" key="my_personal_folder">
        {my_personal_folder?.id ? (
          <SpaceVertical gap="none">
            <FolderTree
              folder_id={my_personal_folder.id}
              folder_name={my_personal_folder.name}
              default_open={true}
              flatten={true}
              onMove={handleMove}
            />
          </SpaceVertical>
        ) : (
          <Box p="u4" display="flex" justifyContent="center">
            <Spinner size={30} />
          </Box>
        )}
      </Tab2>
    ) : null,
    <Tab2 id="shared_folder" label="Shared Folder" key="shared_folder">
      <FolderTree folder_id={sharedFolderId} default_open={true} onMove={handleMove} />
    </Tab2>,
    <Tab2 id="search" label="Search" key="search">
      <SpaceVertical gap="u3" width="100%">
        <InputSearch
          autoFocus
          value={search}
          placeholder="Search for content"
          onChange={(value: string) => {
            setSearch(value)
          }}
        />
        {isSearchLoading && (
          <Box display="flex" justifyContent="center">
            <Spinner size={30} />
          </Box>
        )}
        {!debounced_search_results?.length &&
          !isSearchLoading &&
          debouncedSearch.length ? (
          <Span>No content found</Span>
        ) : null}
        {!!debounced_search_results?.length && (
          <SpaceVertical gap="none" width="100%">
            {debounced_search_results.map((result: IContentSearch) => {
              if (result.type === 'dashboard') {
                return (
                  <NavTreeItem
                    key={`dashboard-${result.content_id}`}
                    icon={<Dashboard />}
                    onClick={() => selectContent('dashboard', result.content_id!)}
                    detail={
                      <IconButton
                        icon={<DriveFileMove />}
                        label="Move"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMove({ id: result.content_id!, type: 'dashboard', title: result.title! })
                        }}
                      />
                    }
                  >
                    {result.title}
                  </NavTreeItem>
                )
              }
              if (result.type === 'look') {
                return (
                  <NavTreeItem
                    key={`look-${result.content_id}`}
                    icon={<Visibility />}
                    onClick={() => selectContent('look', result.content_id!)}
                    detail={
                      <IconButton
                        icon={<DriveFileMove />}
                        label="Move"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMove({ id: result.content_id!, type: 'look', title: result.title! })
                        }}
                      />
                    }
                  >
                    {result.title}
                  </NavTreeItem>
                )
              }
              return null
            })}
          </SpaceVertical>
        )}
      </SpaceVertical>
    </Tab2>
  ].filter((t): t is React.ReactElement => !!t)

  const content = (
    <Tabs2>
      {tabs}
    </Tabs2>
  )

  return (
    <>
      <Popover content={content} isOpen={isOpen} setOpen={setIsOpen}>
        <Button iconBefore={<Folder />}>Navigate</Button>
      </Popover>
      {moveContent && (
        <MoveContentDialog
          isOpen={!!moveContent}
          onClose={() => setMoveContent(null)}
          contentId={moveContent.id}
          contentType={moveContent.type}
          contentTitle={moveContent.title}
        />
      )}
    </>
  )
}
