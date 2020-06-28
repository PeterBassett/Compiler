import { encodeVector } from "./LEBencoding";

export function stringToArray(s:string) : number[] 
{
    const result = [];
    
    for (let i = 0; i < s.length; i++) 
    {
        result.push(s.charCodeAt(i));
    }

    return result;
}

export function encodeStringAsUint8Array(data:string) : number[]
{
    const s = stringToUintArray(data);
    return encodeVector(s);
}

export function stringToUintArray(s:string) : number[] {
    const encodedString =unescape(encodeURIComponent(s));
    const charList = encodedString.split('');
    const uintArray = [];

    for (var i = 0; i < charList.length; i++) 
    {
        uintArray.push(charList[i].charCodeAt(0));
    }

    return uintArray;
}

export function uintArrayToString(uintArray : number[]) : string 
{
    const encodedString = String.fromCharCode.apply(null, uintArray as any);
    const decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}