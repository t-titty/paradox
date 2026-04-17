import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Text } from "@react-three/drei";
import type { Tribe } from "../lib/types.ts";

interface Props {
  position: [number, number, number];
  trajectory: { tribe: Tribe; position: [number, number, number] }[];
}

/**
 * Three axes, one point. The user's position lives inside a unit cube
 * centered at origin; each axis runs -1 to +1.
 *
 *   X  Deontology ← → Consequentialism
 *   Y  Individualism ← → Collectivism
 *   Z  Emotional ← → Rational
 *
 * Trajectory (tribe history) renders as faint white dots; the user's
 * current position is a glowing gold sphere.
 */
export function Constellation({ position, trajectory }: Props) {
  return (
    <div className="relative aspect-square w-full border-2 border-bone bg-ink sm:aspect-auto sm:h-[420px]">
      <Canvas camera={{ position: [2.2, 1.8, 2.2], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color="#FFD700" />
        <pointLight position={[-3, -2, -3]} intensity={0.5} color="#FF2D20" />

        <Axes />

        {/* Trajectory dots — the user's tribal journey across days. */}
        {trajectory.map((t, i) => (
          <mesh key={`${t.tribe}-${i}`} position={t.position}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#F5F5F5" opacity={0.35} transparent />
          </mesh>
        ))}

        {/* Current weighted position — the star. */}
        <mesh position={position}>
          <sphereGeometry args={[0.09, 24, 24]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
        </mesh>

        <Line points={[[0, 0, 0], position]} color="#FFD700" opacity={0.5} transparent lineWidth={1} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableDamping
          dampingFactor={0.1}
          minDistance={1.8}
          maxDistance={6}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] uppercase tracking-brutal text-muted">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </p>
    </div>
  );
}

function Axes() {
  const ext = 1.15;
  return (
    <group>
      <Line points={[[-ext, 0, 0], [ext, 0, 0]]} color="#F5F5F5" opacity={0.6} transparent lineWidth={1} />
      <Line points={[[0, -ext, 0], [0, ext, 0]]} color="#F5F5F5" opacity={0.6} transparent lineWidth={1} />
      <Line points={[[0, 0, -ext], [0, 0, ext]]} color="#F5F5F5" opacity={0.6} transparent lineWidth={1} />

      <AxisLabel position={[ext + 0.2, 0, 0]} color="#FFD700" text="CONSEQUENTIALIST" />
      <AxisLabel position={[-ext - 0.25, 0, 0]} color="#FFD700" text="DEONTOLOGIST" />
      <AxisLabel position={[0, ext + 0.15, 0]} color="#FFD700" text="COLLECTIVIST" />
      <AxisLabel position={[0, -ext - 0.15, 0]} color="#FFD700" text="INDIVIDUALIST" />
      <AxisLabel position={[0, 0, ext + 0.2]} color="#FFD700" text="RATIONAL" />
      <AxisLabel position={[0, 0, -ext - 0.2]} color="#FFD700" text="EMOTIONAL" />
    </group>
  );
}

function AxisLabel({
  position,
  color,
  text,
}: {
  position: [number, number, number];
  color: string;
  text: string;
}) {
  return (
    <Text position={position} fontSize={0.1} color={color} anchorX="center" anchorY="middle">
      {text}
    </Text>
  );
}

