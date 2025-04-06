import {
  CommentProvider,
  GrammarConfig,
  LangiumCoreServices,
  AstNode,
  isAstNodeWithComment,
  CstNode,
  CstUtils,
  isLeafCstNode,
  isRootCstNode,
} from "langium";
import { isComment, isLabel, isLine } from "./generated/ast";

export class AsmCommentProvider implements CommentProvider {
  protected readonly grammarConfig: () => GrammarConfig;
  constructor(services: LangiumCoreServices) {
    this.grammarConfig = () => services.parser.GrammarConfig;
  }
  getComment(node: AstNode): string | undefined {
    if (isLabel(node) && isLine(node.$container)) {
      if (isComment(node.$container.comment)) {
        return node.$container.comment.comment;
      } else {
        const prev = CstUtils.getPreviousNode(node.$cstNode!)?.astNode;
        if (prev && isLine(prev) && isComment(prev.comment)) {
          return prev.comment.comment;
        }
      }
    }
  }
}
