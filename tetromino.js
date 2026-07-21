const SHAPES = {
    I: [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    J: [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],
    L: [
        [0,0,1],
        [1,1,1],
        [0,0,0]
    ],
    O: [
        [1,1],
        [1,1]
    ],
    S: [
        [0,1,1],
        [1,1,0],
        [0,0,0]
    ],
    T: [
        [0,1,0],
        [1,1,1],
        [0,0,0]
    ],
    Z: [
        [1,1,0],
        [0,1,1],
        [0,0,0]
    ]
};

const COLORS = {
    I: '#00f0f0',
    J: '#0000f0',
    L: '#f0a000',
    O: '#f0f000',
    S: '#00f000',
    T: '#a000f0',
    Z: '#f00000'
};

class Piece {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type];
        this.color = COLORS[type];
        this.x = Math.floor((10 - this.shape[0].length) / 2);
        this.y = type === 'I' ? -1 : 0; 
    }
}

const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
