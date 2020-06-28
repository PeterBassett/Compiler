
export function encodeFloat32(data:number):number[]
{
    const buffer = new Uint8Array(4);
    const view = new DataView(buffer.buffer);
    view.setFloat32(0, data, true);

    return [].slice.call(buffer);
}

export function encodeFloat64(data:number):number[]
{
    const buffer = new Uint8Array(8);
    const view = new DataView(buffer.buffer);
    view.setFloat64(0, data, true);
    
    return [].slice.call(buffer);
}