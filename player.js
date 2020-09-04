let player = {
    _hp: 100,
    loot: 0,
    color: '#4060C0',
    size: TILE_SIZE,
    held: -1,
    interactables: [],
    items: [new Hammer, new Grenade, new Balloon, new FireBomb],
    position: new Vector2(TILE_SIZE * 2, TILE_SIZE * 2),
    rotation: new Vector2(0, 1),
    velocity: new Vector2(0, 0),
    acceleration: TILE_SIZE / 60,
    type: 'circle', physics: 'dynamic',
    pickup(item) {
        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i]) {
                item.timer = 0;
                this.items[i] = item;
                this.held = i;
        
                let index = currentLevel.objects.indexOf(item);
                if (index >= 0) currentLevel.objects.splice(index, 1);
                break;
            }
        }
    },
    drop(index) {
        if (this.items[index]) {
            let item = this.items[index];
            this.items[index] = null;
            item.x = this.x;
            item.y = this.y;
            currentLevel.objects.push(item);
        }
    },
    interact() { //Interact with nearby object
        if (this.interactables[0]) this.interactables[0].onInteract();
    },
    use() { //Use current held item
        if (this.items[this.held]) this.items[this.held].onUse();
    },
    draw() {
        let color = this.isDead ? '#203060' : this.color;
        let tileColors = nearTileColors(1, this.x, this.y);
        let emptyTiles = 9 - tileColors.length;
        if (tileColors.length) color = averageHexColors(tileColors.concat(new Array(tileColors.length + emptyTiles).fill(color)));

        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 2;
        
        if (this.items[this.held]) this.items[this.held].drawHeld();

        ctx.fillStyle = color;

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.rotation.x * this.size, this.y + this.rotation.y * this.size);
        ctx.stroke();

        for (item of this.interactables) {
            item.drawLabel(item.x, item.y);
        }
    },
    die() {
        this.isDead = true
        let dIndex = tileAtCoords(this.position.x, this.position.y);
        currentLevel.spawnTile(dIndex, BLOOD);
    },
    get radius() { return this.size },
    get x() { return this.position.x },
    get y() { return this.position.y },
    get hp() { return this._hp },
    set hp(val) {
        this._hp = clamp(val, 0, 100);
        if (this._hp == 0 && !this.isDead) this.die();
    },
}