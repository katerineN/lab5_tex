import { Cube } from './cube.js';
import cubeFragmentShader from "./frag_shader.js";
import cubeVertexShader from "./vert_shader.js";
import texture1 from "./textures/1.png"
import texture2 from "./textures/2.png"
import texture3 from "./textures/3.png"

let textures = [];

const sceneState = {
    lightPower: NaN,
    dampingFunction: NaN,
    lightDirection: NaN,
    shading: NaN,
    lightModel: NaN,

    lightAmbient: NaN,
    lightDiffuse: NaN,
    lightSpecular: NaN,

    lightShininess: NaN,
}
function update() {
    sceneState.lightPower = parseFloat(document.querySelector('#lightPower').value);
    sceneState.dampingFunction = parseInt(document.querySelector('.dampingFunction').value)
    sceneState.lightDirection = [0, 0, 0];
    sceneState.lightShininess = 16

    sceneState.shading = parseInt(document.querySelector('.shading').value)
    sceneState.lightModel = parseInt(document.querySelector('.lightModel').value)
}

//Повороты
const ROTATION_SPEED = 0.03;
let curRotations = [0.0, 0.0, 0.0];
let currentSpeed = 0, currentMode = 0;

window.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft')
        currentSpeed = -ROTATION_SPEED;
    else if (event.key === 'ArrowRight')
        currentSpeed = ROTATION_SPEED;
});

window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft')
        currentSpeed = 0;
    else if (event.key === 'ArrowRight')
        currentSpeed = 0;
});

document.querySelector('#lightPower').addEventListener('change', update);
document.querySelector('.dampingFunction').addEventListener('change', update);
document.querySelector('.shading').addEventListener('change', update);
document.querySelector('.lightModel').addEventListener('change', update);

const rotateEachCube = (obj, Matrix, rad) => obj.rotate(Matrix, rad, [0, 1, 0]);
//Сцена
class Scene {
    constructor(webgl_context, vertex_shader, fragment_shader, store, textures) {
        this.gl = webgl_context;
        this.textures = textures;
        this.state = store;
        const shaderProgram = this.initShadersProgram(vertex_shader, fragment_shader);
        this.setupTextures(texture1);
        //this.setupTextures(texture1);
        //this.setupTextures(texture2);
        //this.setupTextures(texture3);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
                normal: this.gl.getAttribLocation(shaderProgram, 'aNormal'),
                textureCoord: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                lightPower: this.gl.getUniformLocation(shaderProgram, 'uLightPower'),
                lightDirection: this.gl.getUniformLocation(shaderProgram, 'ulightDirection'),
                lightAmbient: this.gl.getUniformLocation(shaderProgram, 'uLightAmbient'),
                lightDiffuse: this.gl.getUniformLocation(shaderProgram, 'uLightDiffuse'),
                lightSpecular: this.gl.getUniformLocation(shaderProgram, 'uLightSpecular'),
                dampingFunction: this.gl.getUniformLocation(shaderProgram, 'uDampingFunction'),

                viewPosition: this.gl.getUniformLocation(shaderProgram, 'uViewPosition'),
                lightModel: this.gl.getUniformLocation(shaderProgram, 'uLightModel'),
                shading: this.gl.getUniformLocation(shaderProgram, 'uShading'),

                lightShininess: this.gl.getUniformLocation(shaderProgram, 'uLightShininess'),
                uSampler: this.gl.getUniformLocation(shaderProgram, 'uSampler'),
            }
        }
        this.objects = [
            new Cube(this.gl, 0.8, [221/255, 1, 0, 1], [0, -0.2, -10]),
            new Cube(this.gl, 0.8, [221/255, 1, 0, 1], [0, 1.4, -10]),
            new Cube(this.gl, 0.9, [192/255, 192/255, 192/255, 1], [-1.7, -0.1, -10]),
            new Cube(this.gl, 0.8, [166/255, 124/255, 0, 1], [1.58, -0.2, -10]),
        ];
        this.fieldOfView = 45 * Math.PI / 180;
        this.aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 100.0;
    }

    start() {
        const render = () => {
            this.drawScene();
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    handleTextureLoaded(image, texture) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
    }


    setupTextures(path) {
        // Создайте текстуру
        const texture = this.gl.createTexture();

        // Загрузите изображение текстуры
        const image = new Image();
        image.onload = () => {
            // При успешной загрузке изображения обработайте текстуру
            this.handleTextureLoaded(image, texture);
        };
        image.src = path; // Подставьте путь к вашей текстуре

        // Добавьте текстуру в массив текстур
        this.textures.push(texture);
    }


    drawScene() {
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);
        this.objects.forEach(obj => {
            var modelViewMatrix = mat4.create();
            obj.toPosition(modelViewMatrix);
            rotateEachCube(obj, modelViewMatrix, curRotations[0]);

            obj.setVertexes(this.programInfo);

            const buffers = obj.getBuffers();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            this.gl.useProgram(this.programInfo.program);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

            this.gl.uniform1f(this.programInfo.uniformLocations.lightPower, this.state.lightPower);
            this.gl.uniform3fv(this.programInfo.uniformLocations.lightDirection, this.state.lightDirection);
            this.gl.uniform1i(this.programInfo.uniformLocations.dampingFunction, this.state.dampingFunction);
            this.gl.uniform3fv(this.programInfo.uniformLocations.viewPosition, [0, 0, 10]);
            this.gl.uniform1i(this.programInfo.uniformLocations.lightModel, this.state.lightModel);
            this.gl.uniform1i(this.programInfo.uniformLocations.shading, this.state.shading);
            this.gl.uniform1f(this.programInfo.uniformLocations.lightShininess, this.state.lightShininess);

            //this.gl.activeTexture(this.gl.TEXTURE0);

            // this.textures.forEach((texture, index) => {
            //     this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            //     this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
            //     const buffers = obj.getBuffers();
            //     this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            //
            //     this.gl.drawElements(this.gl.TRIANGLES, buffers.raw_indices.length, this.gl.UNSIGNED_SHORT, 0);
            // });
            this.gl.activeTexture(this.gl.TEXTURE0);

            this.textures.forEach((texture, index) => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, index);

                const buffers = obj.getBuffers();
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

                this.gl.drawElements(this.gl.TRIANGLES, buffers.raw_indices.length, this.gl.UNSIGNED_SHORT, 0);
            });
            //this.gl.drawElements(this.gl.TRIANGLES, buffers.raw_indices.length, this.gl.UNSIGNED_SHORT, 0);
        });
        curRotations[currentMode] += currentSpeed;
    }

    initShadersProgram(vertexShaderCode, fragmentShaderCode) {
        const vertexShader = this.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderCode);
        const fragmentShader = this.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderCode);
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }
    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}

function main() {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }
    new Scene(gl, cubeVertexShader, cubeFragmentShader, sceneState, textures).start();
}

update();
main();