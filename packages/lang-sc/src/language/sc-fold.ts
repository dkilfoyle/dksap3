import { AstNode, LangiumDocument } from "langium";
import { DefaultFoldingRangeProvider, LangiumServices } from "langium/lsp";
import { FoldingRange, FoldingRangeKind, Trace } from "vscode-languageserver";
import { AstUtils } from "langium";
import { isDoStatement, isForStatement, isFunctionDeclaration, isIfStatement, isProgram, isWhileStatement } from "./generated/ast";
import { TraceRegion } from "langium/generate";
import { findFirstCodingLineAtOrAfter, findSmallestMatchingRegion, ZeroPos } from "./traceUtils";

export type FoldingRangeAcceptor = (foldingRange: FoldingRange) => void;

// const findSmallestSourceRegionAtLine = (curNode: TraceRegion, line: number): TraceRegion | undefined => {
//   if (!curNode.sourceRegion) return undefined;
//   const startLine = curNode.sourceRegion.range?.start.line;
//   const endLine = curNode.sourceRegion.range?.end.line;
//   if (startLine == undefined || endLine == undefined) throw Error("fold no region");
//   if (startLine == line) {
//     return curNode;
//   }

//   if (curNode.children && line >= startLine && line <= endLine) {
//     // node contains line
//     // console.log("testing node", node.sourceRegion, node.children);
//     for (let i = 0; i < curNode.children.length; i++) {
//       const n = findSmallestSourceRegionAtLine(curNode.children[i], line);
//       if (n) return curNode.children[i];
//     }
//   }
//   return undefined;
// };

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
          console.log("matching regions", node, region);
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
