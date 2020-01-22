import React, { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormHelperText,
} from '@material-ui/core'
import { showSaveDialog } from '../../utils/electron'
import css from './NewProjectFormDialog.module.css'
import cn from 'classnames'
import { DialogProps } from './DialogProps'
import { closeDialog, createProject } from '../../actions'
import { uuid, nowUtcTimestamp } from '../../utils/sideEffects'

export const testLabels = {
  projectNameField: 'project-name',
  projectFileLocationField: 'project-file-location',
  noteTypeSelect: 'note-type-select',
  transcriptionNoteTypeOption: 'transcription-note-type-option',
  saveButton: 'save-button',
  cardsPreview: 'cards-preview',
} as const

const CardPreview = ({ noteType }: { noteType: NoteType | '' }) => {
  switch (noteType) {
    case 'Simple':
      return (
        <section className={css.cardsPreview} id={testLabels.cardsPreview}>
          <h3 className={css.cardPreviewHeading}>Preview</h3>
          <p className={css.cardPreviewSummary}>
            Includes fields for transcription, meaning, and notes.
          </p>
          <Paper className={cn(css.cardPreview, 'card')}>
            ♫
            <hr />
            <p className="transcription">¿Cuál es tu nombre?</p>
            <p className="meaning">What's your name?</p>
            <p className="notes">
              The "tu" makes it informal. In a formal setting, or when speaking
              to someone older, you would say "su" instead.
            </p>
          </Paper>
        </section>
      )
    case 'Transliteration':
      return (
        <section className={css.cardsPreview} id={testLabels.cardsPreview}>
          <h3 className={css.cardPreviewHeading}>Preview</h3>
          <p className={css.cardPreviewSummary}>
            Includes fields for transcription, pronunciation, meaning, and
            notes. Especially useful when learning a language with a different
            writing system.
          </p>
          <Paper className={cn(css.cardPreview, 'card')}>
            ♫
            <hr />
            <p className="transcription">你叫什麼名字?</p>
            <p className="pronunciation">Nǐ jiào shénme míngzi?</p>
            <p className="meaning">What's your name?</p>
            <p className="notes">This is less formal than "您貴姓?"</p>
          </Paper>
        </section>
      )
    default:
      return null
  }
}

const NewProjectFormDialog = ({
  open,
}: DialogProps<NewProjectFormDialogData>) => {
  const [state, setState] = useState({
    fieldValues: {
      name: '',
      filePath: '',
      noteType: '' as NoteType | '',
    },
    errors: {
      name: '',
      filePath: '',
      noteType: '',
    },
  })
  const { fieldValues, errors } = state

  const dispatch = useDispatch()

  const validate = useCallback(
    () => {
      const newErrors: typeof errors = {
        name: '',
        filePath: '',
        noteType: '',
      }

      if (!fieldValues.name.trim())
        newErrors.name = 'Please enter a name for your project.'

      if (!fieldValues.filePath.trim())
        newErrors.filePath =
          'Please specify where you want to save your project.'

      if (!fieldValues.noteType.trim())
        newErrors.noteType = 'Please choose a note type.'

      return newErrors
    },
    [errors, fieldValues]
  )

  const handleSubmit = useCallback(
    () => {
      const errors = validate()
      if (Object.values(errors).filter(err => err).length)
        return setState(state => ({ ...state, errors }))

      const { filePath, name } = fieldValues
      dispatch(
        createProject(
          uuid(),
          name,
          (fieldValues.noteType as unknown) as NoteType, // guaranteed after validation
          filePath,
          nowUtcTimestamp()
        )
      )
      dispatch(closeDialog())
    },
    [dispatch, fieldValues, validate]
  )
  const setNameText = useCallback(
    text =>
      setState(({ fieldValues, errors }) => ({
        fieldValues: { ...fieldValues, name: text },
        errors: { ...errors, name: '' },
      })),
    [setState]
  )

  const setFilePathText = useCallback(
    (text: string) => {
      setState(({ fieldValues, errors }) => ({
        fieldValues: { ...fieldValues, filePath: text },
        errors: { ...errors, filePath: '' },
      }))
    },
    [setState]
  )

  const handleChangeNameText = useCallback(e => setNameText(e.target.value), [
    setNameText,
  ])

  const handleChangeNoteType = useCallback(
    e =>
      setState(({ fieldValues, errors }) => ({
        fieldValues: { ...fieldValues, noteType: e.target.value },
        errors: { ...errors, noteType: '' },
      })),
    [setState]
  )

  const showSaveAfcaDialog = useCallback(
    async () => {
      const filePath = await showSaveDialog('AFCA Project File', ['afca'])
      return filePath ? setFilePathText(filePath) : null
    },
    [setFilePathText]
  )

  return (
    <Dialog open={open}>
      <DialogContent>
        <form className={css.form} onSubmit={handleSubmit}>
          <h3>New project</h3>
          <TextField
            fullWidth
            label="Project name"
            inputProps={{ id: testLabels.projectNameField }}
            value={fieldValues.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            onChange={handleChangeNameText}
          />

          <br />
          <br />

          <TextField
            fullWidth
            label="Project file location"
            id={testLabels.projectFileLocationField}
            value={fieldValues.filePath}
            error={Boolean(errors.filePath)}
            helperText={errors.filePath}
            onClick={showSaveAfcaDialog}
            onKeyPress={showSaveAfcaDialog}
          />

          <br />
          <br />

          <FormControl fullWidth error={Boolean(errors.noteType)}>
            <InputLabel htmlFor="note-type">Note type</InputLabel>
            <Select
              value={state.fieldValues.noteType}
              onChange={handleChangeNoteType}
              inputProps={{
                name: 'note-type',
              }}
              SelectDisplayProps={{
                id: testLabels.noteTypeSelect,
              }}
            >
              <MenuItem value="" />
              <MenuItem value="Simple">Simple</MenuItem>
              <MenuItem
                id={testLabels.transcriptionNoteTypeOption}
                value="Transliteration"
                ContainerComponent="div"
                ContainerProps={{ id: testLabels.transcriptionNoteTypeOption }}
              >
                Including pronunciation field
              </MenuItem>
            </Select>
            <FormHelperText>{errors.noteType}</FormHelperText>
          </FormControl>
        </form>

        <CardPreview noteType={fieldValues.noteType} />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Exit</Button>
        <Button onClick={handleSubmit} id={testLabels.saveButton} type="submit">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewProjectFormDialog