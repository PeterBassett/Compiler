export function toDictionary<TItem>(
    array: TItem[],
    getKey: (item: TItem) => number | string,
    getValue?: (item: TItem) => any): { [name: string]: TItem; } {

    var result : { [name: string]: TItem; } = {};

    if (!array) 
        return result;

    if (getValue)
        array.forEach(_ => result[getKey(_)] = getValue(_));
    else
        array.forEach(_ => result[getKey(_)] = _);    

    return result;
}