let canvas, ctx, w, h;

let panX, panY;

function updateCamera() {
    panX = Math.floor(player.x - w/2);
    clamp(panX, 0, Math.floor(w/2));

    panY = Math.floor(player.y - h/2);
    clamp(panY, 0, Math.floor(h/2));
}

function objectInview(x, y) {
    return (x > panX  - GRID_SIZE && y > panY - GRID_SIZE &&
            x < w + panX + GRID_SIZE && y < h + panY + GRID_SIZE);
}

function resizeCanvas(e) {
    canvas.width = w = window.innerWidth;
    canvas.height = h = window.innerHeight;
}