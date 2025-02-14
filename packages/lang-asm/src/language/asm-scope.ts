import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes, Scope } from "langium";
import { AstUtils, Cancellation, DefaultScopeComputation, DefaultScopeProvider, interruptAndCheck, MultiMap } from "langium";
import { AsmServices } from "./asm-module.js";
import { isLabel } from "./generated/ast.js";

export class AsmScopeProvider extends DefaultScopeProvider {
  override createScope(elements: Iterable<AstNodeDescription>, outerScope?: Scope): Scope {
    return super.createScope(elements, outerScope, { caseInsensitive: true });
  }
}

export class AsmScopeComputation extends DefaultScopeComputation {
  constructor(services: AsmServices) {
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
    // boost each label out of Line scope to Program scope
    const container = isLabel(node) ? node.$container.$container : node.$container;
    if (container) {
      const name = this.nameProvider.getName(node);
      if (name) {
        scopes.add(container, this.descriptions.createDescription(node, name, document));
      }
    }
  }
}
