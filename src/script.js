import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { Sky, ThreeMFLoader } from 'three/examples/jsm/Addons.js'
import fireworkVertexShader from './shaders/firework/vertex.glsl'
import fireworkFragmentShader from './shaders/firework/fragment.glsl'
import { generateUUID } from 'three/src/math/MathUtils.js'

// Debug
const gui = new GUI({ width: 340 })

const fireworkController = {
    baseParticleCount: 1000,
    baseParticleSize: 0.1,
    baseFireworkRadius: 0.5
}
const fireworkDebug = gui.addFolder("FIREWORK");
fireworkDebug.add(fireworkController, 'baseParticleCount', 500, 10000, 100)
fireworkDebug.add(fireworkController, 'baseParticleSize', 0.1, 1, 0.01)
fireworkDebug.add(fireworkController, 'baseFireworkRadius', 0.5, 5, 0.1)

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

// Generate random rotation matrix
const generateRotationMatrix = () => {
    const euler = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    )
    
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(euler);
    return rotationMatrix
}

// Shape points generation
const generatePointsOnCube = (count, length, rotationMatrix) => {
    const points = [];
    for (let i = 0; i < count; i++) {
        const face = Math.floor(Math.random() * 6) // Select a random face (0 to 5)
        const u = Math.random() * length - length / 2 // Random coordinate within face width
        const v = Math.random() * length - length / 2 // Random coordinate within face height

        let point
        switch (face) {
            case 0: point = new THREE.Vector3(length / 2, u, v); break;   // +X face
            case 1: point = new THREE.Vector3(-length / 2, u, v); break;  // -X face
            case 2: point = new THREE.Vector3(u, length / 2, v); break;   // +Y face
            case 3: point = new THREE.Vector3(u, -length / 2, v); break;  // -Y face
            case 4: point = new THREE.Vector3(u, v, length / 2); break;   // +Z face
            case 5: point = new THREE.Vector3(u, v, -length / 2); break;  // -Z face
        }

        point.applyMatrix4(rotationMatrix)
        points.push(point)
    }

    return points;
}

const generatePointsOnSphere = (count, radius) => {
    const points = [];

    for(let i = 0; i < count; i++){
        const spherical = new THREE.Spherical(
            radius * (0.75 + Math.random() * 0.25),
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2
        )
        const point = new THREE.Vector3()
        point.setFromSpherical(spherical)

        points.push(point);
    }

    return points
}

const shapeFunctions = [generatePointsOnSphere, generatePointsOnCube]

const createFirework = (count, position, size, texture, radius) => {
    const positionsArray = new Float32Array(count * 3)
    const colorsArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)
    const timeMultipliersArray = new Float32Array(count)

    const isRandomParticleColor = Math.random() >= 0.5;
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.7)

    const randomShape = Math.floor(Math.random() * shapeFunctions.length);

    let pointsOnShape;
    if(randomShape > 0){ // Not a circle
        pointsOnShape = shapeFunctions[randomShape](count, radius, generateRotationMatrix())
    } 
    else{
        pointsOnShape = shapeFunctions[randomShape](count, radius)
    }

    for(let i = 0; i < pointsOnShape.length; i++){
        const i3 = i * 3
        positionsArray[i3] = pointsOnShape[i].x
        positionsArray[i3 + 1] = pointsOnShape[i].y
        positionsArray[i3 + 2] = pointsOnShape[i].z

        if(isRandomParticleColor){
            color.setHSL(Math.random(), 1, 0.7)
        }
        colorsArray[i3] = color.r;
        colorsArray[i3 + 1] = color.g;
        colorsArray[i3 + 2] = color.b;

        sizesArray[i] = Math.random()

        timeMultipliersArray[i] = Math.random() + 1
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3))
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colorsArray, 3))
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
    const count = Math.round(1000 + Math.random() * fireworkController.baseParticleCount);
    const position = new THREE.Vector3(
        (Math.random() -0.5) * 2,
        Math.random(),
        (Math.random() -0.5) * 2
    )
    const size = 0.1 + Math.random() * fireworkController.baseParticleSize
    const texture = textures[Math.floor(Math.random() * textures.length)]
    const radius = 0.5 + Math.random() * fireworkController.baseFireworkRadius

    createFirework(count, position, size, texture, radius)
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

const skyboxDebug = gui.addFolder("SKYBOX");
skyboxDebug.add(skyController, 'turbidity', 0.0, 20.0, 0.1).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'rayleigh', 0.0, 4, 0.001).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'elevation', -3, 10, 0.01).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'azimuth', - 180, 180, 0.1).onChange(skyBoxChanged)
skyboxDebug.add(skyController, 'exposure', 0, 1, 0.0001).onChange(skyBoxChanged)
skyboxDebug.close()
skyBoxChanged();

const tick = () =>
{
    controls.update()

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()