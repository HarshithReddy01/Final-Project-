import type { MetDepartmentDto } from './MetObjectDto.ts'

export class Department {
  static readonly #collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
  static readonly #leadingArticle = /^the\s+/i

  readonly id: number
  readonly name: string

  constructor(id: number, name: string) {
    this.id = id
    this.name = name
  }

  static fromDto(dto: MetDepartmentDto): Department {
    return new Department(dto.departmentId, dto.displayName.trim())
  }

  static compare(left: Department, right: Department): number {
    return Department.#collator.compare(left.#sortName, right.#sortName)
  }

  get #sortName(): string {
    return this.name.replace(Department.#leadingArticle, '')
  }
}
