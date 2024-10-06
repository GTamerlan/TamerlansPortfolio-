
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

var clock = new THREE.Clock(); // Create a clock to track delta time
var mixer; // Animation mixer to control animations
const gltfLoader = new GLTFLoader();
let scene, camera, renderer, controls, marsBase, roverModel, roverAction;
let isDragging = false; // Track if the user is dragging the mouse
let isMouseDown = false; // Track if the mouse is currently held down
let rotationSpeed = 0.002; // Speed at which the environment rotates
let rotationAngle = 0; // Track the environment's rotation
let lastMouseX = 0; // Track the last mouse X position
let mouseDeltaX = 0; // Track the mouse movement delta
let inertia = 0; // Track inertia for smooth rotation after dragging stops
let previousRotation = 0; // Track previous rotation to detect changes
const rotationThreshold = 0.001; // Tolerance for detecting significant rotation changes

// Initialize the scene, camera, renderer, and controls
function init() {
    // Scene setup
    scene = new THREE.Scene();

    // Camera setup

    scene.background = new THREE.Color(0x87ceeb); // Light sky blue

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(1, 5, 10);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for better quality
    renderer.setPixelRatio(window.devicePixelRatio); // Set pixel ratio for sharper image
    document.body.appendChild(renderer.domElement);

    // OrbitControls for smooth camera movement
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.02; // Increase damping for slower, smoother rotation
    controls.enablePan = false; // Disable panning
    controls.minDistance = 8; // Set minimum zoom distance
    controls.maxDistance = 10.7; // Set maximum zoom distance

    // Allow vertical rotation, but no horizontal rotation
    controls.minAzimuthAngle = 0; // Lock horizontal rotation
    controls.maxAzimuthAngle = 0; // Lock horizontal rotation

    // Allow only vertical movement
    controls.minPolarAngle = Math.PI / 2.36; // Set a minimum vertical angle
    controls.maxPolarAngle = Math.PI / 2.2; // Set a maximum vertical angle

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft global light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Dynamic light
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true; // Enable shadows
    directionalLight.shadow.mapSize.width = 4096; // Increase shadow quality
    directionalLight.shadow.mapSize.height = 4096; // Increase shadow quality
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    // Load the Mars terrain and rover model
    createMarsTerrain();
    createBlueCube();

    // Set default cursor to grab
    document.body.style.cursor = 'grab';

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);

    // Add mouse event listeners for dragging and pressing the mouse button
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Handle mouse down event to start dragging and trigger rover animation
function onMouseDown(event) {
    isMouseDown = true; // Mark the mouse as being held down
    isDragging = true; // Start dragging
    lastMouseX = event.clientX; // Record the initial mouse position

    // Resume the rover animation by setting timeScale to 1 (normal speed)
    if (roverAction) {
        roverAction.timeScale = 2.2; // Resume the animation
    }
}

// Handle mouse move event to calculate mouse delta
function onMouseMove(event) {
    if (isDragging) {
        // Calculate how much the mouse has moved since the last frame
        mouseDeltaX = event.clientX - lastMouseX;
        lastMouseX = event.clientX; // Update the last mouse X position for the next frame
        inertia = mouseDeltaX * 0.02; // Set inertia based on mouse movement
    }
}

// Handle mouse up event to stop dragging
function onMouseUp() {
    isMouseDown = false; // Mark the mouse as no longer held down
    isDragging = false; // Stop dragging
    mouseDeltaX = 0; // Reset the mouse delta when dragging stops

    // Pause the rover animation by setting timeScale to 0
    if (roverAction) {
        roverAction.timeScale = 0; // Pause the animation
    }
}

// Create the Mars terrain and environment
function createMarsTerrain() {
    gltfLoader.load('./terrain/terrain.gltf', (gltfScene) => {
        marsBase = gltfScene.scene;

        let landscape = marsBase.getObjectByName('Landscape_2');
        let plane = marsBase.getObjectByName('Plane_1');
        let circle = marsBase.getObjectByName('Circle_1');

        // Create different materials
        const landscapeMaterial = new THREE.MeshStandardMaterial({ color: 0xb9a4f1 }); // Terrain color
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xcdf5ff }); // Lake color
        const circleMaterial = new THREE.MeshStandardMaterial({ color: 0xcacaca }); // Road color

        // Apply the materials to the corresponding meshes
        if (landscape) landscape.material = landscapeMaterial;
        if (plane) plane.material = planeMaterial;
        if (circle) circle.material = circleMaterial;

        // Scale and position the terrain
        marsBase.scale.set(0.16, 0.16, 0.16); // Adjust scale as necessary
        marsBase.position.set(0, 0, 0); // Keep terrain centered

        // Enable shadow receiving for the terrain
        marsBase.receiveShadow = true;

        // Add the terrain to the scene
        scene.add(marsBase);
    });
}

