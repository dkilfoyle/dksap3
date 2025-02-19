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
    'for' '(' counter=VariableDeclaration? ';' condition=Expression? ';' execution=Expression? ')' block=Block
;

ReturnStatement:
    'return' value=Expression?;

VariableDeclaration returns NamedElement:
    {infer VariableDeclaration} type=TypeReference pointer?="*"? name=ID (array=ArrayDeclaration)?
;

ArrayDeclaration:
    "[" (dim=NUMBER)? "]";

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

Parameter:
    type=TypeReference pointer?="*"? name=ID array?="[]"?;

TypeReference:
    PrimitiveTypeReference | StructTypeReference;

PrimitiveTypeReference:
    storage=("static"|"register"|"auto")? signed=("signed"|"unsigned")? type=("int" | "char");

StructTypeReference:
    storage=("static"|"register"|"auto")? type="struct" structName=[StructDeclaration:ID];

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