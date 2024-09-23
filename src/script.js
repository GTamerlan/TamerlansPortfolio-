import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

var clock = new THREE.Clock(); // Create a clock to track delta time
var mixer; // Animation mixer to control animations
const gltfLoader = new GLTFLoader();
let scene, camera, renderer, controls, blueCube;
let clickableObjects = [];
const descriptionElement = document.createElement('div');
descriptionElement.style.position = 'absolute';
descriptionElement.style.bottom = '20px';
descriptionElement.style.left = '50%';
descriptionElement.style.transform = 'translateX(-50%)';
descriptionElement.style.padding = '20px';
descriptionElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
descriptionElement.style.color = 'white';
descriptionElement.style.fontFamily = 'Arial, sans-serif';
descriptionElement.style.display = 'none';
document.body.appendChild(descriptionElement);

var isDragging = false; // Track if the user is dragging the mouse
var angle = Math.PI * -3 / 2;
var lastCameraAngle = 0; // Track the last camera angle
var radius = 8; // Radius for the rover's circular path

// Initialize the scene, camera, renderer, and controls
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(1, 5, 10);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    document.body.appendChild(renderer.domElement);

    // OrbitControls for smooth camera movement
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.enablePan = false; // Disable panning
    controls.minDistance = 8; // Set minimum zoom distance
    controls.maxDistance = 15; // Set maximum zoom distance
    controls.minAzimuthAngle = -Infinity; // No limit on horizontal rotation
    controls.maxAzimuthAngle = Infinity;  // No limit on horizontal rotation
    controls.minPolarAngle = Math.PI / 2.57; // Limit camera tilting upwards
    controls.maxPolarAngle = Math.PI / 2.2; // Limit camera tilting downwards
    controls.screenSpacePanning = false; // No panning
    controls.rotateSpeed = 0.4; // Slow down the spinning speed

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft global light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Dynamic light
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true; // Enable shadows
    scene.add(directionalLight);

    // Add Mars-like terrain
    createMarsTerrain();

    // Add simple shapes as placeholders for projects
    addShapes();

    // Add the rover model instead of the cube
    createBlueCube();

    // Set default cursor to grab
    document.body.style.cursor = 'grab';

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);

    // Mouse interaction for dragging
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Mouse click for object selection
    window.addEventListener('click', onDocumentMouseClick);
}

// Mouse events for drag detection
function onMouseDown() {
    isDragging = true; // Start dragging
    document.body.style.cursor = 'grabbing'; // Change cursor to grabbing hand
}

function onMouseMove(event) {
    if (isDragging) {
        // Handle movement while dragging
        controls.update(); // Optional: Update OrbitControls if necessary
    }
}

function onMouseUp() {
    isDragging = false; // Stop dragging
    document.body.style.cursor = 'grab'; // Change cursor back to grab hand
}

// Add Mars-like terrain
function createMarsTerrain() {
    const geometry0 = new THREE.CylinderGeometry(5, 5, 0.5, 64); // 64 segments for smoother circular terrain
    const material0 = new THREE.MeshPhongMaterial({ color: 0xff4500 }); // Red Mars color
    const mesh0 = new THREE.Mesh(geometry0, material0);

    mesh0.position.set(0, 0, 0);
    mesh0.scale.set(1.86, 0.07, 2); // Adjust scale for flat terrain
    mesh0.rotation.set(0, 0, 0);
    mesh0.receiveShadow = true; // Receive shadows from objects

    scene.add(mesh0);
}

// Add simple geometric shapes (cubes, spheres, etc.)
function addShapes() {
    const geometryCube = new THREE.BoxGeometry(3, 3, 3);
    const materialCube = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometryCube, materialCube);
    cube.position.set(-5, 1.5, 0);
    cube.castShadow = true;
    clickableObjects.push(cube);
    scene.add(cube);

    const geometrySphere = new THREE.SphereGeometry(2, 32, 32);
    const materialSphere = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const sphere = new THREE.Mesh(geometrySphere, materialSphere);
    sphere.position.set(5, 2, 0);
    sphere.castShadow = true;
    clickableObjects.push(sphere);
    scene.add(sphere);

    const geometryCylinder = new THREE.CylinderGeometry(1.5, 1.5, 4, 32);
    const materialCylinder = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const cylinder = new THREE.Mesh(geometryCylinder, materialCylinder);
    cylinder.position.set(0, 2, -5);
    cylinder.castShadow = true;
    clickableObjects.push(cylinder);
    scene.add(cylinder);
}

