import { DeepPartial } from 'redux'
import { trimClozeRangeOverlaps } from '../utils/clozeRanges'
import A from '../types/ActionType'

export const clipsActions = {
  addClip: (
    clip: Clip,
    flashcard: Flashcard,
    startEditing: boolean = false
  ) => ({
    type: A.addClip,
    clip,
    flashcard,
    startEditing,
  }),

  addClips: (
    clips: Array<Clip>,
    flashcards: Array<Flashcard>,
    fileId: MediaFileId
  ) => ({
    type: A.addClips,
    clips,
    flashcards,
    fileId,
  }),

  selectWaveformItem: (selection: WaveformSelection | null) => ({
    type: A.selectWaveformItem,
    selection,
  }),

  highlightLeftClipRequest: () => ({
    type: A.highlightLeftClipRequest,
  }),

  highlightRightClipRequest: () => ({
    type: A.highlightRightClipRequest,
  }),

  editClip: (
    id: ClipId,
    override: DeepPartial<Clip> | null,
    flashcardOverride: DeepPartial<Flashcard> | null
  ) => ({
    type: A.editClip,
    id,
    override,
    flashcardOverride,
  }),

  editClips: (
    edits: {
      id: ClipId
      override: DeepPartial<Clip> | null
      flashcardOverride: DeepPartial<Flashcard> | null
    }[]
  ) => ({
    type: A.editClips,
    edits,
  }),

  mergeClips: (ids: Array<ClipId>, newSelection: WaveformSelection) => ({
    type: A.mergeClips,
    ids,
    newSelection,
  }),

  setFlashcardField: (
    id: ClipId,
    key: FlashcardFieldName,
    value: string,
    caretLocation: number
  ) => ({
    type: A.setFlashcardField,
    id,
    key,
    value,
    caretLocation,
  }),

  addFlashcardTag: (id: ClipId, text: string) => ({
    type: A.addFlashcardTag,
    id,
    text,
  }),

  deleteFlashcardTag: (id: ClipId, index: number, tag: string) => ({
    type: A.deleteFlashcardTag,
    id,
    index,
    tag,
  }),

  deleteCard: (id: ClipId) => ({
    type: A.deleteCard,
    id,
  }),

  deleteCards: (ids: Array<ClipId>) => ({
    type: A.deleteCards,
    ids,
  }),
}

const clearWaveformSelection = () => clipsActions.selectWaveformItem(null)

const addFlashcardImage = (id: ClipId, seconds?: number) => {
  const image: FlashcardImage = seconds
    ? {
        id,
        type: 'VideoStillImage',
        seconds,
      }
    : { id, type: 'VideoStillImage' }
  return clipsActions.editClip(id, null, {
    image,
  })
}

const removeFlashcardImage = (id: ClipId) =>
  clipsActions.editClip(id, null, { image: null })

const addClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  deletion: ClozeDeletion
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(
      currentCloze,
      deletion,
      currentCloze.length
    ).filter(({ ranges }) => ranges.length),
  })

const editClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number,
  ranges: ClozeDeletion['ranges']
) =>
  clipsActions.editClip(id, null, {
    cloze: trimClozeRangeOverlaps(currentCloze, { ranges }, clozeIndex),
  })

const removeClozeDeletion = (
  id: ClipId,
  currentCloze: ClozeDeletion[],
  clozeIndex: number
) =>
  clipsActions.editClip(id, null, {
    cloze: currentCloze.filter((c, i) => i !== clozeIndex),
  })

export const compositeClipsActions = {
  clearWaveformSelection,
  addFlashcardImage,
  removeFlashcardImage,
  addClozeDeletion,
  editClozeDeletion,
  removeClozeDeletion,
}
