import shaderFunctions from "./shaderFunctions.js";

var cubeFragmentShader = `precision mediump float;

varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTextureCoord;

uniform mat4 uModelViewMatrix;
uniform float uLightPower;
uniform vec3 uLightDirection;
uniform lowp int uDampingFunction;
uniform lowp int uShading;
uniform lowp int uLightModel;
uniform float uLightShininess;

uniform sampler2D uSampler;

${shaderFunctions}
void main(void) {
    vec3 positionEye3 = vec3(uModelViewMatrix * vPosition);
    vec3 lightDirection = normalize(uLightDirection - positionEye3);

    int current = 0;

    float light = evaluateLighting(
        uShading, current, uLightModel, vNormal, vPosition,
        lightDirection, positionEye3, uLightPower, uLightShininess);
    light = dampLight(uDampingFunction, light);
    
    vec4 textureColor = texture2D(uSampler, vTextureCoord);

    vec4 vertexColor = vec4(1.0, 1.0, 1.0, 1.0); // Задайте цвет вершины по умолчанию
    if (vTextureCoord.x >= 0.0 && vTextureCoord.y >= 0.0) {
        vertexColor = textureColor; // Получите цвет из текстуры
    }
    gl_FragColor = vColor * vertexColor; // Умножьте цвет вершины на цвет из текстуры


    //gl_FragColor = vColor * textureColor;
    gl_FragColor.rgb *= light;
    
}`

export default cubeFragmentShader;