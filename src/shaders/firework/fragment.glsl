uniform sampler2D uTexture;

void main(){
    vec4 textureColor = texture(uTexture, gl_PointCoord);

    gl_FragColor = vec4(1.0, 1.0, 1.0, textureColor.r);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}