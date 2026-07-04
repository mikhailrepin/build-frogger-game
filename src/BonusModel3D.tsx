import * as THREE from 'three';
import type { BonusItem } from './gameCore';

interface BonusModel3DProps {
  kind: BonusItem['kind'];
}

export function BonusModel3D({ kind }: BonusModel3DProps) {
  const isSlowTime = kind === 'slowTime';
  const isCurrentAnchor = kind === 'currentAnchor';
  const isSuperHop = kind === 'superHop';
  const isFly = kind === 'fly';
  const mainColor = isSlowTime ? '#60a5fa' : isCurrentAnchor ? '#14b8a6' : isSuperHop ? '#f59e0b' : isFly ? '#facc15' : '#fbbf24';
  const emissiveColor = isSlowTime ? '#3b82f6' : isCurrentAnchor ? '#0f766e' : isSuperHop ? '#ea580c' : isFly ? '#ca8a04' : '#f59e0b';
  const ringColor = isSlowTime ? '#bfdbfe' : isCurrentAnchor ? '#99f6e4' : isSuperHop ? '#fde68a' : isFly ? '#fef08a' : '#fde68a';

  if (isSlowTime) {
    return (
      <>
        <mesh castShadow>
          <sphereGeometry args={[0.11, 14, 10]} />
          <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.75} roughness={0.25} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <torusGeometry args={[0.18, 0.02, 10, 24]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.45} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.015, 0.1, 0.015]} />
          <meshStandardMaterial color="#eff6ff" emissive="#eff6ff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.05, 0.03, 0]}>
          <boxGeometry args={[0.08, 0.015, 0.015]} />
          <meshStandardMaterial color="#eff6ff" emissive="#eff6ff" emissiveIntensity={0.4} />
        </mesh>
        <pointLight color={mainColor} intensity={0.8} distance={1.9} />
      </>
    );
  }

  if (isCurrentAnchor) {
    return (
      <>
        <mesh castShadow>
          <boxGeometry args={[0.11, 0.12, 0.03]} />
          <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.8} roughness={0.3} metalness={0.18} />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <torusGeometry args={[0.1, 0.02, 10, 18, Math.PI]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.45} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 10]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.5} />
        </mesh>
        <pointLight color={mainColor} intensity={0.75} distance={1.8} />
      </>
    );
  }

  if (isSuperHop) {
    return (
      <>
        <mesh castShadow>
          <coneGeometry args={[0.1, 0.16, 10]} />
          <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={1} roughness={0.3} metalness={0.16} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.14, 10]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.8} roughness={0.3} metalness={0.16} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.14, 0.02, 8, 18]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.4} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <pointLight color={mainColor} intensity={0.85} distance={2} />
      </>
    );
  }

  if (isFly) {
    return (
      <>
        <mesh castShadow>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.95} roughness={0.3} metalness={0.12} />
        </mesh>
        <mesh position={[-0.12, 0.03, 0.04]} rotation={[0, 0.2, -0.3]}>
          <boxGeometry args={[0.12, 0.02, 0.16]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.55} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.12, 0.03, -0.04]} rotation={[0, -0.2, 0.3]}>
          <boxGeometry args={[0.12, 0.02, 0.16]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.55} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <torusGeometry args={[0.13, 0.018, 8, 18]} />
          <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.35} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <pointLight color={mainColor} intensity={0.85} distance={2} />
      </>
    );
  }

  return (
    <>
      <mesh castShadow>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.9} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.26, 24]} />
        <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.25} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={mainColor} intensity={0.7} distance={1.8} />
    </>
  );
}
