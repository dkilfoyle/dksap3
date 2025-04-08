grammar Sc

entry Program:
    definitions+=Definition*;

Definition:
    GlobalVariableDeclaration |
    FunctionDeclaration;

// ########### Declarations

GlobalVariableDeclaration:
    type=TypeReference varNames+=GlobalVarName ("," varNames+=GlobalVarName)* ";";

GlobalVarName returns NamedElement:
    {infer GlobalVarName} pointer?="*"? name=ID (ArrayIndexing | InitValue)?;

fragment ArrayIndexing:
    array?="[" dim=NUMBER? "]" ("=" "{" items+=Primary ("," items+=Primary)* "}")?;

fragment InitValue:
    assignment?='=' value=Expression;

LocalVariableDeclaration:
    type=TypeReference varNames+=LocalVarName ("," varNames+=LocalVarName)* ";";

LocalVarName returns NamedElement:
    {infer LocalVarName} pointer?="*"? name=ID (array?="[" dim=NUMBER? "]")?;

StructDeclaration:
    "struct" name=ID "{" members+=StructMember* "}";

StructMember:
    PrimitiveTypeReference pointer?="*"? name=ID ";";

ParameterDeclaration:
    type=TypeReference pointer?="*"? name=ID array?="[]"?;

FunctionDeclaration:
    extern?="extern"? (returnType?=TypeReference)? name=ID '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' body=Block;

// ########### Statements

Block:
    '{' statements+=Statement* '}' |
    statements+=Statement;

Statement:
    IfStatement |
    WhileStatement |
    DoStatement ";"|
    ForStatement |
    LocalVariableDeclaration | 
    ReturnStatement ';' | 
    StructDeclaration |
    InlineAssembly |
    Expression ';'
;

InlineAssembly:
    asm=ASM;

IfStatement:
    'if' '(' condition=Expression ')' block=Block ('else' elseBlock=Block)?;

WhileStatement:
    'while' '(' condition=Expression ')' block=Block;

ForStatement:
    'for' '(' init=Expression? ';' condition=Expression? ';' execution=Expression? ')' block=Block;

DoStatement:
    'do' block=Block 'while' '(' condition=Expression ')';

ReturnStatement:
    'return' value=Expression?;

// ################ Expressions

Expression:
    Assignment;

Assignment infers Expression:
    Addition ({infer BinaryExpression.left=current} operator=('=') right=Addition)*;

Addition infers Expression:
    Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-') right=Multiplication)*;

Multiplication infers Expression:
    Logical ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Logical)*;

Logical infers Expression:
    Comparison ({infer BinaryExpression.left=current} operator=('and' | 'or') right=Comparison)*;

Comparison infers Expression:
    Primary ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Primary)*;

Primary infers Expression:
    '(' Expression ')' |
    UnaryExpression |
    NumberExpression |
    StringExpression |
    CharExpression |
    SymbolExpression;

SymbolExpression:
    element=[NamedElement:ID]
    (
        ("." structMember=[StructMember:ID]) |
        functionCall=FunctionCall |
        ("[" indexExpression=Expression "]") |
        postfix=("++"|"--")
    )?;

FunctionCall:
    "(" (arguments+=Expression (',' arguments+=Expression)*)? ")";

UnaryExpression:
    prefix=('!' | '-' | "*" | "%") value=Expression;

NumberExpression:
    value=NUMBER;

StringExpression:
    value=STRING;

CharExpression:
    value=CHAR;

// ########### Types

TypeReference:
    PrimitiveTypeReference | StructTypeReference;

PrimitiveTypeReference:
    storage=("static"|"register"|"auto")? signed=("signed"|"unsigned")? type=("int" | "char");

StructTypeReference:
    storage=("static"|"register"|"auto")? type="struct" structName=[StructDeclaration:ID];

type NamedElement = ParameterDeclaration | FunctionDeclaration | LocalVarName | StructDeclaration | GlobalVarName;

// ########## Terminals




hidden terminal WS: /\s+/;
terminal STRING: /"[^"]*"/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+/;
terminal ASM: /#asm[\s\S]*?#endasm/;
terminal CHAR: /'.'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;