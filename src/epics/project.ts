import {
  flatMap,
  debounce,
  map,
  filter,
  mergeAll,
  switchMap,
  catchError,
  ignoreElements,
  tap,
} from 'rxjs/operators'
import { timer, of, from, Observable, empty } from 'rxjs'
import { ofType, combineEpics, StateObservable } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import parseProject from '../utils/parseProject'
import { saveProjectToLocalStorage } from '../utils/localStorage'
import { AppEpic } from '../types/AppEpic'
import moment from 'moment'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const createProject: AppEpic = (action$, state$, effects) =>
  action$.ofType<CreateProject>(A.CREATE_PROJECT).pipe(
    switchMap(({ project, filePath }) => {
      return from(
        writeFile(
          filePath,
          JSON.stringify(r.getProject(state$.value, project), null, 2),
          'utf8'
        )
      ).pipe(
        flatMap(() =>
          from([r.addAndOpenFile(project, filePath), r.setWorkIsUnsaved(false)])
        )
      )
    }),
    catchError(err =>
      of(
        r.simpleMessageSnackbar(
          'Error creating project file: ' + err.toString()
        )
      )
    )
  )

const addAndOpenProject = async (
  filePath: string,
  state$: StateObservable<AppState>
): Promise<Observable<Action>> => {
  try {
    const projectJson = ((await readFile(filePath)) as unknown) as string
    const project = parseProject(projectJson)
    if (!project)
      return of(
        r.simpleMessageSnackbar(
          'Could not read project file. Please make sure your software is up to date and try again.'
        )
      )

    const mediaFiles = project.mediaFiles.map(({ id }) => id)
    const projectFile: ProjectFile = {
      id: project.id,
      type: 'ProjectFile',
      lastSaved: project.timestamp,
      lastOpened: project.lastOpened,
      name: project.name,
      mediaFileIds: mediaFiles,
      error: null,
      noteType: project.noteType,
    }
    return from([
      r.addFile(projectFile, filePath),
      r.openProject(
        projectFile,
        project.clips,
        moment()
          .utc()
          .format()
      ),
      r.openFileSuccess(projectFile, filePath),
    ])
  } catch (err) {
    console.error(err)
    return of(
      r.simpleMessageSnackbar(`Error opening project file: ${err.message}`)
    )
  }
}

const openProjectById: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestById>(A.OPEN_PROJECT_REQUEST_BY_ID),
    map(({ id }) => {
      const project = r.getFile<ProjectFile>(state$.value, 'ProjectFile', id)
      if (!project)
        return r.simpleMessageSnackbar(`Could not find project ${id}.`)

      return r.openFileRequest(project)
    })
  )

const openProjectByFilePath: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestByFilePath>(
      A.OPEN_PROJECT_REQUEST_BY_FILE_PATH
    ),
    flatMap<OpenProjectRequestByFilePath, Promise<Observable<Action>>>(
      async ({ filePath }) => {
        const projectIdFromRecents = r.getProjectIdByFilePath(
          state$.value,
          filePath
        )
        if (projectIdFromRecents)
          return from([r.openProjectById(projectIdFromRecents)])

        return await addAndOpenProject(filePath, state$)
      }
    ),
    mergeAll()
  )

const saveProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, SaveProjectRequest>(A.SAVE_PROJECT_REQUEST),
    filter(() => {
      const projectMetadata = r.getCurrentProject(state$.value)
      if (!projectMetadata)
        return Boolean({ type: 'NOOP_SAVE_PROJECT_WITH_NONE_OPEN' })
      const projectFile = r.getFileAvailabilityById(
        state$.value,
        'ProjectFile',
        projectMetadata.id
      )
      return Boolean(
        projectFile &&
          projectFile.filePath &&
          fs.existsSync(projectFile.filePath)
      )
    }), // while can't find project file path in local storage, or file doesn't exist
    flatMap(async () => {
      try {
        const projectMetadata = r.getCurrentProject(state$.value)
        if (!projectMetadata) throw new Error('Could not find project metadata')
        const json = JSON.stringify(
          r.getProject(state$.value, projectMetadata),
          null,
          2
        )
        const projectFile = r.getFileAvailabilityById(
          state$.value,
          'ProjectFile',
          projectMetadata.id
        ) as CurrentlyLoadedFile
        await writeFile(projectFile.filePath, json, 'utf8')

        return from([
          r.setWorkIsUnsaved(false),
          r.simpleMessageSnackbar(`Project saved in ${projectFile.filePath}`),
        ])
      } catch (err) {
        console.error(err)
        return of(
          r.simpleMessageSnackbar(`Problem saving project file: ${err.message}`)
        )
      }
    }),
    mergeAll()
  )

const PROJECT_EDIT_ACTIONS = [
  A.DELETE_CARD,
  A.MAKE_CLIPS_FROM_SUBTITLES,
  A.DELETE_CARDS,
  A.SET_FLASHCARD_FIELD,
  A.ADD_FLASHCARD_TAG,
  A.DELETE_FLASHCARD_TAG,
  A.ADD_CLIP,
  A.ADD_CLIPS,
  A.EDIT_CLIP,
  A.MERGE_CLIPS,
  A.DELETE_MEDIA_FROM_PROJECT,
  A.DELETE_FILE_SUCCESS, // ???
  A.ADD_AND_OPEN_FILE,
  A.LOCATE_FILE_SUCCESS, // ????
] as const

const registerUnsavedWork: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, Action>(...PROJECT_EDIT_ACTIONS),
    map(() => r.setWorkIsUnsaved(true))
  )

const THREE_SECONDS = 3000
const autoSaveProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, Action>(...PROJECT_EDIT_ACTIONS),
    debounce(() => timer(THREE_SECONDS)),
    map(() => {
      try {
        const projectMetadata = r.getCurrentProject(state$.value)
        if (!projectMetadata) return ({ type: 'AUTOSAVE' } as unknown) as Action

        saveProjectToLocalStorage(r.getProject(state$.value, projectMetadata))

        return ({ type: 'AUTOSAVE' } as unknown) as Action
      } catch (err) {
        console.error(err)
        return r.simpleMessageSnackbar(
          `Problem saving project file: ${err.message}`
        )
      }
    })
  )

const deleteMediaFileFromProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DeleteMediaFromProject>(A.DELETE_MEDIA_FROM_PROJECT),
    flatMap(({ mediaFileId }) => {
      const file = r.getFile(state$.value, 'MediaFile', mediaFileId)
      return file ? of(r.deleteFileRequest(file.type, file.id)) : empty()
    })
  )

const closeProjectRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.CLOSE_PROJECT_REQUEST),
    map(() => {
      if (r.isWorkUnsaved(state$.value))
        return r.confirmationDialog(
          'Are you sure you want to close this project without saving your work?',
          r.closeProject()
        )
      else return r.closeProject()
    })
  )

const closeProject: AppEpic = (action$, state$, { getCurrentWindow }) =>
  action$.pipe(
    ofType(A.CLOSE_PROJECT),
    tap(() => {
      getCurrentWindow().reload()
    }),
    ignoreElements()
  )

export default combineEpics(
  createProject,
  openProjectByFilePath,
  openProjectById,
  saveProject,
  registerUnsavedWork,
  autoSaveProject,
  deleteMediaFileFromProject,
  closeProjectRequest,
  closeProject
)