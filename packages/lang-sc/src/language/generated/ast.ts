/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const ScTerminals = {
    WS: /\s+/,
    STRING: /"[^"]*"/,
    ID: /[_a-zA-Z][\w_]*/,
    NUMBER: /[0-9]+/,
    ASM: /#asm[\s\S]*?#endasm/,
    CHAR: /'.'/,
    ML_COMMENT: /\/\*[\s\S]*?\*\//,
    SL_COMMENT: /\/\/[^\n\r]*/,
};

export type ScTerminalNames = keyof typeof ScTerminals;

export type ScKeywordNames = 
    | "!"
    | "!="
    | "%"
    | "%="
    | "&"
    | "&&"
    | "&="
    | "("
    | ")"
    | "*"
    | "*="
    | "+"
    | "++"
    | "+="
    | ","
    | "-"
    | "--"
    | "-="
    | "."
    | "/"
    | "/="
    | ";"
    | "<"
    | "<<"
    | "<<="
    | "<="
    | "="
    | "=="
    | ">"
    | ">="
    | ">>"
    | ">>="
    | "["
    | "[]"
    | "]"
    | "^"
    | "^="
    | "auto"
    | "break"
    | "char"
    | "continue"
    | "do"
    | "else"
    | "extern"
    | "for"
    | "if"
    | "int"
    | "register"
    | "return"
    | "signed"
    | "sizeof"
    | "static"
    | "struct"
    | "unsigned"
    | "while"
    | "{"
    | "|"
    | "|="
    | "||"
    | "}"
    | "~";

export type ScTokenNames = ScTerminalNames | ScKeywordNames;

export type Definition = FunctionDeclaration | GlobalVariableDeclaration;

export const Definition = 'Definition';

export function isDefinition(item: unknown): item is Definition {
    return reflection.isInstance(item, Definition);
}

export type Expression = BinaryExpression | CharExpression | NumberExpression | SizeofExpression | StringExpression | SymbolExpression | UnaryExpression;

export const Expression = 'Expression';

export function isExpression(item: unknown): item is Expression {
    return reflection.isInstance(item, Expression);
}

export type NamedElement = FunctionDeclaration | GlobalVarName | LocalVarName | ParameterDeclaration | StructDeclaration;

export const NamedElement = 'NamedElement';

export function isNamedElement(item: unknown): item is NamedElement {
    return reflection.isInstance(item, NamedElement);
}

export type SizeofSymbol = NamedElement | ParameterDeclaration;

export const SizeofSymbol = 'SizeofSymbol';

export function isSizeofSymbol(item: unknown): item is SizeofSymbol {
    return reflection.isInstance(item, SizeofSymbol);
}

export type Statement = BreakStatement | ContinueStatement | DoStatement | Expression | ForStatement | IfStatement | InlineAssembly | ReturnStatement | StructDeclaration | WhileStatement;

export const Statement = 'Statement';

export function isStatement(item: unknown): item is Statement {
    return reflection.isInstance(item, Statement);
}

export type TypeReference = PrimitiveTypeReference | StructTypeReference;

export const TypeReference = 'TypeReference';

export function isTypeReference(item: unknown): item is TypeReference {
    return reflection.isInstance(item, TypeReference);
}

export interface BinaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'BinaryExpression';
    left: Expression;
    operator: '!=' | '%' | '%=' | '&&' | '&' | '&=' | '*' | '*=' | '+' | '+=' | '-' | '-=' | '/' | '/=' | '<' | '<<' | '<<=' | '<=' | '=' | '==' | '>' | '>=' | '>>' | '>>=' | '^' | '^=' | '|' | '|=' | '||';
    right: Expression;
}

export const BinaryExpression = 'BinaryExpression';

export function isBinaryExpression(item: unknown): item is BinaryExpression {
    return reflection.isInstance(item, BinaryExpression);
}

export interface Block extends AstNode {
    readonly $container: DoStatement | ForStatement | FunctionDeclaration | IfStatement | WhileStatement;
    readonly $type: 'Block';
    declarations: Array<LocalVariableDeclaration>;
    statements: Array<Statement>;
}

export const Block = 'Block';

export function isBlock(item: unknown): item is Block {
    return reflection.isInstance(item, Block);
}

export interface BreakStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'BreakStatement';
    break: 'break';
}

export const BreakStatement = 'BreakStatement';

export function isBreakStatement(item: unknown): item is BreakStatement {
    return reflection.isInstance(item, BreakStatement);
}

