/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const ScTerminals = {
    WS: /\s+/,
    MINUS: /[\-](?!>)/,
    STRING: /"[^"]*"/,
    ID: /[_a-zA-Z][\w_]*/,
    HEXNUMBER: /0[xX][0-9a-fA-F]+/,
    BINNUMBER: /0[bB][0-1]+/,
    DECNUMBER: /[\-]?[0-9]+/,
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
    | "--"
    | "-="
    | "->"
    | "."
    | "/"
    | "/="
    | ":"
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
    | "?"
    | "["
    | "[]"
    | "]"
    | "^"
    | "^="
    | "auto"
    | "break"
    | "case"
    | "char"
    | "continue"
    | "default"
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
    | "switch"
    | "union"
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

export type Expression = BinaryExpression | LiteralExpression | MemberAccess | PostfixExpression | PrefixExpression | SizeofExpression | SymbolExpression | TernaryExpression;

export const Expression = 'Expression';

export function isExpression(item: unknown): item is Expression {
    return reflection.isInstance(item, Expression);
}

export type LiteralExpression = CharExpression | NumberExpression | StringExpression;

export const LiteralExpression = 'LiteralExpression';

export function isLiteralExpression(item: unknown): item is LiteralExpression {
    return reflection.isInstance(item, LiteralExpression);
}

export type NamedElement = FunctionDeclaration | GlobalVarName | LocalVarName | ParameterDeclaration;

export const NamedElement = 'NamedElement';

export function isNamedElement(item: unknown): item is NamedElement {
    return reflection.isInstance(item, NamedElement);
}

export type SizeofSymbol = NamedElement | ParameterDeclaration;

export const SizeofSymbol = 'SizeofSymbol';

export function isSizeofSymbol(item: unknown): item is SizeofSymbol {
    return reflection.isInstance(item, SizeofSymbol);
}

export type Statement = BreakStatement | CaseStatement | ContinueStatement | DefaultStatement | DoStatement | Expression | ForStatement | IfStatement | InlineAssembly | ReturnStatement | SwitchStatement | WhileStatement;

export const Statement = 'Statement';

export function isStatement(item: unknown): item is Statement {
    return reflection.isInstance(item, Statement);
}

export type StructTypeSpecifier = StructTypeDeclaration | StructTypeReference;

export const StructTypeSpecifier = 'StructTypeSpecifier';

export function isStructTypeSpecifier(item: unknown): item is StructTypeSpecifier {
    return reflection.isInstance(item, StructTypeSpecifier);
}

export type TypeSpecifier = PrimitiveTypeSpecifier | StructTypeSpecifier;

export const TypeSpecifier = 'TypeSpecifier';

export function isTypeSpecifier(item: unknown): item is TypeSpecifier {
    return reflection.isInstance(item, TypeSpecifier);
}

export interface ArraySpecifier extends AstNode {
    readonly $container: GlobalVarName | LocalVarName;
    readonly $type: 'ArraySpecifier';
    dim?: number;
}

export const ArraySpecifier = 'ArraySpecifier';

export function isArraySpecifier(item: unknown): item is ArraySpecifier {
    return reflection.isInstance(item, ArraySpecifier);
}

export interface BinaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'BinaryExpression';
    left: Expression;
    operator: '!=' | '%' | '%=' | '&&' | '&' | '&=' | '*' | '*=' | '+' | '+=' | '-=' | '/' | '/=' | '<' | '<<' | '<<=' | '<=' | '=' | '==' | '>' | '>=' | '>>' | '>>=' | '^' | '^=' | '|' | '|=' | '||' | string;
    right: Expression;
}

export const BinaryExpression = 'BinaryExpression';

export function isBinaryExpression(item: unknown): item is BinaryExpression {
    return reflection.isInstance(item, BinaryExpression);
}

export interface Block extends AstNode {
    readonly $container: CaseStatement | DefaultStatement | DoStatement | ForStatement | FunctionDeclaration | IfStatement | SwitchStatement | WhileStatement;
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

export interface CaseStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'CaseStatement';
    block: Block;
    caseValue: LiteralExpression;
}

export const CaseStatement = 'CaseStatement';

export function isCaseStatement(item: unknown): item is CaseStatement {
    return reflection.isInstance(item, CaseStatement);
}

export interface CharExpression extends AstNode {
    readonly $container: BinaryExpression | Block | CaseStatement | DoStatement | ForStatement | FunctionCall | IfStatement | Initials | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
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

export interface DefaultStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'DefaultStatement';
    block: Block;
}

export const DefaultStatement = 'DefaultStatement';

export function isDefaultStatement(item: unknown): item is DefaultStatement {
    return reflection.isInstance(item, DefaultStatement);
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
    storage?: 'extern' | 'static';
    typeSpecifier: TypeSpecifier;
    varNames: Array<NamedElement>;
}

