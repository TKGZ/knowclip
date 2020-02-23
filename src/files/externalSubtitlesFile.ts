import * as r from '../redux'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export default {
  openRequest: async ({ file }, filePath, state, effects) => [
    r.openFileSuccess(file, filePath),
  ],

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      if (isVtt(filePath)) {
        const chunks = await effects.getSubtitlesFromFile(state, filePath)
        const track = newExternalSubtitlesTrack(
          validatedFile.id,
          validatedFile.parentId,
          chunks,
          filePath,
          filePath
        )
        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )
        if (r.getCurrentFileId(state) !== validatedFile.parentId) return []

        return [
          ...(mediaFile && !mediaFile.subtitles.some(s => s.id === track.id)
            ? [
                r.addSubtitlesTrack(track),
                ...(state.dialog.queue.some(d => d.type === 'SubtitlesClips')
                  ? []
                  : [r.linkSubtitlesDialog(validatedFile, mediaFile.id)]),
              ]
            : []),
          r.mountSubtitlesTrack(track), // maybe should only do this after linkSubtitlesDialog in case this is first time mounting,
        ]
      } else {
        if (validatedFile.parentId !== r.getCurrentFileId(state)) return []
        const vttFile = r.getFile(
          state,
          'VttConvertedSubtitlesFile',
          validatedFile.id
        )
        return [
          r.openFileRequest(
            vttFile || {
              type: 'VttConvertedSubtitlesFile',
              id: validatedFile.id,
              parentId: validatedFile.id, // not needed?
              parentType: 'ExternalSubtitlesFile',
            }
          ),
        ]
      }
    },
  ],

  locateRequest: async ({ file, message }, availability, state, effects) => {
    return [r.fileSelectionDialog(message, file)]
  },

  locateSuccess: null,

  deleteRequest: [
    async (file, availability, descendants, state, effects) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],

  deleteSuccess: [
    async (action, state, effects) => {
      const mediaFile = Object.values(state.files.MediaFile).find(
        m => m && m.subtitles.some(({ id }) => id === action.file.id)
      )
      return mediaFile
        ? [r.deleteSubtitlesTrackFromMedia(action.file.id, mediaFile.id)]
        : []
    },
  ],
} as FileEventHandlers<ExternalSubtitlesFile>
