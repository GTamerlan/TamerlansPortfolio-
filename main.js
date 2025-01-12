import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioLoader, AudioListener, PositionalAudio } from 'three';
import { CSM } from 'three/examples/jsm/csm/CSM.js';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper.js';

var clock = new THREE.Clock(); // Create a clock to track delta time
var mixer; // Animation mixer to control animations
const gltfLoader = new GLTFLoader();
let scene, camera, renderer, controls, marsBase, roverModel, roverAction, roverSound;
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(1, 5, 10);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Set pixel ratio for sharper image
    document.body.appendChild(renderer.domElement);

    // OrbitControls for smooth camera movement
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.02; // Increase damping for slower, smoother rotation
    controls.enablePan = false; // Disable panning
    controls.minDistance = 8; // Set minimum zoom distance
    controls.maxDistance = 10.4; // Set maximum zoom distance

    // Allow vertical rotation, but no horizontal rotation
    controls.minAzimuthAngle = 0; // Lock horizontal rotation
    controls.maxAzimuthAngle = 0; // Lock horizontal rotation
    controls.minPolarAngle = Math.PI / 2.36; // Set a minimum vertical angle
    controls.maxPolarAngle = Math.PI / 2.2; // Set a maximum vertical angle
     // Lighting setup
    
    // Create the gradient skybox
    createGradientSkybox();

    // Load the Mars terrain and rover model
    createMarsTerrain();
    createBlueCube();
    addEnvironmentDetails();
    setupLighting();
    // Set default cursor to grab
    document.body.style.cursor = 'grab';

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);

    // Add mouse event listeners for dragging and pressing the mouse button
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Enhanced Lighting Setup
function setupLighting() {
    // Create a group for lights to manage them collectively
    const lightsGroup = new THREE.Group();

    // Directional Light (Sunlight)
    const directionalLight = new THREE.DirectionalLight(0x81d3fc, 2);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;

    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;

    lightsGroup.add(directionalLight);

    // Spot Light (Focused Spotlight)
    const spotLight = new THREE.SpotLight(0x81d3fc, 2);
    spotLight.position.set(-15, 25, 15);
    spotLight.angle = Math.PI / 6; // Narrow beam
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 50;

    lightsGroup.add(spotLight);

    // Add a helper for the spotlight
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    //scene.add(spotLightHelper);

    // Point Light (Emulating a glowing object)
    const pointLight = new THREE.PointLight(0x81d3fc, 1, 50); // Soft orange light
    pointLight.position.set(0, 10, 0);
    pointLight.castShadow = true;

    lightsGroup.add(pointLight);

    // Add a helper for the point light
    const pointLightHelper = new THREE.PointLightHelper(pointLight);
    //scene.add(pointLightHelper);

    // Ambient Light (Soft global illumination)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Soft gray
    lightsGroup.add(ambientLight);

    

  

    // Add the lights group to the scene
    scene.add(lightsGroup);
} 



 
// Setup rover sound using AudioListener and PositionalAudio
function setupAudio() {
    const listener = new AudioListener();
    camera.add(listener); // Attach the listener to the camera

    roverSound = new PositionalAudio(listener);
    const audioLoader = new AudioLoader();

    // Load the audio file (replace the URL with your preferred sound file later)
    /*
    audioLoader.load('./roversound.mp3', (buffer) => {
        roverSound.setBuffer(buffer);
        roverSound.setLoop(true);
        roverSound.setVolume(8); // Lower volume for ambient sound effect
    });
    */
}


let classroomModel, treeModel; // Declare variables to store references to the models

function addEnvironmentDetail(modelPath, scale, position, rotation, modelName) {
    gltfLoader.load(modelPath, (gltfScene) => {
        const model = gltfScene.scene;

        // Set scale, position, and rotation based on input parameters
        model.scale.set(scale.x, scale.y, scale.z);
        model.position.set(position.x, position.y, position.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);

        // Enable shadow casting and receiving
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Check and apply anisotropic filtering for textures
                if (child.material.map) {
                    const texture = child.material.map;
                    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    texture.needsUpdate = true;
                }
            }
        });

        // Store the reference of the model for later rotation
        if (modelName === 'classroom') {
            classroomModel = model;
        } else if (modelName === 'tree') {
            treeModel = model;
        }
        scene.add(model);
        
    });
}

