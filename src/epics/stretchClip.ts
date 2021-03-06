import { map, switchMap, takeUntil, takeLast } from 'rxjs/operators'
import { fromEvent, from, of, merge, empty } from 'rxjs'
import r from '../redux'
import { toWaveformX } from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

const stretchClipEpic: AppEpic = (
  action$,
  state$,
  { window, getWaveformSvgElement, document, setCurrentTime }
) => {
  const clipMousedowns = fromEvent<WaveformMousedownEvent>(
    document,
    'waveformMousedown'
  ).pipe(
    switchMap(({ milliseconds }) => {
      const x = r.getXAtMilliseconds(state$.value, milliseconds)
      const edge = r.getClipEdgeAt(state$.value, x)
      return edge ? of({ x, edge }) : empty()
    }),
    switchMap((mousedownData) => {
      const {
        edge: { key, id },
      } = mousedownData
      const pendingStretches = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        takeUntil(fromEvent(window, 'mouseup')),
        map((mousemove) => {
          const svgElement = getWaveformSvgElement()
          if (!svgElement) throw new Error('Waveform disappeared')
          return r.setPendingStretch({
            id,
            originKey: key,
            end: toWaveformX(
              mousemove,
              svgElement,
              r.getWaveformViewBoxXMin(state$.value)
            ),
          })
        })
      )

      return merge(
        pendingStretches,
        pendingStretches.pipe(
          takeLast(1),
          switchMap((lastPendingStretch) => {
            const {
              stretch: { id, originKey, end },
            } = lastPendingStretch
            const stretchedClip = r.getClip(state$.value, id)

            const waveformItems = r.getWaveformItems(state$.value)
            const stretchedClipItem =
              stretchedClip &&
              waveformItems.find(
                (item) => item.type === 'Clip' && item.id === stretchedClip.id
              )
            // if pendingStretch.end is inside a clip separate from stretchedClip,
            // take the start from the earlier and the end from the later,
            // use those as the new start/end of stretchedClip,
            // and delete the separate clip.

            const previousClipId = r.getPreviousClipId(state$.value, id)
            const previousClip =
              previousClipId && r.getClip(state$.value, previousClipId)
            if (previousClip && previousClipId && end <= previousClip.end) {
              setCurrentTime(r.getSecondsAtX(state$.value, previousClip.start))

              return from([
                r.clearPendingStretch(),
                ...(stretchedClipItem?.type === 'Clip'
                  ? [
                      r.mergeClips([id, previousClipId], {
                        type: 'Clip',
                        id: stretchedClipItem.id,
                        index: stretchedClipItem.index,
                      }),
                    ]
                  : []),
              ])
            }

            const nextClipId = r.getNextClipId(state$.value, id)
            const nextClip = nextClipId && r.getClip(state$.value, nextClipId)
            if (nextClip && nextClipId && end >= nextClip.start) {
              if (stretchedClip)
                setCurrentTime(
                  r.getSecondsAtX(state$.value, stretchedClip.start)
                )

              return from([
                r.clearPendingStretch(),
                ...(stretchedClipItem?.type === 'Clip'
                  ? [
                      r.mergeClips([id, nextClipId], {
                        type: 'Clip',
                        id: stretchedClipItem.id,
                        index: stretchedClipItem.index,
                      }),
                    ]
                  : []),
              ])
            }

            if (
              originKey === 'start' &&
              stretchedClip &&
              stretchedClip.end > end
            ) {
              const start = Math.min(end, stretchedClip.end - r.CLIP_THRESHOLD)

              const newCard = r.getNewFlashcardForStretchedClip(
                state$.value,
                r.getCurrentNoteType(state$.value) as NoteType,
                stretchedClip,
                r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
                { start, end: stretchedClip.end },
                'PREPEND'
              )
              setCurrentTime(r.getSecondsAtX(state$.value, start))
              return from([
                r.clearPendingStretch(),
                r.editClip(
                  id,
                  {
                    start,
                  },
                  newCard !==
                    (r.getFlashcard(
                      state$.value,
                      stretchedClip.id
                    ) as Flashcard)
                    ? newCard
                    : null
                ),
              ])
            }

            if (
              originKey === 'end' &&
              stretchedClip &&
              end > stretchedClip.start
            ) {
              const newCard = r.getNewFlashcardForStretchedClip(
                state$.value,
                r.getCurrentNoteType(state$.value) as NoteType,
                stretchedClip,
                r.getFlashcard(state$.value, stretchedClip.id) as Flashcard,
                { end, start: stretchedClip.start },
                'APPEND'
              )

              return from([
                r.clearPendingStretch(),
                r.editClip(
                  id,
                  {
                    end: Math.max(end, stretchedClip.start + r.CLIP_THRESHOLD),
                  },
                  newCard !==
                    (r.getFlashcard(
                      state$.value,
                      stretchedClip.id
                    ) as Flashcard)
                    ? newCard
                    : null
                ),
              ])
            }

            return from([r.clearPendingStretch()])
          })
        )
      )
    })
  )
  return clipMousedowns
}

export default stretchClipEpic
