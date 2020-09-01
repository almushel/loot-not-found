function updateCamera() {
    panX = Math.floor(player.x - w/2);
    clamp(panX, 0, Math.floor(w/2));

    panY = Math.floor(player.y - h/2);
    clamp(panY, 0, Math.floor(h/2));
}

function objectInView(x, y, w, h) {
    return (
        pointInView(x - w, y - h) ||
        pointInView(x + w, y - h) ||
        pointInView(x + w, y + h) ||
        pointInView(x - w, y + h)
    )
}

function pointInView(x, y) {
    const padding = TILE_SIZE;
    return (x > panX - padding && y > panY - padding &&
            x < w + panX + padding && y < h + panY + padding);
}

function resizeCanvas(e) {
    canvas.width = w = window.innerWidth;
    canvas.height = h = window.innerHeight;
}