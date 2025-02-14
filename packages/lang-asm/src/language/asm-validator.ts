import type { ValidationAcceptor, ValidationChecks } from "langium";
import { type AsmAstType, Instr, isAddrArgument, isImm16, isImm8, isReg16, Label } from "./generated/ast.js";
import type { AsmServices } from "./asm-module.js";
import { userPreferences } from "./asm-userpreferences.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: AsmServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.AsmValidator;
  const checks: ValidationChecks<AsmAstType> = {
    Instr: validator.checkInstrArgumentsInRange,
    Label: validator.checkLabelSize,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class AsmValidator {
  checkInstrArgumentsInRange(instr: Instr, accept: ValidationAcceptor): void {
    if (isAddrArgument(instr.arg1) && instr.arg1.number !== undefined) {
      if (instr.arg1.number > 0xffff) accept("error", "Out of 16bit range", { node: instr, property: "arg1" });
    }
    if (isImm8(instr.arg1)) {
      if (instr.arg1.number != undefined && instr.arg1.number > 0xff) accept("error", "Out of 8bit range", { node: instr, property: "arg1" });
    }
    if (isImm16(instr.arg2)) {
      if (instr.arg2.number != undefined && instr.arg2.number! > 0xffff)
        accept("error", "Out of 16bit range", { node: instr, property: "arg1" });
    }
    if (isImm8(instr.arg2)) {
      if (instr.arg2.number != undefined && instr.arg2.number! > 0xff) accept("error", "Out of 18it range", { node: instr, property: "arg1" });
    }
    if (isReg16(instr.arg1) && instr.arg1.register == "psw" && ["PUSH", "POP"].includes(instr.op.opname.toUpperCase()) == false)
      accept("error", "Invalid register, PSW can only be used with PUSH/POP", { node: instr, property: "arg1" });
  }
  checkLabelSize(label: Label, accept: ValidationAcceptor): void {
    if (label.name.length > userPreferences.syntax.maxLabelSize)
      accept("warning", `Label longer than recommended length (${userPreferences.syntax.maxLabelSize})`, { node: label, property: "name" });
  }
}
