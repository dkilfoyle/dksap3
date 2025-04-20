import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { ScAstType, FunctionDeclaration, ParameterDeclaration, LocalVariableDeclaration, NumberExpression } from "./generated/ast";
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
    if (param.type.type == "struct" && !param.pointer) accept("error", "non-pointer struct parameter", { node: param, property: "name" });
  }
}
