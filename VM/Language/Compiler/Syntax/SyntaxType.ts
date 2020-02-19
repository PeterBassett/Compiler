
export enum SyntaxType {
    //trivial
    Eof,
    BadToken,
    WhitespaceTrivia,
    //operators
    Plus,
    Minus,
    Star,
    BackSlash,
    Slash,
    PlusPlus,
    MinusMinus,
    Equals,
    EqualsEquals,
    Hat,
    PipePipe,
    Pipe,
    AmpersandAmpersand,
    Ampersand,
    GreaterThanOrEqual,
    GreaterThan,
    LessThanOrEqual,
    LessThan,
    Tilde,
    BangEquals,
    Bang,
    Colon,
    Comma,
    FatArrow,
    //literals
    IntegerLiteral,
    FloatLiteral,
    StringLiteral,
    //structure
    RightBrace,
    LeftBrace,
    RightParen,
    LeftParen,
    Identifier,
    SemiColon,
    //keywords
    ReturnKeyword,
    IntKeyword,
    FloatKeyword,
    StringKeyword,
    BoolKeyword,
    IfKeyword,
    ElseKeyword,
    ForKeyword,
    WhileKeyword,
    BreakKeyword,
    ContinueKeyword,
    InKeyword,
    ToKeyword,
    FalseKeyword,
    TrueKeyword,
    FuncKeyword,
    LetKeyword,
    VarKeyword,
    NullKeyword,
    EndOfLineTrivia,
    SingleLineCommentTrivia,
    MultiLineCommentTrivia,
    SkippedTokensTrivia,
    ClassKeyword,
    StructKeyword,
    Dot
}