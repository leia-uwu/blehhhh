export enum DisconnectReason {
    InvalidProtocol,
    InvalidPacket,
}

export const GameConstants = Object.freeze({
    protocol: 1,
    maxNameLength: 24,
});
