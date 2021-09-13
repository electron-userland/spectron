export default {
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn(),
    existsSync: jest.fn().mockReturnValue(true)
}