// Create the Mars Rover model
function createBlueCube() {
    // Load the Mars Rover model
    gltfLoader.load('./nasa_rover/scene.gltf', (gltfScene) => {
        var roverModel = gltfScene.scene;

        // Scale down the Mars Rover model to make it smaller
        roverModel.scale.set(0.0025, 0.0025, 0.0025); // Adjust scale as necessary

        // Enable shadow casting
        roverModel.castShadow = true;

        // Set initial position (similar to how the cube was positioned)
        roverModel.position.set(0, 0.74, 0); // Adjust y-position as necessary

        // Add the rover model to the clickable objects if needed
        clickableObjects.push(roverModel);

        // Add the rover model to the scene
        scene.add(roverModel);

        // Save it as a global variable for further use in the update function
        blueCube = roverModel;

        // Initialize the animation mixer
        mixer = new THREE.AnimationMixer(roverModel);

        // Play animations if any are provided in the gltf file
        if (gltfScene.animations && gltfScene.animations.length) {
            gltfScene.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                // Trim the last bit of the animation clip
                action.loop = THREE.LoopRepeat;
                action.clampWhenFinished = true; // Prevents unwanted last frame
                action.play();
            });
        }
    });

    // Enhance lighting with additional lights for the rover
    addRoverLighting();
}

// Update the rover model based on camera movement and make it face one side (like the moon)
function updateBlueCube(deltaTime) {
    if (isDragging) { // Only animate if the mouse is being dragged
        var currentCameraAngle = controls.getAzimuthalAngle(); // Get the camera's current horizontal rotation angle

        // Calculate how much the camera has moved and reverse the direction
        var angleDelta = lastCameraAngle - currentCameraAngle; // Flip-flop the direction

        // Update rover model's angle by the same amount as the camera's horizontal movement
        angle += angleDelta;

        // Set the rover model's position based on the new angle
        var xPos = radius * Math.cos(angle);
        var zPos = radius * Math.sin(angle);
        if (blueCube) {
            blueCube.position.set(xPos, 0.74, zPos); // Adjust y-position as necessary

            // Lock rotation to always face the camera (like the moon facing Earth)
            blueCube.lookAt(camera.position.x, blueCube.position.y, camera.position.z);
        }

        // Update the animation mixer if it's active
        if (mixer) {
            mixer.update(deltaTime); // Animate only while dragging
        }

        // Update the last camera angle
        lastCameraAngle = currentCameraAngle;
    }
}

// Add additional lighting to highlight the rover
function addRoverLighting() {
    // Add a point light above the rover for a spotlight effect
    const pointLight = new THREE.PointLight(0xb380f0, 200, 300); // White light, intensity 1.5
    pointLight.position.set(0, 10, 0); // Place the light above the rover
    pointLight.castShadow = true; // Enable shadows for more realism

    // Add the light to the scene
    scene.add(pointLight);

    // Add a spotlight for more focused lighting
    const spotLight = new THREE.SpotLight(0x2cc1f9, 1000,50); // Warm light
    const spotLight1 = new THREE.SpotLight(0x38f92c, 1000, 90); // Warm light
    spotLight.position.set(5, 10, 5); // Position the spotlight
    spotLight.angle = Math.PI / 6; // Control the spotlight spread
    spotLight.penumbra = 0.5; // Soft edges on the spotlight
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true; // Enable shadows

    // Add the spotlight to the scene
    scene.add(spotLight);
  
}

// Animation loop with delta time for smooth updates
function animate1() {
    const deltaTime = clock.getDelta(); // Get the time between frames

    requestAnimationFrame(animate1);

    controls.update();
    updateBlueCube(deltaTime); // Pass deltaTime to the update function
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse click interactions
function onDocumentMouseClick(event) {
    event.preventDefault();

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        showProjectDetails(selectedObject); // Display project details on click
    }
}

// Show project details based on the selected object
function showProjectDetails(selectedObject) {
    let projectName = "Unknown Project";
    if (selectedObject.geometry instanceof THREE.BoxGeometry) {
        projectName = "Project Cube";
    } else if (selectedObject.geometry instanceof THREE.SphereGeometry) {
        projectName = "Project Sphere";
    } else if (selectedObject.geometry instanceof THREE.CylinderGeometry) {
        projectName = "Project Cylinder";
    }
    descriptionElement.innerHTML = `<h2>${projectName}</h2><p>Description of the project goes here.</p>`;
    descriptionElement.style.display = 'block';
}

// Initialize the scene
init();
animate1();
