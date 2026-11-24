/**
 * Dependency-free ISO/IEC 18004 QR Code SVG Generator (Versions 1-10, ECC Level L, Byte Mode).
 * Works completely offline in the browser with zero external requests.
 */

// Total codewords and EC codewords per block for Version 1..10 at ECC Level L (1 block for V1..V10)
const VERSION_CAPACITY_L: Array<{ total: number; ec: number; align: number[] }> = [
    { total: 0, ec: 0, align: [] }, // placeholder index 0
    { total: 26, ec: 7, align: [] },
    { total: 44, ec: 10, align: [6, 18] },
    { total: 70, ec: 15, align: [6, 22] },
    { total: 100, ec: 20, align: [6, 26] },
    { total: 134, ec: 26, align: [6, 30] },
    { total: 172, ec: 18, align: [6, 34] }, // 2 blocks of 18 ec
    { total: 196, ec: 20, align: [6, 22, 38] }, // 2 blocks of 20 ec
    { total: 242, ec: 24, align: [6, 24, 42] }, // 2 blocks of 24 ec
    { total: 292, ec: 30, align: [6, 26, 46] }, // 2 blocks of 30 ec
    { total: 346, ec: 18, align: [6, 28, 50] }, // 4 blocks
];

const BLOCKS_L = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function getGeneratorPoly(degree: number): Uint8Array {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
        const next = new Uint8Array(poly.length + 1);
        const factor = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
    }
    return poly;
}

function computeReedSolomon(data: Uint8Array, ecLen: number): Uint8Array {
    const gen = getGeneratorPoly(ecLen);
    const rem = new Uint8Array(ecLen);
    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ rem[0];
        rem.copyWithin(0, 1);
        rem[ecLen - 1] = 0;
        for (let j = 0; j < ecLen; j++) {
            rem[j] ^= gfMul(gen[j + 1], factor);
        }
    }
    return rem;
}