// Create the Mars Rover model and set up animations
function createBlueCube() {
    // Load the Mars Rover model
    gltfLoader.load('./Rover/rover.gltf', (gltfScene) => {
        roverModel = gltfScene.scene;

        // Scale down the Mars Rover model to make it smaller
        roverModel.scale.set(0.16, 0.16, 0.16); // Adjust scale as necessary
        roverModel.rotation.y = -Math.PI * 1.6; // Rotate to face the correct direction

        // Enable shadow casting
        roverModel.castShadow = true;

        // Set initial position (keep it fixed)
        roverModel.position.set(0.4, 0.7, 8.3); // Adjust y-position as necessary

        // Add the rover model to the scene
        scene.add(roverModel);

        // Initialize the animation mixer for animations
        mixer = new THREE.AnimationMixer(roverModel);

        // Set up rover animations but do not play them immediately
        if (gltfScene.animations.length > 0) {
            roverAction = mixer.clipAction(gltfScene.animations[0]); // Use the first animation
            roverAction.loop = THREE.LoopRepeat; // Loop the animation
            roverAction.play(); // Start the animation but paused by timeScale
            roverAction.timeScale = 0; // Start the animation paused
        }
    });

    // Enhance lighting with additional lights for the rover
    addRoverLighting();
    
}

// Add additional lighting to highlight the rover
function addRoverLighting() {
    const pointLight = new THREE.PointLight(0x1942ff, 200, 300);
    pointLight.position.set(-5, 2, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);



    const pointLight1 = new THREE.PointLight(0x199dff, 200, 300);
    pointLight1.position.set(5, 4, 6);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const spotLight = new THREE.SpotLight(0x2cc1f9, 100, 50);
    spotLight.position.set(5, 10, 5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true;


    const spotLight1 = new THREE.SpotLight(0x4561e0, 100, 50);
    spotLight1.position.set(5, 2, 5);
    spotLight1.angle = Math.PI / 6;
    spotLight1.penumbra = 0.5;
    spotLight1.decay = 2;
    spotLight1.distance = 20;
    spotLight1.castShadow = true;



    //scene.add(spotLight);
    //scene.add(spotLight1);
    //scene.add(pointLight);
    //scene.add(pointLight1);
}

// Rotate the entire environment around the rover based on mouse movement
function rotateEnvironment() {
    if (marsBase) {
        // Apply inertia to smooth out the rotation after dragging stops
        inertia *= 0.95; // Gradually reduce inertia
        rotationAngle += inertia; // Apply inertia to the rotation angle

        // Apply rotation to the environment (marsBase) around the Y-axis
        marsBase.rotation.y = rotationAngle * 0.1;

        // Calculate the rotation difference between the current and previous rotation
        const rotationDifference = Math.abs(marsBase.rotation.y - previousRotation);

        // Check if the rotation change exceeds the threshold
        if (rotationDifference > rotationThreshold) {
            // If rotation is changing significantly, continue rover animation
            if (roverAction) roverAction.timeScale = 2.2;
        } else {
            // If rotation change is below the threshold, pause the rover animation
            if (roverAction) roverAction.timeScale = 0;
        }

        // Update previous rotation
        previousRotation = marsBase.rotation.y;
    }
}

// Animation loop with delta time for smooth updates
function animate() {
    const deltaTime = clock.getDelta(); // Get the time between frames
    requestAnimationFrame(animate);
    
    // Update the rover's animation mixer
    if (mixer) {
        mixer.update(deltaTime); // Keep the rover animation running
    }
    
    rotateEnvironment(); // Rotate the environment if dragging
    controls.update(); // Update controls for smoother camera movement
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the scene
init();
animate();