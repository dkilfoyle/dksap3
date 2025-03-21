export interface ITagSymbol {
  name: string;
  size: number;
  member_idx: number;
  number_of_members: number;
}

export class TagTable {
  tags: ITagSymbol[] = [];
  tag_table_index = 0;
  public constructor() {}
  init() {
    this.tag_table_index = 0;
  }
  find(name: string) {
    return this.tags.findIndex((s) => s.name == name);
  }
}
