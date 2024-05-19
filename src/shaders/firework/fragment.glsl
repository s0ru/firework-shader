uniform sampler2D uTexture;

varying vec3 vColor;

void main(){
    vec4 textureColor = texture(uTexture, gl_PointCoord);

    gl_FragColor = vec4(vColor, textureColor.r);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}