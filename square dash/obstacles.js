export default class Obstacles {
    constructor(canvas, count) {
        this.canvas = canvas;
        this.obstacles = [];
        this.count = count;
        this.generateObstacles();
    }

    generateObstacles() {
        this.obstacles = [];
        for (let i = 0; i < this.count; i++) {
            this.obstacles.push({
                x: Math.random() * (this.canvas.width - 50),
                y: Math.random() * (this.canvas.height - 50),
                width: 50,
                height: 50,
                color: "black"
            });
        }
    }

    draw(ctx) {
        for (let obs of this.obstacles) {
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
    }
}
