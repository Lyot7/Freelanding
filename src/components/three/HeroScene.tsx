'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
	Icosahedron,
	MeshDistortMaterial,
	Environment,
	AdaptiveDpr,
	PerformanceMonitor
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const ACCENT = '#6FF0D3';
const BASE = '#182622';

/** Reactive distorted blob — leans toward the cursor, breathes over time. */
function Blob({ active }: { active: boolean }) {
	const group = useRef<THREE.Group>(null);
	// drei material instance exposes a mutable `distort` uniform
	const mat = useRef<THREE.Material & { distort: number }>(null);
	const pointer = useRef({ x: 0, y: 0 });

	useFrame((state, delta) => {
		if (!active || !group.current) return;
		pointer.current.x = state.pointer.x;
		pointer.current.y = state.pointer.y;
		// damped tilt toward cursor
		group.current.rotation.y = THREE.MathUtils.damp(
			group.current.rotation.y,
			pointer.current.x * 0.6,
			3,
			delta
		);
		group.current.rotation.x = THREE.MathUtils.damp(
			group.current.rotation.x,
			-pointer.current.y * 0.4,
			3,
			delta
		);
		group.current.rotation.z += delta * 0.05;
		if (mat.current) {
			const dist = Math.hypot(pointer.current.x, pointer.current.y);
			mat.current.distort = THREE.MathUtils.damp(mat.current.distort, 0.3 + dist * 0.2, 3, delta);
		}
	});

	return (
		<group ref={group}>
			<Icosahedron args={[1.15, 64]}>
				<MeshDistortMaterial
					ref={mat as never}
					color={BASE}
					emissive={ACCENT}
					emissiveIntensity={0.25}
					roughness={0.15}
					metalness={0.85}
					distort={0.35}
					speed={1.5}
				/>
			</Icosahedron>
		</group>
	);
}

/** Slow-drifting accent particle field for depth. */
function Particles({ count }: { count: number }) {
	const ref = useRef<THREE.Points>(null);

	const positions = useMemo(() => {
		const arr = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			const r = 2.5 + Math.random() * 3.5;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			arr[i * 3 + 2] = r * Math.cos(phi);
		}
		return arr;
	}, [count]);

	useFrame((_, delta) => {
		if (ref.current) ref.current.rotation.y += delta * 0.02;
	});

	return (
		<points ref={ref}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
			</bufferGeometry>
			<pointsMaterial
				color={ACCENT}
				size={0.025}
				sizeAttenuation
				transparent
				opacity={0.6}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
}

function Scene({ isMobile, degraded }: { isMobile: boolean; degraded: boolean }) {
	const { gl } = useThree();
	// Pause rendering when tab hidden to save battery.
	useFrame(() => {
		if (typeof document !== 'undefined' && document.hidden) gl.setAnimationLoop(null);
	});

	return (
		<>
			<ambientLight intensity={0.6} />
			<directionalLight position={[3, 3, 3]} intensity={1.2} color={ACCENT} />
			<pointLight position={[-4, -2, -2]} intensity={0.5} color="#ffffff" />
			<Blob active />
			<Particles count={isMobile ? 600 : 2200} />
			<Environment preset="city" />
			{!degraded && !isMobile && (
				<EffectComposer>
					<Bloom luminanceThreshold={0.2} intensity={0.6} mipmapBlur radius={0.7} />
				</EffectComposer>
			)}
		</>
	);
}

export default function HeroScene({ isMobile = false }: { isMobile?: boolean }) {
	const [degraded, setDegraded] = useState(false);

	return (
		<Canvas
			camera={{ position: [0, 0, 4], fov: 45 }}
			dpr={isMobile ? 1 : [1, 2]}
			gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
			style={{ background: 'transparent' }}
		>
			<PerformanceMonitor onDecline={() => setDegraded(true)} />
			<AdaptiveDpr pixelated />
			<Scene isMobile={isMobile} degraded={degraded} />
		</Canvas>
	);
}
