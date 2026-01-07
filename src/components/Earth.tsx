"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { LightingMode } from "@/lib/types";

interface EarthProps {
  lightingMode?: LightingMode;
  showClouds?: boolean;
}

/**
 * Earth globe component with realistic textures and atmospheric effects
 * Uses NASA Blue Marble textures for day/night visualization
 * @param lightingMode - Controls globe lighting: realistic, day, or night
 * @returns Three.js group containing Earth mesh and atmosphere
 */
export function Earth({ lightingMode = "realistic", showClouds = true }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const cloudMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [textures, setTextures] = useState<{
    day: THREE.Texture | null;
    night: THREE.Texture | null;
    clouds: THREE.Texture | null;
  }>({ day: null, night: null, clouds: null });

  // Cloud fade-in animation state
  const cloudOpacityRef = useRef(0);
  const targetCloudOpacity = 0.35;

  // Reset cloud opacity when toggling clouds off/on
  useEffect(() => {
    if (!showClouds) {
      cloudOpacityRef.current = 0;
    }
  }, [showClouds]);

  /**
   * Load textures in two phases for better perceived performance:
   * 1. Critical textures (day/night) - loaded immediately
   * 2. Cloud texture - lazy loaded after critical textures are ready
   */
  useEffect(() => {
    const loader = new TextureLoader();

    const configureTexture = (tex: THREE.Texture): void => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
    };

    // Phase 1: Load critical day/night textures first
    Promise.all([
      loader.loadAsync("/textures/earth_day_8k.jpg"),
      loader.loadAsync("/textures/earth_night_8k.jpg"),
    ]).then(([dayTex, nightTex]) => {
      configureTexture(dayTex);
      configureTexture(nightTex);

      setTextures(prev => ({
        ...prev,
        day: dayTex,
        night: nightTex,
      }));

      // Phase 2: Lazy load cloud texture after Earth is visible
      if (showClouds) {
        // Small delay to prioritize Earth rendering
        requestAnimationFrame(() => {
          loader.loadAsync("/textures/earth_clouds_8k.jpg").then(cloudsTex => {
            configureTexture(cloudsTex);
            setTextures(prev => ({
              ...prev,
              clouds: cloudsTex,
            }));
          }).catch(err => {
            console.warn("Failed to load cloud texture:", err);
          });
        });
      }
    }).catch(err => {
      console.warn("Failed to load Earth textures:", err);
    });
  }, [showClouds]);

  const earthRotationOffset = -Math.PI / 2;
  const cloudDriftRef = useRef(0);

  useFrame((state, delta) => {
    if (cloudsRef.current) {
      // Cloud drift rotation
      cloudDriftRef.current += delta * 0.003;
      cloudsRef.current.rotation.y = earthRotationOffset + cloudDriftRef.current;

      // Smooth cloud fade-in animation
      if (textures.clouds && cloudMaterialRef.current) {
        if (cloudOpacityRef.current < targetCloudOpacity) {
          // Ease-out animation over ~1.5 seconds
          cloudOpacityRef.current = Math.min(
            cloudOpacityRef.current + delta * 0.25,
            targetCloudOpacity
          );
          cloudMaterialRef.current.opacity = cloudOpacityRef.current;
        }
      }
    }
  });

  const earthShader = useMemo(() => {
    return {
      uniforms: {
        dayTexture: { value: null },
        nightTexture: { value: null },
        sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
        lightingMode: { value: 0 }, // 0 = realistic, 1 = day, 2 = night
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        uniform int lightingMode;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);

          float dayFactor;

          if (lightingMode == 1) {
            // Day mode: full illumination
            dayFactor = 1.0;
          } else if (lightingMode == 2) {
            // Night mode: show city lights
            dayFactor = 0.0;
          } else {
            // Realistic mode: day/night based on sun position
            float sunDot = dot(vNormal, sunDirection);
            dayFactor = smoothstep(-0.2, 0.3, sunDot);
          }

          float lightIntensity = max(max(nightColor.r, nightColor.g), nightColor.b);

          // City lights with cool nuclear green tint
          vec3 cityLights = nightColor.rgb * vec3(0.8, 1.5, 0.9) * 3.0;
          cityLights += vec3(0.4, 1.0, 0.6) * pow(lightIntensity, 2.0) * 2.0;

          vec3 nightBase = vec3(0.01, 0.02, 0.03);
          vec3 nightSide = nightBase + cityLights;

          vec3 finalColor = mix(nightSide, dayColor.rgb, dayFactor);

          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 3.0);

          // Green rim for nuclear theme
          finalColor += vec3(0.1, 0.3, 0.15) * rim * 0.3;

          float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
          finalColor = mix(finalColor, vec3(luminance), 0.08);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };
  }, []);

  useEffect(() => {
    if (earthRef.current && textures.day && textures.night) {
      const material = earthRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.dayTexture.value = textures.day;
        material.uniforms.nightTexture.value = textures.night;
        material.needsUpdate = true;
      }
    }
  }, [textures]);

  // Update lighting mode uniform when prop changes
  useEffect(() => {
    if (earthRef.current) {
      const material = earthRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        const modeValue = lightingMode === "day" ? 1 : lightingMode === "night" ? 2 : 0;
        material.uniforms.lightingMode.value = modeValue;
        material.needsUpdate = true;
      }
    }
  }, [lightingMode]);

  const atmosphereShader = useMemo(
    () => ({
      uniforms: {
        glowColor: { value: new THREE.Color("#22ff66") },
        c: { value: 0.4 },
        p: { value: 4.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vPositionNormal), p);
          gl_FragColor = vec4(glowColor, intensity * 0.5);
        }
      `,
    }),
    []
  );

  return (
    <group>
      {textures.day && textures.night ? (
        <mesh ref={earthRef} rotation={[0, earthRotationOffset, 0]}>
          <sphereGeometry args={[2, 128, 128]} />
          <shaderMaterial
            attach="material"
            args={[earthShader]}
            uniforms-dayTexture-value={textures.day}
            uniforms-nightTexture-value={textures.night}
          />
        </mesh>
      ) : (
        <mesh ref={earthRef} rotation={[0, earthRotationOffset, 0]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.8}
            metalness={0.1}
            emissive="#0a0a14"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {textures.clouds && showClouds && (
        <mesh ref={cloudsRef} rotation={[0, earthRotationOffset, 0]}>
          <sphereGeometry args={[2.015, 64, 64]} />
          <meshBasicMaterial
            ref={cloudMaterialRef}
            map={textures.clouds}
            transparent={true}
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      <mesh scale={1.12}>
        <sphereGeometry args={[2, 32, 32]} />
        <shaderMaterial
          attach="material"
          args={[atmosphereShader]}
          side={THREE.BackSide}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.02}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#22ff66"
          transparent={true}
          opacity={0.02}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Enhanced starfield background component with twinkling effect
 * Creates a procedural starfield with varying star sizes, colors, and brightness
 * @param count - Number of stars to generate
 * @returns Three.js points object with stars
 */
export function Starfield({ count = 3000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Star color variations (warm white, cool white, blue-white, orange)
    const starColors = [
      [1.0, 1.0, 1.0],      // White
      [0.9, 0.95, 1.0],     // Cool white
      [1.0, 0.95, 0.9],     // Warm white
      [0.8, 0.9, 1.0],      // Blue-white
      [1.0, 0.85, 0.7],     // Orange tint
    ];

    for (let i = 0; i < count; i++) {
      // Distribute stars in a sphere shell
      const radius = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random star color
      const colorChoice = starColors[Math.floor(Math.random() * starColors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = colorChoice[0] * brightness;
      colors[i * 3 + 1] = colorChoice[1] * brightness;
      colors[i * 3 + 2] = colorChoice[2] * brightness;

      // Vary sizes - most stars small, few large
      const sizeRand = Math.random();
      if (sizeRand > 0.98) {
        sizes[i] = 2.5 + Math.random() * 1.5; // Bright stars
      } else if (sizeRand > 0.9) {
        sizes[i] = 1.5 + Math.random() * 1.0; // Medium stars
      } else {
        sizes[i] = 0.3 + Math.random() * 0.7; // Dim stars
      }
    }

    return { positions, colors, sizes };
  }, [count]);

  // Subtle twinkling animation
  useFrame((state) => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < Math.min(100, count); i++) {
        // Only animate a subset for performance
        const idx = Math.floor(Math.random() * count);
        const baseSize = sizes[idx];
        const twinkle = Math.sin(time * 3 + idx) * 0.2 + 1;
        sizeAttr.array[idx] = baseSize * twinkle;
      }
      sizeAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes.slice(), 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Sun component with high-resolution texture
 * Uses equirectangular sun texture from Solar System Scope
 * @returns Three.js group containing sun mesh and glow layers
 */
export function Sun() {
  const sunRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Position sun far in the background (realistic distance feel)
  const sunPosition = new THREE.Vector3(50, 25, -40);
  const sunRadius = 5;

  // Load sun texture (same approach as Earth)
  useEffect(() => {
    const loader = new TextureLoader();
    loader.loadAsync("/textures/sun_8k.jpg").then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      setTexture(tex);
    }).catch((err) => {
      console.warn("Failed to load sun texture:", err);
    });
  }, []);

  // Slow rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.01;
    }
    if (sunRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.2) * 0.008 + 1;
      sunRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={sunRef} position={[sunPosition.x, sunPosition.y, sunPosition.z]}>
      {/* Sun core with texture */}
      {texture && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[sunRadius, 64, 64]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      )}

      {/* Fallback if no texture */}
      {!texture && (
        <mesh>
          <sphereGeometry args={[sunRadius, 32, 32]} />
          <meshBasicMaterial color="#ffaa00" />
        </mesh>
      )}

      {/* Bright white core glow */}
      <mesh>
        <sphereGeometry args={[sunRadius * 1.05, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Yellow inner glow */}
      <mesh>
        <sphereGeometry args={[sunRadius * 1.15, 32, 32]} />
        <meshBasicMaterial
          color="#ffee88"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orange middle glow */}
      <mesh>
        <sphereGeometry args={[sunRadius * 1.4, 32, 32]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[sunRadius * 1.8, 32, 32]} />
        <meshBasicMaterial
          color="#ff9922"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Corona */}
      <mesh>
        <sphereGeometry args={[sunRadius * 2.5, 32, 32]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Far corona */}
      <mesh>
        <sphereGeometry args={[sunRadius * 3.5, 32, 32]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.04}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
