"use client";

import { Suspense, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Earth, Starfield } from "./Earth";
import { ReactorMarkers } from "./ReactorMarkers";
import { Reactor, LightingMode } from "@/lib/types";

/**
 * Earth radius constant - must match other components
 */
const EARTH_RADIUS = 2;

/**
 * Earth rotation offset for texture alignment
 */
const EARTH_ROTATION_OFFSET = -Math.PI / 2;

/**
 * Scene control interface exposed via ref
 */
export interface SceneControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  rotateToLocation: (lat: number, lon: number) => void;
}

/**
 * Cinematic camera controller for initial zoom-in effect
 * Animates camera from distant view to orbital position
 * @param onAnimationComplete - Callback when animation finishes
 */
function CinematicCamera({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const hasCompletedRef = useRef(false);

  const startDistance = 80;
  const endDistance = 10;
  const endPosition = new THREE.Vector3(6, 2.5, 7);
  const animationDuration = 5;

  const startDelay = 2.4;
  const delayRef = useRef(startDelay);

  useFrame((state, delta) => {
    if (delayRef.current > 0) {
      delayRef.current -= delta;
      camera.position.set(0, 0, startDistance);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (progressRef.current < 1) {
      const newProgress = Math.min(progressRef.current + delta / animationDuration, 1);
      progressRef.current = newProgress;

      const easeInOutQuart = newProgress < 0.5
        ? 8 * newProgress * newProgress * newProgress * newProgress
        : 1 - Math.pow(-2 * newProgress + 2, 4) / 2;

      const spiralAngle = newProgress * Math.PI * 0.3;
      const spiralRadius = (1 - easeInOutQuart) * 2;

      const distance = startDistance + (endDistance - startDistance) * easeInOutQuart;

      const targetX = endPosition.x * easeInOutQuart + Math.sin(spiralAngle) * spiralRadius;
      const targetY = endPosition.y * easeInOutQuart + Math.cos(spiralAngle) * spiralRadius * 0.3;
      const targetZ = distance * (1 - easeInOutQuart) + endPosition.z * easeInOutQuart;

      camera.position.set(targetX, targetY, targetZ);

      const lookAtOffset = (1 - easeInOutQuart) * 0.5;
      camera.lookAt(lookAtOffset, lookAtOffset * 0.2, 0);

      if (newProgress >= 1 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        camera.position.copy(endPosition);
        camera.lookAt(0, 0, 0);
        onAnimationComplete();
      }
    }
  });

  return null;
}

/**
 * Lighting setup for nuclear reactor scene
 * Creates clean, technical lighting with cool accents
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#4a4a52" />

      <directionalLight
        position={[10, 5, 5]}
        intensity={1.8}
        color="#fff5e6"
        castShadow
      />

      <directionalLight
        position={[-5, -2, -5]}
        intensity={0.4}
        color="#00aaff"
      />

      <pointLight
        position={[0, -5, 5]}
        intensity={0.8}
        color="#22ff66"
        distance={25}
      />

      <pointLight
        position={[0, 10, 0]}
        intensity={0.4}
        color="#ffffff"
        distance={30}
      />
    </>
  );
}

/**
 * Convert latitude/longitude to camera position looking at that point
 * @param lat - Latitude in degrees
 * @param lon - Longitude in degrees
 * @param distance - Distance from Earth center
 * @returns Camera position vector
 */
function latLonToCameraPosition(lat: number, lon: number, distance: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180) + EARTH_ROTATION_OFFSET;

  const x = -distance * Math.sin(phi) * Math.cos(theta);
  const y = distance * Math.cos(phi);
  const z = distance * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Camera controller component that can be controlled externally
 */
interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
  targetLocation: { lat: number; lon: number } | null;
  targetZoom: number | null;
  onAnimationDone: () => void;
}

function CameraController({
  controlsRef,
  targetLocation,
  targetZoom,
  onAnimationDone,
}: CameraControllerProps) {
  const { camera } = useThree();
  const animatingRef = useRef(false);
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);
  const startPositionRef = useRef<THREE.Vector3 | null>(null);
  const startDistanceRef = useRef<number>(0);
  const targetDistanceRef = useRef<number>(0);
  const progressRef = useRef(0);

  useFrame((state, delta) => {
    // Handle location animation (includes zoom if targetZoom is set)
    if (targetLocation && !animatingRef.current) {
      animatingRef.current = true;
      progressRef.current = 0;
      startPositionRef.current = camera.position.clone();
      startDistanceRef.current = camera.position.length();

      // Use targetZoom if provided, otherwise maintain current distance
      const finalDistance = targetZoom ?? startDistanceRef.current;
      targetDistanceRef.current = finalDistance;

      targetPositionRef.current = latLonToCameraPosition(
        targetLocation.lat,
        targetLocation.lon,
        finalDistance
      );
    }

    if (animatingRef.current && targetPositionRef.current && startPositionRef.current) {
      // Slower, smoother animation (1.2 seconds)
      progressRef.current += delta * 0.8;
      const t = Math.min(progressRef.current, 1);

      // Smooth ease-in-out curve
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Interpolate position
      camera.position.lerpVectors(startPositionRef.current, targetPositionRef.current, eased);

      // Smoothly interpolate distance for zoom
      if (targetZoom !== null) {
        const currentDist = camera.position.length();
        const targetDist = startDistanceRef.current + (targetDistanceRef.current - startDistanceRef.current) * eased;
        camera.position.normalize().multiplyScalar(targetDist);
      }

      camera.lookAt(0, 0, 0);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      if (t >= 1) {
        animatingRef.current = false;
        targetPositionRef.current = null;
        startPositionRef.current = null;
        onAnimationDone();
      }
    } else if (targetZoom !== null && !animatingRef.current && controlsRef.current) {
      // Handle standalone zoom (without location change)
      const currentDistance = camera.position.length();
      const diff = targetZoom - currentDistance;
      if (Math.abs(diff) > 0.05) {
        // Smoother zoom interpolation
        const newDistance = currentDistance + diff * delta * 3;
        camera.position.normalize().multiplyScalar(newDistance);
        controlsRef.current.update();
      }
    }
  });

  return null;
}

