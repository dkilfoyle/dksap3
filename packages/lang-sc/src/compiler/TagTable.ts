export interface ITagSymbol {
  name: string;
  size: number;
  member_idx: number;
  number_of_members: number;
}

class TagTable {
  private static _instance: TagTable;
  tags: ITagSymbol[] = [];
  tag_table_index = 0;
  private constructor() {}
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  init() {
    this.tag_table_index = 0;
  }
  find(name: string) {
    return this.tags.findIndex((s) => s.name == name);
  }
}

export const tag_table = TagTable.Instance;
