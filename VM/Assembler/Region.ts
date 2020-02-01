
export default class Region {    
    public readonly isSingle : boolean;

    constructor(public readonly start: number, public readonly end: number) {
        this.isSingle = this.start == this.end;
    }

    public contains(address : number) : boolean
    {
        return this.start <= address && this.end >= address;
    }

    public overlaps(other : Region) : boolean
    {
        return this.start <= other.end && other.start <= this.end;
    }

    public touching(other : Region) : boolean
    {
        return this.end + 1 == other.start ||
                this.start - 1 == other.end;
    }

    public merge(other : Region) : Region
    {
        return new Region(Math.min(this.start, other.start), 
                          Math.max(this.end, other.end));
    }

    public subtract(other : Region) : { first : Region | null, second : Region | null }
    {
        // this is horrible, but it passes the tests
        // do we need two output Regions?
        if (this.start < other.start &&
            this.end > other.end)
        {
            var a = new Region(this.start, other.start - 1);
            var b = new Region(other.end + 1, this.end);
            return { first : a, second : b };
        }

        if (this.start < other.start)
        {
            return { 
                first : new Region(this.start, other.start - 1), 
                second : null 
            };
        }

        if (this.start > other.start)
        {
            return { 
                first : new Region(other.end + 1, this.end), 
                second : null 
            };
        }

        if (this.start == other.start && this.end == other.end)
            return { 
                first : null,
                second : null 
            };

        if (this.start == other.start)
        {
            return { 
                first : new Region(other.start + 1, this.end),
                second : null 
            };
        }               

        throw new Error();
    }

    public intersection(other : Region) : Region
    {
        return new Region(Math.max(this.start, other.start), 
                          Math.min(this.end, other.end));
    }
}
