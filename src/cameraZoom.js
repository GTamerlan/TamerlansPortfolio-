// cameraZoom.js

export function animateCameraZoom() {
    // Ensure the camera is available from the global THREE context
    if (typeof window.THREE !== 'undefined' && window.THREE) {
        const camera = window.THREE.camera;

        // If the camera exists, perform the zoom animation
        if (camera) {
            const startPosition = { z: camera.position.z }; // Start far away
            const endPosition = { z: 10 }; // Zoom closer to the world

            const zoomDuration = 2000; // Animation duration (2 seconds)

            // Function to interpolate between start and end positions
            const zoomIn = (start, end, duration) => {
                let startTime = null;

                const animateStep = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = timestamp - startTime;
                    const fraction = progress / duration;

                    // Update camera position (interpolating the z-position)
                    camera.position.z = start.z + (end.z - start.z) * Math.min(fraction, 1);

                    if (progress < duration) {
                        requestAnimationFrame(animateStep);
                    }
                };

                requestAnimationFrame(animateStep);
            };

            // Start the zoom-in animation
            zoomIn(startPosition, endPosition, zoomDuration);
        } else {
            console.error("Camera not found in the THREE.js context.");
        }
    } else {
        console.error("THREE.js environment not found.");
    }
}
