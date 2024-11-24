import type { ValidationAcceptor, ValidationChecks } from "langium";
import {
  type AsmAstType,
  type R8Imm8Instruction,
  type AddrInstruction,
  type R16Imm16Instruction,
  isAddrArgument,
  isImm16,
  isImm8,
} from "./generated/ast.js";
import type { AsmServices } from "./asm-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: AsmServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.AsmValidator;
  const checks: ValidationChecks<AsmAstType> = {
    R8Imm8Instruction: validator.checkValidR8Imm8Instruction,
    R16Imm16Instruction: validator.checkValidR16Imm16Instruction,
    AddrInstruction: validator.checkValidAddrInstruction,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class AsmValidator {
  checkValidR8Imm8Instruction(instr: R8Imm8Instruction, accept: ValidationAcceptor): void {
    if (isImm8(instr.arg2)) if (instr.arg2.number > 0xff) return accept("error", "Out of range", { node: instr, property: "arg2" });
  }
  checkValidR16Imm16Instruction(instr: R16Imm16Instruction, accept: ValidationAcceptor): void {
    if (isImm16(instr.arg2)) if (instr.arg2.number > 0xffff) return accept("error", "Out of range", { node: instr, property: "arg2" });
  }
  checkValidAddrInstruction(instr: AddrInstruction, accept: ValidationAcceptor): void {
    if (isAddrArgument(instr.arg1)) {
      if (instr.arg1.number != undefined)
        if (instr.arg1.number > 0xffff) return accept("error", "Out of range", { node: instr, property: "arg1" });
    }
  }
}
