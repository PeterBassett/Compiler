import { SyntaxType } from "./SyntaxType";

const syntaxTypeKeys = Object.keys(SyntaxType).filter(k => typeof SyntaxType[k as any] === "number");
const syntaxTypes = syntaxTypeKeys.map(k => SyntaxType[k as any] as unknown as SyntaxType);

const lexemes : { lexeme : string, type : SyntaxType } [] = [
    { lexeme : "+",  type : SyntaxType.Plus },
    { lexeme : "-",  type : SyntaxType.Minus },
    { lexeme : "*",  type : SyntaxType.Star },
    { lexeme : "\\", type : SyntaxType.BackSlash },
    { lexeme : "/", type : SyntaxType.Slash },
    { lexeme : "++", type : SyntaxType.PlusPlus },
    { lexeme : "--", type : SyntaxType.MinusMinus },
    { lexeme : "=", type : SyntaxType.Equals },
    { lexeme : "==", type : SyntaxType.EqualsEquals },
    { lexeme : "!", type : SyntaxType.Bang },  
    { lexeme : "!=", type : SyntaxType.BangEquals },
    { lexeme : "~", type : SyntaxType.Tilde },
    { lexeme : "<", type : SyntaxType.LessThan },
    { lexeme : "<=", type : SyntaxType.LessThanOrEqual },
    { lexeme : ">", type : SyntaxType.GreaterThan },
    { lexeme : ">=", type : SyntaxType.GreaterThanOrEqual },
    { lexeme : "&", type : SyntaxType.Ampersand },
    { lexeme : "&&", type : SyntaxType.AmpersandAmpersand },
    { lexeme : "|", type : SyntaxType.Pipe },
    { lexeme : "||", type : SyntaxType.PipePipe },
    { lexeme : "^", type : SyntaxType.Hat },
    { lexeme : ":", type : SyntaxType.Colon },
    { lexeme : ",", type : SyntaxType.Comma },
    { lexeme : ";", type : SyntaxType.SemiColon },
    { lexeme : "=>", type : SyntaxType.FatArrow },
    { lexeme : "{", type : SyntaxType.LeftBrace },
    { lexeme : "}", type : SyntaxType.RightBrace },
    { lexeme : "(", type : SyntaxType.LeftParen },
    { lexeme : ")", type : SyntaxType.RightParen },
    { lexeme : "return", type : SyntaxType.ReturnKeyword },
    { lexeme : "if", type : SyntaxType.IfKeyword },
    { lexeme : "else", type : SyntaxType.ElseKeyword },
    { lexeme : "for", type : SyntaxType.ForKeyword },
    { lexeme : "while", type : SyntaxType.WhileKeyword },
    { lexeme : "in", type : SyntaxType.InKeyword },
    { lexeme : "true", type : SyntaxType.TrueKeyword },
    { lexeme : "false", type : SyntaxType.FalseKeyword },
    { lexeme : "func", type : SyntaxType.FuncKeyword },
    { lexeme : "var", type : SyntaxType.VarKeyword },
    { lexeme : "let", type : SyntaxType.LetKeyword },
    { lexeme : "to", type : SyntaxType.ToKeyword },
    { lexeme : "int", type : SyntaxType.IntKeyword },
    { lexeme : "float", type : SyntaxType.FloatKeyword },
    { lexeme : "string", type : SyntaxType.StringKeyword },
    { lexeme : "bool", type : SyntaxType.BoolKeyword },
    { lexeme : "class", type : SyntaxType.ClassKeyword },
    { lexeme : "break", type : SyntaxType.BreakKeyword },
    { lexeme : "continue", type : SyntaxType.ContinueKeyword },
    { lexeme : ".", type : SyntaxType.Dot }
];

type SyntaxTypeToLexeme = { [k in SyntaxType] :string; };
const syntaxTypeToLexeme : SyntaxTypeToLexeme = {} as SyntaxTypeToLexeme;
lexemes.forEach( (value) => syntaxTypeToLexeme[value.type] = value.lexeme );

type LexemeToSyntaxType = { [key : string] :SyntaxType; };
const lexemeToSyntaxType : LexemeToSyntaxType = {} as LexemeToSyntaxType;
lexemes.forEach( (value) => lexemeToSyntaxType[value.lexeme] = value.type );

export function GetText(type : SyntaxType) : string 
{
    return syntaxTypeToLexeme[type];
}

export function isKeyword(type : SyntaxType) : boolean 
{
    return syntaxTypeKeys[type].match("Keyword$") != null;
}