// Now, use this function to load multiple models and track them
function addEnvironmentDetails() {
    // Add a classroom model and track it
    addEnvironmentDetail(
        './low_poly_moon/scene.gltf',            // Path to the GLTF model
        { x: 0.1, y: 0.1, z: 0.1 },           // Scale for the model
        { x: 13, y: 4, z: -6},              // Position in the scene

        { x: 0, y: Math.PI / 2, z: 0},        // Rotation (optional)
        'classroom'                            // Model name for tracking
    );

    // Add a tree model and track it
    addEnvironmentDetail(
        './rotunda_spsace_ship/scene.gltf',            // Path to the GLTF model
        { x: 0.001, y: 0.001, z: 0.001 },           // Scale for the model
        { x: 1, y: 1, z: 6.5 },                // Position in the scene
        { x: 0, y: Math.PI / 4, z: 0 },        // Rotation (optional)
        'tree'                                // Model name for tracking
    );
}


// Create a gradient skybox that resembles a Martian sky
function createGradientSkybox() {
    // Create a gradient background sky
    const skyGeometry = new THREE.SphereGeometry(1000, 64, 64);
    const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x2a1a5e) }, // Deep purple
            bottomColor: { value: new THREE.Color(0x000000) }, // Black
            offset: { value: 400 },
            exponent: { value: 0.6 },
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide,
    });
    const gradientSky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(gradientSky);

    // Add stars using a Points system
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 2000; // X position
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Y position
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // Z position
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add glowing galaxies using SpriteMaterial
    const galaxyCount = 10;
    const galaxies = [];
    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('./textures/glow.png'), // Replace with your galaxy texture
        color: 0xff69b4, // Glowing pink
        transparent: true,
        opacity: 0.6,
    });

    for (let i = 0; i < galaxyCount; i++) {
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(150, 150, 1); // Make the galaxy large
        sprite.position.set(
            (Math.random() - 0.5) * 1500,
            (Math.random() - 0.5) * 1500,
            (Math.random() - 0.5) * 1500
        );
        galaxies.push(sprite);
        scene.add(sprite);
    }

    // Add comets
    const comets = [];
    const cometCount = 5;
    const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500, emissive: 0xff4500 });
    for (let i = 0; i < cometCount; i++) {
        const cometGeometry = new THREE.SphereGeometry(2, 8, 8);
        const comet = new THREE.Mesh(cometGeometry, cometMaterial);
        comet.position.set(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        comets.push({ comet, velocity: new THREE.Vector3(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2) });
        scene.add(comet);
    }

    // Animate stars, galaxies, and comets
    function animateSkybox() {
        // Twinkle stars
        const starPositions = starGeometry.attributes.position.array;
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3 + 1] -= 0.1; // Simulate subtle movement
            if (starPositions[i * 3 + 1] < -1000) starPositions[i * 3 + 1] = 1000;
        }
        starGeometry.attributes.position.needsUpdate = true;

        // Rotate galaxies slightly for dynamic effect
        galaxies.forEach((galaxy) => {
            galaxy.rotation.z += 0.001; // Subtle spinning
        });

        // Move comets
        comets.forEach(({ comet, velocity }) => {
            comet.position.add(velocity);
            if (comet.position.length() > 800) {
                comet.position.set(
                    (Math.random() - 0.5) * 1000,
                    (Math.random() - 0.5) * 1000,
                    (Math.random() - 0.5) * 1000
                );
            }
        });

        requestAnimationFrame(animateSkybox);
    }

    animateSkybox();
}




