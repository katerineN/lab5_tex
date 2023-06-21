import shaderFunctions from "./shaderFunctions.js";

var cubeFragmentShader = `precision mediump float;

varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTextureCoord;
varying vec2 vIceTextureCoord;

uniform mat4 uModelViewMatrix;
uniform float uLightPower;
uniform vec3 uLightDirection;
uniform lowp int uDampingFunction;
uniform lowp int uShading;
uniform lowp int uLightModel;
uniform float uLightShininess;
uniform int uTextureSelect;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;

${shaderFunctions}
void main(void) {
    vec3 positionEye3 = vec3(uModelViewMatrix * vPosition);
    vec3 lightDirection = normalize(uLightDirection - positionEye3);

    int current = 0;

    float light = evaluateLighting(
        uShading, current, uLightModel, vNormal, vPosition,
        lightDirection, positionEye3, uLightPower, uLightShininess);
    light = dampLight(uDampingFunction, light);
    
    vec4 fragColor;
    if (uTextureSelect == 0) {
        fragColor = texture2D(uSampler, vTextureCoord) * vColor;
    } else if (uTextureSelect == 1) {
        fragColor = texture2D(uSampler, vTextureCoord);
    } else if (uTextureSelect == 2) {
        vec4 textureColor = texture2D(uSampler, vTextureCoord);
        vec4 iceTextureColor = texture2D(uSampler2, vIceTextureCoord);
        fragColor = textureColor * vColor * iceTextureColor;
    }
    
    gl_FragColor = vColor * fragColor;
    gl_FragColor.rgb *= light;
    
    // vec4 textureColor = texture2D(uSampler, vTextureCoord);
    // vec4 iceTextureColor = texture2D(uSampler2, vIceTextureCoord);
    //
    // vec4 vertexColor = vec4(1.0, 1.0, 1.0, 1.0); 
    // if (vTextureCoord.x >= 0.0 && vTextureCoord.y >= 0.0) {
    //     vertexColor = textureColor; 
    // }
    // vec4 finalColor = vertexColor; 
    // if (vIceTextureCoord.x >= 0.0 && vIceTextureCoord.y >= 0.0) {
    //     finalColor = vec4(iceTextureColor.rgb * finalColor.rgb, iceTextureColor.a * finalColor.a * 1.0); 
    // }
    
    //gl_FragColor = vColor * finalColor; 
    //gl_FragColor = vColor * textureColor;
    //gl_FragColor.rgb *= light;
    
}`

export default cubeFragmentShader;