export interface CharExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'CharExpression';
    value: string;
}

export const CharExpression = 'CharExpression';

export function isCharExpression(item: unknown): item is CharExpression {
    return reflection.isInstance(item, CharExpression);
}

export interface ContinueStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'ContinueStatement';
    continue: 'continue';
}

export const ContinueStatement = 'ContinueStatement';

export function isContinueStatement(item: unknown): item is ContinueStatement {
    return reflection.isInstance(item, ContinueStatement);
}

export interface DoStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'DoStatement';
    block: Block;
    condition: Expression;
}

export const DoStatement = 'DoStatement';

export function isDoStatement(item: unknown): item is DoStatement {
    return reflection.isInstance(item, DoStatement);
}

export interface ForStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'ForStatement';
    block: Block;
    condition?: Expression;
    execution?: Expression;
    init?: Expression;
}

export const ForStatement = 'ForStatement';

export function isForStatement(item: unknown): item is ForStatement {
    return reflection.isInstance(item, ForStatement);
}

export interface FunctionCall extends AstNode {
    readonly $container: SymbolExpression;
    readonly $type: 'FunctionCall';
    arguments: Array<Expression>;
}

export const FunctionCall = 'FunctionCall';

export function isFunctionCall(item: unknown): item is FunctionCall {
    return reflection.isInstance(item, FunctionCall);
}

export interface FunctionDeclaration extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | Program | SizeofExpression;
    readonly $type: 'FunctionDeclaration';
    body: Block;
    extern: boolean;
    name: string;
    parameters: Array<ParameterDeclaration>;
    returnType: boolean;
}

export const FunctionDeclaration = 'FunctionDeclaration';

export function isFunctionDeclaration(item: unknown): item is FunctionDeclaration {
    return reflection.isInstance(item, FunctionDeclaration);
}

export interface GlobalVariableDeclaration extends AstNode {
    readonly $container: Program;
    readonly $type: 'GlobalVariableDeclaration';
    type: TypeReference;
    varNames: Array<NamedElement>;
}

export const GlobalVariableDeclaration = 'GlobalVariableDeclaration';

export function isGlobalVariableDeclaration(item: unknown): item is GlobalVariableDeclaration {
    return reflection.isInstance(item, GlobalVariableDeclaration);
}

export interface GlobalVarName extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'GlobalVarName';
    array: boolean;
    assignment: boolean;
    dim?: number;
    items: Array<Expression>;
    name: string;
    pointer: boolean;
    value?: Expression;
}

export const GlobalVarName = 'GlobalVarName';

export function isGlobalVarName(item: unknown): item is GlobalVarName {
    return reflection.isInstance(item, GlobalVarName);
}

export interface IfStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'IfStatement';
    block: Block;
    condition: Expression;
    elseBlock?: Block;
}

export const IfStatement = 'IfStatement';

export function isIfStatement(item: unknown): item is IfStatement {
    return reflection.isInstance(item, IfStatement);
}

export interface InlineAssembly extends AstNode {
    readonly $container: Block;
    readonly $type: 'InlineAssembly';
    asm: string;
}

export const InlineAssembly = 'InlineAssembly';

export function isInlineAssembly(item: unknown): item is InlineAssembly {
    return reflection.isInstance(item, InlineAssembly);
}

export interface LocalVariableDeclaration extends AstNode {
    readonly $container: Block;
    readonly $type: 'LocalVariableDeclaration';
    type: TypeReference;
    varNames: Array<NamedElement>;
}

export const LocalVariableDeclaration = 'LocalVariableDeclaration';

export function isLocalVariableDeclaration(item: unknown): item is LocalVariableDeclaration {
    return reflection.isInstance(item, LocalVariableDeclaration);
}

export interface LocalVarName extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'LocalVarName';
    array: boolean;
    dim?: number;
    name: string;
    pointer: boolean;
}

export const LocalVarName = 'LocalVarName';

export function isLocalVarName(item: unknown): item is LocalVarName {
    return reflection.isInstance(item, LocalVarName);
}

export interface NumberExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'NumberExpression';
    value: number;
}

export const NumberExpression = 'NumberExpression';

export function isNumberExpression(item: unknown): item is NumberExpression {
    return reflection.isInstance(item, NumberExpression);
}

export interface ParameterDeclaration extends AstNode {
    readonly $container: FunctionDeclaration | GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'ParameterDeclaration';
    array: boolean;
    name: string;
    pointer: boolean;
    type: TypeReference;
}

