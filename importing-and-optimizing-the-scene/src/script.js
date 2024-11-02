import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/flireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/flireflies/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const textures = [
    { name: 'Body', path: './CuteCharacter/Body_Diffuse.png' },
    { name: 'Hair', path: './CuteCharacter/Hair_Diffuse.png' },
    { name: 'Boot', path: './CuteCharacter/Boot_Diffuse.png' },
    { name: 'Boot001', path: './CuteCharacter/Boot.001_Diffuse.png' },
    { name: 'Cloth', path: './CuteCharacter/Cloth_diffuse.png' },
    { name: 'DMAD_iris_l001', path: './CuteCharacter/Iris_L_diffuse.png' },
    { name: 'DMAD_iris_r001', path: './CuteCharacter/Iris_L_diffuse.png' },
    { name: 'DMAD_cornea_l001', path: './CuteCharacter/Cornea_L_diffuse.png' },
]

const materials = {}

textures.forEach(({ name, path }) => {
    const texture = textureLoader.load(path)
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace

    materials[name] = new THREE.MeshBasicMaterial({ map: texture })
})

const alphaMapTexture = textureLoader.load('./CuteCharacter/Cornea_L_diffuse.png');

/**
 * Model
 */
gltfLoader.load(
    'CuteCharacter.glb',
    (gltf) => {
        const meshMap = new Map(gltf.scene.children.map(child => [child.name, child]))

        materials['Hair'] && (meshMap.get('Hair').material = materials['Hair'])
        materials['Boot'] && (meshMap.get('Boot').material = materials['Boot'])
        materials['Body'] && (meshMap.get('Body').material = materials['Body'])
        materials['Boot001'] && (meshMap.get('Boot001').material = materials['Boot001'])
        materials['Cloth'] && (meshMap.get('Cloth').material = materials['Cloth'])
        materials['DMAD_iris_l001'] && (meshMap.get('DMAD_iris_l001').material = materials['DMAD_iris_l001'])
        materials['DMAD_iris_r001'] && (meshMap.get('DMAD_iris_r001').material = materials['DMAD_iris_r001'])
        materials['DMAD_cornea_l001'] && (meshMap.get('DMAD_cornea_l001').material = materials['DMAD_cornea_l001'])

        // Update the material for DMAD_cornea_l001 with the alpha map
        if (materials['DMAD_cornea_l001']) {
            const corneaMaterial = materials['DMAD_cornea_l001'];

            // Create a new material with the alpha map
            const newCorneaMaterial = new THREE.MeshBasicMaterial({
                map: corneaMaterial.map, // Use the existing texture map
                alphaMap: alphaMapTexture, // Set the alpha map
                transparent: true // Make the material transparent
            });

            // Replace the material in the materials object
            materials['DMAD_cornea_l001'] = newCorneaMaterial;

            // Update the material for the cornea in the scene
            const corneaLMesh = meshMap.get('DMAD_cornea_l001');
            const corneaRMesh = meshMap.get('DMAD_cornea_r001');
            if (corneaLMesh) {
                corneaLMesh.material = newCorneaMaterial;
                corneaRMesh.material = newCorneaMaterial;
            }
        }

        const meshNames = ['Hair', 'Boot', 'Body', 'Boot001', 'Cloth', 'DMAD_cornea_l001', 'DMAD_cornea_r001', 'DMAD_iris_l001', 'DMAD_iris_r001']
        meshNames.forEach(name => {
            const mesh = meshMap.get(name)
            if (mesh) {
                scene.add(mesh)
            }
        })
    }
)

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 60
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 8
    positionArray[i * 3 + 1] = Math.random() * 10
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 8

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 280 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(1000).step(1).name('firefliesSize')

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Gradient Background
 */
const topColor = '#c7a7d1';
const bottomColor = '#880c6d';

const gradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uHeight: { value: sizes.height },
        topColor: { value: new THREE.Color(topColor) },
        bottomColor: { value: new THREE.Color(bottomColor) }
    },
    vertexShader: `
        uniform float uHeight;

        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uHeight;
        uniform vec3 topColor;
        uniform vec3 bottomColor;

        void main() {
            gl_FragColor = vec4(mix(bottomColor, topColor, gl_FragCoord.y / uHeight), 1.0);
        }
    `,
    depthTest: false
});

const gradientMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gradientMaterial);
gradientMesh.renderOrder = -1;
scene.add(gradientMesh);

// GUI to change the background color
gui.addColor({ topColor, bottomColor }, 'topColor').onChange((color) => {
    gradientMaterial.uniforms.topColor.value.set(color);
});
gui.addColor({ topColor, bottomColor }, 'bottomColor').onChange((color) => {
    gradientMaterial.uniforms.bottomColor.value.set(color);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 10
camera.position.y = 10
camera.position.z = 10
scene.add(camera)

gui.add(camera.position, 'x').min(0).max(20).step(0.1)
gui.add(camera.position, 'y').min(0).max(20).step(0.1)
gui.add(camera.position, 'z').min(0).max(20).step(0.1)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// debugObject.clearColor = '#804263'
// renderer.setClearColor(debugObject.clearColor)
// gui.addColor(debugObject, 'clearColor')
//     .onChange(() =>
//     {
//         renderer.setClearColor(debugObject.clearColor)
//     })

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()