import { TournamentService } from '../../services/tournament.service';
import { supabase } from '../../config/supabase';

describe('Tournament Integration Tests', () => {
  const service = new TournamentService();
  let testTournamentId: string;

  beforeAll(async () => {
    // 테스트 환경 설정
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'test@ggproduction.net',
      password: 'TestPassword123!'
    });
    
    if (!session) {
      throw new Error('Authentication failed');
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testTournamentId) {
      await supabase
        .from('tournaments')
        .delete()
        .eq('id', testTournamentId);
    }
    
    await supabase.auth.signOut();
  });

  test('should create a tournament', async () => {
    const tournamentData = {
      tournament_name: 'Test Tournament',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(),
      venue: 'Test Venue',
      buy_in: 1000000,
      starting_chips: 10000,
      status: 'upcoming' as const
    };

    const tournament = await service.createTournament(tournamentData);
    
    expect(tournament).toBeDefined();
    expect(tournament.tournament_name).toBe('Test Tournament');
    
    testTournamentId = tournament.id;
  });

  test('should create tables for tournament', async () => {
    const tableData = {
      tournament_id: testTournamentId,
      table_number: 1,
      table_name: 'Table 1',
      status: 'waiting' as const,
      small_blind: 50,
      big_blind: 100,
      ante: 0,
      hands_played: 0
    };

    const table = await service.createTable(tableData);
    
    expect(table).toBeDefined();
    expect(table.table_number).toBe(1);
  });

  test('should get all tables for tournament', async () => {
    const tables = await service.getTables(testTournamentId);
    
    expect(tables).toHaveLength(1);
    expect(tables[0].table_name).toBe('Table 1');
  });
});