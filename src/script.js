import * as THREE from "three"
import * as dat from "dat.gui"
import gsap from "gsap"

THREE.ColorManagement.enabled = false

/**
 * Debug
 */
const gui = new dat.GUI({ width: 320 })

const parameters = {
  materialColor: "#84cee1",
}

gui
  .addColor(parameters, "materialColor")
  .onFinishChange(() => {
    material.color.set(parameters.materialColor)
    particlesMaterial.color.set(parameters.materialColor)
  })
  .name("Color")

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load("/textures/gradients/3.jpg")
gradientTexture.magFilter = THREE.NearestFilter

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */
const gutterSize = 4
const offset = 2
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
}) // light based material
const geometries = [
  new THREE.TorusGeometry(1, 0.4, 16, 60),
  new THREE.ConeGeometry(1, 2, 32),
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
]
const meshes = geometries.map((geometry, idx) => {
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  mesh.position.y = -gutterSize * idx
  mesh.position.x = idx % 2 ? -offset : offset
  return mesh
})

/**
 * Particles
 */
const count = 200
const horizontalSpread = 10
const particlesGeometry = new THREE.BufferGeometry()
const coordinates = new Float32Array(count * 3)
coordinates.forEach((_, idx) => {
  const idx3 = idx * 3
  coordinates[idx3 + 0] = (Math.random() - 0.5) * horizontalSpread
  coordinates[idx3 + 1] =
    gutterSize * 0.5 - Math.random() * meshes.length * gutterSize
  coordinates[idx3 + 2] = (Math.random() - 0.5) * horizontalSpread
})

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(coordinates, 3)
)
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.03,
  sizeAttenuation: true,
  color: parameters.materialColor,
})
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSection = 0
window.addEventListener("scroll", () => {
  scrollY = window.scrollY
  const newSection = Math.round(scrollY / sizes.height)
  if (newSection !== currentSection) {
    currentSection = newSection
    gsap.to(meshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    })
  }
})

/**
 * Cursor
 */
const cursor = { x: 0, y: 0 }

window.addEventListener("mousemove", (e) => {
  cursor.x = e.clientX / sizes.width - 0.5
  cursor.y = -(e.clientY / sizes.height - 0.5)
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Animate camera
  // Scrolling
  camera.position.y = -((scrollY / sizes.height) * gutterSize)

  // Parallax effect
  const destinationX = cursor.x
  const destinationY = cursor.y
  cameraGroup.position.y +=
    (destinationY - cameraGroup.position.y) * 5 * deltaTime
  cameraGroup.position.x +=
    (destinationX - cameraGroup.position.x) * 5 * deltaTime

  // Animate objects
  meshes.forEach((mesh, idx) => {
    mesh.rotation.x += deltaTime * 0.1
    mesh.rotation.y += deltaTime * 0.12
  })

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
