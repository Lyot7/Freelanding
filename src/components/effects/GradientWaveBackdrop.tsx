"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Fragment shader copié sans modification fonctionnelle depuis
 * `GradientWave.DnJK5ijj.mjs` dans le miroir Framer. Seules les déclarations
 * WebGL (`uniform`, entrée UV et sortie) sont ajoutées par ce composant.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_waveSpeed;
uniform float u_waveFreqX;
uniform float u_waveFreqY;
uniform float u_waveAngle;
uniform float u_waveAmplitude;
uniform float u_maskSoftness;
uniform float u_blendAmount;
uniform vec4 u_colors[4];
uniform int u_colors_length;

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
    float s = u_seed;
    vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
    vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
    p = vec2(dot(p, k1), dot(p, k2));
    return fract(sin(p) * (43758.5453 + s * 1.618));
}

float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float n = mix(
        mix(dot(-1.0 + 2.0 * hash(i), f),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
    return 0.5 + 0.5 * n;
}

vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

float seedF(float base) {
    return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
}

vec2 warpUV(vec2 uv) {
    float t = u_time * u_waveSpeed;

    float angleOffset = sin(u_seed * 2.73) * 30.0;
    mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
    vec2 ruv = dirRot * uv;

    float fxMod = seedF(u_waveFreqX);
    float fyMod = seedF(u_waveFreqY);

    float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
    float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;

    float harmonic = sin(u_seed * 1.23) * 0.5;
    float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - t + phaseX);
    a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + t * 0.7 + phaseY);

    a = smoothstep(
        cos(a) * u_maskSoftness,
        sin(a) * u_maskSoftness + 3.,
        cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
    );

    a *= u_waveAmplitude;

    uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
    return uv;
}

void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 uv = fragCoord / u_resolution.xy;
    float ratio = u_resolution.x / u_resolution.y;
    float t = u_time * u_waveSpeed;

    vec2 tuv = uv - 0.5;

    vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
    float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
    tuv.y *= ratio;

    vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
    float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
    uv2 *= Rot(preRotAngle);
    vec2 warped = warpUV(uv2) * 0.5 + 0.5;

    vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);

    float layerRot1 = -5.0 + sin(u_seed * 1.83) * 20.0;
    float layerRot2 = 10.0 + cos(u_seed * 2.47) * 20.0;

    vec3 c0 = getColor(0);
    vec3 c1 = getColor(1);
    vec3 c2 = getColor(2);
    vec3 c3 = getColor(3);

    vec3 layer1 = mix(c0, c2, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot1))).x));
    vec3 layer2 = mix(c3, c1, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot2))).x));
    vec3 col = mix(layer1, layer2, S(0.3, -0.3, blendUV.y));

    col = mix(col, col * col + 0.5 * sqrt(col), 0.3);

    fragColor = vec4(col, 1.0);
}`;

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

/* Le shader ci-dessus a été RÉÉCRIT à partir du rendu observé du composant
   `GradientWave` du template ; rien de son code n'est chargé ni recopié ici.
   Le chemin du module d'origine était jusqu'ici recopié dans un attribut
   `data-source-module` posé sur le canevas : une note de traçabilité utile
   pendant la reconstruction, mais qui publiait une adresse du template dans le
   balisage servi au visiteur, et qui pointe sur du vide depuis que le miroir a
   quitté `public/`. Elle vit désormais ici, dans le code, à sa place. */

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create GradientWave shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function requiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`GradientWave uniform missing: ${name}`);
  return location;
}

export function GradientWaveBackdrop({
  seed,
  className = "",
}: {
  seed: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion() === true;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.dataset.gradientWaveStatus = "initializing";

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
    });
    if (!gl) {
      canvas.dataset.gradientWaveStatus = "fallback-no-webgl2";
      console.error("GradientWave requires WebGL 2; the static dark fallback is active.");
      return;
    }

    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let animationFrame = 0;
    let inViewport = true;
    const startedAt = performance.now();

    try {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error("Unable to create GradientWave program.");

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
          gl.getProgramInfoLog(program) ?? "Unknown GradientWave link error.",
        );
      }
      gl.useProgram(program);

      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to create GradientWave geometry.");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1, 1, -1, -1, 1,
          -1, 1, 1, -1, 1, 1,
        ]),
        gl.STATIC_DRAW,
      );

      const position = gl.getAttribLocation(program, "a_position");
      if (position < 0) throw new Error("GradientWave position attribute missing.");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const resolution = requiredUniform(gl, program, "u_resolution");
      const time = requiredUniform(gl, program, "u_time");
      gl.uniform1f(requiredUniform(gl, program, "u_seed"), seed);
      gl.uniform1f(requiredUniform(gl, program, "u_waveSpeed"), 0.63);
      gl.uniform1f(requiredUniform(gl, program, "u_waveFreqX"), 0.9);
      gl.uniform1f(requiredUniform(gl, program, "u_waveFreqY"), 6);
      gl.uniform1f(requiredUniform(gl, program, "u_waveAngle"), 105);
      gl.uniform1f(requiredUniform(gl, program, "u_waveAmplitude"), 2.1);
      gl.uniform1f(requiredUniform(gl, program, "u_maskSoftness"), 0.74);
      gl.uniform1f(requiredUniform(gl, program, "u_blendAmount"), 0.54);
      gl.uniform1i(requiredUniform(gl, program, "u_colors_length"), 3);
      gl.uniform4fv(
        requiredUniform(gl, program, "u_colors[0]"),
        new Float32Array([
          8 / 255, 8 / 255, 8 / 255, 1,
          18 / 255, 18 / 255, 18 / 255, 1,
          5 / 255, 5 / 255, 5 / 255, 1,
          5 / 255, 5 / 255, 5 / 255, 1,
        ]),
      );

      const draw = (elapsedSeconds: number) => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * pixelRatio));
        const height = Math.max(1, Math.round(rect.height * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
        gl.uniform2f(resolution, width, height);
        gl.uniform1f(time, elapsedSeconds);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      const stop = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      };
      const tick = (now: number) => {
        animationFrame = 0;
        if (
          reducedMotion ||
          !inViewport ||
          document.visibilityState !== "visible"
        ) {
          return;
        }
        draw((now - startedAt) / 1000);
        animationFrame = requestAnimationFrame(tick);
      };
      const start = () => {
        if (!reducedMotion && inViewport && !animationFrame) {
          animationFrame = requestAnimationFrame(tick);
        }
      };

      draw(0);
      resizeObserver = new ResizeObserver(() => {
        draw(reducedMotion ? 0 : (performance.now() - startedAt) / 1000);
      });
      resizeObserver.observe(canvas);

      intersectionObserver = new IntersectionObserver(([entry]) => {
        inViewport = entry?.isIntersecting ?? true;
        if (inViewport) start();
        else stop();
      });
      intersectionObserver.observe(canvas);

      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") start();
        else stop();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      canvas.dataset.gradientWaveStatus = reducedMotion
        ? "ready-reduced-motion"
        : "ready";
      start();

      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        stop();
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
      };
    } catch (error: unknown) {
      canvas.dataset.gradientWaveStatus = "fallback-error";
      console.error("GradientWave failed; the static dark fallback is active.", error);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    }
  }, [reducedMotion, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
