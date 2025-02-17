grammar Sc

entry Program:
    definitions+=Definition*;

Definition:
    GlobalVariableDeclaration |
    FunctionDeclaration;

GlobalVariableDeclaration returns NamedElement:
    {infer VariableDeclaration} type=TypeReference name=ID (assignment?='=' value=Expression)? ";";

FunctionDeclaration:
    (returnType?=TypeReference)? name=ID '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')' body=Block;

Block:
    '{' statements+=Statement* '}';

Statement:
    IfStatement |
    WhileStatement |
    ForStatement |
    VariableDeclaration ';' | 
    AssignmentStatement ';' |
    ReturnStatement ';' | 
    StructDeclaration |
    Expression ';'
;

IfStatement:
    'if' '(' condition=Expression ')' block=Block
    ('else' elseBlock=Block)?
;

WhileStatement:
    'while' '(' condition=Expression ')' block=Block
;

ForStatement:
    'for' '(' counter=VariableDeclaration? ';' condition=Expression? ';' execution=AssignmentStatement? ')' block=Block
;

ReturnStatement:
    'return' value=Expression?;

VariableDeclaration returns NamedElement:
    {infer VariableDeclaration} type=TypeReference pointer?="*"? name=ID (array=ArrayDeclaration)?
;

ArrayDeclaration:
    "[" dim=NUMBER "]";

AssignmentStatement:
    varRef=[VariableDeclaration:ID] '=' value=Expression
;

Expression:
    Addition;

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
    CharExpression |
    NumberExpression |
    MemberCall;

MemberCall:
    element=[NamedElement:ID] (
		explicitOperationCall?='('
		(
		    arguments+=Expression (',' arguments+=Expression)*
		)?
		')')?;

UnaryExpression:
    operator=('!' | '-') value=Expression
;

NumberExpression:
    value=NUMBER;

CharExpression:
    value=STRING;

Parameter:
    type=TypeReference pointer?="*"? name=ID array?="[]"?;

TypeReference:
    PrimitiveTypeReference | StructTypeReference;

PrimitiveTypeReference:
    signed=("signed"|"unsigned")? type=("int" | "char");

StructTypeReference:
    type="struct" structName=[StructDeclaration:ID];

StructDeclaration:
    "struct" name=ID "{" members+=StructMember* "}";

StructMember:
    PrimitiveTypeReference pointer?="*"? name=ID ";";

type NamedElement = Parameter | FunctionDeclaration | VariableDeclaration | StructDeclaration;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;
terminal STRING: /"[^"]*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;