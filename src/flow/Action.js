// @flow

declare type Action =
  | {| type: '@@INIT' |}
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | NoteTypeAction
  | {|
      type: 'CHOOSE_AUDIO_FILES',
      filePaths: Array<AudioFilePath>,
      noteTypeId: NoteTypeId,
    |}
  | {| type: 'REMOVE_AUDIO_FILES' |}
  | {|
      type: 'SET_FLASHCARD_FIELD',
      id: ClipId,
      key: string,
      value: string,
    |}
  | {|
      type: 'LOAD_AUDIO',
      filePath: string,
      audioElement: Object,
      svgElement: Object,
    |}
  | {| type: 'SET_CURRENT_FILE', index: number |}
  | {| type: 'TOGGLE_LOOP' |}
  | {| type: 'LOAD_AUDIO_SUCCESS', file: Object |}
  | {| type: 'DELETE_CARD', id: ClipId |}
  | {| type: 'MAKE_CLIPS' |}
  | {| type: 'EXPORT_FLASHCARDS' |}
  | {| type: 'INITIALIZE_APP' |}
  | {| type: 'SET_MEDIA_FOLDER_LOCATION', directoryPath: ?string |}
  | {| type: 'DETECT_SILENCE' |}
  | {| type: 'DETECT_SILENCE_REQUEST' |}
  | {| type: 'DELETE_CARDS', ids: Array<ClipId> |}
  | {| type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' |}

declare type AppAction = Action

declare type WaveformAction =
  | {| type: 'SET_WAVEFORM_PEAKS', peaks: Array<*> |}
  | {| type: 'SET_CURSOR_POSITION', x: number, newViewBox: Object |}
  | {| type: 'ADD_WAVEFORM_SELECTION', selection: Clip |}
  | {|
      type: 'ADD_WAVEFORM_SELECTIONS',
      selections: Array<Clip>,
      filePath: AudioFilePath,
    |}
  | {| type: 'SET_WAVEFORM_PENDING_SELECTION', selection: Clip |}
  | {| type: 'HIGHLIGHT_WAVEFORM_SELECTION', id: ClipId |}
  | {| type: 'EDIT_WAVEFORM_SELECTION', id: ClipId, override: $Shape<Clip> |}
  | {| type: 'SET_WAVEFORM_PENDING_STRETCH', stretch: PendingStretch |}
  | {| type: 'MERGE_WAVEFORM_SELECTIONS', ids: Array<ClipId> |}

declare type DialogAction =
  | {| type: 'ENQUEUE_DIALOG', dialog: DialogData |}
  | {| type: 'CLOSE_DIALOG' |}

declare type SnackbarAction =
  | {| type: 'ENQUEUE_SNACKBAR', snackbar: SnackbarData |}
  | {| type: 'CLOSE_SNACKBAR' |}

declare type NoteTypeAction =
  | { type: 'ADD_NOTE_TYPE', noteType: NoteType }
  | { type: 'EDIT_NOTE_TYPE', id: NoteTypeId, override: $Shape<NoteType> }
  | { type: 'DELETE_NOTE_TYPE', id: NoteTypeId }
  | { type: 'SET_DEFAULT_NOTE_TYPE', id: NoteTypeId }