export const GlobalVariableDeclaration = 'GlobalVariableDeclaration';

export function isGlobalVariableDeclaration(item: unknown): item is GlobalVariableDeclaration {
    return reflection.isInstance(item, GlobalVariableDeclaration);
}

export interface GlobalVarName extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'GlobalVarName';
    arraySpecifier?: ArraySpecifier;
    initials?: Initials;
    name: string;
    pointer: boolean;
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

export interface Initials extends AstNode {
    readonly $container: GlobalVarName;
    readonly $type: 'Initials';
    values: Array<LiteralExpression>;
}

export const Initials = 'Initials';

export function isInitials(item: unknown): item is Initials {
    return reflection.isInstance(item, Initials);
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
    storage?: 'auto' | 'register' | 'static';
    typeSpecifier: TypeSpecifier;
    varNames: Array<NamedElement>;
}

export const LocalVariableDeclaration = 'LocalVariableDeclaration';

export function isLocalVariableDeclaration(item: unknown): item is LocalVariableDeclaration {
    return reflection.isInstance(item, LocalVariableDeclaration);
}

export interface LocalVarName extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | SizeofExpression;
    readonly $type: 'LocalVarName';
    arraySpecifier?: ArraySpecifier;
    name: string;
    pointer: boolean;
}

export const LocalVarName = 'LocalVarName';

export function isLocalVarName(item: unknown): item is LocalVarName {
    return reflection.isInstance(item, LocalVarName);
}

export interface MemberAccess extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'MemberAccess';
    memberName: Reference<StructMember>;
    operator: '->' | '.';
    receiver: Expression;
}

export const MemberAccess = 'MemberAccess';

export function isMemberAccess(item: unknown): item is MemberAccess {
    return reflection.isInstance(item, MemberAccess);
}

export interface NumberExpression extends AstNode {
    readonly $container: BinaryExpression | Block | CaseStatement | DoStatement | ForStatement | FunctionCall | IfStatement | Initials | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
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
    typeSpecifier: TypeSpecifier;
}

export const ParameterDeclaration = 'ParameterDeclaration';

export function isParameterDeclaration(item: unknown): item is ParameterDeclaration {
    return reflection.isInstance(item, ParameterDeclaration);
}

export interface PostfixExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'PostfixExpression';
    operand: Expression;
    operator: '++' | '--';
}

export const PostfixExpression = 'PostfixExpression';

export function isPostfixExpression(item: unknown): item is PostfixExpression {
    return reflection.isInstance(item, PostfixExpression);
}

export interface PrefixExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'PrefixExpression';
    operand: Expression;
    operator: '!' | '&' | '*' | '++' | '--' | '~' | string;
}

export const PrefixExpression = 'PrefixExpression';

export function isPrefixExpression(item: unknown): item is PrefixExpression {
    return reflection.isInstance(item, PrefixExpression);
}

export interface PrimitiveTypeSpecifier extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration | StructMember;
    readonly $type: 'PrimitiveTypeSpecifier';
    atomicType: 'char' | 'int';
    signed?: 'signed' | 'unsigned';
}

export const PrimitiveTypeSpecifier = 'PrimitiveTypeSpecifier';

export function isPrimitiveTypeSpecifier(item: unknown): item is PrimitiveTypeSpecifier {
    return reflection.isInstance(item, PrimitiveTypeSpecifier);
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
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'SizeofExpression';
    arg: SizeofSymbol | SizeofTypeReference;
}

export const SizeofExpression = 'SizeofExpression';

export function isSizeofExpression(item: unknown): item is SizeofExpression {
    return reflection.isInstance(item, SizeofExpression);
}

export interface SizeofTypeReference extends AstNode {
    readonly $container: SizeofExpression;
    readonly $type: 'PrimitiveTypeSpecifier' | 'SizeofTypeReference' | 'StructTypeDeclaration' | 'StructTypeReference' | 'StructTypeSpecifier' | 'TypeSpecifier';
    pointer: boolean;
}

export const SizeofTypeReference = 'SizeofTypeReference';

export function isSizeofTypeReference(item: unknown): item is SizeofTypeReference {
    return reflection.isInstance(item, SizeofTypeReference);
}

export interface StringExpression extends AstNode {
    readonly $container: BinaryExpression | Block | CaseStatement | DoStatement | ForStatement | FunctionCall | IfStatement | Initials | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'StringExpression';
    value: string;
}

export const StringExpression = 'StringExpression';

export function isStringExpression(item: unknown): item is StringExpression {
    return reflection.isInstance(item, StringExpression);
}

export interface StructMember extends AstNode {
    readonly $container: StructTypeDeclaration;
    readonly $type: 'StructMember';
    array: boolean;
    dim?: number;
    name: string;
    pointer: boolean;
    typeSpecifier: PrimitiveTypeSpecifier;
}

