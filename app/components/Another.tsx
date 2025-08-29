// components/SiriOrbWrapper.tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SiriBubble from "./Bubble";

function GlassShell() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        transmission={1}
        thickness={0.4}
        roughness={0}
        clearcoat={1}
        clearcoatRoughness={0}
        ior={1.5}
        reflectivity={1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export default function SiriOrbWrapper() {
  return (
    <div className="h-[400px] w-[400px] bg-black rounded-full">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <SiriBubble />     {/* inner fluid */}
        <GlassShell />     {/* outer perfect sphere */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
