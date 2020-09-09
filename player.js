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
    reset() {
        this.isDead = false;
        this._hp = 100;
        this.loot = 0;
        this.items.fill(null);
        this.items[0] = new Hammer(0, 0);
        this.items[1] = new Grenade(0, 0);
        this.held = -1;
        this.velocity.length = 0;
        this.rotation.x = 0;
        this.rotation.y = 1;
    },
    pickup(item) {
        for (let i = 0; i < this.items.length; i++) {
            if (!this.items[i]) {
                item.timer = 0;
                this.items[i] = item;
                this.held = i;
        
                zzfx(...[.2,,1e3,,,.09,,.65,,49,,,,,120,,,.12,.02,.08]);
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
            zzfx(...[,,880,.1,,.25,,3,,,200,.2,,,59.9,,,.9]);
        }
    },
    interact() { //Interact with nearby object
        if (this.interactables[0]) {
            this.interactables[0].onInteract();
        }
    },
    use() { //Use current held item
        let heldItem = this.items[this.held];
        if (heldItem && (heldItem.durability == undefined || heldItem.durability > 0))  {
            heldItem.onUse();
            zzfx(...[,,440,.01,,,,,,,220,.012,,,60]);
        }
    },
    tileEffect(type) {
       if (type == FIRE) this.hp -= 0.125;
    },
    draw() {
        let color = this.isDead ? '#203060' : this.color;
        let tileColors = nearTileColors(1, this.x, this.y);
        let emptyTiles = 9 - tileColors.length;
        if (tileColors.length) color = averageHexColors(tileColors.concat(new Array(tileColors.length + emptyTiles).fill(color)));

        setShadow('black', 2);
        
        if (this.items[this.held]) this.items[this.held].drawHeld();

        ctx.fillStyle = color;

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fill();

        resetShadow();

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
        this.isDead = true;
        let dIndex = tileAtCoords(this.position.x, this.position.y);
        currentLevel.spawnTile(dIndex, BLOOD);
        gameState = 2;
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