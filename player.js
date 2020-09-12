let player = {
    _hp: 100,
    _sway: 0,
    useTime: 20,
	swingTimer: 0,
    loot: 0,
    color: '#4060C0',
    size: TILE_SIZE,
    held: -1,
    interactables: [],
    items: new Array(4),
    position: new Vector2(TILE_SIZE * 2, TILE_SIZE * 2),
    rotation: new Vector2(0, 1),
    velocity: new Vector2(0, 0),
    swingRotation: new Vector2(0, 1),
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
                item.swingTimer = 0;
                this.items[i] = item;
                this.held = i;
        
                zzfx(...SOUND_EFFECTS['pickup']);
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
            zzfx(...SOUND_EFFECTS['drop']);
        }
    },
    interact() { //Interact with nearby object
        if (this.interactables[0]) {
            this.interactables[0].onInteract();
        }
    },
    use() { //Use current held item
        let heldItem = this.items[this.held];
        if (!this.swingTimer && heldItem && (heldItem.durability == undefined || heldItem.durability > 0))  {
            this.swingTimer = 1;
            zzfx(...SOUND_EFFECTS['use']);
        }
    },
    tileEffect(type) {
       if (type == FIRE) this.hp -= 0.125;
    },
    updateHeld() {
        let item = this.items[this.held];
        if (this.swingTimer > 0) {
            this.swingTimer++;
            if (this.swingTimer == Math.floor(this.useTime / 2)) {
                item.onUse()
            } else if (this.swingTimer == this.useTime + 8) {
                this.swingTimer = 0;
                this.swingRotation.x = 0, this.swingRotation.y = 0;
            }
        }
	},
    draw() {
        let color = this.isDead ? '#203060' : this.color;
        let tileColors = nearTileColors(1, this.x, this.y);
        let emptyTiles = 9 - tileColors.length;
        if (tileColors.length) color = averageHexColors(tileColors.concat(new Array(tileColors.length + emptyTiles).fill(color)));

        setShadow('black', 2);

        const armOffset = this.size - this.size/4;
        let armAngle = this.rotation.rotate(Math.PI/2);
        armAngle = armAngle.multiply(this.size);
        armAngle = armAngle.add(this.rotation.multiply(Math.sin(this.sway/10) * armOffset));
        
        //Left arm
        colorCircle(this.x - armAngle.x, this.y  - armAngle.y, this.size/2, color, true);
        //Right arm
        if (this.swingTimer) {
            armAngle = this.swingRotation.multiply(this.size);
        }
        colorCircle(this.x + armAngle.x, this.y  + armAngle.y, this.size/2, color, true);
        this.drawHeld();
        //Body
        colorCircle(this.x, this.y, this.size, color, true);

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
    drawHeld() {
        let item = this.items[this.held];
		if (item && this.swingTimer) {
			let offset = lerp(Math.PI, 0, smoothStop(clamp(this.swingTimer, 0, this.useTime) / this.useTime, 3));
			this.swingRotation = this.rotation.rotate(offset);
			
			ctx.translate(this.x, this.y);
			ctx.rotate(this.swingRotation.angle + Math.PI/2);
			item.draw(0, -item.size/2 - player.size/2);
			ctx.rotate(-(this.swingRotation.angle + Math.PI/2));
			ctx.translate(-this.x, -this.y);
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
    get sway() {return this._sway; },
    set sway(value) {
        this._sway = value;
        if (this._sway > 120) this._sway = 0;
    }
}