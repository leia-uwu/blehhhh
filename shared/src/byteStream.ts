/**
 * This helps keep track of a {@link DataView} index for reads and writes. \
 * And also supports reading and writing clamped 8 bits and 16 bits floats, UTF-8 strings and groups of booleans
 */
export class ByteStream {
    index = 0;
    view: DataView;

    constructor(sourceOrLength: ArrayBufferLike | number) {
        const buffer = typeof sourceOrLength === "number"
            ? new ArrayBuffer(sourceOrLength)
            : sourceOrLength;

        this.view = new DataView(buffer);
    }

    get bytesLeft(): number {
        return this.view.byteLength - this.index;
    }

    getBuffer(): Uint8Array {
        return new Uint8Array(this.view.buffer, 0, this.index);
    }

    writeUint8(value: number): void {
        this.view.setUint8(this.index, value);
        this.index += 1;
    }

    writeInt8(value: number): void {
        this.view.setInt8(this.index, value);
        this.index += 1;
    }

    writeUint16(value: number): void {
        this.view.setUint16(this.index, value);
        this.index += 2;
    }

    writeInt16(value: number): void {
        this.view.setInt16(this.index, value);
        this.index += 2;
    }

    writeUint32(value: number): void {
        this.view.setUint32(this.index, value);
        this.index += 4;
    }

    writeInt32(value: number): void {
        this.view.setInt32(this.index, value);
        this.index += 4;
    }

    writeFloat32(value: number): void {
        this.view.setFloat32(this.index, value);
        this.index += 4;
    }

    writeFloat64(value: number): void {
        this.view.setFloat64(this.index, value);
        this.index += 8;
    }

    readUint8(): number {
        const value = this.view.getUint8(this.index);
        this.index += 1;
        return value;
    }

    readInt8(): number {
        const value = this.view.getInt8(this.index);
        this.index += 1;
        return value;
    }

    readUint16(): number {
        const value = this.view.getUint16(this.index);
        this.index += 2;
        return value;
    }

    readInt16(): number {
        const value = this.view.getInt16(this.index);
        this.index += 2;
        return value;
    }

    readUint32(): number {
        const value = this.view.getUint32(this.index);
        this.index += 4;
        return value;
    }

    readInt32(): number {
        const value = this.view.getInt32(this.index);
        this.index += 4;
        return value;
    }

    readFloat32(): number {
        const value = this.view.getFloat32(this.index);
        this.index += 4;
        return value;
    }

    readFloat64(): number {
        const value = this.view.getFloat64(this.index);
        this.index += 8;
        return value;
    }

    /**
     * Write a clamped 8 bits float between a minimum and a maximum value
     */
    writeFloat8(value: number, min: number, max: number): void {
        if (value < min && value > max) {
            throw new RangeError(
                `Value out of range: ${value}, range: [${min}, ${max}]`,
            );
        }

        const range = (1 << 8) - 1;
        const factor = (value - min) / (max - min);
        const valueToWrite = factor * range + 0.5;

        this.writeUint8(valueToWrite);
    }

    /**
     * Read a clamped 8 bits float between a minimum and a maximum value
     */
    readFloat8(min: number, max: number): number {
        const range = (1 << 8) - 1;
        const read = this.readUint8();
        const factor = read / range;
        const value = min + factor * (max - min);
        return value;
    }

    /**
     * Write a clamped 16 bits float between a minimum and a maximum value
     */
    writeFloat16(value: number, min: number, max: number): void {
        if (value < min && value > max) {
            throw new RangeError(
                `Value out of range: ${value}, range: [${min}, ${max}]`,
            );
        }

        const range = (1 << 16) - 1;
        const factor = (value - min) / (max - min);
        const valueToWrite = factor * range + 0.5;

        this.writeUint16(valueToWrite);
    }

    /**
     * Read a clamped 16 bits float between a minimum and a maximum value
     */
    readFloat16(min: number, max: number): number {
        const range = (1 << 16) - 1;
        const read = this.readUint16();
        const factor = read / range;
        const value = min + factor * (max - min);
        return value;
    }

    private static _textEncoder = new TextEncoder();
    private static _textDecoder = new TextDecoder();

    /**
     * Write an UTF-8 string
     * @param maxLength The maximum length in bytes to write. This is not the string length since UTF-8 characters can have more than 1 byte
     */
    writeString(string: string, maxLength?: number): void {
        const bytes = ByteStream._textEncoder.encode(string);

        const len = maxLength ? Math.min(maxLength, bytes.length + 1) : bytes.length + 1;

        for (let i = 0; i < len; i++) {
            this.writeUint8(i < bytes.length ? bytes[i] : 0x00);
        }
    }

    /**
     * Read an UTF-8 string
     * @param maxLength The maximum length in bytes to read. This is not the string length since UTF-8 characters can have more than 1 byte
     */
    readString(maxLength?: number): string {
        const chars: number[] = [];
        const len = maxLength ?? this.view.byteLength - this.index;

        for (let i = 0; i < len; i++) {
            const char = this.readUint8();
            if (char === 0x00) {
                break;
            } else {
                chars.push(char);
            }
        }
        return ByteStream._textDecoder.decode(new Uint8Array(chars));
    }

    /**
     * Write a group of at maximum 8 booleans to a single byte
     */
    writeBooleanGroup(bools: boolean[]): void {
        if (bools.length > 8) {
            throw new RangeError(`Can only write 8 booleans at a time, received ${bools.length}`);
        }

        let val = 0;

        for (let i = 0; i < bools.length; i++) {
            if (bools[i]) {
                val |= 1 << i;
            }
        }

        this.writeUint8(val);
    }

    /**
     * Read 8 booleans from a single byte
     */
    readBooleanGroup(): boolean[] {
        const bools = new Array(8);
        const value = this.readUint8();

        for (let i = 0; i < 8; i++) {
            bools[i] = (value & (1 << i)) !== 0;
        }

        return bools;
    }
}
