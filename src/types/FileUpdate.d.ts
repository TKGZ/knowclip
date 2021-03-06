declare type FileUpdates = import('../files/updates').FileUpdates

declare type FileUpdater<F extends FileMetadata, U> = (F, ...U) => F

declare type FileUpdate<
  U extends keyof import('../files/updates').FileUpdates
> = {
  id: FileId
  updateName: U
  fileType: FirstUpdaterParameter<U> extends FileMetadata
    ? FirstUpdaterParameter<U>['type']
    : never
  updatePayload: RestUpdaterParameters<U>
}

type FirstUpdaterParameter<U> = Head<
  Parameters<import('../files/updates').FileUpdates[U]>
>
type RestUpdaterParameters<U> = Tail<
  Parameters<import('../files/updates').FileUpdates[U]>
>

type Tail<T extends any[]> = ((...x: T) => void) extends (
  h: infer A,
  ...t: infer R
) => void
  ? R
  : never

type Head<T extends any[]> = ((...x: T) => void) extends (
  h: infer A,
  ...t: infer R
) => void
  ? A
  : never
