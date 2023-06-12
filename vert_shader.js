import shaderFunctions from "./shaderFunctions.js";
var cubeVertexShader = `precision mediump float;
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTextureCoord;

uniform float uLightPower;
uniform vec3 uLightDirection;
uniform lowp int uDampingFunction;
uniform lowp int uShading;
uniform lowp int uLightModel;
uniform float uLightShininess;

uniform sampler2D uSampler;

${shaderFunctions}
void main(void) {
    vec3 normal = normalize(mat3(uModelViewMatrix) * aNormal);
    vec3 position = vec3(uModelViewMatrix * aVertexPosition);
    vec3 lightDirection = normalize(uLightDirection - position);

    int current = 1;
    float light = evaluateLighting(
        uShading, current, uLightModel, normal, aVertexPosition,
        lightDirection, position, uLightPower, uLightShininess);
    light = dampLight(uDampingFunction, light);

    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
    vColor.rgb *= light;
    vPosition = aVertexPosition;
    vNormal = normal;
    vTextureCoord = aTextureCoord;
}`

export default cubeVertexShader;