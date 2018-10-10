window.addEventListener('DOMContentLoaded', init)

//#region classes

class Vector {
    public x: number = 0
    public y: number = 0
    public vx: number = 0
    public vy: number = 0
    public angle: number = 0
    public va: number = 0.05
}

class Particle extends Vector {
    public id: string = Math.random().toString()
    public color: string = randomColor()
    public radius: number = 8
    public opacity: number = 1
}

class Unicorn extends Vector {
    constructor(public image: HTMLImageElement) {
        super()
    }
}

class Tile extends Vector {
    public color: string = randomColor()
    public width: number = 30
    public height: number = 10
    public opacity: number = 1
}

class ParticleFactory {
    private static particleArchive: { [key: string]: any } = {}

    private static archive(p: Particle): void {
        ParticleFactory.particleArchive[p.id] = (Object as any).assign({}, p)
    }

    private static retrieve(p: Particle): Particle | null {
        if (p.id in ParticleFactory.particleArchive) {
            return ParticleFactory.particleArchive[p.id]
        }

        return null
    }

    static create(options: any): Particle {
        const p = new Particle()
        ;(Object as any).assign(p, options)
        ParticleFactory.archive(p)
        return p
    }

    static reset(p: Particle): void {
        const archivedVersion = ParticleFactory.retrieve(p)
        if (archivedVersion) {
            ;(Object as any).assign(p, archivedVersion)
        }
    }
}

class Renderer {
    constructor(private $: CanvasRenderingContext2D) {}

    public renderParticle = (p: Particle): void => {
        const { $ } = this
        const { x, y, radius, color, opacity } = p
        $.save()
        $.globalAlpha = opacity
        $.fillStyle = color
        $.translate(x, y)
        $.beginPath()
        $.arc(0, 0, radius, 0, PI2)
        $.fill()
        $.stroke()
        $.restore()
    }

    public renderStar = (p: Particle): void => {
        const { $ } = this
        const { radius, color, x, y, opacity } = p
        $.save()
        $.translate(x, y)
        $.fillStyle = color
        $.globalAlpha = opacity

        $.beginPath()
        for (let i = 5; i--; ) {
            $.lineTo(0, radius)
            $.translate(0, radius)
            $.rotate(PI2 / 10)
            $.lineTo(0, -radius)
            $.translate(0, -radius)
            $.rotate(-((Math.PI * 6) / 10))
        }
        $.lineTo(0, radius)

        $.fill()
        $.stroke()
        $.restore()
    }

    public clearScreen(): void {
        const { $ } = this
        $.clearRect(0, 0, $.canvas.width, $.canvas.height)
    }

    public renderImage(img: HTMLImageElement, x: number, y: number): void {
        const { $ } = this
        $.save()
        $.drawImage(img, x, y)
        $.restore()
    }

    public renderUnicorn(u: Unicorn): void {
        this.renderImage(u.image, u.x, u.y)
    }

    public renderTile = (t: Tile): void => {
        const { $ } = this
        const { x, y, width, height, color, opacity } = t
        $.save()
        $.globalAlpha = opacity
        $.fillStyle = color
        $.translate(x, y)
        $.beginPath()
        $.rect(0, 0, width, height)
        $.fill()
        $.stroke()
        $.restore()
    }
}

//#endregion

//#region globals

const CANVAS = document.createElement('canvas')
const CTX = CANVAS.getContext('2d') as CanvasRenderingContext2D
const WIDTH = (CANVAS.width = window.innerWidth)
const HEIGHT = (CANVAS.height = window.innerHeight)

const PI2 = 2 * Math.PI
const GRAVITY = 0.125
const COLOR_FADE = 0.01
const COLORS = [
    '#9400D3',
    '#4B0082',
    '#0000FF',
    '#00FF00',
    '#FFFF00',
    '#FF7F00',
    '#FF0000'
]
const RENDERER = new Renderer(CTX)
const TILES: Tile[] = []
const PARTICLES: Particle[] = []
const PARTICLE_COUNT = 40
const UNICORN_IMAGE = document.getElementById('unicorn') as HTMLImageElement
const UNICORN = new Unicorn(UNICORN_IMAGE)

//#endregion

//#region utils

function randomColor(): string {
    return sample(COLORS)
}

function randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min
}

function randomBoolean(): boolean {
    return Math.random() > 0.5
}

function sample(a: any[]): any {
    return a[Math.floor(Math.random() * a.length)]
}

function outsideScreen(p: Particle): boolean {
    const diameter = p.radius * 2
    const yExceeded = p.y - diameter > HEIGHT || p.y + diameter < 0
    const xExceeded = p.x - diameter > WIDTH || p.x + diameter < 0
    return yExceeded || xExceeded
}

//#endregion

//#region animation

function updateParticle(p: Particle): void {
    p.vy += GRAVITY

    p.y += p.vy
    p.x += p.vx

    if (p.opacity > COLOR_FADE) {
        p.opacity -= COLOR_FADE
    }

    if (outsideScreen(p)) {
        ParticleFactory.reset(p)
    }
}

function updateUnicorn(unicorn: Unicorn): void {
    const { image } = unicorn
    const centerX = WIDTH / 2 - image.width / 2
    const centerY = HEIGHT / 2 - image.height / 2 - 50
    const radiusX = 20
    const radiusY = 8
    unicorn.x = centerX + Math.cos(unicorn.angle) * radiusX
    unicorn.y = centerY + Math.sin(unicorn.angle) * radiusY
    unicorn.angle += unicorn.va
}

function animation(): void {
    requestAnimationFrame(animation)

    RENDERER.clearScreen()

    TILES.forEach(updateTile)
    TILES.forEach(RENDERER.renderTile)

    PARTICLES.forEach(updateParticle)
    PARTICLES.forEach(RENDERER.renderStar)

    if (UNICORN_IMAGE.complete) {
        updateUnicorn(UNICORN)
        RENDERER.renderUnicorn(UNICORN)
    }
}

function createParticles(): void {
    for (let i = PARTICLE_COUNT; i > 0; --i) {
        const p = ParticleFactory.create({
            x: WIDTH / 2,
            y: HEIGHT / 2,
            vx: randomNumber(-14, -3),
            vy: randomNumber(-8, 2)
        })

        let i = Math.floor(randomNumber(0, 60)) + 1
        while (i--) {
            updateParticle(p)
        }
        PARTICLES.push(p)
    }
}

function updateTile(t: Tile): void {
    t.vx -= GRAVITY
    t.x += t.vx
    t.y += t.vy
    if (t.x + t.width < 0) {
        t.x = randomNumber(0, WIDTH) + WIDTH
        t.vx = 0
    }
}

function createTiles(): void {
    const tileCount = HEIGHT / 10
    for (let i = tileCount; i > 0; --i) {
        const tileWidth = randomNumber(60, 120)
        const t = new Tile()
        t.opacity = randomNumber(0.1, 0.6)
        t.width = tileWidth
        t.x = tileWidth * (i - 1)
        t.y = t.height * (i - 1)
        let ii = Math.floor(randomNumber(0, 260)) + 1
        while (ii--) {
            updateTile(t)
        }
        TILES.push(t)
    }
}

function setup(): void {
    document.body.appendChild(CANVAS)

    const unicornX = WIDTH / 2 - UNICORN.image.width / 2
    const unicornY = HEIGHT / 2 - UNICORN.image.height / 2

    UNICORN.x = unicornX
    UNICORN.y = unicornY

    createTiles()
    createParticles()
}

function init(): void {
    setup()
    animation()
}

//#endregion
