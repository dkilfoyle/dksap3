import { ISymbol } from "./interface";

export interface ITagSymbol {
  name: string;
  size: number;
  members: ISymbol[];
}

export class TagTable {
  tags: ITagSymbol[] = [];
  public constructor() {}
  init() {
    this.tags = [];
  }
  find(name: string) {
    return this.tags.findIndex((t) => t.name == name);
  }
}
