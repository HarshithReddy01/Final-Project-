export type SearchFieldKey = 'all' | 'title' | 'artist' | 'tags'

export type SearchApiFlag = 'title' | 'artistOrCulture' | 'tags'

export class SearchField {
  static readonly defaultKey: SearchFieldKey = 'all'
  static readonly all: readonly SearchField[] = [
    new SearchField('all', 'All fields', null),
    new SearchField('title', 'Title', 'title'),
    new SearchField('artist', 'Artist or culture', 'artistOrCulture'),
    new SearchField('tags', 'Subject', 'tags'),
  ]

  readonly key: SearchFieldKey
  readonly label: string
  readonly apiFlag: SearchApiFlag | null

  constructor(key: SearchFieldKey, label: string, apiFlag: SearchApiFlag | null) {
    this.key = key
    this.label = label
    this.apiFlag = apiFlag
  }

  static find(key: string | null | undefined): SearchField | null {
    return SearchField.all.find((field) => field.key === key) ?? null
  }

  static parse(key: string | null | undefined): SearchFieldKey {
    return SearchField.find(key)?.key ?? SearchField.defaultKey
  }
}
