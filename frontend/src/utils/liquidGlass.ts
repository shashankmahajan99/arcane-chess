import * as THREE from 'three';

export interface LiquidGlassOptions {
  color: 'white' | 'black';
  intensity?: number;
  displacement?: number;
  refraction?: number;
  reflection?: number;
}

export class LiquidGlassShader {
  private static vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uDisplacement;
    uniform float uRefraction;
    uniform float uReflection;
    uniform vec2 uMouse;
    uniform bool uIsWhite;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    // Noise functions
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Rounded rectangle SDF
    float roundedRectSDF(vec2 p, vec2 size, float radius) {
      vec2 q = abs(p) - size + radius;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
    }
    
    // Smooth step function
    float smoothStep(float a, float b, float t) {
      t = clamp((t - a) / (b - a), 0.0, 1.0);
      return t * t * (3.0 - 2.0 * t);
    }
    
    void main() {
      vec2 uv = vUv;
      vec3 viewDirection = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Time-based animation
      float time = uTime * 0.5;
      
      // Create liquid distortion effect
      vec2 distortedUV = uv;
      
      // Add multiple layers of noise for complex liquid motion
      float noise1 = noise(uv * 8.0 + time * 0.3);
      float noise2 = noise(uv * 16.0 - time * 0.2);
      float noise3 = noise(uv * 32.0 + time * 0.1);
      
      // Combine noise layers
      float liquidNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
      
      // Mouse interaction
      vec2 mouseOffset = (uMouse - 0.5) * 2.0;
      float mouseDistance = length(uv - uMouse);
      float mouseEffect = smoothStep(0.8, 0.0, mouseDistance) * 0.3;
      
      // Apply displacement
      vec2 displacement = vec2(
        sin(liquidNoise * 6.28 + time) * uDisplacement,
        cos(liquidNoise * 6.28 + time * 1.1) * uDisplacement
      );
      
      displacement += mouseOffset * mouseEffect;
      distortedUV += displacement;
      
      // Create rounded rectangle mask for piece shape
      vec2 centeredUV = (uv - 0.5) * 2.0;
      float sdf = roundedRectSDF(centeredUV, vec2(0.8), 0.3);
      float mask = smoothStep(0.1, 0.0, sdf);
      
      // Fresnel effect for glass-like appearance
      float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);
      
      // Base color calculation
      vec3 baseColor = uColor;
      
      if (uIsWhite) {
        // White pieces: bright, crystalline
        baseColor = mix(
          vec3(0.95, 0.98, 1.0),
          vec3(0.8, 0.9, 1.0),
          liquidNoise * 0.3
        );
        
        // Add iridescent highlights
        float iridescence = sin(liquidNoise * 10.0 + time * 2.0) * 0.5 + 0.5;
        baseColor += vec3(0.1, 0.05, 0.2) * iridescence * fresnel;
      } else {
        // Black pieces: deep, mysterious
        baseColor = mix(
          vec3(0.05, 0.08, 0.12),
          vec3(0.15, 0.18, 0.25),
          liquidNoise * 0.4
        );
        
        // Add subtle color shifts
        float colorShift = sin(liquidNoise * 8.0 + time * 1.5) * 0.5 + 0.5;
        baseColor += vec3(0.1, 0.05, 0.15) * colorShift * fresnel;
      }
      
      // Apply reflection based on viewing angle
      float reflection = uReflection * fresnel;
      baseColor = mix(baseColor, vec3(1.0), reflection * 0.3);
      
      // Apply refraction distortion
      vec3 refractedColor = baseColor;
      float refractionStrength = uRefraction * (1.0 - fresnel);
      refractedColor = mix(baseColor, baseColor * 1.2, refractionStrength);
      
      // Edge glow effect
      float edgeGlow = smoothStep(0.05, 0.0, sdf) - smoothStep(0.0, -0.05, sdf);
      vec3 glowColor = uIsWhite ? vec3(0.6, 0.8, 1.0) : vec3(0.4, 0.2, 0.8);
      refractedColor += glowColor * edgeGlow * uIntensity;
      
      // Final color with mask
      vec3 finalColor = refractedColor * mask;
      
      // Add transparency based on fresnel for glass effect
      float alpha = mask * (0.8 + fresnel * 0.2);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  public static createMaterial(options: LiquidGlassOptions): THREE.ShaderMaterial {
    const baseColor = options.color === 'white' 
      ? new THREE.Color(0.95, 0.98, 1.0)
      : new THREE.Color(0.05, 0.08, 0.12);

    return new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor },
        uIntensity: { value: options.intensity || 1.0 },
        uDisplacement: { value: options.displacement || 0.02 },
        uRefraction: { value: options.refraction || 0.5 },
        uReflection: { value: options.reflection || 0.8 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uIsWhite: { value: options.color === 'white' },
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
  }

  public static updateMaterial(
    material: THREE.ShaderMaterial, 
    time: number, 
    mousePosition?: THREE.Vector2
  ): void {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }
    
    if (mousePosition && material.uniforms.uMouse) {
      material.uniforms.uMouse.value.copy(mousePosition);
    }
  }
}

export class LiquidGlassManager {
  private materials: Map<string, THREE.ShaderMaterial> = new Map();
  private mousePosition = new THREE.Vector2(0.5, 0.5);

  createPieceMaterial(pieceId: string, color: 'white' | 'black'): THREE.ShaderMaterial {
    const material = LiquidGlassShader.createMaterial({
      color,
      intensity: color === 'white' ? 1.2 : 0.9,
      displacement: 0.015,
      refraction: 0.6,
      reflection: color === 'white' ? 0.9 : 0.7,
    });

    this.materials.set(pieceId, material);
    return material;
  }

  updateMouse(x: number, y: number): void {
    this.mousePosition.set(x, y);
  }

  update(time: number): void {
    this.materials.forEach((material) => {
      LiquidGlassShader.updateMaterial(material, time, this.mousePosition);
    });
  }

  dispose(): void {
    this.materials.forEach((material) => {
      material.dispose();
    });
    this.materials.clear();
  }

  getMaterial(pieceId: string): THREE.ShaderMaterial | undefined {
    return this.materials.get(pieceId);
  }
}
