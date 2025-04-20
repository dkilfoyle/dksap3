import { AstNode, LangiumDocument } from "langium";
import { DefaultFoldingRangeProvider, LangiumServices } from "langium/lsp";
import { FoldingRange, FoldingRangeKind, Trace } from "vscode-languageserver";
import { AstUtils } from "langium";
import { isDoStatement, isForStatement, isFunctionDeclaration, isIfStatement, isWhileStatement } from "./generated/ast";
import { TraceRegion } from "langium/generate";
import { findSmallestMatchingRegion, ZeroPos } from "./traceUtils";

export type FoldingRangeAcceptor = (foldingRange: FoldingRange) => void;

export class ScFoldProvider extends DefaultFoldingRangeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  protected shouldProcess(node: AstNode): boolean {
    return isFunctionDeclaration(node) || isIfStatement(node) || isWhileStatement(node) || isForStatement(node) || isDoStatement(node);
  }
}

export const getAsmFolds = (document: LangiumDocument, trace: TraceRegion) => {
  const root = document.parseResult?.value;
  const uri = document.uri.toString();
  const folds: FoldingRange[] = [];

  if (root) {
    const treeIterator = AstUtils.streamAllContents(root).iterator();
    let result: IteratorResult<AstNode>;
    do {
      result = treeIterator.next();
      if (!result.done) {
        const node = result.value;
        if (isFunctionDeclaration(node) || isIfStatement(node) || isWhileStatement(node) || isForStatement(node) || isDoStatement(node)) {
          const region = findSmallestMatchingRegion(
            "source",
            trace,
            ZeroPos.FromLangium(node.$cstNode!.range.start),
            ZeroPos.FromLangium(node.$cstNode!.range.end)
          );
          if (!region) throw Error("no region");
          const range = region.targetRegion.range!;
          folds.push(
            FoldingRange.create(range?.start.line, range?.end.line, range?.start.character, range?.end.character, FoldingRangeKind.Region)
          );
        }
      }
    } while (!result.done);
  }
  return folds;
};
