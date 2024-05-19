uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;

#include "../includes/remap.glsl";

void main() {
    vec3 newPosition = position;

    float explosionProgress = clamp(remap(uProgress, 0.0, 0.1, 0.0, 1.0), 0.0, 1.0);
    explosionProgress = 1.0 - pow(1.0 - explosionProgress, 3.0);
    newPosition = mix(vec3(0.0), newPosition, explosionProgress);

    float fallingProgress = clamp(remap(uProgress, 0.1, 1.0, 0.0, 1.0), 0.0, 1.0);
    fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
    newPosition.y -= fallingProgress * 0.2;

    float sizeProgressStart = remap(uProgress, 0.0, 0.125, 0.0, 1.0);
    float sizeProgressEnd = remap(uProgress, 0.125, 1.0, 1.0, 0.0);
    float sizeProgress = clamp(min(sizeProgressStart, sizeProgressEnd), 0.0, 1.0);

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress;
    gl_PointSize *= 1.0 / -viewPosition.z;
}