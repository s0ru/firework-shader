uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;
attribute float aTimeMultiplier;

#include "../includes/remap.glsl";

void main() {
    float progress = uProgress * aTimeMultiplier;
    vec3 newPosition = position;

    float explosionProgress = clamp(remap(progress, 0.0, 0.1, 0.0, 1.0), 0.0, 1.0);
    explosionProgress = 1.0 - pow(1.0 - explosionProgress, 3.0);
    newPosition = mix(vec3(0.0), newPosition, explosionProgress);

    float fallingProgress = clamp(remap(progress, 0.1, 1.0, 0.0, 1.0), 0.0, 1.0);
    fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
    newPosition.y -= fallingProgress * 0.2;

    float sizeProgressStart = remap(progress, 0.0, 0.125, 0.0, 1.0);
    float sizeProgressEnd = remap(progress, 0.125, 1.0, 1.0, 0.0);
    float sizeProgress = clamp(min(sizeProgressStart, sizeProgressEnd), 0.0, 1.0);

    float twinkleProgress = clamp(remap(progress, 0.2, 0.8, 0.0, 1.0), 0.0, 1.0);
    float sizeTwinkling = 1.0 - (sin(progress * 30.0) * 0.5 + 0.5) * twinkleProgress;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizeTwinkling;
    gl_PointSize *= 1.0 / -viewPosition.z;

    if(gl_PointSize < 1.0) // Prevent windows from displaying static size 1 particles
        gl_Position = vec4(9999.9); // Just move them out of the way untill they're disposed
}