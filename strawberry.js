export default class Strawberry {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 20;
        this.height = 20;
        this.color = "red";
        this.respawn();
    }

    respawn() {
        this.x = Math.random() * (this.canvas.width - this.width);
        this.y = Math.random() * (this.canvas.height - this.height);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
