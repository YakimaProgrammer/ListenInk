export interface DocId {
  document_id: string
}

export interface Document {
  name: string,
  numpages: number,
  bookmarks: Bookmark[],
  leftOffAt: Bookmark
  shares: string[],
  owner: string,
  id: string,
  completed: boolean
}

export interface Bookmark {
  page: number,
  audiotime: number
}
