import { GameConstants } from "../constants.ts";
import { ByteStream } from "./byteStream.ts";

export interface Packet {
    serialize(s: ByteStream): void;
    deserialize(s: ByteStream): void;
}

// class constructor that returns a packet
type PacketCtr = new() => Packet;

class PacketRegister {
    idToPacket = new Map<number, PacketCtr>();
    packetToId = new Map<PacketCtr, number>();

    nextId = 0;

    register(ctr: PacketCtr) {
        if (this.packetToId.has(ctr)) {
            throw new Error(`Packet ${ctr} already registered`);
        }

        const id = this.nextId++;
        this.idToPacket.set(id, ctr);
        this.packetToId.set(ctr, id);
    }

    serializePacket(stream: ByteStream, packet: Packet) {
        const id = this.packetToId.get(packet.constructor as PacketCtr);
        if (id === undefined) {
            throw new Error(`Packet ${packet.constructor} is not registered`);
        }

        stream.writeUint8(id);
        packet.serialize(stream);
    }

    /**
     * Deserializes a packet from the stream
     * Will return undefined if there was an error deserializing it
     */
    deserializePacket(stream: ByteStream): Packet | undefined {
        try {
            const id = stream.readUint8();
            const ctr = this.idToPacket.get(id);
            if (!ctr) {
                throw new Error(`No packet with id ${id} is registered`);
            }
            const packet = new ctr();
            packet.deserialize(stream);
            return packet;
        } catch (error) {
            console.error(`Failed to deserialize packet:`, error);
            return undefined;
        }
    }

    /**
     * Deserializes all packets from a stream
     * This keeps deserializing packets until an error or the stream is out of bytes
     */
    deserializeAllPackets(stream: ByteStream): Packet[] {
        const packets: Packet[] = [];
        while (stream.bytesLeft > 0) {
            const packet = this.deserializePacket(stream);
            if (!packet) break;
            packets.push(packet);
        }
        return packets;
    }
}
export const clientToServerPackets = new PacketRegister();
export const serverToClientPackets = new PacketRegister();

export class ConnectPacket implements Packet {
    protocol: number = GameConstants.protocol;
    name = "";

    serialize(s: ByteStream): void {
        s.writeUint32(this.protocol);
        s.writeString(this.name, GameConstants.maxNameLength);
    }
    deserialize(s: ByteStream): void {
        this.protocol = s.readUint32();
        this.name = s.readString(GameConstants.maxNameLength);
    }
}
clientToServerPackets.register(ConnectPacket);
