"use client";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CubeCamera, Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function BubbleMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.4;
    meshRef.current.rotation.x += delta * 0.3;
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }
  });

  const vertexShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPos;
    void main() {
      vNormal = normal;
      vPos = position;
      float deform = sin(position.x * 4.0 + uTime) * 0.05
                   + sin(position.y * 6.0 + uTime * 1.5) * 0.05;
      vec3 newPosition = position + normal * deform;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPos;
    uniform float uTime;
    void main() {
      vec3 normal = normalize(vNormal);
      float n = (normal.x + normal.y + normal.z) * 0.5;

      // Multiple color lobes
      vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
      vec3 color2 = vec3(0.9, 0.0, 0.5); // Pink
      vec3 color3 = vec3(0.4, 0.0, 0.9); // Purple
      vec3 color4 = vec3(0.1, 0.6, 1.0); // Blue

      float mask1 = 0.5 + 0.5 * sin(uTime + vPos.x * 3.0);
      float mask2 = 0.5 + 0.5 * sin(uTime * 1.2 + vPos.y * 3.5);
      float mask3 = 0.5 + 0.5 * sin(uTime * 1.4 + vPos.z * 4.0);
      float mask4 = 0.5 + 0.5 * sin(uTime * 1.6 + (vPos.x+vPos.y) * 2.5);

      vec3 mixedColor = 
        mix(color1, color2, mask1) +
        mix(color3, color4, mask2) * 0.5;

      // Slight brightness
      mixedColor = pow(mixedColor, vec3(0.8));

      gl_FragColor = vec4(mixedColor, 0.9);
    }
  `;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 1024, 1024]} />
      <shaderMaterial
        ref={shaderRef}
        transparent
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default function SiriBubble() {
  return (
    <div className="flex items-center justify-center min-h-screen overflow-hidden">
      <div className="w-96 h-96 rounded-full overflow-hidden shadow-2xl">
        <Canvas camera={{ position: [0, 0, 3], fov: 35 }}>
          <ambientLight intensity={0.5} />
          <CubeCamera resolution={128} frames={Infinity}>
            {(texture) => (
              <>
                <Environment map={texture} />
                <BubbleMesh />
              </>
            )}
          </CubeCamera>
          <EffectComposer>
            <Bloom
              intensity={2}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.8}
            />
          </EffectComposer>
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
    </div>
  );
}
