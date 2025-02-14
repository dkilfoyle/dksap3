import { AstNode, LangiumDocument } from "langium";
import { FoldingRangeProvider } from "langium/lsp";
import { FoldingRange, FoldingRangeKind } from "vscode-languageserver";
import { AstUtils } from "langium";
import { isLabel } from "./generated/ast.js";

export type FoldingRangeAcceptor = (foldingRange: FoldingRange) => void;

export class AsmFoldProvider implements FoldingRangeProvider {
  constructor() {}

  getFoldingRanges(document: LangiumDocument): FoldingRange[] {
    const foldings: FoldingRange[] = [];
    const acceptor: FoldingRangeAcceptor = (foldingRange) => foldings.push(foldingRange);
    this.collectFolding(document, acceptor);
    return foldings;
  }

  protected collectFolding(document: LangiumDocument, acceptor: FoldingRangeAcceptor): void {
    const root = document.parseResult?.value;
    let start = -1;
    if (root) {
      const treeIterator = AstUtils.streamAllContents(root).iterator();
      let result: IteratorResult<AstNode>;
      do {
        result = treeIterator.next();
        if (!result.done) {
          const node = result.value;
          if (isLabel(node) && node.$cstNode) {
            const end = node.$cstNode.range.start.line;
            if (start != -1 && end - start > 3) {
              acceptor(FoldingRange.create(start, end - 1, 0, 0, FoldingRangeKind.Region));
            }
            start = node.$cstNode.range.start.line;
          }
        }
      } while (!result.done);
    }
  }
}
