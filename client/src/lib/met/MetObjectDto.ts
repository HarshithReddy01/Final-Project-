export type MetConstituentDto = {
  readonly constituentID: number
  readonly role: string
  readonly name: string
  readonly constituentULAN_URL: string
  readonly constituentWikidata_URL: string
  readonly gender: string
}

export type MetTagDto = {
  readonly term: string
  readonly AAT_URL: string | null
  readonly Wikidata_URL: string | null
}

export type MetMeasurementDto = {
  readonly elementName: string
  readonly elementDescription: string | null
  readonly elementMeasurements: Readonly<Record<string, number>>
}

export type MetObjectDto = {
  readonly objectID: number
  readonly isHighlight: boolean
  readonly accessionNumber: string
  readonly accessionYear: string
  readonly isPublicDomain: boolean
  readonly primaryImage: string
  readonly primaryImageSmall: string
  readonly additionalImages: readonly string[] | null
  readonly constituents: readonly MetConstituentDto[] | null
  readonly department: string
  readonly objectName: string
  readonly title: string
  readonly culture: string
  readonly period: string
  readonly dynasty: string
  readonly reign: string
  readonly portfolio: string
  readonly artistRole: string
  readonly artistPrefix: string
  readonly artistDisplayName: string
  readonly artistDisplayBio: string
  readonly artistSuffix: string
  readonly artistAlphaSort: string
  readonly artistNationality: string
  readonly artistBeginDate: string
  readonly artistEndDate: string
  readonly artistGender: string
  readonly artistWikidata_URL: string
  readonly artistULAN_URL: string
  readonly objectDate: string
  readonly objectBeginDate: number
  readonly objectEndDate: number
  readonly medium: string
  readonly dimensions: string
  readonly measurements: readonly MetMeasurementDto[] | null
  readonly creditLine: string
  readonly geographyType: string
  readonly city: string
  readonly state: string
  readonly county: string
  readonly country: string
  readonly region: string
  readonly subregion: string
  readonly locale: string
  readonly locus: string
  readonly excavation: string
  readonly river: string
  readonly classification: string
  readonly rightsAndReproduction: string
  readonly linkResource: string
  readonly metadataDate: string
  readonly repository: string
  readonly objectURL: string
  readonly tags: readonly MetTagDto[] | null
  readonly objectWikidata_URL: string
  readonly isTimelineWork: boolean
  readonly GalleryNumber: string
}

export type MetSearchDto = {
  readonly total: number
  readonly objectIDs: readonly number[] | null
}

export type MetDepartmentDto = {
  readonly departmentId: number
  readonly displayName: string
}

export type MetDepartmentsDto = {
  readonly departments: readonly MetDepartmentDto[]
}
