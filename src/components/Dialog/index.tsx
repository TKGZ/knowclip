import React from 'react'
import { useSelector } from 'react-redux'
import Confirmation from './Confirmation'
import MediaFolderLocationForm from './MediaFolderLocationFormDialog'
import ReviewAndExport from '../ReviewAndExport'
import NewProjectForm from './NewProjectFormDialog'
import CsvAndMp3Export from './CsvAndMp3ExportDialog'
import SubtitlesClips from './SubtitlesClipsDialog'
import FileSelection from './FileSelectionDialog'
import { getCurrentDialog } from '../../selectors'

const DialogView = () => {
  const currentDialog = useSelector((state: AppState) =>
    getCurrentDialog(state)
  )

  if (!currentDialog) return null

  switch (currentDialog.type) {
    case 'Confirmation':
      return <Confirmation open={true} data={currentDialog} />
    case 'MediaFolderLocationForm':
      return <MediaFolderLocationForm open={true} data={currentDialog} />
    case 'ReviewAndExport':
      return <ReviewAndExport open={true} data={currentDialog} />
    case 'NewProjectForm':
      return <NewProjectForm open={true} data={currentDialog} />
    case 'CsvAndMp3Export':
      return <CsvAndMp3Export open={true} data={currentDialog} />
    case 'SubtitlesClips':
      return <SubtitlesClips open={true} data={currentDialog} />
    case 'FileSelection':
      return <FileSelection open={true} data={currentDialog} />
  }
}

export default DialogView
