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

  async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
    const model = document.parseResult.value as Program;
    // export all labels to file scope
    return model.lines.filter((l) => l.label).map((l) => this.descriptions.createDescription(l.label!, l.label!.name));
  }
}