export const StructMember = 'StructMember';

export function isStructMember(item: unknown): item is StructMember {
    return reflection.isInstance(item, StructMember);
}

export interface StructTypeDeclaration extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration;
    readonly $type: 'StructTypeDeclaration';
    atomicType: 'struct' | 'union';
    members: Array<StructMember>;
    name: string;
}

export const StructTypeDeclaration = 'StructTypeDeclaration';

export function isStructTypeDeclaration(item: unknown): item is StructTypeDeclaration {
    return reflection.isInstance(item, StructTypeDeclaration);
}

export interface StructTypeReference extends AstNode {
    readonly $container: GlobalVariableDeclaration | LocalVariableDeclaration | ParameterDeclaration;
    readonly $type: 'StructTypeReference';
    atomicType: 'struct' | 'union';
    structTypeName: Reference<StructTypeDeclaration>;
}

export const StructTypeReference = 'StructTypeReference';

export function isStructTypeReference(item: unknown): item is StructTypeReference {
    return reflection.isInstance(item, StructTypeReference);
}

export interface SwitchStatement extends AstNode {
    readonly $container: Block;
    readonly $type: 'SwitchStatement';
    block: Block;
    switchValue: Expression;
}

export const SwitchStatement = 'SwitchStatement';

export function isSwitchStatement(item: unknown): item is SwitchStatement {
    return reflection.isInstance(item, SwitchStatement);
}

export interface SymbolExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'SymbolExpression';
    element: Reference<NamedElement>;
    functionCall?: FunctionCall;
    indexExpression?: Expression;
}

export const SymbolExpression = 'SymbolExpression';

export function isSymbolExpression(item: unknown): item is SymbolExpression {
    return reflection.isInstance(item, SymbolExpression);
}

export interface TernaryExpression extends AstNode {
    readonly $container: BinaryExpression | Block | DoStatement | ForStatement | FunctionCall | IfStatement | MemberAccess | PostfixExpression | PrefixExpression | ReturnStatement | SwitchStatement | SymbolExpression | TernaryExpression | WhileStatement;
    readonly $type: 'TernaryExpression';
    left: Expression;
    right: Expression;
    test: Expression;
}

export const TernaryExpression = 'TernaryExpression';

