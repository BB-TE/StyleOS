export const NO_STATE_CHANGE = Symbol('styleos.no-state-change')

export class RevisionConflictError extends Error {
  constructor(expectedRevision, currentRevision) {
    super(`Expected memory revision ${expectedRevision}, but current revision is ${currentRevision}.`)
    this.name = 'RevisionConflictError'
    this.code = 'revision_conflict'
    this.expectedRevision = expectedRevision
    this.currentRevision = currentRevision
  }
}
