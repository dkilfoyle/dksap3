import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes } from "langium";
import { AstUtils, Cancellation, DefaultScopeComputation, interruptAndCheck, MultiMap } from "langium";
import { ScServices } from "./sc-module.js";
// import { ClassDec, isClassDec, isSubroutineDec, isVarName } from "./generated/ast.js";
import { isLocalVarName, isGlobalVarName } from "./generated/ast.js";

export class ScScopeComputation extends DefaultScopeComputation {
  constructor(services: ScServices) {
    super(services);
  }

  override async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
    const rootNode = document.parseResult.value;
    const scopes = new MultiMap<AstNode, AstNodeDescription>();
    // Here we navigate the full AST - local scopes shall be available in the whole document
    for (const node of AstUtils.streamAllContents(rootNode)) {
      await interruptAndCheck(cancelToken);
      this.processNode(node, document, scopes);
    }
    return scopes;
  }

  /**
   * Process a single node during scopes computation. The default implementation makes the node visible
   * in the subtree of its container (if the node has a name). Override this method to change this,
   * e.g. by increasing the visibility to a higher level in the AST.
   */
  protected override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
    // boost each varName to be sibling of VarDec's container
    // this allows to declare multiple varNames in one VarDec
    // eg var int x,y;
    const container = isLocalVarName(node) || isGlobalVarName(node) ? node.$container.$container : node.$container;
    if (container) {
      const name = this.nameProvider.getName(node);
      if (name) {
        scopes.add(container, this.descriptions.createDescription(node, name, document));
      }
    }
  }
}
