import { TournamentService } from '../../services/tournament.service';
import { Tournament, TournamentTable } from '../../types/database.types';

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

describe('TournamentService Unit Tests', () => {
  let service: TournamentService;

  beforeEach(() => {
    service = new TournamentService();
    jest.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create a tournament successfully', async () => {
      const mockTournament: Tournament = {
        id: '123',
        tournament_name: 'Test Tournament',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        venue: 'Test Venue',
        buy_in: 1000,
        starting_chips: 10000,
        status: 'upcoming',
      };

      const { supabase } = require('../../config/supabase');
      supabase.from().single.mockResolvedValue({
        data: mockTournament,
        error: null,
      });

      const result = await service.createTournament({
        tournament_name: 'Test Tournament',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        venue: 'Test Venue',
        buy_in: 1000,
        starting_chips: 10000,
        status: 'upcoming',
      });

      expect(result).toEqual(mockTournament);
      expect(supabase.from).toHaveBeenCalledWith('tournaments');
    });

    it('should throw error when creation fails', async () => {
      const { supabase } = require('../../config/supabase');
      supabase.from().single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        service.createTournament({
          tournament_name: 'Test',
          start_date: '2024-01-01',
          end_date: '2024-01-02',
          venue: 'Test',
          buy_in: 1000,
          starting_chips: 10000,
          status: 'upcoming',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTables', () => {
    it('should return tables for a tournament', async () => {
      const mockTables: TournamentTable[] = [
        {
          id: '1',
          tournament_id: '123',
          table_number: 1,
          table_name: 'Table 1',
          status: 'active',
          small_blind: 50,
          big_blind: 100,
          ante: 0,
          hands_played: 10,
        },
      ];

      const { supabase } = require('../../config/supabase');
      supabase.from().order.mockResolvedValue({
        data: mockTables,
        error: null,
      });

      const result = await service.getTables('123');

      expect(result).toEqual(mockTables);
      expect(supabase.from).toHaveBeenCalledWith('tournament_tables');
    });

    it('should return empty array when no tables found', async () => {
      const { supabase } = require('../../config/supabase');
      supabase.from().order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getTables('123');

      expect(result).toEqual([]);
    });
  });
});