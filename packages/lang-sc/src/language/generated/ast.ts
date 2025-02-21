/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const ScTerminals = {
    WS: /\s+/,
    ID: /[_a-zA-Z][\w_]*/,
    NUMBER: /[0-9]+(\.[0-9]+)?/,
    ML_COMMENT: /\/\*[\s\S]*?\*\//,
    SL_COMMENT: /\/\/[^\n\r]*/,
};

export type ScTerminalNames = keyof typeof ScTerminals;

export type ScKeywordNames = 
    | "!"
    | "!="
    | "("
    | ")"
    | "*"
    | "+"
    | ","
    | "-"
    | "/"
    | ";"
    | "<"
    | "<="
    | "="
    | "=="
    | ">"
    | ">="
    | "["
    | "[]"
    | "]"
    | "and"
    | "auto"
    | "char"
    | "else"
    | "for"
    | "if"
    | "int"
    | "or"
    | "register"
    | "return"
    | "signed"
    | "static"
    | "struct"
    | "unsigned"
    | "while"
    | "{"
    | "}";

export type ScTokenNames = ScTerminalNames | ScKeywordNames;

export type Definition = FunctionDeclaration | NamedElement;

export const Definition = 'Definition';

export function isDefinition(item: unknown): item is Definition {
    return reflection.isInstance(item, Definition);
}

export type Expression = BinaryExpression | MemberCall | NumberExpression | UnaryExpression;

export const Expression = 'Expression';

export function isExpression(item: unknown): item is Expression {
    return reflection.isInstance(item, Expression);
}

export type NamedElement = FunctionDeclaration | Parameter | StructDeclaration | VariableDeclaration;

export const NamedElement = 'NamedElement';

export function isNamedElement(item: unknown): item is NamedElement {
    return reflection.isInstance(item, NamedElement);
}

export type Statement = Expression | ForStatement | IfStatement | NamedElement | ReturnStatement | StructDeclaration | WhileStatement;

export const Statement = 'Statement';

export function isStatement(item: unknown): item is Statement {
    return reflection.isInstance(item, Statement);
}

export type TypeReference = PrimitiveTypeReference | StructTypeReference;

export const TypeReference = 'TypeReference';

export function isTypeReference(item: unknown): item is TypeReference {
    return reflection.isInstance(item, TypeReference);
}

export interface ArrayDeclaration extends AstNode {
    readonly $container: VariableDeclaration;
    readonly $type: 'ArrayDeclaration';
    dim?: number;
}

export const ArrayDeclaration = 'ArrayDeclaration';

export function isArrayDeclaration(item: unknown): item is ArrayDeclaration {
    return reflection.isInstance(item, ArrayDeclaration);
}

export interface BinaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | ForStatement | IfStatement | MemberCall | ReturnStatement | UnaryExpression | VariableDeclaration | WhileStatement;
    readonly $type: 'BinaryExpression';
    left: Expression;
    operator: '!=' | '*' | '+' | '-' | '/' | '<' | '<=' | '=' | '==' | '>' | '>=' | 'and' | 'or';
    right: Expression;
}

export const BinaryExpression = 'BinaryExpression';

export function isBinaryExpression(item: unknown): item is BinaryExpression {
    return reflection.isInstance(item, BinaryExpression);
}

export interface Block extends AstNode {
    readonly $container: ForStatement | FunctionDeclaration | IfStatement | WhileStatement;
    readonly $type: 'Block';
    statements: Array<Statement>;
}

export const Block = 'Block';

export function isBlock(item: unknown): item is Block {
    return reflection.isInstance(item, Block);
}

export interface ForStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'ForStatement';
    block: Block;
    condition?: Expression;
    counter?: NamedElement;
    execution?: Expression;
}

export const ForStatement = 'ForStatement';

export function isForStatement(item: unknown): item is ForStatement {
    return reflection.isInstance(item, ForStatement);
}

export interface FunctionDeclaration extends AstNode {
    readonly $container: Block | ForStatement | Program;
    readonly $type: 'FunctionDeclaration';
    body: Block;
    name: string;
    parameters: Array<Parameter>;
    returnType: boolean;
}

export const FunctionDeclaration = 'FunctionDeclaration';

