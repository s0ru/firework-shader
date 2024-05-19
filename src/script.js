import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { Sky } from 'three/examples/jsm/Addons.js'
import fireworkVertexShader from './shaders/firework/vertex.glsl'
import fireworkFragmentShader from './shaders/firework/fragment.glsl'

// Debug
const gui = new GUI({ width: 340 })

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const textureLoader = new THREE.TextureLoader()

const textures = [
    textureLoader.load('./particles/1.png'),
    textureLoader.load('./particles/2.png'),
    textureLoader.load('./particles/3.png'),
    textureLoader.load('./particles/4.png'),
    textureLoader.load('./particles/5.png'),
    textureLoader.load('./particles/6.png'),
    textureLoader.load('./particles/7.png'),
    textureLoader.load('./particles/8.png'),
]

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}
sizes.resolution = new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.resolution.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1.5, 0, 6)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

const createFirework = (count, position, size, texture, radius, color) => {
    const positionsArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)
    const timeMultipliersArray = new Float32Array(count)

    for(let i = 0; i < positionsArray.length; i++){
        const i3 = i * 3

        const spherical = new THREE.Spherical(
         radius * (0.75 + Math.random() * 0.25),
         Math.random() * Math.PI,
         Math.random() * Math.PI * 2
        )
        const position = new THREE.Vector3()
        position.setFromSpherical(spherical)

        positionsArray[i3] = position.x
        positionsArray[i3 + 1] = position.y
        positionsArray[i3 + 2] = position.z

        sizesArray[i] = Math.random()

        timeMultipliersArray[i] = Math.random() + 1
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesArray, 1))
    geometry.setAttribute('aTimeMultiplier', new THREE.Float32BufferAttribute(timeMultipliersArray, 1))

    texture.flipY = false;
    const material = new THREE.ShaderMaterial(
        {
            vertexShader: fireworkVertexShader,
            fragmentShader: fireworkFragmentShader,
            uniforms: {
                uSize: new THREE.Uniform(size),
                uResolution: new THREE.Uniform(sizes.resolution),
                uTexture: new THREE.Uniform(texture),
                uColor: new THREE.Uniform(color),
                uProgress: new THREE.Uniform(0),
            },
            transparent: true,
            depthWrite: false
        }
    )

    const destroy = () => {
        scene.remove(firework)
        geometry.dispose()
        material.dispose()
    }

    gsap.to(material.uniforms.uProgress, { value: 1, duration: 3, ease: 'linear', onComplete: destroy})

    const firework = new THREE.Points(geometry, material)
    firework.position.copy(position)
    scene.add(firework)
}

const createRandomFirework = () => {
    const count = Math.round(400 + Math.random() * 1000);
    const position = new THREE.Vector3(
        (Math.random() -0.5) * 2,
        Math.random(),
        (Math.random() -0.5) * 2
    )
    const size = 0.1 + Math.random() * 0.1
    const texture = textures[Math.floor(Math.random() * textures.length)]
    const radius = 0.5 + Math.random()
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.7)

    createFirework(count, position, size, texture, radius, color)
}

window.addEventListener('click', () => {
    createRandomFirework();
})

// Sky
const sky = new Sky()
sky.scale.setScalar(450000)
scene.add( sky )
const sun = new THREE.Vector3()

const skyController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.95,
    elevation: -2.2,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
}

function skyBoxChanged() {
    const uniforms = sky.material.uniforms
    uniforms[ 'turbidity' ].value = skyController.turbidity
    uniforms[ 'rayleigh' ].value = skyController.rayleigh
    uniforms[ 'mieCoefficient' ].value = skyController.mieCoefficient
    uniforms[ 'mieDirectionalG' ].value = skyController.mieDirectionalG

    const phi = THREE.MathUtils.degToRad( 90 - skyController.elevation )
    const theta = THREE.MathUtils.degToRad( skyController.azimuth )

    sun.setFromSphericalCoords( 1, phi, theta )

    uniforms[ 'sunPosition' ].value.copy( sun )
    renderer.toneMappingExposure = skyController.exposure
    renderer.render( scene, camera )
}

gui.add(skyController, 'turbidity', 0.0, 20.0, 0.1).onChange(skyBoxChanged)
gui.add(skyController, 'rayleigh', 0.0, 4, 0.001).onChange(skyBoxChanged)
gui.add(skyController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(skyBoxChanged)
gui.add(skyController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(skyBoxChanged)
gui.add(skyController, 'elevation', -3, 10, 0.01).onChange(skyBoxChanged)
gui.add(skyController, 'azimuth', - 180, 180, 0.1).onChange(skyBoxChanged)
gui.add(skyController, 'exposure', 0, 1, 0.0001).onChange(skyBoxChanged)

skyBoxChanged();

const tick = () =>
{
    controls.update()

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()