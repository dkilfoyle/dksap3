/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const AsmTerminals = {
    ID: /[_a-zA-Z$][a-zA-Z0-9._]*/,
    EOL: /[\r\n]+/,
    COMMENT: /;[^\n\r]*/,
    NUMBER: /[0-9][0-9a-fA-F]*[h]?/,
    CHARACTER: /'[ -~]'/,
    WS: /[ \t]/,
};

export type AsmTerminalNames = keyof typeof AsmTerminals;

export type AsmKeywordNames = 
    | ","
    | ":"
    | "a"
    | "aci"
    | "adc"
    | "add"
    | "adi"
    | "ana"
    | "ani"
    | "b"
    | "c"
    | "call"
    | "cc"
    | "cm"
    | "cma"
    | "cmc"
    | "cmp"
    | "cnc"
    | "cnz"
    | "cp"
    | "cpe"
    | "cpi"
    | "cpo"
    | "cz"
    | "d"
    | "dad"
    | "db"
    | "dcr"
    | "dcx"
    | "ds"
    | "dw"
    | "e"
    | "equ"
    | "h"
    | "hlt"
    | "inr"
    | "inx"
    | "jc"
    | "jm"
    | "jmp"
    | "jnc"
    | "jnz"
    | "jp"
    | "jpe"
    | "jpo"
    | "jz"
    | "l"
    | "lda"
    | "ldax"
    | "lhld"
    | "lxi"
    | "m"
    | "mov"
    | "mvi"
    | "nop"
    | "ora"
    | "org"
    | "ori"
    | "out"
    | "pchl"
    | "pop"
    | "psw"
    | "push"
    | "ral"
    | "rar"
    | "rc"
    | "ret"
    | "rlc"
    | "rm"
    | "rnc"
    | "rnz"
    | "rp"
    | "rpe"
    | "rpo"
    | "rrc"
    | "rz"
    | "sbb"
    | "sbi"
    | "shld"
    | "sp"
    | "sta"
    | "stax"
    | "stc"
    | "sub"
    | "sui"
    | "xchg"
    | "xra"
    | "xri"
    | "xthl";

export type AsmTokenNames = AsmTerminalNames | AsmKeywordNames;

export type Instruction = Instr;

export const Instruction = 'Instruction';

export function isInstruction(item: unknown): item is Instruction {
    return reflection.isInstance(item, Instruction);
}

export interface AddrArgument extends AstNode {
    readonly $container: Instr;
    readonly $type: 'AddrArgument';
    identifier?: Reference<Label>;
    number?: number;
}

export const AddrArgument = 'AddrArgument';

export function isAddrArgument(item: unknown): item is AddrArgument {
    return reflection.isInstance(item, AddrArgument);
}

export interface Comment extends AstNode {
    readonly $container: Line;
    readonly $type: 'Comment';
    comment: string;
}

export const Comment = 'Comment';

export function isComment(item: unknown): item is Comment {
    return reflection.isInstance(item, Comment);
}

export interface Directive extends AstNode {
    readonly $container: Line;
    readonly $type: 'Directive';
    args: Array<DirectiveArgument>;
    dir: DirectiveOperation;
    lhs?: DirectiveArgument;
}

export const Directive = 'Directive';

export function isDirective(item: unknown): item is Directive {
    return reflection.isInstance(item, Directive);
}

export interface DirectiveArgument extends AstNode {
    readonly $container: Directive;
    readonly $type: 'DirectiveArgument';
    identifier?: Reference<Label>;
    number?: number;
}

export const DirectiveArgument = 'DirectiveArgument';

export function isDirectiveArgument(item: unknown): item is DirectiveArgument {
    return reflection.isInstance(item, DirectiveArgument);
}

export interface DirectiveOperation extends AstNode {
    readonly $container: Directive;
    readonly $type: 'DirectiveOperation';
    opname: 'db' | 'ds' | 'dw' | 'equ' | 'org';
}

export const DirectiveOperation = 'DirectiveOperation';

export function isDirectiveOperation(item: unknown): item is DirectiveOperation {
    return reflection.isInstance(item, DirectiveOperation);
}

export interface Imm16 extends AstNode {
    readonly $container: Instr;
    readonly $type: 'Imm16';
    identifier?: Reference<Label>;
    number?: number;
}

export const Imm16 = 'Imm16';

export function isImm16(item: unknown): item is Imm16 {
    return reflection.isInstance(item, Imm16);
}

export interface Imm8 extends AstNode {
    readonly $container: Instr;
    readonly $type: 'Imm8';
    char?: string;
    number?: number;
}

export const Imm8 = 'Imm8';

export function isImm8(item: unknown): item is Imm8 {
    return reflection.isInstance(item, Imm8);
}

export interface Instr extends AstNode {
    readonly $container: Line;
    readonly $type: 'Instr';
    arg1?: AddrArgument | Imm8 | Reg16 | Reg8;
    arg2?: Imm16 | Imm8 | Reg8;
    op: Operation;
}

export const Instr = 'Instr';

export function isInstr(item: unknown): item is Instr {
    return reflection.isInstance(item, Instr);
}

export interface Label extends AstNode {
    readonly $container: Line;
    readonly $type: 'Label';
    glob: boolean;
    name: string;
}

export const Label = 'Label';

export function isLabel(item: unknown): item is Label {
    return reflection.isInstance(item, Label);
}

export interface Line extends AstNode {
    readonly $container: Program;
    readonly $type: 'Line';
    comment?: Comment;
    dir?: Directive;
    instr?: Instruction;
    label?: Label;
}

export const Line = 'Line';

export function isLine(item: unknown): item is Line {
    return reflection.isInstance(item, Line);
}

