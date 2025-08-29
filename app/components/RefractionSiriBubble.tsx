// components/RefractionSiriBubble.tsx
"use client";
import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { CubeCamera, Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

type Lobe = {
  color: string;
  scale: number;
  speed: number;
  offset: number;
};

function InnerLobes({ lobes }: { lobes: Lobe[] }) {
  // Each lobe is a slightly smaller icosahedron with additive, emissive material
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      // gentle rotation & pulsate
      m.rotation.x = Math.sin(t * (0.3 + i * 0.1) + i) * 0.3;
      m.rotation.y = Math.cos(t * (0.2 + i * 0.07) - i) * 0.4;
      m.position.y = Math.sin(t * (0.6 + i * 0.08) + i * 0.5) * 0.06;
      m.position.x = Math.cos(t * (0.5 + i * 0.04) + i * 0.3) * 0.06;
    });
  });

  return (
    <>
      {lobes.map((l, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el as unknown as THREE.Mesh;
          }}
          scale={l.scale}
        >
          <icosahedronGeometry args={[1, 64]} />
          <meshStandardMaterial
            emissive={new THREE.Color(l.color)}
            emissiveIntensity={1.5}
            metalness={0}
            roughness={0.35}
            transparent
            opacity={0.9}
            depthWrite={false}
            // @ts-ignore
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

function GlassShell({ children }: { children?: React.ReactNode }) {
  // Outer glass shell using MeshPhysicalMaterial.
  // We will assign the cube camera texture to this material's envMap in the render callback.
  const shellRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  // default physical material params tuned for glass
  const physicalParams = useMemo(
    () => ({
      transmission: 1.0, // physical glass
      thickness: 0.4,
      roughness: 0.05,
      metalness: 0.0,
      ior: 1.2,
      specularIntensity: 1.2,
      envMapIntensity: 1.0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    }),
    []
  );

  useFrame(() => {
    // optional tiny shell rotation for subtle motion
    if (shellRef.current) {
      shellRef.current.rotation.y += 0.0008;
      shellRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <CubeCamera resolution={256} frames={1}>
      {(texture) => {
        // assign the cube texture to the material each frame
        // Use a MeshPhysicalMaterial instance and set its envMap
        const mat =
          matRef.current ||
          new THREE.MeshPhysicalMaterial({
            ...physicalParams,
            transparent: true,
            opacity: 1,
            // envMap left null initially; will set below
          });

        // Update envMap / properties on every render call to keep refraction accurate
        mat.envMap = texture;
        mat.needsUpdate = true;
        mat.envMapIntensity = 1.2;

        // store ref
        matRef.current = mat;

        return (
          <>
            <mesh ref={shellRef}>
              {/* <sphereGeometry args={[1.02, 128, 128]} /> */}
              {/* @ts-ignore */}
              <primitive object={mat} attach="material" />
            </mesh>

            {/* Render children (inner lobes) inside the cube camera block so they are visible to the cube camera */}
            {children}
          </>
        );
      }}
    </CubeCamera>
  );
}

export default function RefractionSiriBubble({
  size = 420,
}: {
  size?: number;
}) {
  // define multiple lobes with varied sizes and speeds
  const lobes: Lobe[] = [
    { color: "#00F0FF", scale: 0.35, speed: 1.0, offset: 0 },
    { color: "#FF4EA8", scale: 0.35, speed: 1.2, offset: 1 },
    { color: "#7B5CFF", scale: 0.35, speed: 1.4, offset: 2 },
    { color: "#00E6A8", scale: 0.35, speed: 1.6, offset: 3 },
    { color: "#7B5CFF", scale: 0.05, speed: 1.4, offset: 2 },
    { color: "#FF4EA8", scale: 0.05, speed: 1.2, offset: 1 },
    { color: "#00F0FF", scale: 0.05, speed: 1.0, offset: 0 },
    { color: "#00E6A8", scale: 0.05, speed: 1.6, offset: 3 },
  ];

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100%",
        height: "100vh",
        background: "#000", // dark background like Siri screenshot
      }}
    >
      <div
        className="rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // subtle glass backdrop and border (Tailwind optional)
          backdropFilter: "blur(6px)",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 14px 50px rgba(0,0,0,0.6)",
        }}
      >
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          {/* A soft ambient + bright point light like Siri */}
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -3, -3]} intensity={0.6} />

          {/* Environment behind the bubble (drives refraction) */}
          <Environment preset="city" background={false} />

          {/* Glass shell with CubeCamera for refraction; inner children are rendered inside so CubeCamera captures them */}
          <GlassShell>
            {/* Inner colored lobes sit inside the glass shell */}
            <InnerLobes lobes={lobes} />
          </GlassShell>

          {/* Bright core highlight (a small emissive sphere centered) */}
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshBasicMaterial
              color={new THREE.Color("#ffffff")}
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>

          {/* Bloom for that glowing Siri core */}
          <EffectComposer>
            <Bloom
              intensity={1.4}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>

          {/* Optional orbit controls for development (disable in production for performance) */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
          />
        </Canvas>
      </div>
    </div>
  );
}