export const ParameterDeclaration = 'ParameterDeclaration';

export function isParameterDeclaration(item: unknown): item is ParameterDeclaration {
    return reflection.isInstance(item, ParameterDeclaration);
}

export interface Program extends AstNode {
    readonly $type: 'Program';
    definitions: Array<Definition>;
}

export const Program = 'Program';

export function isProgram(item: unknown): item is Program {
    return reflection.isInstance(item, Program);
}

export interface ReturnStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'ReturnStatement';
    value?: Expression;
}

export const ReturnStatement = 'ReturnStatement';

export function isReturnStatement(item: unknown): item is ReturnStatement {
    return reflection.isInstance(item, ReturnStatement);
}

export interface SizeofExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'SizeofExpression';
    arg: SizeofSymbol | SizeofTypeReference;
}

export const SizeofExpression = 'SizeofExpression';

export function isSizeofExpression(item: unknown): item is SizeofExpression {
    return reflection.isInstance(item, SizeofExpression);
}

export interface SizeofTypeReference extends AstNode {
    readonly $container: SizeofExpression;
    readonly $type: 'PrimitiveTypeReference' | 'SizeofTypeReference' | 'StructTypeReference' | 'TypeReference';
    pointer: boolean;
}

export const SizeofTypeReference = 'SizeofTypeReference';

export function isSizeofTypeReference(item: unknown): item is SizeofTypeReference {
    return reflection.isInstance(item, SizeofTypeReference);
}

export interface StringExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'StringExpression';
    value: string;
}

export const StringExpression = 'StringExpression';

export function isStringExpression(item: unknown): item is StringExpression {
    return reflection.isInstance(item, StringExpression);
}

export interface StructDeclaration extends AstNode {
    readonly $container: Block | GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'StructDeclaration';
    members: Array<StructMember>;
    name: string;
}

export const StructDeclaration = 'StructDeclaration';

export function isStructDeclaration(item: unknown): item is StructDeclaration {
    return reflection.isInstance(item, StructDeclaration);
}

export interface StructMember extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration | StructDeclaration;
    readonly $type: 'PrimitiveTypeReference' | 'StructMember';
    name: string;
    pointer: boolean;
}

export const StructMember = 'StructMember';

export function isStructMember(item: unknown): item is StructMember {
    return reflection.isInstance(item, StructMember);
}

export interface StructTypeReference extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration;
    readonly $type: 'StructTypeReference';
    storage?: 'auto' | 'register' | 'static';
    structName: Reference<StructDeclaration>;
    type: 'struct';
}

export const StructTypeReference = 'StructTypeReference';

export function isStructTypeReference(item: unknown): item is StructTypeReference {
    return reflection.isInstance(item, StructTypeReference);
}

export interface SymbolExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | UnaryExpression | WhileStatement;
    readonly $type: 'SymbolExpression';
    element: Reference<NamedElement>;
    functionCall?: FunctionCall;
    indexExpression?: Expression;
    postfix?: '++' | '--';
    structMember?: Reference<StructMember>;
}

export const SymbolExpression = 'SymbolExpression';

export function isSymbolExpression(item: unknown): item is SymbolExpression {
    return reflection.isInstance(item, SymbolExpression);
}

export interface UnaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | GlobalVarName | IfStatement | ReturnStatement | SymbolExpression | WhileStatement;
    readonly $type: 'UnaryExpression';
    prefix: '!' | '&' | '*' | '++' | '-' | '--' | '~';
    value: SymbolExpression;
}

export const UnaryExpression = 'UnaryExpression';

export function isUnaryExpression(item: unknown): item is UnaryExpression {
    return reflection.isInstance(item, UnaryExpression);
}

export interface WhileStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'WhileStatement';
    block: Block;
    condition: Expression;
}

export const WhileStatement = 'WhileStatement';

export function isWhileStatement(item: unknown): item is WhileStatement {
    return reflection.isInstance(item, WhileStatement);
}

export interface PrimitiveTypeReference extends StructMember {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration;
    readonly $type: 'PrimitiveTypeReference';
    signed?: 'signed' | 'unsigned';
    storage?: 'auto' | 'register' | 'static';
    type: 'char' | 'int';
}

export const PrimitiveTypeReference = 'PrimitiveTypeReference';

export function isPrimitiveTypeReference(item: unknown): item is PrimitiveTypeReference {
    return reflection.isInstance(item, PrimitiveTypeReference);
}

