import GeneratedCode from "../../../Language/Compiler/CodeGeneration/AssemblyLanguage/GeneratedCode";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import AssemblyCodeGenerator from "../../../Language/Compiler/CodeGeneration/AssemblyLanguage/CodeGenerator";
import Parser from "../../../Language/Compiler/Syntax/Parser";
import Assembler from "../../../Assembler/Assembler";
import InstructionCoder from "../../../VirtualMachine/CPU/Instruction/InstructionCoder";
import InstructionCoder32Bit from "../../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import RAM from "../../../VirtualMachine/Memory/RAM";
import Flags from "../../../VirtualMachine/CPU/Flags";
import RegisterBank from "../../../VirtualMachine/CPU/RegisterBank";
import CPU from "../../../VirtualMachine/CPU/CPU";
import { AssembledOutput } from "../../../Assembler/AssembledOutput";
import BuiltinFunctions, { BuiltinFunction } from "../../../Language/Compiler/BuiltinFunctions";
import { FunctionDetails, FunctionType } from "../../../Language/Types/TypeInformation";
import { PredefinedValueTypes } from "../../../Language/Types/PredefinedValueTypes";
import { ValueType } from "../../../Language/Types/ValueType";
import { printPerformance, resetPerformance } from "./CompileAndExecute.base";
import InstructionCoderVariable from "../../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { Diagnostics } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import { AssemblyLexer } from "../../../Assembler/AssemblyLexer";
import { AssemblyParser } from "../../../Assembler/AssemblyParser";

let canvas : HTMLCanvasElement;
let context :CanvasRenderingContext2D;
let maximumStepCount : number;
let ramSize : number;

describe("Compiler Intrinsic Execute", () => {

    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("intrinsics");
    });
    
    const builtins = new BuiltinFunctions(
        [
            new BuiltinFunction("Math_Log", 
                new FunctionType(ValueType.Float, "Math_Log", new FunctionDetails([PredefinedValueTypes.Float], PredefinedValueTypes.Float, true)),
                (parameters : number[]) => {
                    return Math.log(parameters[0]);
                }
            ),
            new BuiltinFunction("Canvas", 
                new FunctionType(ValueType.Int, "Canvas", new FunctionDetails([PredefinedValueTypes.Integer, PredefinedValueTypes.Integer], PredefinedValueTypes.Integer, true)),
                (parameters : number[]) => {
                    canvas = document.createElement("canvas");

                    canvas.width = parameters[0];
                    canvas.height = parameters[1];

                    canvas.style.position = "absolute";
                    canvas.style.top = "0px";
                    canvas.style.left = "0px";

                    document.body.appendChild(canvas);

                    let ctx = canvas.getContext("2d");

                    if(ctx)
                        context = ctx;

                    return 1;
                }
            ),
            new BuiltinFunction("DrawPixel", 
                new FunctionType(ValueType.Int, "DrawPixel", new FunctionDetails([PredefinedValueTypes.Integer, PredefinedValueTypes.Integer, PredefinedValueTypes.Integer, PredefinedValueTypes.Integer, PredefinedValueTypes.Integer], PredefinedValueTypes.Integer, true)),
                (parameters : number[]) => {

                    let x = parameters[0];
                    let y = parameters[1];
                    let r = parameters[2];
                    let g = parameters[3];
                    let b = parameters[4];

                    function hex(v : number) : string{
                        return ('0' + v.toString(16).toUpperCase()).slice(-2);
                    }

                    context.fillStyle = `#${hex(r)}${hex(g)}${hex(b)}`; 
                    context.fillRect(x, y, 1, 1);

                    return 1;
                }
            ),
            new BuiltinFunction("Debug", 
                new FunctionType(ValueType.Int, "Debug", new FunctionDetails([PredefinedValueTypes.Float], PredefinedValueTypes.Integer, true)),
                (parameters : number[]) => {

                    let value = parameters[0];

                    console.log(value);

                    return 1;
                }
            )              
        ]
    );

    function run(text : string) : number 
    {
        let code = compile(text);
        let assemblyStream = assemble(code.text);
        let result = execute(assemblyStream);

        return result;
    }

    function compile(text : string) : GeneratedCode
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder(builtins);
        let boundTree = binder.Bind(compilationUnit);
        let lowerer = new Lowerer();
        let newBoundTree = lowerer.lower(boundTree);
        let codeGenerator = new AssemblyCodeGenerator({ builtins,  });
        let result = codeGenerator.generate(newBoundTree);
        
        if(!result.success)
            throw new Error(result.diagnostics.get(0).message);

        return result;
    }

    function CreateInstructionCoder() : InstructionCoder
    {
        const instructionCoderVariable = new InstructionCoderVariable();

        return instructionCoderVariable;
    }

    function assemble(assemblyCode : string) : AssembledOutput
    {
        const source = new SourceText(assemblyCode);
        const diagnostics = new Diagnostics(source);      
        
        const lexer = new AssemblyLexer(source, diagnostics);
        const parser = new AssemblyParser(lexer, diagnostics);
        const instructionCoder = new InstructionCoderVariable();
        
        const assembler = new Assembler(parser, instructionCoder, diagnostics);
        
        return assembler.assemble();
    }

    function execute(output : AssembledOutput) : number
    {
        let ram : RAM;
        let flags : Flags;
        let registers : RegisterBank;
        let instructionCoder : InstructionCoder;
        let cpu : CPU;

        ram = new RAM(ramSize);
        registers = new RegisterBank(ramSize);
        flags = new Flags();
        
        ram.blitStoreBytes(0, output.machineCode);
        ram.setReadonlyRegions(output.regions);

        instructionCoder = CreateInstructionCoder();
        cpu = new CPU(ram, registers, flags, instructionCoder, builtins);

        let stepCount = 0;
        try
        {
            while(true)   
            {                  
                cpu.step();

                stepCount++;

                if(stepCount > maximumStepCount)
                    throw new Error("Step Count Exceeded.");
            }
        }
        catch(e)
        {
            //console.log("stepCount = " + stepCount.toString());
            if(e.message != "HALT EXECUTION") 
                throw e;
        }

        return registers.R1;
    }

