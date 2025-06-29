import * as THREE from 'three';
import { LiquidGlassShader, LiquidGlassManager, LiquidGlassOptions } from '../liquidGlass';

// Mock Three.js materials
jest.mock('three', () => ({
  ShaderMaterial: jest.fn().mockImplementation((params) => ({
    ...params,
    dispose: jest.fn(),
    uniforms: params.uniforms || {},
  })),
  Color: jest.fn().mockImplementation((r, g, b) => ({ r, g, b })),
  Vector2: jest.fn().mockImplementation((x, y) => {
    const vec = {
      x: x || 0,
      y: y || 0,
      set: jest.fn(function(this: any, newX: number, newY: number) {
        this.x = newX;
        this.y = newY;
        return this; // Important for chaining
      }),
      copy: jest.fn(function(this: any, other: { x: number, y: number }) {
        this.x = other.x;
        this.y = other.y;
        return this;
      })
    };
    return vec;
  }),
  DoubleSide: 'DoubleSide',
  NormalBlending: 'NormalBlending',
}));

describe('LiquidGlassShader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Material creation', () => {
    it('should create white piece material with correct properties', () => {
      const options: LiquidGlassOptions = {
        color: 'white',
        intensity: 1.2,
        displacement: 0.02,
        refraction: 0.5,
        reflection: 0.8,
      };

      LiquidGlassShader.createMaterial(options);

      expect(THREE.ShaderMaterial).toHaveBeenCalledWith({
        vertexShader: expect.any(String),
        fragmentShader: expect.any(String),
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: expect.any(Object) },
          uIntensity: { value: 1.2 },
          uDisplacement: { value: 0.02 },
          uRefraction: { value: 0.5 },
          uReflection: { value: 0.8 },
          uMouse: { value: expect.any(Object) },
          uIsWhite: { value: true },
        },
        transparent: true,
        side: 'DoubleSide',
        blending: 'NormalBlending',
      });

      expect(THREE.Color).toHaveBeenCalledWith(0.95, 0.98, 1.0);
    });

    it('should create black piece material with correct properties', () => {
      const options: LiquidGlassOptions = {
        color: 'black',
        intensity: 0.9,
        displacement: 0.015,
        refraction: 0.6,
        reflection: 0.7,
      };

      LiquidGlassShader.createMaterial(options);

      expect(THREE.ShaderMaterial).toHaveBeenCalledWith({
        vertexShader: expect.any(String),
        fragmentShader: expect.any(String),
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: expect.any(Object) },
          uIntensity: { value: 0.9 },
          uDisplacement: { value: 0.015 },
          uRefraction: { value: 0.6 },
          uReflection: { value: 0.7 },
          uMouse: { value: expect.any(Object) },
          uIsWhite: { value: false },
        },
        transparent: true,
        side: 'DoubleSide',
        blending: 'NormalBlending',
      });

      expect(THREE.Color).toHaveBeenCalledWith(0.05, 0.08, 0.12);
    });

    it('should use default values when options are not provided', () => {
      const options: LiquidGlassOptions = {
        color: 'white',
      };

      LiquidGlassShader.createMaterial(options);

      const createCall = (THREE.ShaderMaterial as jest.Mock).mock.calls[0][0];
      expect(createCall.uniforms.uIntensity.value).toBe(1.0);
      expect(createCall.uniforms.uDisplacement.value).toBe(0.02);
      expect(createCall.uniforms.uRefraction.value).toBe(0.5);
      expect(createCall.uniforms.uReflection.value).toBe(0.8);
    });

    it('should have valid shader code structure', () => {
      const options: LiquidGlassOptions = { color: 'white' };
      LiquidGlassShader.createMaterial(options);

      const createCall = (THREE.ShaderMaterial as jest.Mock).mock.calls[0][0];
      
      // Check that shaders contain key elements
      expect(createCall.vertexShader).toContain('varying vec2 vUv');
      expect(createCall.vertexShader).toContain('gl_Position');
      expect(createCall.fragmentShader).toContain('uniform float uTime');
      expect(createCall.fragmentShader).toContain('gl_FragColor');
    });
  });

  describe('Material updates', () => {
    let mockMaterial: THREE.ShaderMaterial;

    beforeEach(() => {
      mockMaterial = {
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: { copy: jest.fn() } },
        },
      };
    });

    it('should update time uniform correctly', () => {
      const time = 123.45;
      
      LiquidGlassShader.updateMaterial(mockMaterial, time);
      
      expect(mockMaterial.uniforms.uTime.value).toBe(time);
    });

    it('should update mouse position when provided', () => {
      const time = 0;
      const mousePosition = new THREE.Vector2(0.3, 0.7);
      
      LiquidGlassShader.updateMaterial(mockMaterial, time, mousePosition);
      
      expect(mockMaterial.uniforms.uMouse.value.copy).toHaveBeenCalledWith(mousePosition);
    });

    it('should handle missing uniforms gracefully', () => {
      const materialWithoutUniforms = { uniforms: {} };
      
      // Should not throw error
      expect(() => {
        LiquidGlassShader.updateMaterial(materialWithoutUniforms as any, 0);
      }).not.toThrow();
    });

    it('should update only time when mouse position is not provided', () => {
      const time = 67.89;
      
      LiquidGlassShader.updateMaterial(mockMaterial, time);
      
      expect(mockMaterial.uniforms.uTime.value).toBe(time);
      expect(mockMaterial.uniforms.uMouse.value.copy).not.toHaveBeenCalled();
    });
  });
});

