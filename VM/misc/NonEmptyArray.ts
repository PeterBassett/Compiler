export interface NonEmptyArray<T> extends Array<T> {
    pop: () => T;
}

export function isNonEmpty<T>(arr: Array<T>): arr is NonEmptyArray<T> {
    return arr.length > 0;
}