export function isTernaryExpression(item: unknown): item is TernaryExpression {
    return reflection.isInstance(item, TernaryExpression);
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

export type ScAstType = {
    ArraySpecifier: ArraySpecifier
    BinaryExpression: BinaryExpression
    Block: Block
    BreakStatement: BreakStatement
    CaseStatement: CaseStatement
    CharExpression: CharExpression
    ContinueStatement: ContinueStatement
    DefaultStatement: DefaultStatement
    Definition: Definition
    DoStatement: DoStatement
    Expression: Expression
    ForStatement: ForStatement
    FunctionCall: FunctionCall
    FunctionDeclaration: FunctionDeclaration
    GlobalVarName: GlobalVarName
    GlobalVariableDeclaration: GlobalVariableDeclaration
    IfStatement: IfStatement
    Initials: Initials
    InlineAssembly: InlineAssembly
    LiteralExpression: LiteralExpression
    LocalVarName: LocalVarName
    LocalVariableDeclaration: LocalVariableDeclaration
    MemberAccess: MemberAccess
    NamedElement: NamedElement
    NumberExpression: NumberExpression
    ParameterDeclaration: ParameterDeclaration
    PostfixExpression: PostfixExpression
    PrefixExpression: PrefixExpression
    PrimitiveTypeSpecifier: PrimitiveTypeSpecifier
    Program: Program
    ReturnStatement: ReturnStatement
    SizeofExpression: SizeofExpression
    SizeofSymbol: SizeofSymbol
    SizeofTypeReference: SizeofTypeReference
    Statement: Statement
    StringExpression: StringExpression
    StructMember: StructMember
    StructTypeDeclaration: StructTypeDeclaration
    StructTypeReference: StructTypeReference
    StructTypeSpecifier: StructTypeSpecifier
    SwitchStatement: SwitchStatement
    SymbolExpression: SymbolExpression
    TernaryExpression: TernaryExpression
    TypeSpecifier: TypeSpecifier
    WhileStatement: WhileStatement
}

export class ScAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return [ArraySpecifier, BinaryExpression, Block, BreakStatement, CaseStatement, CharExpression, ContinueStatement, DefaultStatement, Definition, DoStatement, Expression, ForStatement, FunctionCall, FunctionDeclaration, GlobalVarName, GlobalVariableDeclaration, IfStatement, Initials, InlineAssembly, LiteralExpression, LocalVarName, LocalVariableDeclaration, MemberAccess, NamedElement, NumberExpression, ParameterDeclaration, PostfixExpression, PrefixExpression, PrimitiveTypeSpecifier, Program, ReturnStatement, SizeofExpression, SizeofSymbol, SizeofTypeReference, Statement, StringExpression, StructMember, StructTypeDeclaration, StructTypeReference, StructTypeSpecifier, SwitchStatement, SymbolExpression, TernaryExpression, TypeSpecifier, WhileStatement];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case BinaryExpression:
            case LiteralExpression:
            case MemberAccess:
            case PostfixExpression:
            case PrefixExpression:
            case SizeofExpression:
            case SymbolExpression:
            case TernaryExpression: {
                return this.isSubtype(Expression, supertype);
            }
            case BreakStatement:
            case CaseStatement:
            case ContinueStatement:
            case DefaultStatement:
            case DoStatement:
            case Expression:
            case ForStatement:
            case IfStatement:
            case InlineAssembly:
            case ReturnStatement:
            case SwitchStatement:
            case WhileStatement: {
                return this.isSubtype(Statement, supertype);
            }
            case CharExpression:
            case NumberExpression:
            case StringExpression: {
                return this.isSubtype(LiteralExpression, supertype);
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
            case PrimitiveTypeSpecifier:
            case StructTypeSpecifier: {
                return this.isSubtype(TypeSpecifier, supertype);
            }
            case StructTypeDeclaration:
            case StructTypeReference: {
                return this.isSubtype(StructTypeSpecifier, supertype);
            }
            case TypeSpecifier: {
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
            case 'MemberAccess:memberName': {
                return StructMember;
            }
            case 'StructTypeReference:structTypeName': {
                return StructTypeDeclaration;
            }
            case 'SymbolExpression:element': {
                return NamedElement;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case ArraySpecifier: {
                return {
                    name: ArraySpecifier,
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
            case CaseStatement: {
                return {
                    name: CaseStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'caseValue' }
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
            case DefaultStatement: {
                return {
                    name: DefaultStatement,
                    properties: [
                        { name: 'block' }
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
                        { name: 'storage' },
                        { name: 'typeSpecifier' },
                        { name: 'varNames', defaultValue: [] }
                    ]
                };
            }
            case GlobalVarName: {
                return {
                    name: GlobalVarName,
                    properties: [
                        { name: 'arraySpecifier' },
                        { name: 'initials' },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false }
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
            case Initials: {
                return {
                    name: Initials,
                    properties: [
                        { name: 'values', defaultValue: [] }
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
                        { name: 'storage' },
                        { name: 'typeSpecifier' },
                        { name: 'varNames', defaultValue: [] }
                    ]
                };
            }
            case LocalVarName: {
                return {
                    name: LocalVarName,
                    properties: [
                        { name: 'arraySpecifier' },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false }
                    ]
                };
            }
            case MemberAccess: {
                return {
                    name: MemberAccess,
                    properties: [
                        { name: 'memberName' },
                        { name: 'operator' },
                        { name: 'receiver' }
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
                        { name: 'typeSpecifier' }
                    ]
                };
            }
            case PostfixExpression: {
                return {
                    name: PostfixExpression,
                    properties: [
                        { name: 'operand' },
                        { name: 'operator' }
                    ]
                };
            }
            case PrefixExpression: {
                return {
                    name: PrefixExpression,
                    properties: [
                        { name: 'operand' },
                        { name: 'operator' }
                    ]
                };
            }
            case PrimitiveTypeSpecifier: {
                return {
                    name: PrimitiveTypeSpecifier,
                    properties: [
                        { name: 'atomicType' },
                        { name: 'signed' }
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
            case StructMember: {
                return {
                    name: StructMember,
                    properties: [
                        { name: 'array', defaultValue: false },
                        { name: 'dim' },
                        { name: 'name' },
                        { name: 'pointer', defaultValue: false },
                        { name: 'typeSpecifier' }
                    ]
                };
            }
            case StructTypeDeclaration: {
                return {
                    name: StructTypeDeclaration,
                    properties: [
                        { name: 'atomicType' },
                        { name: 'members', defaultValue: [] },
                        { name: 'name' }
                    ]
                };
            }
            case StructTypeReference: {
                return {
                    name: StructTypeReference,
                    properties: [
                        { name: 'atomicType' },
                        { name: 'structTypeName' }
                    ]
                };
            }
            case SwitchStatement: {
                return {
                    name: SwitchStatement,
                    properties: [
                        { name: 'block' },
                        { name: 'switchValue' }
                    ]
                };
            }
            case SymbolExpression: {
                return {
                    name: SymbolExpression,
                    properties: [
                        { name: 'element' },
                        { name: 'functionCall' },
                        { name: 'indexExpression' }
                    ]
                };
            }
            case TernaryExpression: {
                return {
                    name: TernaryExpression,
                    properties: [
                        { name: 'left' },
                        { name: 'right' },
                        { name: 'test' }
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