export function isFunctionDeclaration(item: unknown): item is FunctionDeclaration {
    return reflection.isInstance(item, FunctionDeclaration);
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

export interface MemberCall extends AstNode {
    readonly $container: BinaryExpression | Block | ForStatement | IfStatement | MemberCall | ReturnStatement | UnaryExpression | VariableDeclaration | WhileStatement;
    readonly $type: 'MemberCall';
    arguments: Array<Expression>;
    element: Reference<NamedElement>;
    explicitOperationCall: boolean;
}

export const MemberCall = 'MemberCall';

export function isMemberCall(item: unknown): item is MemberCall {
    return reflection.isInstance(item, MemberCall);
}

export interface NumberExpression extends AstNode {
    readonly $container: BinaryExpression | Block | ForStatement | IfStatement | MemberCall | ReturnStatement | UnaryExpression | VariableDeclaration | WhileStatement;
    readonly $type: 'NumberExpression';
    value: number;
}

export const NumberExpression = 'NumberExpression';

export function isNumberExpression(item: unknown): item is NumberExpression {
    return reflection.isInstance(item, NumberExpression);
}

export interface Parameter extends AstNode {
    readonly $container: Block | ForStatement | FunctionDeclaration | Program;
    readonly $type: 'Parameter';
    array: boolean;
    name: string;
    pointer: boolean;
    type: TypeReference;
}

export const Parameter = 'Parameter';

export function isParameter(item: unknown): item is Parameter {
    return reflection.isInstance(item, Parameter);
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

export interface StructDeclaration extends AstNode {
    readonly $container: Block | ForStatement | Program;
    readonly $type: 'StructDeclaration';
    members: Array<StructMember>;
    name: string;
}

export const StructDeclaration = 'StructDeclaration';

export function isStructDeclaration(item: unknown): item is StructDeclaration {
    return reflection.isInstance(item, StructDeclaration);
}

export interface StructMember extends AstNode {
    readonly $container: Parameter | StructDeclaration | VariableDeclaration;
    readonly $type: 'PrimitiveTypeReference' | 'StructMember';
    name: string;
    pointer: boolean;
}

export const StructMember = 'StructMember';

export function isStructMember(item: unknown): item is StructMember {
    return reflection.isInstance(item, StructMember);
}

export interface StructTypeReference extends AstNode {
    readonly $container: Parameter | VariableDeclaration;
    readonly $type: 'StructTypeReference';
    storage?: 'auto' | 'register' | 'static';
    structName: Reference<StructDeclaration>;
    type: 'struct';
}

export const StructTypeReference = 'StructTypeReference';

export function isStructTypeReference(item: unknown): item is StructTypeReference {
    return reflection.isInstance(item, StructTypeReference);
}

export interface UnaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | ForStatement | IfStatement | MemberCall | ReturnStatement | UnaryExpression | VariableDeclaration | WhileStatement;
    readonly $type: 'UnaryExpression';
    operator: '!' | '-';
    value: Expression;
}

export const UnaryExpression = 'UnaryExpression';

export function isUnaryExpression(item: unknown): item is UnaryExpression {
    return reflection.isInstance(item, UnaryExpression);
}

export interface VariableDeclaration extends AstNode {
    readonly $container: Block | ForStatement | Program;
    readonly $type: 'VariableDeclaration';
    array?: ArrayDeclaration;
    assignment: boolean;
    name: string;
    pointer: boolean;
    type: TypeReference;
    value?: Expression;
}

export const VariableDeclaration = 'VariableDeclaration';

export function isVariableDeclaration(item: unknown): item is VariableDeclaration {
    return reflection.isInstance(item, VariableDeclaration);
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
    readonly $container: Parameter | VariableDeclaration;
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
    ArrayDeclaration: ArrayDeclaration
    BinaryExpression: BinaryExpression
    Block: Block
    Definition: Definition
    Expression: Expression
    ForStatement: ForStatement
    FunctionDeclaration: FunctionDeclaration
    IfStatement: IfStatement
    MemberCall: MemberCall
    NamedElement: NamedElement
    NumberExpression: NumberExpression
    Parameter: Parameter
    PrimitiveTypeReference: PrimitiveTypeReference
    Program: Program
    ReturnStatement: ReturnStatement
    Statement: Statement
    StructDeclaration: StructDeclaration
    StructMember: StructMember
    StructTypeReference: StructTypeReference
    TypeReference: TypeReference
    UnaryExpression: UnaryExpression
    VariableDeclaration: VariableDeclaration
    WhileStatement: WhileStatement
}

export class ScAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return [ArrayDeclaration, BinaryExpression, Block, Definition, Expression, ForStatement, FunctionDeclaration, IfStatement, MemberCall, NamedElement, NumberExpression, Parameter, PrimitiveTypeReference, Program, ReturnStatement, Statement, StructDeclaration, StructMember, StructTypeReference, TypeReference, UnaryExpression, VariableDeclaration, WhileStatement];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case BinaryExpression:
            case MemberCall:
            case NumberExpression:
            case UnaryExpression: {
                return this.isSubtype(Expression, supertype);
            }
            case Expression:
            case ForStatement:
            case IfStatement:
            case ReturnStatement:
            case WhileStatement: {
                return this.isSubtype(Statement, supertype);
            }
            case FunctionDeclaration: {
                return this.isSubtype(Definition, supertype) || this.isSubtype(NamedElement, supertype);
            }
            case NamedElement: {
                return this.isSubtype(Definition, supertype) || this.isSubtype(Statement, supertype);
            }
            case Parameter:
            case VariableDeclaration: {
                return this.isSubtype(NamedElement, supertype);
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
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'MemberCall:element': {
                return NamedElement;
            }
            case 'StructTypeReference:structName': {
                return StructDeclaration;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case ArrayDeclaration: {
                return {
                    name: ArrayDeclaration,
                    properties: [
                        { name: 'dim' }
                    ]
                };
            }
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
                        { name: 'statements', defaultValue: [] }
                    ]
                };
            }
            case ForStatement: {
                return {
                    name: ForStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'condition' },
                        { name: 'counter' },
                        { name: 'execution' }
                    ]
                };
            }
            case FunctionDeclaration: {
                return {
                    name: FunctionDeclaration,
                    properties: [
                        { name: 'body' },
                        { name: 'name' },
                        { name: 'parameters', defaultValue: [] },
                        { name: 'returnType', defaultValue: false }
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
            case MemberCall: {
                return {
                    name: MemberCall,
                    properties: [
                        { name: 'arguments', defaultValue: [] },
                        { name: 'element' },
                        { name: 'explicitOperationCall', defaultValue: false }
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
            case Parameter: {
                return {
                    name: Parameter,
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
            case UnaryExpression: {
                return {
                    name: UnaryExpression,
                    properties: [
                        { name: 'operator' },
                        { name: 'value' }
                    ]
                };
            }
            case VariableDeclaration: {
                return {
                    name: VariableDeclaration,
                    properties: [
                        { name: 'array' },
                        { name: 'assignment', defaultValue: false },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false },
                        { name: 'type' },
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
