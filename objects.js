class LootPiece {
    active = true;
    type = 'rect';
    physics= 'dynamic';
    
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.size = GRID_SIZE / 2;
    }

    onCollision(withObject) {
        if (!this.active) return;
        if (withObject == player) {
            player.loot++;
            this.active = false;
        }
    }

    draw() {
        if (!this.active || !objectInview(this.x, this.y)) return;
        ctx.fillStyle = 'gold';
        ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
    }

    get width() {return this.size;}
    get height() {return this.size;}
    get x() {return this.position.x};
    get y() {return this.position.y};
    set x(value) {this.position.x = value};
    set y(value) { this.position.x = value};
}