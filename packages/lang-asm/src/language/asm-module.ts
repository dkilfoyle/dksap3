import { DeepPartial, type Module, inject } from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from "langium/lsp";
import { AsmGeneratedModule, AsmGeneratedSharedModule } from "./generated/module.js";
import { AsmValidator, registerValidationChecks } from "./asm-validator.js";
import { AsmSignatureHelpProvider } from "./asm-signature.js";
import { AsmDocumentationProvider } from "./asm-documentation.js";
import { AsmHoverProvider } from "./asm-hover.js";
import { AsmValueConverter } from "./asm-valueconverter.js";
import { AsmFormatter } from "./asm-formatter.js";
import { AsmCompletionProvider } from "./asm-completion.js";
import { AsmFoldProvider } from "./asm-fold.js";
import { AsmScopeComputation, AsmScopeProvider } from "./asm-scope.js";
import { AsmWorkspaceManager } from "./asm-workspace.js";
import { AsmCommentProvider } from "./asm-comment.js";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type AsmAddedServices = {
  validation: {
    AsmValidator: AsmValidator;
  };
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type AsmServices = LangiumServices & AsmAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const AsmModule: Module<AsmServices, PartialLangiumServices & AsmAddedServices> = {
  documentation: {
    DocumentationProvider: (services) => new AsmDocumentationProvider(services),
    CommentProvider: (services) => new AsmCommentProvider(services),
  },
  validation: {
    AsmValidator: () => new AsmValidator(),
  },
  lsp: {
    CompletionProvider: (services) => new AsmCompletionProvider(services),
    SignatureHelp: (services) => new AsmSignatureHelpProvider(services),
    // CodeActionProvider: (services) => new JackCodeActionProvider(),
    HoverProvider: (services) => new AsmHoverProvider(services),
    FoldingRangeProvider: () => new AsmFoldProvider(),
    Formatter: () => new AsmFormatter(),
  },
  references: {
    ScopeComputation: (services) => new AsmScopeComputation(services),
    ScopeProvider: (services) => new AsmScopeProvider(services),
  },
  parser: {
    ValueConverter: () => new AsmValueConverter(),
  },
};

export type AsmSharedServices = LangiumSharedServices;

export const AsmSharedModule: Module<AsmSharedServices, DeepPartial<AsmSharedServices>> = {
  workspace: {
    WorkspaceManager: (services) => new AsmWorkspaceManager(services),
  },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createAsmServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  Asm: AsmServices;
} {
  const shared = inject(createDefaultSharedModule(context), AsmGeneratedSharedModule, AsmSharedModule);
  const Asm = inject(createDefaultModule({ shared }), AsmGeneratedModule, AsmModule);
  shared.ServiceRegistry.register(Asm);
  registerValidationChecks(Asm);
  if (!context.connection) {
    // We don't run inside a language server
    // Therefore, initialize the configuration provider instantly
    shared.workspace.ConfigurationProvider.initialized({});
  }
  return { shared, Asm };
}
