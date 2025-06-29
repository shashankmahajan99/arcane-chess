import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArenaSelector } from '../UI/ArenaSelector';

describe('ArenaSelector Component', () => {
  const mockOnArenaSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main title correctly', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      expect(screen.getByText('Choose Your Arena')).toBeInTheDocument();
    });

    it('should render all arena options', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      expect(screen.getByText('Classic Arena')).toBeInTheDocument();
      expect(screen.getByText('Mystic Realm')).toBeInTheDocument();
      expect(screen.getByText('Future City')).toBeInTheDocument();
    });

    it('should render arena descriptions', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      expect(screen.getByText('Experience chess in the classic environment')).toBeInTheDocument();
      expect(screen.getByText('Experience chess in the mystic environment')).toBeInTheDocument();
      expect(screen.getByText('Experience chess in the future environment')).toBeInTheDocument();
    });

    it('should render arena preview placeholders', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const previews = screen.getAllByText('Arena Preview');
      expect(previews).toHaveLength(3);
    });

    it('should render the quick match button', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      expect(screen.getByText('Quick Match (Classic Arena)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onArenaSelected when classic arena is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const classicArena = screen.getByText('Classic Arena');
      fireEvent.click(classicArena);
      
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'classic');
      expect(mockOnArenaSelected).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should call onArenaSelected when mystic arena is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const mysticArena = screen.getByText('Mystic Realm');
      fireEvent.click(mysticArena);
      
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'mystic');
      expect(mockOnArenaSelected).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should call onArenaSelected when future arena is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const futureArena = screen.getByText('Future City');
      fireEvent.click(futureArena);
      
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'future');
      expect(mockOnArenaSelected).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should call onArenaSelected when quick match button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const quickMatchButton = screen.getByText('Quick Match (Classic Arena)');
      fireEvent.click(quickMatchButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'classic');
      expect(mockOnArenaSelected).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple arena selections', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      // Click multiple arenas
      fireEvent.click(screen.getByText('Classic Arena'));
      fireEvent.click(screen.getByText('Mystic Realm'));
      fireEvent.click(screen.getByText('Future City'));
      
      expect(mockOnArenaSelected).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'classic');
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'mystic');
      expect(consoleSpy).toHaveBeenCalledWith('Selected arena:', 'future');
      
      consoleSpy.mockRestore();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct base styling classes', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const container = screen.getByText('Choose Your Arena').closest('div');
      expect(container).toHaveClass('min-h-screen', 'bg-gray-900', 'text-white');
    });

    it('should apply hover classes to arena cards', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const classicArenaCard = screen.getByText('Classic Arena').closest('div');
      expect(classicArenaCard).toHaveClass('hover:bg-gray-700', 'hover:border-blue-500');
    });

    it('should apply correct button styling', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const quickMatchButton = screen.getByText('Quick Match (Classic Arena)');
      expect(quickMatchButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    });

    it('should have responsive grid layout', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const grid = screen.getByText('Classic Arena').closest('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Choose Your Arena');
      
      const arenaHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(arenaHeadings).toHaveLength(3);
      expect(arenaHeadings[0]).toHaveTextContent('Classic Arena');
      expect(arenaHeadings[1]).toHaveTextContent('Mystic Realm');
      expect(arenaHeadings[2]).toHaveTextContent('Future City');
    });

    it('should have clickable elements with proper interaction', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      // Arena cards should be clickable
      const arenaCards = screen.getAllByText(/Arena|Realm|City/);
      arenaCards.forEach(card => {
        const cardElement = card.closest('div');
        expect(cardElement).toHaveClass('cursor-pointer');
      });
      
      // Quick match button should be properly labeled
      const quickMatchButton = screen.getByRole('button');
      expect(quickMatchButton).toHaveTextContent('Quick Match (Classic Arena)');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onArenaSelected prop gracefully', () => {
      // This test ensures the component doesn't crash if callback is undefined
      expect(() => {
        render(<ArenaSelector onArenaSelected={undefined as any} />);
      }).not.toThrow();
    });

    it('should not break when clicking arenas without callback', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<ArenaSelector onArenaSelected={undefined as any} />);
      
      expect(() => {
        fireEvent.click(screen.getByText('Classic Arena'));
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Structure', () => {
    it('should display correct arena data', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      // Verify each arena has the expected information
      const expectedArenas = [
        { name: 'Classic Arena', theme: 'classic' },
        { name: 'Mystic Realm', theme: 'mystic' },
        { name: 'Future City', theme: 'future' }
      ];
      
      expectedArenas.forEach(arena => {
        expect(screen.getByText(arena.name)).toBeInTheDocument();
        expect(screen.getByText(`Experience chess in the ${arena.theme} environment`)).toBeInTheDocument();
      });
    });

    it('should maintain consistent arena count', () => {
      render(<ArenaSelector onArenaSelected={mockOnArenaSelected} />);
      
      const arenaCards = screen.getAllByText('Arena Preview');
      expect(arenaCards).toHaveLength(3);
      
      const arenaHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(arenaHeadings).toHaveLength(3);
    });
  });
});