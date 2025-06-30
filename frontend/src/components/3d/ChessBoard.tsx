import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { ChessPiece } from './ChessPiece';


interface ChessBoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  controlMode?: 'camera' | 'first-person';
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  controlMode = 'camera'
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Mesh>(null);
  
  const { 
    chessBoard, 
    selectedSquare, 
    possibleMoves, 
    selectSquare,
    isMyTurn 
  } = useGameStore();

  // Create board squares
  const squares = useMemo(() => {
    const squareElements = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (rank + file) % 2 === 0;
        const square = String.fromCharCode(97 + file) + (8 - rank);
        const isSelected = selectedSquare === square;
        const isPossibleMove = possibleMoves.includes(square);
        
        squareElements.push(
          <Square
            key={square}
            position={[file - 3.5, 0.11, rank - 3.5]}
            isLight={isLight}
            isSelected={isSelected}
            isPossibleMove={isPossibleMove}
            square={square}
            onClick={() => selectSquare(square)}
            interactive={isMyTurn}
          />
        );
      }
    }
    
    return squareElements;
  }, [selectedSquare, possibleMoves, selectSquare, isMyTurn]);

  // Create pieces
  const pieces = useMemo(() => {
    if (!chessBoard?.pieces) return [];
    
    return Object.entries(chessBoard.pieces).map(([square, piece]) => {
      const file = square.charCodeAt(0) - 97;
      const rank = 8 - parseInt(square[1]);
      console.log('Rendering piece:', piece, 'at square:', square); // Debug log
      return (
        <ChessPiece
          key={square}
          piece={piece}
          position={[file - 3.5, 0.5, rank - 3.5]}
          square={square}
          isSelected={selectedSquare === square}
          onClick={() => selectSquare(square)}
          interactive={isMyTurn}
        />
      );
    });
  }, [chessBoard?.pieces, selectedSquare, selectSquare, isMyTurn]);

  // Border material for the board frame
  const borderMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#654321', // Darker brown for border
    roughness: 0.5,
    metalness: 0.2,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.0,
  }), []);

  useFrame((state) => {
    if (groupRef.current) {
      if (controlMode !== 'first-person') {
        // Subtle floating animation - disabled in first person mode
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      } else {
        // Keep board at fixed position in first person mode
        groupRef.current.position.y = position[1];
      }
    }
  });

  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Board base */}
      <mesh ref={boardRef} receiveShadow>
        <boxGeometry args={[9, 0.2, 9]} />
        <primitive object={borderMaterial} />
      </mesh>
      
      {/* Squares - positioned above the base */}
      {squares}
      
      {/* Pieces */}
      {pieces}
      
      {/* Coordinate labels */}
      {/* Files (a-h) - Bottom */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`file-bottom-${i}`}
          position={[i - 3.5, 0.3, -4.2]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {String.fromCharCode(97 + i)}
        </Text>
      ))}
      
      {/* Files (a-h) - Top */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`file-top-${i}`}
          position={[i - 3.5, 0.3, 4.2]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          rotation={[0, Math.PI, 0]}
        >
          {String.fromCharCode(97 + i)}
        </Text>
      ))}
      
      {/* Ranks (1-8) - Left */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`rank-left-${i}`}
          position={[-4.2, 0.3, i - 3.5]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          rotation={[0, Math.PI / 2, 0]}
        >
          {8 - i}
        </Text>
      ))}
      
      {/* Ranks (1-8) - Right */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`rank-right-${i}`}
          position={[4.2, 0.3, i - 3.5]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          rotation={[0, -Math.PI / 2, 0]}
        >
          {8 - i}
        </Text>
      ))}
    </group>
  );
};

// Square component
interface SquareProps {
  position: [number, number, number];
  isLight: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  square: string;
  onClick: () => void;
  interactive: boolean;
}

const Square: React.FC<SquareProps> = ({
  position,
  isLight,
  isSelected,
  isPossibleMove,
  onClick,
  interactive
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = useMemo(() => {
    let color = isLight ? '#ffffff' : '#000000'; // Classic white and black chess board colors
    
    if (isSelected) {
      color = '#7dd3fc'; // Light blue for selected square
    } else if (isPossibleMove) {
      color = '#22c55e'; // Green for possible moves
    }
    
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.8,
    });
  }, [isLight, isSelected, isPossibleMove]);

  useFrame((state) => {
    if (meshRef.current && (isSelected || isPossibleMove)) {
      // Subtle glow animation for interactive squares
      const intensity = 0.95 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      meshRef.current.scale.setScalar(intensity);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1] + 0.01, position[2]]} // Adjust Y position for elevation
      onClick={interactive ? onClick : undefined}
      onPointerEnter={(e) => {
        if (interactive) {
          e.object.scale.setScalar(1.05);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerLeave={(e) => {
        if (interactive) {
          e.object.scale.setScalar(1.0);
          document.body.style.cursor = 'default';
        }
      }}
    >
      <boxGeometry args={[0.9, 0.02, 0.9]} /> {/* Changed to boxGeometry with small height */}
      <primitive object={material} />
    </mesh>
  );
};
