grammar Sc

entry Program:
    definitions+=Definition*;

Definition:
    GlobalVariableDeclaration |
    FunctionDeclaration;

// ########### Declarations

GlobalVariableDeclaration:
    storage=("extern"|"static")? typeSpecifier=TypeSpecifier varNames+=GlobalVarName ("," varNames+=GlobalVarName)* ";";

GlobalVarName returns NamedElement:
    {infer GlobalVarName} pointer?="*"? name=ID (arraySpecifier=ArraySpecifier | valueSpecifier=ValueSpecifier)?;

ArraySpecifier:
    ("[" dim=DECNUMBER "]")|"[]" (assignment?="=" "{" items+=LiteralExpression ("," items+=LiteralExpression)* "}")?;

ValueSpecifier:
    assignment?='=' value=LiteralExpression;

LocalVariableDeclaration:
    storage=("static"|"register"|"auto")? typeSpecifier=TypeSpecifier varNames+=LocalVarName ("," varNames+=LocalVarName)* ";";

LocalVarName returns NamedElement:
    {infer LocalVarName} pointer?="*"? name=ID (array?="[" dim=DECNUMBER? "]")?;

StructTypeDeclaration:
    atomicType=("struct"|"union") name=ID "{" members+=StructMember* "}";

StructMember:
    typeSpecifier=PrimitiveTypeSpecifier pointer?="*"? name=ID (array?="[" dim=DECNUMBER? "]")? ";";

ParameterDeclaration:
    typeSpecifier=TypeSpecifier pointer?="*"? name=ID array?="[]"?;

FunctionDeclaration:
    extern?="extern"? (returnType?=TypeSpecifier)? name=ID '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' body=Block;

// ########### Types

TypeSpecifier:
    PrimitiveTypeSpecifier | StructTypeSpecifier;

StructTypeSpecifier:
    StructTypeDeclaration | StructTypeReference;

PrimitiveTypeSpecifier:
    signed=("signed"|"unsigned")? atomicType=("int" | "char");

StructTypeReference:
    atomicType=("struct"|"union") structTypeName=[StructTypeDeclaration:ID];

SizeofTypeReference:
    TypeSpecifier pointer?="*";

type NamedElement = ParameterDeclaration | FunctionDeclaration | LocalVarName | GlobalVarName;

// ########### Statements

Block:
    '{' declarations+=LocalVariableDeclaration* statements+=Statement* '}' |
    statements+=Statement;

Statement:
    IfStatement |
    WhileStatement |
    DoStatement ";"|
    ForStatement |
    BreakStatement ";" |
    ContinueStatement ";" |
    ReturnStatement ';' | 
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

BreakStatement:
    break='break';

ContinueStatement:
    continue='continue';

// ################ Expressions

Expression:
    Assignment;

Assignment infers Expression:
    LogicalOr ({infer BinaryExpression.left=current} operator=('='|"+="|"-="|"*="|"/="|"%="|"&="|">>="|"<<="|"^="|"|=") right=LogicalOr)*;

// Ternary infers Expression:
//     LogicalOr ({infer TernaryExpression.test=current} "?" left=Expression ":" right=LogicalOr)*;

LogicalOr infers Expression:
    LogicalAnd ({infer BinaryExpression.left=current} operator="||" right=LogicalAnd)*;

LogicalAnd infers Expression:
    BitwiseOr ({infer BinaryExpression.left=current} operator="&&" right=BitwiseOr)*;

BitwiseOr infers Expression:
    BitwiseXor ({infer BinaryExpression.left=current} operator="|" right=BitwiseXor)*;

BitwiseXor infers Expression:
    BitwiseAnd ({infer BinaryExpression.left=current} operator="^" right=BitwiseAnd)*;

BitwiseAnd infers Expression:
    Equality ({infer BinaryExpression.left=current} operator="&" right=Equality)*;

Equality infers Expression:
    Comparison ({infer BinaryExpression.left=current} operator=('==' | '!=') right=Comparison)*;

Comparison infers Expression:
    BitwiseShift ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=') right=BitwiseShift)*;

BitwiseShift infers Expression:
    Addition ({infer BinaryExpression.left=current} operator=('>>' | '<<') right=Addition)*;

Addition infers Expression:
    Multiplication ({infer BinaryExpression.left=current} operator=('+' | MINUS) right=Multiplication)*;

Multiplication infers Expression:
    Prefix ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Prefix)*;

Prefix infers Expression:
    {infer PrefixExpression} operator=("*"|"&"|MINUS|"++"|"--"|"!"|"~") operand=Prefix 
    | Postfix;

Postfix infers Expression:
    Chained ({infer PostfixExpression.operand=current} operator=("++"|"--"))*;

Chained infers Expression:
    Primary ({infer MemberAccess.receiver=current} operator=("."|"->") member=[StructMember:ID])*;

Primary infers Expression:
    '(' Expression ')' |
    LiteralExpression |
    SizeofExpression |
    SymbolExpression;

LiteralExpression:
    NumberExpression |
    CharExpression |
    StringExpression;

SymbolExpression:
    element=[NamedElement:ID]
    (
    // ("." structMember=[StructMember:ID]) |
        functionCall=FunctionCall |
        ("[" indexExpression=Expression "]") 
    )?;

SizeofExpression:
    "sizeof" "(" arg=(SizeofSymbol|SizeofTypeReference) ")";

SizeofSymbol:
    ParameterDeclaration | LocalVarName | GlobalVarName;

FunctionCall:
    "(" (arguments+=Expression (',' arguments+=Expression)*)? ")";

// UnaryExpression:
//     prefix=('!' | '-' | "*" | "&" | "~" | "++" | "--") value=Expression;


NumberExpression:
    value=(DECNUMBER|HEXNUMBER|BINNUMBER);

StringExpression:
    value=STRING;

CharExpression:
    value=CHAR;

// ########## Terminals

hidden terminal WS: /\s+/;
terminal MINUS: /[\-](?!>)/;
terminal STRING: /"[^"]*"/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal HEXNUMBER returns number: /0[xX][0-9a-fA-F]+/;
terminal BINNUMBER returns number: /0[bB][0-1]+/;
terminal DECNUMBER returns number: /[\-]?[0-9]+/;
terminal ASM: /#asm[\s\S]*?#endasm/;
terminal CHAR: /'.'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;