[
[`func main() : int {
    
    return rnd(5, 5);
}`, 5],
[`func main() : int {
    
    return rnd(3, 3) + rnd(8, 8);
}`, 11],
[`
func getANumber(a : int) : int
{
    return rnd(a,a) + 1;
}
func main() : int {
    return getANumber(3) * 5;
}`, 20],
[`
func MandelbrotFractionalEscapeTime(cr : float, ci : float) : float
{            
    let zr = cr;
    let zi = ci;
    let log2 = Math_Log(2);

    for let counter in 0 to 2
    {
        let r2 : float = zr * zr;
        let i2 : float = zi * zi;

        if (r2 + i2 > 4.0)
        {
            let log_zn = Math_Log(r2 + i2) / 2.0;
            let nu = Math_Log(log_zn / log2) / log2;

            return counter + 1 - nu;                    
        }

        zi = 2.0 * zr * zi + ci;
        zr = r2 - i2 + cr;
    }

    return -1.0;
}

func main() : float {
    return MandelbrotFractionalEscapeTime(1.0, 1.0);
}`, 1.2679791543553804],
[`
struct color
{
    r : int;
    g : int;
    b : int;
}

func min (a : int, b : int) : int
{
    if(a < b)
        return a;
    
    return b;
}

func max(a : int, b : int) : int
{
    if(a >= b)
        return a;
    
    return b;
}

func GetColor(iterations : int) : color
{
    let r : int;
    let g : int;
    let b : int;

    if (iterations < 16)
    {
        r = 16 * (16 - iterations);
        g = 0;
        b = 16 * iterations - 1;
    }
    else if (iterations < 32)
    {
        r = 0;
        g = 16 * (iterations - 16);
        b = 16 * (32 - iterations) - 1;
    }
    else if (iterations < 64)
    {
        r = 8 * (iterations - 32);
        g = 8 * (64 - iterations) - 1;
        b = 0;
    }
    else
    { 
        // range is 64 - 127
        r = 255 - (iterations - 64) * 4;
        g = 0;
        b = 0;
    }

    let col : color;
    col.r = max(0, min(r, 255));
    col.g = max(0, min(g, 255));
    col.b = max(0, min(b, 255));

    return col;
}

func MandelbrotEscapeTime(cr : float, ci : float) : int
{
    let zr : float = cr;
    let zi : float = ci;

    for let counter in 0 to 128
    {
        let r2 : float = zr * zr;
        let i2 : float = zi * zi;

        if (r2 + i2 > 4.0)
            return counter;

        zi = 2.0 * zr * zi + ci;
        zr = r2 - i2 + cr;
    }

    return 128 - 1;
}

func FlatEscape(imag : float, real : float) : color
{
    let value : int = MandelbrotEscapeTime(real, imag);
    return GetColor(value);    
}      

func main() : int {
    let width : int = 1; // 1 to just make it quick. 200 makes a nice picture but takes quite a while
    let height : int = 1;

    // an interesting point to zoom straight into
    let offsetX : float = -0.7;
    let offsetY : float = 0.0;
    let zoom : float = 0.02664;

    Canvas(width, height);

    // calculate the start position (x,y) in the complex plane
    // based on the zoom and the x y offsets
    let realstart : float = -width  / 2.0 * zoom + offsetX;
    let imagstart : float = -height / 2.0 * zoom + offsetY;

    // iterate over the xy region in both pixels and complex coordinates
    let imag : float = imagstart;

    for let y in 0 to height
    {
        imag = imag + zoom;
        let real : float = realstart;
        //Debug(y);
        for let x in 0 to width
        {
            real = real + zoom;

            // calculate the output colour with complex coordinates
            let col : color = FlatEscape(imag, real);

            DrawPixel(x, y, col.r, col.g, col.b);            
        }
    }
    
    return 0;
}`, 0, 1000000000, 1 << 24],
[`
struct color
{
    r : int;
    g : int;
    b : int;
}

func min (a : int, b : int) : int
{
    if(a < b)
        return a;
    
    return b;
}

func max(a : int, b : int) : int
{
    if(a >= b)
        return a;
    
    return b;
}

func GetColor(iterations : int) : color
{
    var r : int;
    var g : int;
    var b : int;

    if (iterations < 16)
    {
        r = 16 * (16 - iterations);
        g = 0;
        b = 16 * iterations - 1;
    }
    else if (iterations < 32)
    {
        r = 0;
        g = 16 * (iterations - 16);
        b = 16 * (32 - iterations) - 1;
    }
    else if (iterations < 64)
    {
        r = 8 * (iterations - 32);
        g = 8 * (64 - iterations) - 1;
        b = 0;
    }
    else
    { 
        // range is 64 - 127
        r = 255 - (iterations - 64) * 4;
        g = 0;
        b = 0;
    }

    let col : color;
    col.r = max(0, min(r, 255));
    col.g = max(0, min(g, 255));
    col.b = max(0, min(b, 255));

    return col;
}

func MandelbrotFractionalEscapeTime(cr : float, ci : float) : float
{            
    var zr = cr;
    var zi = ci;
    let log2 = Math_Log(2);

    for let counter in 0 to 128
    {
        let r2 = zr * zr;
        let i2 = zi * zi;

        if (r2 + i2 > 4.0)
        {
            let log_zn = Math_Log(r2 + i2) / 2.0;
            let nu = Math_Log(log_zn / log2) / log2;

            return counter + 1 - nu;                    
        }

        zi = 2.0 * zr * zi + ci;
        zr = r2 - i2 + cr;
    }

    return 127;
}

func Lerp(a : float, b : float, t : float) : float
{
    return a + t * (b - a);
}

func EscapeTimeToSmoothColour(value : float) : color
{
    let iValue = int(value);
    let coloura = GetColor(iValue);
    let colourb = GetColor(iValue + 1);

    let t = value - iValue;    

    let r = int(Lerp(coloura.r, colourb.r, t));
    let g = int(Lerp(coloura.g, colourb.g, t));
    let b = int(Lerp(coloura.b, colourb.b, t));

    let col : color;
    col.r = r;
    col.g = g;
    col.b = b;

    return col;
}

func SmoothFastEscape(imag: float, real: float) : color
{
    let value = MandelbrotFractionalEscapeTime(real, imag);            
    return EscapeTimeToSmoothColour(value);
}

func main() : int {
    let width = 1; // 1 to just make it quick. 200 makes a nice picture but takes quite a while
    let height = 1;

    // an interesting point to zoom straight into
    let offsetX = -0.7;
    let offsetY = 0.0;
    let zoom = 0.01964;

    Canvas(width, height);

    // calculate the start position (x,y) in the complex plane
    // based on the zoom and the x y offsets
    let realstart = -width  / 2.0 * zoom + offsetX;
    let imagstart = -height / 2.0 * zoom + offsetY;

    // iterate over the xy region in both pixels and complex coordinates
    var imag = imagstart;

    for let y in 0 to height
    {
        imag = imag + zoom;
        var real = realstart;

        Debug(y);
        for let x in 0 to width
        {
            real = real + zoom;

            // calculate the output colour with complex coordinates
            let col = SmoothFastEscape(imag, real);

            DrawPixel(x, y, col.r, col.g, col.b);            
        }
    }
    
    return 0;
}`, 0, 1000000000, 1 << 24]
].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as number;
            maximumStepCount = 500000;
            ramSize = 1 << 18;

            if(item.length >= 3)
                maximumStepCount = item[2] as number;

            if(item.length >= 4)
                ramSize = item[3] as number;                

            let t0 = performance.now();
            let result = run(text);
            let t1 = performance.now();

            //console.log("execution took " + (t1-t0) + "ms");
            
            expect(result).toEqual(expected);
        });
    });
});