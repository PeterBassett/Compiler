export const MagicAsmHeader = [0x0, 0x61, 0x73, 0x6d]; //0ASM
export const Version = [0x1, 0x0, 0x0, 0x0];           //Version 1

// The following Opcodes are from the google translated version of https://www.wasm.com.cn/docs/binary-encoding/

export enum Sections
{
    //The content of each section is encoded in its payload_data.
    Custom = 0,
    Type = 1,       //	Function signature declarations
    Import = 2,     //	Import declarations
    Function = 3,   //	Function declarations
    Table = 4,      //	Indirect function table and other tables
    Memory = 5,     //	Memory attributes
    Global = 6,     //	Global declarations
    Export = 7,     //	Exports
    Start = 8,      //	Start function declaration
    Element = 9,    //	Elements section
    Code = 	10,     //	Function bodies (code)
    Data = 	11      //	Data segments
}

export enum NameType
{
    Module = 0,     // Assigns a name to the module
    Function = 1,   // Assigns names to functions
    Local = 2       // Assigns names to locals in functions
}

export enum Types
{
    i32 = 0x7f,
    i64 = 0x7e,
    f32 = 0x7d,
    f64 = 0x7c,
    anyfunc = 0x70,
    func = 0x60,
    block = 0x40
}

export enum ExternalKind
{
    //A single-byte unsigned integer indicating the kind of definition being imported or defined:
    Function = 0,
    Table = 1,
    Memory = 2,
    Global = 3
}

export enum ControlFlow
{
    unreachable = 0x00,     //	trap immediately
    nop = 0x01,             //	no operation
    block = 0x02,           //	sig : block_type	begin a sequence of expressions, yielding 0 or 1 values
    loop = 0x03,            //	sig : block_type	begin a block which can also form control flow loops
    if = 0x04,              //	sig : block_type	begin if expression
    else = 0x05,            //	begin else expression of if
    end = 0x0b,             //	end a block, loop, or if
    br = 0x0c,              //	relative_depth : varuint32	break that targets an outer nested block
    br_if = 0x0d,           //	relative_depth : varuint32	conditional break that targets an outer nested block
    br_table = 0x0e,        //	see below	branch table control flow construct
    return = 0x0f           //	return zero or one value from this function
}

export enum Opcodes
{
    // Call operators
    call = 0x10,        	// function_index : varuint32	call a function by its index
    call_indirect =	0x11,	// type_index : varuint32, reserved : varuint1	call a function indirect with an expected signature

    // Parametric operators
    drop = 0x1a,	 	    // ignore value
    select = 0x1b,	 	    // select one of two values based on condition

    // Variable access
    get_local = 0x20,       // local_index : varuint32	read a local variable or parameter
    set_local = 0x21,       // local_index : varuint32	write a local variable or parameter
    tee_local = 0x22,       // local_index : varuint32	write a local variable or parameter and return the same value
    get_global = 0x23,      // global_index : varuint32	read a global variable
    set_global = 0x24,      // global_index : varuint32	write a global variable

    // Memory-related operators
    i32_load = 0x28,        // memory_immediate	load from memory
    i64_load = 0x29,        // memory_immediate	load from memory
    f32_load = 0x2a,        // memory_immediate	load from memory
    f64_load = 0x2b,        // memory_immediate	load from memory
    i32_load8_s = 0x2c,     // memory_immediate	load from memory
    i32_load8_u = 0x2d,     // memory_immediate	load from memory
    i32_load16_s = 0x2e,    // memory_immediate	load from memory
    i32_load16_u = 0x2f,    // memory_immediate	load from memory
    i64_load8_s = 0x30,     // memory_immediate	load from memory
    i64_load8_u = 0x31,     // memory_immediate	load from memory
    i64_load16_s = 0x32,    // memory_immediate	load from memory
    i64_load16_u = 0x33,    // memory_immediate	load from memory
    i64_load32_s = 0x34,    // memory_immediate	load from memory
    i64_load32_u = 0x35,    // memory_immediate	load from memory
    i32_store = 0x36,       // memory_immediate	store to memory
    i64_store = 0x37,       // memory_immediate	store to memory
    f32_store = 0x38,       // memory_immediate	store to memory
    f64_store = 0x39,       // memory_immediate	store to memory
    i32_store8 = 0x3a,      // memory_immediate	store to memory
    i32_store16 = 0x3b,     // memory_immediate	store to memory
    i64_store8 = 0x3c,      // memory_immediate	store to memory
    i64_store16 = 0x3d,     // memory_immediate	store to memory
    i64_store32 = 0x3e,     // memory_immediate	store to memory
    current_memory = 0x3f,  // reserved - query the size of memory
    grow_memory	= 0x40,     // reserved - grow the size of memory

    // Constants 
    i32_const = 0x41,       // value : varint32	a constant value interpreted as i32
    i64_const = 0x42,       // value : varint64	a constant value interpreted as i64
    f32_const = 0x43,       // value : uint32	a constant value interpreted as f32
    f64_const = 0x44,       // value : uint64	a constant value interpreted as f64

