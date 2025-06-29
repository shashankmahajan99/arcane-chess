import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1 
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
            position={[file - 3.5, 0.01, rank - 3.5]}
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

  // Board materials
  const boardMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8B4513',
    roughness: 0.8,
    metalness: 0.1,
  }), []);

  const borderMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#654321',
    roughness: 0.6,
    metalness: 0.2,
  }), []);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
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
      
      {/* Board surface */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[8, 0.02, 8]} />
        <primitive object={boardMaterial} />
      </mesh>
      
      {/* Squares */}
      {squares}
      
      {/* Pieces */}
      {pieces}
      
      {/* Coordinate labels */}
      {/* Files (a-h) */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`file-${i}`}
          position={[i - 3.5, 0.3, -4.2]}
          fontSize={0.2}
          color="#654321"
          anchorX="center"
          anchorY="middle"
        >
          {String.fromCharCode(97 + i)}
        </Text>
      ))}
      
      {/* Ranks (1-8) */}
      {Array.from({ length: 8 }, (_, i) => (
        <Text
          key={`rank-${i}`}
          position={[-4.2, 0.3, i - 3.5]}
          fontSize={0.2}
          color="#654321"
          anchorX="center"
          anchorY="middle"
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
    let color = isLight ? '#F0D9B5' : '#B58863';
    
    if (isSelected) {
      color = '#7dd3fc';
    } else if (isPossibleMove) {
      color = '#22c55e';
    }
    
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.1,
      transparent: isPossibleMove,
      opacity: isPossibleMove ? 0.8 : 1.0,
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
      position={position}
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
      <planeGeometry args={[0.9, 0.9]} />
      <primitive object={material} />
    </mesh>
  );
};
