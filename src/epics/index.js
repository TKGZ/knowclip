import {
  filter,
  map,
  flatMap,
  tap,
  ignoreElements,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { setWaveformCursor } from '../actions'
// import { getFlashcard } from '../selectors'
// import { setLocalFlashcard } from '../utils/localFlashcards'
import * as r from '../redux'
import getWaveformEpic from './getWaveform'
import waveformSelectionEpic from './waveformSelectionEpic'
import waveformStretchEpic from './waveformStretchEpic'
import detectSilenceEpic from './detectSilence'
import makeClipsEpic from './makeClips'
import exportFlashcardsEpic from './exportFlashcards'
import noteTypesEpic from './noteTypes'
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import persistStateEpic from './persistState'
import loadAudio from './loadAudio'
import media from './media'
import deleteAllCurrentFileClips from './deleteAllCurrentFileClips'
import keyboard from './keyboard'
import project from './project'

import { basename } from 'path'

// const setLocalFlashcardEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('SET_FLASHCARD_FIELD'),
//     tap(({ id, key, value }) => {
//       const flashcard = getFlashcard(state$.value, id)
//       setLocalFlashcard({ ...flashcard, [key]: value })
//     }),
//     ignoreElements()
//   )

const elementWidth = element => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const audioElement = () => document.getElementById('audioPlayer')

const setWaveformCursorEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(audioElement(), 'timeupdate').pipe(
        takeUntil(action$.pipe(ofType('CLOSE_PROJECT' /* CLOSE_MEDIA_FILE */))),
        map(e => {
          const viewBox = state$.value.waveform.viewBox

          const highlightedId = r.getHighlightedClipId(state$.value)
          const highlightedClip =
            highlightedId && r.getClip(state$.value, highlightedId)
          const timeToLoop =
            highlightedClip &&
            r.isLoopOn(state$.value) &&
            e.target.currentTime >=
              r.getSecondsAtX(state$.value, highlightedClip.end)
          if (timeToLoop) {
            e.target.currentTime = r.getSecondsAtX(
              state$.value,
              highlightedClip.start
            )
          }

          const newX = Math.round(
            timeToLoop
              ? highlightedClip.start
              : e.target.currentTime && e.target.currentTime * 50
          )
          const svgElement = document.getElementById('waveform-svg')
          // if (!svgElement) return { type: 'WHOOPS CaNT UPDATE CURSOR NOW' }
          const svgWidth = elementWidth(svgElement)
          if (newX < viewBox.xMin) {
            return setWaveformCursor(newX, {
              ...viewBox,
              xMin: Math.max(0, newX - svgWidth * 0.9),
            })
          }
          if (newX > svgWidth + viewBox.xMin) {
            return setWaveformCursor(newX, { ...viewBox, xMin: newX })
          }
          return setWaveformCursor(newX)
        })
      )
    )
  )

const waveformMousedownEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(document.getElementById('waveform-svg'), 'mousedown').pipe(
        tap(e => e.preventDefault()),
        map(mousedown => ({
          type: 'WAVEFORM_MOUSEDOWN',
          ...toWaveformCoordinates(
            mousedown,
            mousedown.currentTarget,
            r.getWaveformViewBoxXMin(state$.value)
          ),
        }))
      )
    )
  )

const highlightClipsOnAddEpic = (action$, state$) =>
  action$.pipe(
    ofType('ADD_CLIP'),
    map(({ clip: { id } }) => r.highlightClip(id))
  )

const playClipsOnHighlightEpic = (action$, state$) =>
  action$.pipe(
    ofType('HIGHLIGHT_CLIP'),
    filter(({ id }) => Boolean(id)),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    tap(([{ id: clipId } /*, { audioElement } */]) => {
      const { start } = r.getClip(state$.value, clipId)
      const newTime = r.getSecondsAtX(state$.value, start)
      audioElement().currentTime = newTime
      //
      //
      //
      //
      //
      //
      //
      //
      //

      const input = document.querySelector('textarea:not([aria-hidden=true])')
      input && input.focus()
      //
      //
      //
      //
      //
      //
    }),
    ignoreElements()
  )

const defaultTagsEpic = (action$, state$) =>
  action$.pipe(
    ofType('ADD_FLASHCARD_TAG', 'DELETE_FLASHCARD_TAG'),
    map(({ id }) => ({
      type: 'SET_DEFAULT_TAGS',
      tags: r.getClip(state$.value, id).flashcard.tags,
    }))
  )

// const defaultTagsAudioEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('LOAD_AUDIO_SUCCESS'),
//     filter(({ file }) => file),
//     map(({ id }) => ({
//       type: 'SET_DEFAULT_TAGS',
//       tags: [basename(r.getCurrentFileName(state$.value))],
//     }))
//   )

export default combineEpics(
  loadAudio,
  media,
  getWaveformEpic,
  // setLocalFlashcardEpic,
  setWaveformCursorEpic,
  // waveformMousemoveEpic,
  waveformMousedownEpic,
  // waveformMouseupEpic,
  waveformSelectionEpic,
  waveformStretchEpic,
  highlightClipsOnAddEpic,
  playClipsOnHighlightEpic,
  makeClipsEpic,
  detectSilenceEpic,
  persistStateEpic,
  exportFlashcardsEpic,
  deleteAllCurrentFileClips,
  project,
  noteTypesEpic,
  defaultTagsEpic,
  // defaultTagsAudioEpic,
  keyboard
)