interface SceneProps {
  reactors: Reactor[];
  selectedReactor: Reactor | null;
  onSelectReactor: (reactor: Reactor | null) => void;
  visibleStatuses: Set<string>;
  onLoadComplete: () => void;
  isLoading?: boolean;
  onHoverReactor?: (reactor: { name: string; status: string } | null, screenPos: { x: number; y: number } | null) => void;
  lightingMode?: LightingMode;
  showClouds?: boolean;
}

/**
 * Internal scene content component
 */
interface SceneContentProps extends SceneProps {
  controlsEnabled: boolean;
  controlsRef: React.RefObject<any>;
  targetLocation: { lat: number; lon: number } | null;
  targetZoom: number | null;
  onLocationAnimationDone: () => void;
  lightingMode: LightingMode;
  showClouds: boolean;
}

function SceneContent({
  reactors,
  selectedReactor,
  onSelectReactor,
  visibleStatuses,
  onHoverReactor,
  controlsEnabled,
  controlsRef,
  targetLocation,
  targetZoom,
  onLocationAnimationDone,
  lightingMode,
  showClouds,
}: SceneContentProps) {
  return (
    <>
      <CameraController
        controlsRef={controlsRef}
        targetLocation={targetLocation}
        targetZoom={targetZoom}
        onAnimationDone={onLocationAnimationDone}
      />

      <OrbitControls
        ref={controlsRef}
        enabled={controlsEnabled}
        enablePan={false}
        minDistance={3.5}
        maxDistance={25}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={1.0}
      />

      <Lighting />

      <color attach="background" args={["#020206"]} />
      <fog attach="fog" args={["#020206", 60, 120]} />
      <Starfield count={4000} />

      <Earth lightingMode={lightingMode} showClouds={showClouds} />

      <ReactorMarkers
        reactors={reactors}
        selectedReactor={selectedReactor}
        onSelectReactor={onSelectReactor}
        visibleStatuses={visibleStatuses}
        onHoverReactor={onHoverReactor}
        visualStyle="dots"
      />
    </>
  );
}

/**
 * Main 3D scene component for nuclear reactor visualization
 * Combines Earth, reactor markers, camera, and lighting
 * Exposes camera controls via ref
 */
export const Scene = forwardRef<SceneControls, SceneProps>(function Scene(
  {
    reactors,
    selectedReactor,
    onSelectReactor,
    visibleStatuses,
    onLoadComplete,
    isLoading = false,
    onHoverReactor,
    lightingMode = "realistic",
    showClouds = true,
  },
  ref
) {
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const handleAnimationComplete = () => {
    setControlsEnabled(true);
    onLoadComplete();
  };

  const handleLocationAnimationDone = () => {
    setTargetLocation(null);
  };

  // Expose controls via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (cameraRef.current) {
        const currentDistance = cameraRef.current.position.length();
        setTargetZoom(Math.max(3.5, currentDistance - 2));
        setTimeout(() => setTargetZoom(null), 500);
      }
    },
    zoomOut: () => {
      if (cameraRef.current) {
        const currentDistance = cameraRef.current.position.length();
        setTargetZoom(Math.min(25, currentDistance + 2));
        setTimeout(() => setTargetZoom(null), 500);
      }
    },
    resetView: () => {
      setTargetLocation({ lat: 20, lon: 0 });
      setTargetZoom(10);
      setTimeout(() => setTargetZoom(null), 500);
    },
    rotateToLocation: (lat: number, lon: number) => {
      setTargetLocation({ lat, lon });
    },
  }));

  return (
    <div className="canvas-container">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 80]} fov={45} />
          <CinematicCamera onAnimationComplete={handleAnimationComplete} />

          <SceneContent
            reactors={reactors}
            selectedReactor={selectedReactor}
            onSelectReactor={onSelectReactor}
            visibleStatuses={visibleStatuses}
            onHoverReactor={onHoverReactor}
            onLoadComplete={onLoadComplete}
            controlsEnabled={controlsEnabled}
            controlsRef={controlsRef}
            targetLocation={targetLocation}
            targetZoom={targetZoom}
            onLocationAnimationDone={handleLocationAnimationDone}
            lightingMode={lightingMode}
            showClouds={showClouds}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});