export function generateQrSvg(text: string, size = 160): string {
    const bytes = new TextEncoder().encode(text || ' ');

    // Pick smallest version (1..10) that fits bytes
    let version = 1;
    for (let v = 1; v <= 10; v++) {
        const numBlocks = BLOCKS_L[v];
        const dataCap = VERSION_CAPACITY_L[v].total - VERSION_CAPACITY_L[v].ec * numBlocks;
        const headerBytes = v < 10 ? 2 : 3;
        if (bytes.length + headerBytes <= dataCap) {
            version = v;
            break;
        }
        if (v === 10) version = 10;
    }

    const numBlocks = BLOCKS_L[version];
    const ecPerBlock = VERSION_CAPACITY_L[version].ec;
    const totalCodewords = VERSION_CAPACITY_L[version].total;
    const dataCapacity = totalCodewords - ecPerBlock * numBlocks;

    const payload = bytes.slice(0, dataCapacity - (version < 10 ? 2 : 3));

    // Bit buffer
    const bits: number[] = [];
    const pushBits = (val: number, len: number) => {
        for (let i = len - 1; i >= 0; i--) {
            bits.push((val >>> i) & 1);
        }
    };

    // Byte mode indicator (0100)
    pushBits(0b0100, 4);
    pushBits(payload.length, version < 10 ? 8 : 16);
    for (let i = 0; i < payload.length; i++) {
        pushBits(payload[i], 8);
    }

    // Terminator up to 4 zero bits
    const maxBits = dataCapacity * 8;
    pushBits(0, Math.min(4, maxBits - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCodewords = new Uint8Array(dataCapacity);
    for (let i = 0; i < bits.length / 8; i++) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
            byte = (byte << 1) | bits[i * 8 + b];
        }
        dataCodewords[i] = byte;
    }

    let padToggle = true;
    for (let i = bits.length / 8; i < dataCapacity; i++) {
        dataCodewords[i] = padToggle ? 0xec : 0x11;
        padToggle = !padToggle;
    }

    // Split into blocks and compute ECC
    const dataBlocks: Uint8Array[] = [];
    const ecBlocks: Uint8Array[] = [];
    const baseBlockSize = Math.floor(dataCapacity / numBlocks);
    const extraBlocks = dataCapacity % numBlocks;
    let offset = 0;
    for (let b = 0; b < numBlocks; b++) {
        const bLen = baseBlockSize + (b >= numBlocks - extraBlocks ? 1 : 0);
        const block = dataCodewords.slice(offset, offset + bLen);
        offset += bLen;
        dataBlocks.push(block);
        ecBlocks.push(computeReedSolomon(block, ecPerBlock));
    }

    // Interleave blocks
    const finalCodewords: number[] = [];
    const maxDataBlockLen = baseBlockSize + (extraBlocks > 0 ? 1 : 0);
    for (let i = 0; i < maxDataBlockLen; i++) {
        for (let b = 0; b < numBlocks; b++) {
            if (i < dataBlocks[b].length) finalCodewords.push(dataBlocks[b][i]);
        }
    }
    for (let i = 0; i < ecPerBlock; i++) {
        for (let b = 0; b < numBlocks; b++) {
            finalCodewords.push(ecBlocks[b][i]);
        }
    }

    // Matrix creation
    const dim = version * 4 + 17;
    const matrix: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));
    const reserved: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

    const setModule = (r: number, c: number, dark: boolean) => {
        if (r >= 0 && r < dim && c >= 0 && c < dim) {
            matrix[r][c] = dark ? 1 : 0;
            reserved[r][c] = true;
        }
    };

    const drawFinder = (row: number, col: number) => {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const inOuter = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
                const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                setModule(row + r, col + c, inOuter || inInner);
            }
        }
    };

    drawFinder(0, 0);
    drawFinder(0, dim - 7);
    drawFinder(dim - 7, 0);

    // Alignment patterns
    const alignCoords = VERSION_CAPACITY_L[version].align;
    for (const r of alignCoords) {
        for (const c of alignCoords) {
            if ((r === 6 && c === 6) || (r === 6 && c === dim - 7) || (r === dim - 7 && c === 6)) continue;
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
                    setModule(r + dr, c + dc, dark);
                }
            }
        }
    }

    // Timing patterns
    for (let i = 8; i < dim - 8; i++) {
        if (!reserved[6][i]) setModule(6, i, i % 2 === 0);
        if (!reserved[i][6]) setModule(i, 6, i % 2 === 0);
    }

    // Dark module & reserve format info areas
    setModule(dim - 8, 8, true);
    for (let i = 0; i < 9; i++) {
        if (!reserved[8][i]) reserved[8][i] = true;
        if (!reserved[i][8]) reserved[i][8] = true;
    }
    for (let i = 0; i < 8; i++) {
        reserved[8][dim - 1 - i] = true;
        reserved[dim - 1 - i][8] = true;
    }

    // Version info for V >= 7
    if (version >= 7) {
        let rem = version;
        for (let i = 0; i < 12; i++) {
            rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        }
        const vBits = (version << 12) | rem;
        for (let i = 0; i < 18; i++) {
            const dark = ((vBits >>> i) & 1) === 1;
            const a = dim - 11 + (i % 3);
            const b = Math.floor(i / 3);
            setModule(b, a, dark);
            setModule(a, b, dark);
        }
    }

    // Place data bits (upward/downward 2-column zigzag) with Mask 0: (r + c) % 2 === 0
    let bitIdx = 0;
    const totalBits = finalCodewords.length * 8;
    let upward = true;
    for (let right = dim - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < dim; vert++) {
            const r = upward ? dim - 1 - vert : vert;
            for (let j = 0; j < 2; j++) {
                const c = right - j;
                if (!reserved[r][c]) {
                    let dark = false;
                    if (bitIdx < totalBits) {
                        const byte = finalCodewords[bitIdx >>> 3];
                        dark = ((byte >>> (7 - (bitIdx & 7))) & 1) === 1;
                        bitIdx++;
                    }
                    if ((r + c) % 2 === 0) dark = !dark;
                    matrix[r][c] = dark ? 1 : 0;
                }
            }
        }
        upward = !upward;
    }

    // Format information for ECC Level L (01) and Mask 0 (000) -> Precomputed BCH format bits: 0x77c4
    const formatBits = 0x77c4;
    for (let i = 0; i <= 5; i++) matrix[8][i] = (formatBits >>> i) & 1;
    matrix[8][7] = (formatBits >>> 6) & 1;
    matrix[8][8] = (formatBits >>> 7) & 1;
    matrix[7][8] = (formatBits >>> 8) & 1;
    for (let i = 9; i < 15; i++) matrix[14 - i][8] = (formatBits >>> i) & 1;

    for (let i = 0; i < 8; i++) matrix[8][dim - 1 - i] = (formatBits >>> i) & 1;
    for (let i = 8; i < 15; i++) matrix[dim - 15 + i][8] = (formatBits >>> i) & 1;

    // Render SVG path
    const margin = 2;
    const viewSize = dim + margin * 2;
    let path = '';
    for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
            if (matrix[r][c]) {
                path += `M${c + margin},${r + margin}h1v1h-1z`;
            }
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Código QR">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <path d="${path}" fill="#000000"/>
    </svg>`;
}