export type ScAstType = {
    BinaryExpression: BinaryExpression
    Block: Block
    BreakStatement: BreakStatement
    CharExpression: CharExpression
    ContinueStatement: ContinueStatement
    Definition: Definition
    DoStatement: DoStatement
    Expression: Expression
    ForStatement: ForStatement
    FunctionCall: FunctionCall
    FunctionDeclaration: FunctionDeclaration
    GlobalVarName: GlobalVarName
    GlobalVariableDeclaration: GlobalVariableDeclaration
    IfStatement: IfStatement
    InlineAssembly: InlineAssembly
    LocalVarName: LocalVarName
    LocalVariableDeclaration: LocalVariableDeclaration
    NamedElement: NamedElement
    NumberExpression: NumberExpression
    ParameterDeclaration: ParameterDeclaration
    PrimitiveTypeReference: PrimitiveTypeReference
    Program: Program
    ReturnStatement: ReturnStatement
    SizeofExpression: SizeofExpression
    SizeofSymbol: SizeofSymbol
    SizeofTypeReference: SizeofTypeReference
    Statement: Statement
    StringExpression: StringExpression
    StructDeclaration: StructDeclaration
    StructMember: StructMember
    StructTypeReference: StructTypeReference
    SymbolExpression: SymbolExpression
    TypeReference: TypeReference
    UnaryExpression: UnaryExpression
    WhileStatement: WhileStatement
}