describe('LiquidGlassManager', () => {
  let manager: LiquidGlassManager;
  let mockMaterial: any;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new LiquidGlassManager();
    
    mockMaterial = {
      dispose: jest.fn(),
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: { copy: jest.fn() } },
      },
    };

    // Mock the createMaterial method to return our mock material
    jest.spyOn(LiquidGlassShader, 'createMaterial').mockReturnValue(mockMaterial as any);
    jest.spyOn(LiquidGlassShader, 'updateMaterial').mockImplementation(() => {});
  });

  describe('Piece material creation', () => {
    it('should create white piece material with correct settings', () => {
      const pieceId = 'white-king-1';
      const material = manager.createPieceMaterial(pieceId, 'white');

      expect(LiquidGlassShader.createMaterial).toHaveBeenCalledWith({
        color: 'white',
        intensity: 1.2,
        displacement: 0.015,
        refraction: 0.6,
        reflection: 0.9,
      });

      expect(material).toBe(mockMaterial);
    });

    it('should create black piece material with correct settings', () => {
      const pieceId = 'black-queen-1';
      const material = manager.createPieceMaterial(pieceId, 'black');

      expect(LiquidGlassShader.createMaterial).toHaveBeenCalledWith({
        color: 'black',
        intensity: 0.9,
        displacement: 0.015,
        refraction: 0.6,
        reflection: 0.7,
      });

      expect(material).toBe(mockMaterial);
    });

    it('should store material with piece ID', () => {
      const pieceId = 'white-rook-1';
      manager.createPieceMaterial(pieceId, 'white');

      const retrievedMaterial = manager.getMaterial(pieceId);
      expect(retrievedMaterial).toBe(mockMaterial);
    });

    it('should handle multiple piece materials', () => {
      const pieces = [
        { id: 'white-king-1', color: 'white' as const },
        { id: 'black-king-1', color: 'black' as const },
        { id: 'white-pawn-1', color: 'white' as const },
        { id: 'black-pawn-1', color: 'black' as const },
      ];

      pieces.forEach(piece => {
        manager.createPieceMaterial(piece.id, piece.color);
      });

      pieces.forEach(piece => {
        const material = manager.getMaterial(piece.id);
        expect(material).toBe(mockMaterial);
      });

      expect(LiquidGlassShader.createMaterial).toHaveBeenCalledTimes(4);
    });
  });

  describe('Mouse tracking', () => {
    it('should update mouse position correctly', () => {
      const x = 0.4;
      const y = 0.6;
      
      manager.updateMouse(x, y);
      
      // Access private mousePosition for testing
      const mousePosition = (manager as any).mousePosition;
      expect(mousePosition.x).toBe(x);
      expect(mousePosition.y).toBe(y);
    });

    it('should handle edge case coordinates', () => {
      // Test boundary values
      const testCases = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 },
        { x: -0.1, y: 1.1 }, // Outside normal range
      ];

      testCases.forEach(({ x, y }) => {
        expect(() => manager.updateMouse(x, y)).not.toThrow();
      });
    });
  });

  describe('Material updates', () => {
    beforeEach(() => {
      manager.createPieceMaterial('piece-1', 'white');
      manager.createPieceMaterial('piece-2', 'black');
    });

    it('should update all materials with time', () => {
      const time = 456.78;
      
      manager.update(time);
      
      expect(LiquidGlassShader.updateMaterial).toHaveBeenCalledTimes(2);
      expect(LiquidGlassShader.updateMaterial).toHaveBeenCalledWith(
        mockMaterial, 
        time, 
        expect.any(Object)
      );
    });

    it('should pass mouse position to material updates', () => {
      const time = 123;
      manager.updateMouse(0.3, 0.7);
      
      manager.update(time);
      
      expect(LiquidGlassShader.updateMaterial).toHaveBeenCalledWith(
        mockMaterial, 
        time, 
        expect.objectContaining({ x: 0.3, y: 0.7 })
      );
    });

    it('should handle empty materials list', () => {
      const emptyManager = new LiquidGlassManager();
      
      expect(() => emptyManager.update(123)).not.toThrow();
      expect(LiquidGlassShader.updateMaterial).not.toHaveBeenCalled();
    });
  });

  describe('Material retrieval', () => {
    it('should return existing material', () => {
      const pieceId = 'test-piece';
      manager.createPieceMaterial(pieceId, 'white');
      
      const material = manager.getMaterial(pieceId);
      expect(material).toBe(mockMaterial);
    });

    it('should return undefined for non-existent material', () => {
      const material = manager.getMaterial('non-existent-piece');
      expect(material).toBeUndefined();
    });

    it('should handle empty string ID', () => {
      const material = manager.getMaterial('');
      expect(material).toBeUndefined();
    });
  });

  describe('Resource management', () => {
    beforeEach(() => {
      manager.createPieceMaterial('piece-1', 'white');
      manager.createPieceMaterial('piece-2', 'black');
      manager.createPieceMaterial('piece-3', 'white');
    });

    it('should dispose all materials', () => {
      manager.dispose();
      
      expect(mockMaterial.dispose).toHaveBeenCalledTimes(3);
    });

    it('should clear materials map after disposal', () => {
      manager.dispose();
      
      const material = manager.getMaterial('piece-1');
      expect(material).toBeUndefined();
    });

    it('should handle disposal of empty manager', () => {
      const emptyManager = new LiquidGlassManager();
      
      expect(() => emptyManager.dispose()).not.toThrow();
    });

    it('should be safe to call dispose multiple times', () => {
      manager.dispose();
      
      expect(() => manager.dispose()).not.toThrow();
      expect(mockMaterial.dispose).toHaveBeenCalledTimes(3); // Only called once per material
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full lifecycle of chess piece materials', () => {
      // Create materials for a full chess set
      const whitePieces = ['king', 'queen', 'rook1', 'rook2', 'bishop1', 'bishop2', 'knight1', 'knight2'];
      const blackPieces = ['king', 'queen', 'rook1', 'rook2', 'bishop1', 'bishop2', 'knight1', 'knight2'];
      
      // Create white pieces
      whitePieces.forEach(piece => {
        manager.createPieceMaterial(`white-${piece}`, 'white');
      });
      
      // Create black pieces
      blackPieces.forEach(piece => {
        manager.createPieceMaterial(`black-${piece}`, 'black');
      });
      
      // Simulate mouse movement
      manager.updateMouse(0.2, 0.8);
      
      // Simulate frame updates
      for (let i = 0; i < 10; i++) {
        manager.update(i * 0.016); // 60fps
      }
      
      // Verify all materials were created and updated
      expect(LiquidGlassShader.createMaterial).toHaveBeenCalledTimes(16);
      expect(LiquidGlassShader.updateMaterial).toHaveBeenCalledTimes(160); // 16 materials * 10 updates
      
      // Clean up
      manager.dispose();
      expect(mockMaterial.dispose).toHaveBeenCalledTimes(16);
    });

    it('should handle material replacement', () => {
      const pieceId = 'replaceable-piece';
      
      // Create initial material
      const firstMaterial = manager.createPieceMaterial(pieceId, 'white');
      expect(manager.getMaterial(pieceId)).toBe(firstMaterial);
      
      // Replace with new material (simulating piece promotion)
      const secondMaterial = manager.createPieceMaterial(pieceId, 'black');
      expect(manager.getMaterial(pieceId)).toBe(secondMaterial);
      
      // Should still only have one material for this ID
      manager.update(0);
      expect(LiquidGlassShader.updateMaterial).toHaveBeenCalledTimes(1);
    });
  });
});