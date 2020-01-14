export const enqueueDialog = (
  dialog: DialogData,
  skipQueue: boolean = false
): EnqueueDialog => ({
  type: A.ENQUEUE_DIALOG,
  dialog,
  skipQueue,
})

export const confirmationDialog = (
  message: string,
  action: Action,
  onCancel: Action | null = null
) =>
  enqueueDialog({
    type: 'Confirmation',
    message,
    action,
    onCancel,
  })

export const mediaFolderLocationFormDialog = (
  action: Action | null,
  skipQueue: boolean
): DialogAction =>
  enqueueDialog(
    {
      type: 'MediaFolderLocationForm',
      action,
    },
    skipQueue
  )

export const reviewAndExportDialog = () =>
  enqueueDialog({
    type: 'ReviewAndExport',
  })

export const newProjectFormDialog = () =>
  enqueueDialog({ type: 'NewProjectForm' })

export const fileSelectionDialog = (
  message: string,
  file: FileMetadata
): DialogAction => enqueueDialog({ type: 'FileSelection', message, file })

export const closeDialog = (): DialogAction => ({
  type: A.CLOSE_DIALOG,
})

export const csvAndMp3ExportDialog = (clipIds: Array<ClipId>): DialogAction =>
  enqueueDialog({ type: 'CsvAndMp3Export', clipIds }, true)

export const subtitlesClipDialog = (): DialogAction =>
  enqueueDialog({ type: 'SubtitlesClips' })
