import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { ScAstType, FunctionDeclaration } from "./generated/ast";
import type { ScServices } from "./sc-module";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScValidator;
  const checks: ValidationChecks<ScAstType> = {
    FunctionDeclaration: validator.checkPersonStartsWithCapital,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScValidator {
  checkPersonStartsWithCapital(person: FunctionDeclaration, accept: ValidationAcceptor): void {
    // if (person.name) {
    //   const firstChar = person.name.substring(0, 1);
    //   if (firstChar.toUpperCase() !== firstChar) {
    //     accept("warning", "Person name should start with a capital.", { node: person, property: "name" });
    //   }
    // }
  }
}