// Handle mouse down event to start dragging and trigger rover animation
function onMouseDown(event) {
    isMouseDown = true; // Mark the mouse as being held down
    isDragging = true; // Start dragging
    lastMouseX = event.clientX; // Record the initial mouse position

    // Resume the rover animation by setting timeScale to 1 (normal speed)
    if (roverAction) {
        roverAction.timeScale = 2.2; // Resume the animation
        if (!roverSound.isPlaying) {
            roverSound.play(); // Play the sound when the rover starts moving
        }
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

    // Pause the rover animation and stop the sound
    if (roverAction) {
        roverAction.timeScale = 0; // Pause the animation
        if (roverSound.isPlaying) {
            roverSound.stop(); // Stop the sound when the rover stops moving
        }
    }
}

// Create the Mars terrain and environment
function createMarsTerrain() {
    gltfLoader.load('./myterrain/terrain.gltf', (gltfScene) => {
        marsBase = gltfScene.scene;
        

        let landscape = marsBase.getObjectByName('Landscape_2');
        let plane = marsBase.getObjectByName('Plane_1');
        let circle = marsBase.getObjectByName('Circle_1');

        // Create different materials
        const landscapeMaterial = new THREE.MeshStandardMaterial({ color: 0xe39796}); // Terrain color
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xa2a980}); // Lake color
        const circleMaterial = new THREE.MeshStandardMaterial({ color: 0x7b7b7b}); // Road color

        // Apply the materials to the corresponding meshes
        if (landscape) landscape.material = landscapeMaterial;
        if (plane) plane.material = planeMaterial;
        if (circle) circle.material = circleMaterial;
        // Traverse the scene to ensure all meshes are processed
        marsBase.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Allow shadow casting
                child.receiveShadow = true; // Allow shadow receiving

                // Check and apply anisotropic filtering for textures
                if (child.material.map) {
                    const texture = child.material.map;
                    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Maximize texture quality
                    texture.needsUpdate = true;
                }
            }
        });
        if (gltfScene.animations.length > 0) {
            const terrainMixer = new THREE.AnimationMixer(marsBase);

            // Loop through all animations and play them
            gltfScene.animations.forEach((clip) => {
                const action = terrainMixer.clipAction(clip);
                action.loop = THREE.LoopRepeat; // Ensure looping
                action.clampWhenFinished = true; // Prevent flickering after looping
                action.play(); // Play the animation
            });

            // Add terrain mixer update to the animation loop
            animateMixers.push((deltaTime) => {
                terrainMixer.update(deltaTime);
            });
        } else {
            console.warn('No animations found in the terrain GLTF file.');
        }
        // Scale and position the terrain to ensure animation matches geometry
        marsBase.scale.set(0.75, 0.75, 0.75); // Adjust as necessary
        marsBase.position.set(0, 0, 0); // Center the terrain

        // Add the terrain to the scene
        scene.add(marsBase);

        // Process animations, ensuring compatibility with all clips
        
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
        roverModel.add(roverSound); // Attach the sound to the rover
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

    const pointLight3 = new THREE.PointLight(0xfff189, 28, 300);
    pointLight3.position.set(0.4, 3, 8.3);
    pointLight3.castShadow = true;
    scene.add(pointLight3);

    const spotLight = new THREE.SpotLight(0x2cc1f9, 100, 50);
    spotLight.position.set(5, 10, 5);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 2;
    spotLight.castShadow = true;

    scene.add(spotLight);
}

