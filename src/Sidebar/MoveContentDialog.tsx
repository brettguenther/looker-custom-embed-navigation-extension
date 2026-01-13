import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Button,
  SpaceVertical,
  InputSearch,
  Spinner,
  Span,
  Space,
  List,
  ListItem
} from '@looker/components'
import useSdk from '../hooks/useSdk'
import useSWR, { useSWRConfig } from 'swr'
import { useDebounce } from '../hooks/useDebounce'

interface MoveContentDialogProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  contentType: 'dashboard' | 'look'
  contentTitle: string
}

export const MoveContentDialog = ({
  isOpen,
  onClose,
  contentId,
  contentType,
  contentTitle
}: MoveContentDialogProps) => {
  const sdk = useSdk()
  const { mutate } = useSWRConfig()
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const debouncedSearch = useDebounce<string>(search, 300)

  const { data: searchResults, isLoading: isSearchLoading } = useSWR(
    debouncedSearch ? ['search_folders', debouncedSearch] : null,
    () => sdk.ok(sdk.search_folders({ name: debouncedSearch }))
  )

  const handleMove = async () => {
    if (!selectedFolder) return

    setIsMoving(true)
    try {
      if (contentType === 'dashboard') {
        await sdk.ok(sdk.move_dashboard(contentId, selectedFolder.id))
      } else {
        await sdk.ok(sdk.move_look(contentId, selectedFolder.id))
      }

      // Refresh the folders to show the updated content
      await mutate(['folder_children', selectedFolder.id])
      // We might want to refresh the source folder too if we knew it, 
      // but without it, global cache invalidation is tricky.
      // Ideally we invalidate where it came from.

      onClose()
      setSearch('')
      setSelectedFolder(null)
    } catch (error) {
      console.error('Failed to move content', error)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} width="500px">
      <DialogHeader>Move "{contentTitle}"</DialogHeader>
      <DialogContent>
        <SpaceVertical gap="u4">
          <Span>Select a destination folder:</Span>
          <InputSearch
            autoFocus
            value={search}
            placeholder="Search for a folder..."
            onChange={setSearch}
          />

          {selectedFolder && (
            <Span color="inform">Selected: {selectedFolder.name}</Span>
          )}

          <SpaceVertical gap="u1" maxHeight="300px" overflowY="auto">
            {isSearchLoading && <Spinner />}
            {searchResults?.map((folder) => (
              <List
                key={folder.id}
              >
                <ListItem
                  onClick={() => setSelectedFolder({ id: folder.id!, name: folder.name! })}
                  selected={selectedFolder?.id === folder.id}
                  itemRole="button"
                >
                  {folder.name}
                </ListItem>
              </List>
            ))}
          </SpaceVertical>

          <Space>
            <Button disabled={!selectedFolder || isMoving} onClick={handleMove}>
              {isMoving ? 'Moving...' : 'Move'}
            </Button>
            <Button color="neutral" disabled={isMoving} onClick={onClose}>
              Cancel
            </Button>
          </Space>
        </SpaceVertical>
      </DialogContent>
    </Dialog>
  )
}
