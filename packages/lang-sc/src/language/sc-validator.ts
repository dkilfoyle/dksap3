import type { ValidationAcceptor, ValidationChecks } from "langium";
import {
  type ScAstType,
  type ParameterDeclaration,
  type NumberExpression,
  GlobalVarName,
  GlobalVariableDeclaration,
  isStructTypeSpecifier,
  isStructTypeDeclaration,
} from "./generated/ast";
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
    GlobalVariableDeclaration: validator.checkInitialsSize,
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
  checkInitialsSize(v: GlobalVariableDeclaration, accept: ValidationAcceptor) {
    v.varNames.forEach((vn) => {
      const gvn = vn as GlobalVarName;
      if (gvn.arraySpecifier) {
        if (gvn.arraySpecifier.dim == undefined) {
          if (!(gvn.initials && gvn.initials.values.length > 0)) accept("error", "Undimensioned array must have initializer", { node: vn });
        } else if (gvn.arraySpecifier.dim == 0) {
          // Not sure if this is correct
          // Reference SmallC will compile this, just produces a label with no dw
          accept("error", "Zero dimension arrays not allowed", { node: gvn.arraySpecifier, property: "dim" });
        } else {
          // [x]
          if (gvn.initials && gvn.initials.values.length > gvn.arraySpecifier.dim) {
            accept("warning", "Array dimension < initializer length", { node: gvn.arraySpecifier, property: "dim" });
          }
        }
      }
      if (isStructTypeSpecifier(v.typeSpecifier)) {
        if (gvn.initials) {
          const members = isStructTypeDeclaration(v.typeSpecifier) ? v.typeSpecifier.members : v.typeSpecifier.structTypeName.ref!.members;
          if (gvn.initials.values.length != members.length) accept("error", "Initials length != number of members", { node: gvn.initials });
        }
      }
    });
  }
}