// Rotate the entire environment around the rover based on mouse movement
function rotateEnvironment() {
    if (marsBase) {
        // Apply inertia to smooth out the rotation after dragging stops
        inertia *= 0.92; // Gradually reduce inertia
        rotationAngle += inertia; // Apply inertia to the rotation angle

        // Apply rotation to marsBase around the Y-axis (environment rotation)
        marsBase.rotation.y = rotationAngle * 0.04;

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
    if (treeModel) {
        // Apply inertia to smooth out the rotation after dragging stops
        inertia *= 0.92; // Gradually reduce inertia
        rotationAngle += inertia; // Apply inertia to the rotation angle

        // Apply rotation to marsBase around the Y-axis (environment rotation)
        classroomModel.rotation.y = rotationAngle * 0.04;

        // Calculate the rotation difference between the current and previous rotation
        const rotationDifference = Math.abs(classroomModel.rotation.y - previousRotation);

        // Check if the rotation change exceeds the threshold
        if (rotationDifference > rotationThreshold) {
            // If rotation is changing significantly, continue rover animation
            if (roverAction) roverAction.timeScale = 2.2;
        } else {
            // If rotation change is below the threshold, pause the rover animation
            if (roverAction) roverAction.timeScale = 0;
        }

        // Update previous rotation
        previousRotation = classroomModel.rotation.y;
    }
}



const animateMixers = []; // Store functions to update animation mixers

function animateLights() {
    const time = clock.getElapsedTime();

    // Static variable to ensure the model and light are only added once
    if (!animateLights.modelLoaded) {
        const loader = new GLTFLoader();
        loader.load(
            './low_poly_satellite/scene.gltf', // Replace with your model path
            (gltf) => {
                const customModel = gltf.scene;

                // Scale and position the model
                customModel.scale.set(0.003, 0.003, 0.003);
                customModel.position.set(0, 9, 0);

                // Create a PointLight and attach it to the model
                const pointLight = new THREE.PointLight(0xffccaa, 1.5, 50); // Glowing light effect
                pointLight.castShadow = true;
                pointLight.position.set(0, 0, 0); // Centered on the model

                // Group the model and the light together
                const lightGroup = new THREE.Group();
                lightGroup.add(customModel);
                lightGroup.add(pointLight);

                // Add the group to the scene
                scene.add(lightGroup);

                // Store the group for animation
                animateLights.lightGroup = lightGroup;
            },
            undefined,
            (error) => {
                console.error('Error loading the model:', error);
            }
        );

        // Mark the model as loaded
        animateLights.modelLoaded = true;
    }

    // Animate lights only if the light group exists
    if (animateLights.lightGroup) {
        const lightGroup = animateLights.lightGroup;

        // Animate Point Light with its attached model (orbiting and rotation)
        lightGroup.position.x = Math.sin(time * 0.5) * 13;
        lightGroup.position.z = Math.cos(time * 0.5) * 13;
        lightGroup.rotation.y += 0.01; // Slowly rotate the model
    }

    // Iterate through all lights in the scene and apply animations
    scene.traverse((object) => {
        if (object.isDirectionalLight) {
            // Animate directional light (e.g., day-night cycle)
           object.position.x = Math.sin(time) * 20;
            //object.position.z = Math.cos(time) * 20;
        }

        
    });
}



const rotationTextElement = document.getElementById('rotationText'); // The 2D text div
const rotationLinkButton = document.getElementById('rotationLinkButton'); // The button

// Define rotation ranges, their corresponding text, and link URLs
const rotationTextRanges = [
    { min: 9, max: -15, text: "Robo Code Youth Initiative is an Organization made by and one of my friends to  spread the  of robotics to the worlds younger generation, check out our website!", link: "https://robocodeyouthinitiative.com" },
    { min: -75, max: -125, text: "During my high school years, I work at a chess club named Master Piece chess academy, I teach a variety of chess class levels", link: "https://masterpiecechessacademy.com/" },
    { min: -177, max: -237, text: "During most of my freetime, I spent my time in my garage, which I transformed into a own personal makerspace with the money I made through my job, check out the projects I built there on my maker timeline", link: "https://gtamerlan.com/2/" },
    { min: -280, max: -310, text: "To learn more about me check out my website or feel free to contact at thstudios0708@gmail.com", link: "https://gtamerlan.com/" },
];

// Function to normalize the rotation to the range [-360, 360]
function normalizeRotation(rotationInDegrees) {
    return ((rotationInDegrees % 360) + 360) % 360 - 360;
}

// Function to determine the text and link based on the normalized rotation
function getRotationData(rotationInDegrees) {
    for (const range of rotationTextRanges) {
        if (rotationInDegrees >= range.max && rotationInDegrees <= range.min) {
            return { text: range.text, link: range.link };
        }
    }
    return null; // Return null if no range matches
}

// Update the displayed text and button dynamically
function updateRotationText() {
    if (marsBase) {
        // Convert rotation to degrees and normalize
        let rotationInDegrees = marsBase.rotation.y * (180 / Math.PI);
        rotationInDegrees = normalizeRotation(rotationInDegrees); // Normalize to [-360, 360]

        // Get the text and link for the current rotation
        const rotationData = getRotationData(rotationInDegrees);

        if (rotationData) {
            // Update the displayed text
            rotationTextElement.textContent = rotationData.text;

            // Update the button's link and show it
            rotationLinkButton.style.display = "block";
            rotationLinkButton.onclick = () => window.location.href = rotationData.link;
        } else {
            // Hide the button if no range matches
            rotationTextElement.textContent = "";
            rotationLinkButton.style.display = "none";
        }
    }
}

// Call `updateRotationText` at regular intervals or within a render loop
setInterval(updateRotationText, 100); // Adjust interval as needed




// Modify your animate function to include text updates
function animate() {
    const deltaTime = clock.getDelta(); // Get the time between frames
    requestAnimationFrame(animate);

    // Update the rover's animation mixer
    if (mixer) {
        mixer.update(deltaTime); // Keep the rover animation running
    }

    // Update additional mixers
    animateMixers.forEach((updateMixer) => updateMixer(deltaTime));

    // Update lights
    animateLights();

    // Rotate the environment if dragging
    rotateEnvironment();

    // Update rotation text
    updateRotationText();

    // Update controls for smoother camera movement
    controls.update();

    // Render the scene with the camera
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
