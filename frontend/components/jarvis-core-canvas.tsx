"use client";

import { Line, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import type { Group, ShaderMaterial } from "three";
import { AdditiveBlending, Color, MathUtils, Vector2 } from "three";

type JarvisCoreCanvasProps = {
  energy: number;
  audioLevel: number;
  listening: boolean;
};

export function JarvisCoreCanvas({ energy, audioLevel, listening }: JarvisCoreCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.7], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#071019", 4.4, 9.5]} />
      <ambientLight intensity={0.65} />
      <ReactiveLights energy={energy} listening={listening} />
      <pointLight position={[0, 0, 2.8]} intensity={7.4} color="#56fff1" />
      <pointLight position={[0, 0, -4]} intensity={8} color="#ffffff" />
      <CoreForm energy={energy} audioLevel={audioLevel} />
      <Sparkles count={20} scale={[7.2, 7.2, 7.2]} size={2.4} speed={0.02} noise={0.08} color="#56fff1" />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.24} luminanceSmoothing={0.28} intensity={0.34} />
        <ChromaticAberration offset={new Vector2(0.00006, 0.00008)} />
        <Noise opacity={0} premultiply />
        <Vignette eskil={false} offset={0.12} darkness={0.88} />
      </EffectComposer>
    </Canvas>
  );
}

function ReactiveLights({ energy, listening }: { energy: number; listening: boolean }) {
  return (
    <>
      <pointLight position={[3.4, 2.2, 4.6]} intensity={15.6 + energy * 0.4} color="#56fff1" />
      <pointLight position={[-3.2, -2.6, 3.6]} intensity={8.6 + (listening ? 0.18 : 0)} color="#8cbfff" />
    </>
  );
}