    //Comparison operators 
    i32_eqz = 0x45,	 	 
    i32_eq = 0x46,	 	 
    i32_ne = 0x47,	 	 
    i32_lt_s = 0x48,	 	 
    i32_lt_u = 0x49,	 	 
    i32_gt_s = 0x4a,	 	 
    i32_gt_u = 0x4b,	 	 
    i32_le_s = 0x4c,	 	 
    i32_le_u = 0x4d,	 	 
    i32_ge_s = 0x4e,	 	 
    i32_ge_u = 0x4f,	 	 
    i64_eqz = 0x50,	 	 
    i64_eq = 0x51,	 	 
    i64_ne = 0x52,	 	 
    i64_lt_s = 0x53,	 	 
    i64_lt_u = 0x54,	 	 
    i64_gt_s = 0x55,	 	 
    i64_gt_u = 0x56,	 	 
    i64_le_s = 0x57,	 	 
    i64_le_u = 0x58,	 	 
    i64_ge_s = 0x59,	 	 
    i64_ge_u = 0x5a,	 	 
    f32_eq = 0x5b,	 	 
    f32_ne = 0x5c,	 	 
    f32_lt = 0x5d,	 	 
    f32_gt = 0x5e,	 	 
    f32_le = 0x5f,	 	 
    f32_ge = 0x60,	 	 
    f64_eq = 0x61,	 	 
    f64_ne = 0x62,	 	 
    f64_lt = 0x63,	 	 
    f64_gt = 0x64,	 	 
    f64_le = 0x65,	 	 
    f64_ge = 0x66,	 	 

//Numeric operators (described here)
    i32_clz = 0x67,	 	 
    i32_ctz = 0x68,	 	 
    i32_popcnt = 0x69,	 	 
    i32_add = 0x6a,	 	 
    i32_sub = 0x6b,	 	 
    i32_mul = 0x6c,	 	 
    i32_div_s = 0x6d,	 	 
    i32_div_u = 0x6e,	 	 
    i32_rem_s = 0x6f,	 	 
    i32_rem_u = 0x70,	 	 
    i32_and = 0x71,	 	 
    i32_or = 0x72,	 	 
    i32_xor = 0x73,	 	 
    i32_shl = 0x74,	 	 
    i32_shr_s = 0x75,	 	 
    i32_shr_u = 0x76,	 	 
    i32_rotl = 0x77,	 	 
    i32_rotr = 0x78,	 	 
    i64_clz = 0x79,	 	 
    i64_ctz = 0x7a,	 	 
    i64_popcnt = 0x7b,	 	 
    i64_add = 0x7c,	 	 
    i64_sub = 0x7d,	 	 
    i64_mul = 0x7e,	 	 
    i64_div_s = 0x7f,	 	 
    i64_div_u = 0x80,	 	 
    i64_rem_s = 0x81,	 	 
    i64_rem_u = 0x82,	 	 
    i64_and = 0x83,	 	 
    i64_or = 0x84,	 	 
    i64_xor = 0x85,	 	 
    i64_shl = 0x86,	 	 
    i64_shr_s = 0x87,	 	 
    i64_shr_u = 0x88,	 	 
    i64_rotl = 0x89,	 	 
    i64_rotr = 0x8a,	 	 
    f32_abs = 0x8b,	 	 
    f32_neg = 0x8c,	 	 
    f32_ceil = 0x8d,	 	 
    f32_floor = 0x8e,	 	 
    f32_trunc = 0x8f,	 	 
    f32_nearest = 0x90,	 	 
    f32_sqrt = 0x91,	 	 
    f32_add = 0x92,	 	 
    f32_sub = 0x93,	 	 
    f32_mul = 0x94,	 	 
    f32_div = 0x95,	 	 
    f32_min = 0x96,	 	 
    f32_max = 0x97,	 	 
    f32_copysign = 0x98,	 	 
    f64_abs = 0x99,	 	 
    f64_neg = 0x9a,	 	 
    f64_ceil = 0x9b,	 	 
    f64_floor = 0x9c,	 	 
    f64_trunc = 0x9d,	 	 
    f64_nearest = 0x9e,	 	 
    f64_sqrt = 0x9f,	 	 
    f64_add = 0xa0,	 	 
    f64_sub = 0xa1,	 	 
    f64_mul = 0xa2,	 	 
    f64_div = 0xa3,	 	 
    f64_min = 0xa4,	 	 
    f64_max = 0xa5,	 	 
    f64_copysign = 0xa6,	 	 

    // Conversions (described here)
    i32_wrap_i64 = 0xa7,	 	 
    i32_trunc_s_f32 = 0xa8,	 	 
    i32_trunc_u_f32 = 0xa9,	 	 
    i32_trunc_s_f64 = 0xaa,	 	 
    i32_trunc_u_f64 = 0xab,	 	 
    i64_extend_s_i32 = 0xac,	 	 
    i64_extend_u_i32 = 0xad,	 	 
    i64_trunc_s_f32 = 0xae,	 	 
    i64_trunc_u_f32 = 0xaf,	 	 
    i64_trunc_s_f64 = 0xb0,	 	 
    i64_trunc_u_f64 = 0xb1,	 	 
    f32_convert_s_i32 = 0xb2,	 	 
    f32_convert_u_i32 = 0xb3,	 	 
    f32_convert_s_i64 = 0xb4,	 	 
    f32_convert_u_i64 = 0xb5,	 	 
    f32_demote_f64 = 0xb6,	 	 
    f64_convert_s_i32 = 0xb7,	 	 
    f64_convert_u_i32 = 0xb8,	 	 
    f64_convert_s_i64 = 0xb9,	 	 
    f64_convert_u_i64 = 0xba,	 	 
    f64_promote_f32 = 0xbb,	 	 

    // Reinterpretations (described here)

    i32_reinterpret_f32 = 0xbc,
    i64_reinterpret_f64 = 0xbd,
    f32_reinterpret_i32 = 0xbe,
    f64_reinterpret_i64 = 0xbf
}