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
    (returnType?=TypeReference)? name=ID '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' body=Block;

// ########### Statements

Block:
    '{' statements+=Statement* '}';

Statement:
    IfStatement |
    WhileStatement |
    ForStatement |
    LocalVariableDeclaration | 
    ReturnStatement ';' | 
    StructDeclaration |
    Expression ';'
;

IfStatement:
    'if' '(' condition=Expression ')' block=Block ('else' elseBlock=Block)?;

WhileStatement:
    'while' '(' condition=Expression ')' block=Block;

ForStatement:
    'for' '(' init=Expression? ';' condition=Expression? ';' execution=Expression? ')' block=Block;

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
    Logical ({infer BinaryExpression.left=current} operator=('*' | '/') right=Logical)*;

Logical infers Expression:
    Comparison ({infer BinaryExpression.left=current} operator=('and' | 'or') right=Comparison)*;

Comparison infers Expression:
    Primary ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Primary)*;

Primary infers Expression:
    '(' Expression ')' |
    UnaryExpression |
    NumberExpression |
    SymbolExpression;

SymbolExpression:
    element=[NamedElement:ID]
    (("." structMember=[StructMember:ID])?)?
    functionCall=FunctionCall?
    ("[" indexExpression=Expression "]")?;

FunctionCall:
    "(" (arguments+=Expression (',' arguments+=Expression)*)? ")";

UnaryExpression:
    operator=('!' | '-' | "*" | "%") value=Expression;

NumberExpression:
    value=NUMBER;

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
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+/;
terminal STRING: /"[^"]*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;