import React, { useCallback } from 'react'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import { Tooltip, IconButton } from '@material-ui/core'
import { LibraryAdd } from '@material-ui/icons'
import { useDispatch } from 'react-redux'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import useClozeControls from '../utils/useClozeUi'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'

const FlashcardSectionPreview = ({
  cardBases,
  cardPreviewSelection,
  mediaFile,
  fieldsToTracks,
  viewMode,
}: {
  clipsIds: string[]
  cardBases: r.SubtitlesCardBases
  cardPreviewSelection: {
    type: 'Preview'
    index: number
    item: r.SubtitlesCardBase
    cardBaseIndex: number
  }
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
  viewMode: ViewMode
}) => {
  const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(
    cardPreviewSelection.item
  )
  const fields = {} as TransliterationFlashcardFields
  for (const fieldName of cardBases.fieldNames) {
    const trackId = fieldsToTracks[fieldName]
    const text = trackId && tracksToFieldsText[trackId]
    fields[fieldName] = text || ''
  }

  const dispatch = useDispatch()
  const startEditing = useCallback(
    () => {
      dispatch(r.startEditingCards())
    },
    [dispatch]
  )

  const clozeControls = useClozeControls({
    onNewClozeCard: useCallback(
      deletion => {
        dispatch(r.newClipFromSubtitlesChunk(cardPreviewSelection, deletion))
      },
      [cardPreviewSelection, dispatch]
    ),
  })

  return (
    <FlashcardSectionDisplay
      className={css.preview}
      mediaFile={mediaFile}
      fieldsToTracks={fieldsToTracks}
      fields={fields}
      viewMode={viewMode}
      clozeControls={clozeControls}
      menuItems={
        <>
          <Tooltip title="Create flashcard from these subtitles (E key)">
            <IconButton className={css.editCardButton} onClick={startEditing}>
              <LibraryAdd />
            </IconButton>
          </Tooltip>
          {(fields.transcription || '').trim() && (
            <ClozeButtons controls={clozeControls} />
          )}
        </>
      }
    />
  )
}

export default FlashcardSectionPreview