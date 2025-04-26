import type { ValidationAcceptor, ValidationChecks } from "langium";
import { type ScAstType, type ParameterDeclaration, type NumberExpression, GlobalVarName } from "./generated/ast";
import type { ScServices } from "./sc-module";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScValidator;
  const checks: ValidationChecks<ScAstType> = {
    ParameterDeclaration: validator.checkStructParameterIsPointer,
    NumberExpression: validator.checkNumberInRange,
    GlobalVarName: validator.checkInitialsSize,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScValidator {
  checkNumberInRange(num: NumberExpression, accept: ValidationAcceptor): void {
    if (num.value == undefined) accept("error", "undefined parse result", { node: num, property: "value" });
    if (num.value < -32768) accept("error", "Out of signed integer range", { node: num, property: "value" });
    if (num.value > 65535) accept("warning", "Out of signed integer range", { node: num, property: "value" });
    // todo typir??
  }
  checkStructParameterIsPointer(param: ParameterDeclaration, accept: ValidationAcceptor) {
    if (param.typeSpecifier.atomicType == "struct" && !param.pointer)
      accept("error", "non-pointer struct parameter", { node: param, property: "name" });
  }
  checkInitialsSize(g: GlobalVarName, accept: ValidationAcceptor) {
    if (g.dim != undefined) {
      if (g.items.length > 0 && g.items.length != g.dim) {
        accept("warning", "Array dimension < initializer length", { node: g, property: "dim" });
      }
    }
  }
}