export interface Operation extends AstNode {
    readonly $container: Instr;
    readonly $type: 'Operation';
    opname: 'aci' | 'adc' | 'add' | 'adi' | 'ana' | 'ani' | 'call' | 'cc' | 'cm' | 'cma' | 'cmc' | 'cmp' | 'cnc' | 'cnz' | 'cp' | 'cpe' | 'cpi' | 'cpo' | 'cz' | 'dad' | 'dcr' | 'dcx' | 'hlt' | 'inr' | 'inx' | 'jc' | 'jm' | 'jmp' | 'jnc' | 'jnz' | 'jp' | 'jpe' | 'jpo' | 'jz' | 'lda' | 'ldax' | 'lhld' | 'lxi' | 'mov' | 'mvi' | 'nop' | 'ora' | 'ori' | 'out' | 'pchl' | 'pop' | 'push' | 'ral' | 'rar' | 'rc' | 'ret' | 'rlc' | 'rm' | 'rnc' | 'rnz' | 'rp' | 'rpe' | 'rpo' | 'rrc' | 'rz' | 'sbb' | 'sbi' | 'shld' | 'sta' | 'stax' | 'stc' | 'sub' | 'sui' | 'xchg' | 'xra' | 'xri' | 'xthl';
}

export const Operation = 'Operation';

export function isOperation(item: unknown): item is Operation {
    return reflection.isInstance(item, Operation);
}

export interface Program extends AstNode {
    readonly $type: 'Program';
    lines: Array<Line>;
}

export const Program = 'Program';

export function isProgram(item: unknown): item is Program {
    return reflection.isInstance(item, Program);
}

export interface Reg16 extends AstNode {
    readonly $container: Instr;
    readonly $type: 'Reg16';
    register: 'b' | 'd' | 'h' | 'psw' | 'sp';
}

export const Reg16 = 'Reg16';

export function isReg16(item: unknown): item is Reg16 {
    return reflection.isInstance(item, Reg16);
}

export interface Reg8 extends AstNode {
    readonly $container: Instr;
    readonly $type: 'Reg8';
    register: 'a' | 'b' | 'c' | 'd' | 'e' | 'h' | 'l' | 'm';
}

export const Reg8 = 'Reg8';

export function isReg8(item: unknown): item is Reg8 {
    return reflection.isInstance(item, Reg8);
}

export type AsmAstType = {
    AddrArgument: AddrArgument
    Comment: Comment
    Directive: Directive
    DirectiveArgument: DirectiveArgument
    DirectiveOperation: DirectiveOperation
    Imm16: Imm16
    Imm8: Imm8
    Instr: Instr
    Instruction: Instruction
    Label: Label
    Line: Line
    Operation: Operation
    Program: Program
    Reg16: Reg16
    Reg8: Reg8
}

export class AsmAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return [AddrArgument, Comment, Directive, DirectiveArgument, DirectiveOperation, Imm16, Imm8, Instr, Instruction, Label, Line, Operation, Program, Reg16, Reg8];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case Instr: {
                return this.isSubtype(Instruction, supertype);
            }
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'AddrArgument:identifier':
            case 'DirectiveArgument:identifier':
            case 'Imm16:identifier': {
                return Label;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case AddrArgument: {
                return {
                    name: AddrArgument,
                    properties: [
                        { name: 'identifier' },
                        { name: 'number' }
                    ]
                };
            }
            case Comment: {
                return {
                    name: Comment,
                    properties: [
                        { name: 'comment' }
                    ]
                };
            }
            case Directive: {
                return {
                    name: Directive,
                    properties: [
                        { name: 'args', defaultValue: [] },
                        { name: 'dir' },
                        { name: 'lhs' }
                    ]
                };
            }
            case DirectiveArgument: {
                return {
                    name: DirectiveArgument,
                    properties: [
                        { name: 'identifier' },
                        { name: 'number' }
                    ]
                };
            }
            case DirectiveOperation: {
                return {
                    name: DirectiveOperation,
                    properties: [
                        { name: 'opname' }
                    ]
                };
            }
            case Imm16: {
                return {
                    name: Imm16,
                    properties: [
                        { name: 'identifier' },
                        { name: 'number' }
                    ]
                };
            }
            case Imm8: {
                return {
                    name: Imm8,
                    properties: [
                        { name: 'char' },
                        { name: 'number' }
                    ]
                };
            }
            case Instr: {
                return {
                    name: Instr,
                    properties: [
                        { name: 'arg1' },
                        { name: 'arg2' },
                        { name: 'op' }
                    ]
                };
            }
            case Label: {
                return {
                    name: Label,
                    properties: [
                        { name: 'glob', defaultValue: false },
                        { name: 'name' }
                    ]
                };
            }
            case Line: {
                return {
                    name: Line,
                    properties: [
                        { name: 'comment' },
                        { name: 'dir' },
                        { name: 'instr' },
                        { name: 'label' }
                    ]
                };
            }
            case Operation: {
                return {
                    name: Operation,
                    properties: [
                        { name: 'opname' }
                    ]
                };
            }
            case Program: {
                return {
                    name: Program,
                    properties: [
                        { name: 'lines', defaultValue: [] }
                    ]
                };
            }
            case Reg16: {
                return {
                    name: Reg16,
                    properties: [
                        { name: 'register' }
                    ]
                };
            }
            case Reg8: {
                return {
                    name: Reg8,
                    properties: [
                        { name: 'register' }
                    ]
                };
            }
            default: {
                return {
                    name: type,
                    properties: []
                };
            }
        }
    }
}

export const reflection = new AsmAstReflection();