export function GetKeywordType(lexeme : string) : SyntaxType 
{
    switch(lexeme.toLowerCase())
    {
        case "return" : return SyntaxType.ReturnKeyword;
        case "if" : return SyntaxType.IfKeyword;
        case "else" : return SyntaxType.ElseKeyword;
        case "for" : return SyntaxType.ForKeyword;
        case "while" : return SyntaxType.WhileKeyword;
        case "in" : return SyntaxType.InKeyword;
        case "true" : return SyntaxType.TrueKeyword;
        case "false" : return SyntaxType.FalseKeyword;
        case "func" : return SyntaxType.FuncKeyword;
        case "var" : return SyntaxType.VarKeyword;
        case "let" : return SyntaxType.LetKeyword;
        case "to" : return SyntaxType.ToKeyword;
        case "int" : return SyntaxType.IntKeyword;
        case "float" : return SyntaxType.FloatKeyword;
        case "string" : return SyntaxType.StringKeyword;
        case "bool" : return SyntaxType.BoolKeyword;
        case "class" : return SyntaxType.ClassKeyword;
        case "break" : return SyntaxType.BreakKeyword;
        case "continue" : return SyntaxType.ContinueKeyword;
        default: return SyntaxType.Identifier;
    }
}

export function GetUnaryOperatorTypes() : SyntaxType[] 
{
    return [
        SyntaxType.Bang,
        SyntaxType.Hat,
        SyntaxType.Tilde,
        SyntaxType.MinusMinus,
    ];
}

export function GetBinaryOperatorTypes() : SyntaxType[] 
{
    return [
        SyntaxType.Ampersand,
        SyntaxType.AmpersandAmpersand,
        SyntaxType.BackSlash,
        SyntaxType.Equals,
        SyntaxType.EqualsEquals,
        SyntaxType.GreaterThanOrEqual,
        SyntaxType.GreaterThan,
        SyntaxType.LessThan,
        SyntaxType.LessThanOrEqual,
        SyntaxType.Minus,        
        SyntaxType.Pipe,
        SyntaxType.PipePipe,
        SyntaxType.Plus,
        SyntaxType.Slash,
        SyntaxType.Star,
        SyntaxType.Dot
    ];
}

export function GetUnaryOperatorPrecedence(type : SyntaxType) : number{
    switch(type)
    {
        case SyntaxType.Plus:
        case SyntaxType.Minus:
        case SyntaxType.Bang:
        case SyntaxType.Tilde:
            return 7;
        default:
            return 0;
    }
}

export function GetBinaryOperatorPrecedence(type : SyntaxType) : number{
    switch(type)
    {
        case SyntaxType.Dot:
            return 6;
        case SyntaxType.Star:
        case SyntaxType.Slash:
            return 5;
        case SyntaxType.Plus:
        case SyntaxType.Minus:
            return 4;
        case SyntaxType.EqualsEquals:
        case SyntaxType.BangEquals:
        case SyntaxType.LessThan:
        case SyntaxType.LessThanOrEqual:
        case SyntaxType.GreaterThan:
        case SyntaxType.GreaterThanOrEqual:
            return 3;                        
        case SyntaxType.Ampersand:
        case SyntaxType.AmpersandAmpersand:
            return 2;                        
        case SyntaxType.Pipe:
        case SyntaxType.PipePipe:
        case SyntaxType.Hat:
            return 1;                     
        default:
            return 0;
    }
}

export function isLiteral(type : SyntaxType) : boolean
{
    return type == SyntaxType.FloatLiteral ||
            type == SyntaxType.IntegerLiteral ||
            type == SyntaxType.StringLiteral;

}

export function isEofOrBad(type : SyntaxType) : boolean 
{
    return type == SyntaxType.Eof ||
            type == SyntaxType.BadToken;
}

export function isTrivia(type : SyntaxType) : boolean 
{
    return type == SyntaxType.WhitespaceTrivia ||
            type == SyntaxType.EndOfLineTrivia ||
            type == SyntaxType.SingleLineCommentTrivia ||
            type == SyntaxType.MultiLineCommentTrivia ||
            type == SyntaxType.SkippedTokensTrivia ||
           type == SyntaxType.BadToken;
}

export function isDeclaration(type : SyntaxType) : boolean 
{
    return type == SyntaxType.FuncKeyword ||
            type == SyntaxType.ClassKeyword ||
            type == SyntaxType.LetKeyword ||
            type == SyntaxType.VarKeyword;
}