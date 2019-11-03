export interface IDisposable {
    dispose() : void;
}

export function using<T extends IDisposable,
    T2 extends IDisposable,
    T3 extends IDisposable>(disposable: [T, T2, T3], action: (r: T, r2: T2, r3: T3) => void) : void;
export function using<T extends IDisposable, T2 extends IDisposable>(disposable: [T, T2], action: (r: T, r2: T2) => void) : void;
export function using<T extends IDisposable>(disposable: T, action: (r: T) => void) : void;
export function using(disposable: IDisposable[], action: (...r: IDisposable[]) => void) : void
export function using(disposable: IDisposable | IDisposable[], action: (...r: IDisposable[]) => void) : void {
    let disposableArray = disposable instanceof Array ? disposable : [disposable];
    try {
        action(...disposableArray);
    } finally {
        disposableArray.forEach(d => d.dispose());
    }
}