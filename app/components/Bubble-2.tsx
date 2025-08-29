// components/Bubble.tsx
"use client";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { useRef } from "react";

// GLSL shader with fresnel + glow + distortion
const WaveMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color("#6a5acd"), // purple-blue
    uColor2: new THREE.Color("#00ffff"), // cyan
    uGlowColor: new THREE.Color("#ffffff"),
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform float uTime;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;

      // Wave distortion
      pos.x += 0.1 * sin(pos.y * 4.0 + uTime * 2.0);
      pos.y += 0.1 * sin(pos.x * 4.0 + uTime * 1.5);
      pos.z += 0.1 * sin(pos.y * 4.0 + uTime * 2.5);

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uGlowColor;
    uniform float uTime;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      // Fresnel effect for glassy edges
      float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);

      // Color blend
      vec3 baseColor = mix(uColor1, uColor2, 0.5 + 0.5 * sin(uTime));

      // Glow towards center
      float glow = smoothstep(0.0, 0.8, fresnel);
      vec3 glowColor = uGlowColor * glow;

      // Final color
      vec3 finalColor = baseColor + glowColor;

      gl_FragColor = vec4(finalColor, fresnel * 0.9 + 0.1); // transparent glass
    }
  `
);

extend({ WaveMaterial });

function BubbleMesh() {
  const ref = useRef<any>();
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.uTime = t;
    }
    // Breathing animation
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      {/* @ts-ignore */}
      <waveMaterial ref={ref} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Bubble() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="w-[400px] h-[400px] rounded-full overflow-hidden">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <BubbleMesh />
        </Canvas>
      </div>
    </div>
  );
}