function CoreForm({ energy, audioLevel }: { energy: number; audioLevel: number }) {
  const shellRef = useRef<Group>(null);
  const cageRef = useRef<Group>(null);
  const neuralRef = useRef<Group>(null);
  const plasmaRef = useRef<ShaderMaterial>(null);
  const auraRef = useRef<ShaderMaterial>(null);
  const chamberRef = useRef<ShaderMaterial>(null);
  const pulseRef = useRef<Group>(null);

  const plasmaUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: energy },
      uAudio: { value: audioLevel },
      uColorA: { value: new Color("#56fff1") },
      uColorB: { value: new Color("#8cbfff") },
    }),
    [audioLevel, energy],
  );

  const auraUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: energy },
      uAudio: { value: audioLevel },
      uColor: { value: new Color("#56fff1") },
    }),
    [audioLevel, energy],
  );

  const chamberUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: energy },
      uAudio: { value: audioLevel },
      uColorA: { value: new Color("#56fff1") },
      uColorB: { value: new Color("#103349") },
    }),
    [audioLevel, energy],
  );

  useFrame((state, delta) => {
    const targetEnergy = MathUtils.clamp(energy, 0, 1);
    const targetAudio = MathUtils.clamp(audioLevel, 0, 1);

    if (shellRef.current) {
      shellRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.24) * 0.03;
      shellRef.current.rotation.x += delta * (0.03 + targetEnergy * 0.025);
      shellRef.current.rotation.y += delta * (0.08 + targetEnergy * 0.1);
    }

    if (cageRef.current) {
      cageRef.current.rotation.x -= delta * (0.025 + targetEnergy * 0.015);
      cageRef.current.rotation.y -= delta * (0.05 + targetAudio * 0.035);
      cageRef.current.rotation.z += delta * (0.018 + targetEnergy * 0.02);
    }

    if (neuralRef.current) {
      neuralRef.current.rotation.y += delta * (0.03 + targetEnergy * 0.03);
      neuralRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
    }

    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(1.086 + targetEnergy * 0.01);
    }

    if (plasmaRef.current) {
      plasmaRef.current.uniforms.uTime.value += delta * 0.14;
      plasmaRef.current.uniforms.uEnergy.value = MathUtils.damp(plasmaRef.current.uniforms.uEnergy.value, targetEnergy, 4, delta);
      plasmaRef.current.uniforms.uAudio.value = MathUtils.damp(plasmaRef.current.uniforms.uAudio.value, targetAudio, 5.5, delta);
    }

    if (auraRef.current) {
      auraRef.current.uniforms.uTime.value += delta * 0.1;
      auraRef.current.uniforms.uEnergy.value = MathUtils.damp(auraRef.current.uniforms.uEnergy.value, targetEnergy, 3.5, delta);
      auraRef.current.uniforms.uAudio.value = MathUtils.damp(auraRef.current.uniforms.uAudio.value, targetAudio, 5.5, delta);
    }

    if (chamberRef.current) {
      chamberRef.current.uniforms.uTime.value += delta * 0.08;
      chamberRef.current.uniforms.uEnergy.value = MathUtils.damp(chamberRef.current.uniforms.uEnergy.value, targetEnergy, 3, delta);
      chamberRef.current.uniforms.uAudio.value = MathUtils.damp(chamberRef.current.uniforms.uAudio.value, targetAudio, 5, delta);
    }
  });

  return (
    <group>
      <mesh position={[0, 0, -1.6]} scale={[4.8, 4.8, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <shaderMaterial
          ref={chamberRef}
          uniforms={chamberUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          vertexShader={PLASMA_VERTEX_SHADER}
          fragmentShader={CHAMBER_FRAGMENT_SHADER}
        />
      </mesh>

      <group ref={shellRef}>
        <mesh scale={1.56}>
          <icosahedronGeometry args={[1.26, 16]} />
          <shaderMaterial
            ref={plasmaRef}
            uniforms={plasmaUniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            vertexShader={PLASMA_VERTEX_SHADER}
            fragmentShader={PLASMA_FRAGMENT_SHADER}
          />
        </mesh>

        <mesh scale={1.34}>
          <octahedronGeometry args={[1.2, 0]} />
          <MeshTransmissionMaterial
            color="#56fff1"
            thickness={0.65}
            roughness={0.08}
            transmission={0.98}
            ior={1.22}
            chromaticAberration={0.12}
            anisotropicBlur={0.18}
            distortion={0.18}
            distortionScale={0.32}
            temporalDistortion={0.18}
            emissive="#56fff1"
            emissiveIntensity={0.24 + energy * 0.28}
          />
        </mesh>

        <mesh scale={1.92}>
          <icosahedronGeometry args={[1.14, 1]} />
          <meshBasicMaterial color="#8cbfff" wireframe transparent opacity={0.24 + energy * 0.14} />
        </mesh>

        <mesh scale={0.72}>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial color="#dcffff" emissive="#bffff9" emissiveIntensity={0.95 + energy * 0.9} metalness={0.12} roughness={0.18} />
        </mesh>

        <group ref={pulseRef}>
          <mesh scale={2.02}>
            <icosahedronGeometry args={[1.16, 10]} />
            <shaderMaterial
              ref={auraRef}
              uniforms={auraUniforms}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              vertexShader={PLASMA_VERTEX_SHADER}
              fragmentShader={AURA_FRAGMENT_SHADER}
            />
          </mesh>
        </group>
      </group>

      <group ref={cageRef}>
        <Line points={[[0, 2.2, 0], [2.08, 0, 0], [0, -2.2, 0], [-2.08, 0, 0], [0, 2.2, 0]]} color="#56fff1" lineWidth={2.2 + energy * 1.2} transparent opacity={0.66 + energy * 0.18} />
        <Line points={[[0, 0, 2.16], [1.62, 0, 0], [0, 0, -2.16], [-1.62, 0, 0], [0, 0, 2.16]]} color="#8cbfff" lineWidth={1.8 + audioLevel * 1.2} transparent opacity={0.5 + energy * 0.18} />
        <Line points={[[0, 1.74, 1.28], [1.12, 0, 1.82], [0, -1.74, 1.28], [-1.12, 0, 1.82], [0, 1.74, 1.28]]} color="#ffffff" lineWidth={1.15 + energy * 0.55} transparent opacity={0.26 + audioLevel * 0.22} />
      </group>

      <group ref={neuralRef}>
        <Line points={[[-2.2, 0.2, -0.2], [-1.35, 0.65, 0], [-0.55, 1.15, 0.2]]} color="#56fff1" lineWidth={1.15 + energy * 0.75} transparent opacity={0.48 + audioLevel * 0.22} />
        <Line points={[[2.25, -0.15, 0], [1.35, -0.72, 0.15], [0.55, -1.12, -0.2]]} color="#56fff1" lineWidth={1.1 + audioLevel * 0.65} transparent opacity={0.44 + energy * 0.18} />
        <Line points={[[0.2, 2.25, 0], [0.55, 1.25, 0.2], [1.05, 0.48, 0.45]]} color="#8cbfff" lineWidth={0.95 + energy * 0.45} transparent opacity={0.38 + audioLevel * 0.2} />
      </group>
    </group>
  );
}

const PLASMA_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLASMA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAudio;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float waveA = sin(vPosition.y * 1.3 + uTime * 0.12);
    float waveB = sin((vPosition.x + vPosition.z) * 1.8 - uTime * 0.1);
    float turbulence = waveA * waveB;
    float fresnel = pow(1.0 - abs(vNormal.z), 2.6);
    float plasma = smoothstep(-0.45, 0.7, turbulence + fresnel * (0.8 + uEnergy));
    vec3 color = mix(uColorB, uColorA, plasma);
    color += vec3(0.16, 0.24, 0.36) * fresnel * (0.8 + uAudio * 1.6);
    float alpha = plasma * 0.24 + fresnel * (0.32 + uEnergy * 0.34);
    gl_FragColor = vec4(color, alpha);
  }
`;

const AURA_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAudio;
  uniform vec3 uColor;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float fresnel = pow(1.0 - abs(vNormal.z), 3.4);
    float ring = sin(length(vPosition.xy) * 2.8 - uTime * 0.12);
    float pulse = smoothstep(-0.2, 0.9, ring) * (0.2 + uEnergy * 0.8);
    vec3 color = uColor * (0.5 + pulse + fresnel * (0.6 + uAudio));
    float alpha = fresnel * 0.16 + pulse * 0.22;
    gl_FragColor = vec4(color, alpha);
  }
`;

const CHAMBER_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform float uAudio;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vPosition;

  void main() {
    vec2 uv = vPosition.xy * 0.5 + 0.5;
    float dist = distance(uv, vec2(0.5));
    float ring = sin(dist * 5.6 - uTime * 0.08);
    float glow = smoothstep(0.92, 0.1, dist);
    float pulse = smoothstep(-0.2, 0.8, ring) * (0.16 + uEnergy * 0.55);
    vec3 color = mix(uColorB, uColorA, glow * (0.55 + uEnergy * 0.35));
    color += uColorA * pulse;
    float alpha = glow * (0.28 + uEnergy * 0.24) + pulse * 0.32;
    gl_FragColor = vec4(color, alpha);
  }
`;