export class ScAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return [BinaryExpression, Block, BreakStatement, CharExpression, ContinueStatement, Definition, DoStatement, Expression, ForStatement, FunctionCall, FunctionDeclaration, GlobalVarName, GlobalVariableDeclaration, IfStatement, InlineAssembly, LocalVarName, LocalVariableDeclaration, NamedElement, NumberExpression, ParameterDeclaration, PrimitiveTypeReference, Program, ReturnStatement, SizeofExpression, SizeofSymbol, SizeofTypeReference, Statement, StringExpression, StructDeclaration, StructMember, StructTypeReference, SymbolExpression, TypeReference, UnaryExpression, WhileStatement];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case BinaryExpression:
            case CharExpression:
            case NumberExpression:
            case SizeofExpression:
            case StringExpression:
            case SymbolExpression:
            case UnaryExpression: {
                return this.isSubtype(Expression, supertype);
            }
            case BreakStatement:
            case ContinueStatement:
            case DoStatement:
            case Expression:
            case ForStatement:
            case IfStatement:
            case InlineAssembly:
            case ReturnStatement:
            case WhileStatement: {
                return this.isSubtype(Statement, supertype);
            }
            case FunctionDeclaration: {
                return this.isSubtype(Definition, supertype) || this.isSubtype(NamedElement, supertype);
            }
            case GlobalVariableDeclaration: {
                return this.isSubtype(Definition, supertype);
            }
            case GlobalVarName:
            case LocalVarName: {
                return this.isSubtype(NamedElement, supertype);
            }
            case NamedElement: {
                return this.isSubtype(SizeofSymbol, supertype);
            }
            case ParameterDeclaration: {
                return this.isSubtype(NamedElement, supertype) || this.isSubtype(SizeofSymbol, supertype);
            }
            case PrimitiveTypeReference: {
                return this.isSubtype(StructMember, supertype) || this.isSubtype(TypeReference, supertype);
            }
            case StructDeclaration: {
                return this.isSubtype(NamedElement, supertype) || this.isSubtype(Statement, supertype);
            }
            case StructTypeReference: {
                return this.isSubtype(TypeReference, supertype);
            }
            case TypeReference: {
                return this.isSubtype(SizeofTypeReference, supertype);
            }
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'StructTypeReference:structName': {
                return StructDeclaration;
            }
            case 'SymbolExpression:element': {
                return NamedElement;
            }
            case 'SymbolExpression:structMember': {
                return StructMember;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case BinaryExpression: {
                return {
                    name: BinaryExpression,
                    properties: [
                        { name: 'left' },
                        { name: 'operator' },
                        { name: 'right' }
                    ]
                };
            }
            case Block: {
                return {
                    name: Block,
                    properties: [
                        { name: 'declarations', defaultValue: [] },
                        { name: 'statements', defaultValue: [] }
                    ]
                };
            }
            case BreakStatement: {
                return {
                    name: BreakStatement,
                    properties: [
                        { name: 'break' }
                    ]
                };
            }
            case CharExpression: {
                return {
                    name: CharExpression,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case ContinueStatement: {
                return {
                    name: ContinueStatement,
                    properties: [
                        { name: 'continue' }
                    ]
                };
            }
            case DoStatement: {
                return {
                    name: DoStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'condition' }
                    ]
                };
            }
            case ForStatement: {
                return {
                    name: ForStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'condition' },
                        { name: 'execution' },
                        { name: 'init' }
                    ]
                };
            }
            case FunctionCall: {
                return {
                    name: FunctionCall,
                    properties: [
                        { name: 'arguments', defaultValue: [] }
                    ]
                };
            }
            case FunctionDeclaration: {
                return {
                    name: FunctionDeclaration,
                    properties: [
                        { name: 'body' },
                        { name: 'extern', defaultValue: false },
                        { name: 'name' },
                        { name: 'parameters', defaultValue: [] },
                        { name: 'returnType', defaultValue: false }
                    ]
                };
            }
            case GlobalVariableDeclaration: {
                return {
                    name: GlobalVariableDeclaration,
                    properties: [
                        { name: 'type' },
                        { name: 'varNames', defaultValue: [] }
                    ]
                };
            }
            case GlobalVarName: {
                return {
                    name: GlobalVarName,
                    properties: [
                        { name: 'array', defaultValue: false },
                        { name: 'assignment', defaultValue: false },
                        { name: 'dim' },
                        { name: 'items', defaultValue: [] },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false },
                        { name: 'value' }
                    ]
                };
            }
            case IfStatement: {
                return {
                    name: IfStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'condition' },
                        { name: 'elseBlock' }
                    ]
                };
            }
            case InlineAssembly: {
                return {
                    name: InlineAssembly,
                    properties: [
                        { name: 'asm' }
                    ]
                };
            }
            case LocalVariableDeclaration: {
                return {
                    name: LocalVariableDeclaration,
                    properties: [
                        { name: 'type' },
                        { name: 'varNames', defaultValue: [] }
                    ]
                };
            }
            case LocalVarName: {
                return {
                    name: LocalVarName,
                    properties: [
                        { name: 'array', defaultValue: false },
                        { name: 'dim' },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false }
                    ]
                };
            }
            case NumberExpression: {
                return {
                    name: NumberExpression,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case ParameterDeclaration: {
                return {
                    name: ParameterDeclaration,
                    properties: [
                        { name: 'array', defaultValue: false },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false },
                        { name: 'type' }
                    ]
                };
            }
            case Program: {
                return {
                    name: Program,
                    properties: [
                        { name: 'definitions', defaultValue: [] }
                    ]
                };
            }
            case ReturnStatement: {
                return {
                    name: ReturnStatement,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case SizeofExpression: {
                return {
                    name: SizeofExpression,
                    properties: [
                        { name: 'arg' }
                    ]
                };
            }
            case SizeofTypeReference: {
                return {
                    name: SizeofTypeReference,
                    properties: [
                        { name: 'pointer', defaultValue: false }
                    ]
                };
            }
            case StringExpression: {
                return {
                    name: StringExpression,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case StructDeclaration: {
                return {
                    name: StructDeclaration,
                    properties: [
                        { name: 'members', defaultValue: [] },
                        { name: 'name' }
                    ]
                };
            }
            case StructMember: {
                return {
                    name: StructMember,
                    properties: [
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false }
                    ]
                };
            }
            case StructTypeReference: {
                return {
                    name: StructTypeReference,
                    properties: [
                        { name: 'storage' },
                        { name: 'structName' },
                        { name: 'type' }
                    ]
                };
            }
            case SymbolExpression: {
                return {
                    name: SymbolExpression,
                    properties: [
                        { name: 'element' },
                        { name: 'functionCall' },
                        { name: 'indexExpression' },
                        { name: 'postfix' },
                        { name: 'structMember' }
                    ]
                };
            }
            case UnaryExpression: {
                return {
                    name: UnaryExpression,
                    properties: [
                        { name: 'prefix' },
                        { name: 'value' }
                    ]
                };
            }
            case WhileStatement: {
                return {
                    name: WhileStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'condition' }
                    ]
                };
            }
            case PrimitiveTypeReference: {
                return {
                    name: PrimitiveTypeReference,
                    properties: [
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false },
                        { name: 'signed' },
                        { name: 'storage' },
                        { name: 'type' }
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

export const reflection = new ScAstReflection();
