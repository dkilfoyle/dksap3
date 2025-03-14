import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes, Scope } from "langium";
import { AstUtils, Cancellation, DefaultScopeComputation, DefaultScopeProvider, interruptAndCheck, MultiMap } from "langium";
import { AsmServices } from "./asm-module.js";
import { isLabel, Program } from "./generated/ast.js";

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
    // boost non-global labels out of line scope to program scope
    const container = isLabel(node) && !node.glob ? node.$container.$container : node.$container;
    if (container) {
      const name = this.nameProvider.getName(node);
      if (name) {
        scopes.add(container, this.descriptions.createDescription(node, name, document));
      }
    }
  }

  async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
    const model = document.parseResult.value as Program;
    // export all global labels ("::") to file scope
    return model.lines.filter((l) => l.label && l.label.glob).map((l) => this.descriptions.createDescription(l.label!, l.label!.name));
  }
}
