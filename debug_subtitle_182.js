// 핸드 #182 자막 생성 디버깅 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🔍 핸드 #182 자막 생성 디버깅 시작...');

// 1. Hand 시트 CSV 데이터 직접 확인
async function debugHand182() {
  try {
    console.log('📥 Hand 시트 CSV 데이터 로드 중...');
    const response = await fetch(CONFIG.CSV_HAND_URL + '&t=' + Date.now());
    const text = await response.text();
    const rows = parseCSV(text);

    console.log(`📊 총 행 수: ${rows.length}`);

    // 핸드 182 관련 행들 필터링
    const hand182Rows = rows.filter(row => row[1] === '182' || row[1] === 182);

    console.log(`🎯 핸드 #182 관련 행 수: ${hand182Rows.length}`);
    console.log('📋 핸드 #182 관련 행들:', hand182Rows);

    // HAND 행 찾기
    const handRow = hand182Rows.find(row => row[0] === 'HAND');
    if (handRow) {
      console.log('🎲 HAND 행:', handRow);
      console.log(`   빅블라인드 (F열/5번): ${handRow[5]}`);
    } else {
      console.log('❌ HAND 행을 찾을 수 없음');
    }

    // PLAYER 행들 찾기
    const playerRows = hand182Rows.filter(row => row[0] === 'PLAYER');
    console.log(`👥 PLAYER 행 수: ${playerRows.length}`);

    playerRows.forEach((row, idx) => {
      console.log(`   플레이어 ${idx + 1}:`, {
        name: row[1],           // B열
        position: row[2],       // C열
        startStack: row[3],     // D열
        currentStack: row[4],   // E열
        cards: row[5],          // F열
        col6: row[6],           // G열
        col7: row[7],           // H열
        col8: row[8],           // I열
        isKeyPlayer: row[9],    // J열 (키플레이어)
        country: row[10]        // K열 (국가)
      });

      // 키 플레이어 확인
      if (row[9] === 'TRUE' || row[9] === 'True' || row[9] === 'true') {
        console.log(`🎯 키 플레이어 발견: ${row[1]} (${row[10]})`);
      }
    });

    return { hand182Rows, playerRows };

  } catch (error) {
    console.error('❌ 디버깅 오류:', error);
  }
}

// 2. 자막 생성 함수 직접 테스트
async function testSubtitle182() {
  try {
    console.log('\n🎬 자막 생성 함수 직접 테스트...');
    const subtitle = await generateSubtitle(182);
    console.log('✅ 자막 생성 결과:', subtitle);
    return subtitle;
  } catch (error) {
    console.error('❌ 자막 생성 오류:', error);
    return null;
  }
}

// 3. 전체 테스트 실행
async function runFullTest() {
  console.log('🚀 전체 디버깅 테스트 시작...\n');

  // Hand 시트 데이터 확인
  const debugResult = await debugHand182();

  console.log('\n' + '='.repeat(50));

  // 자막 생성 테스트
  const subtitleResult = await testSubtitle182();

  console.log('\n🏁 디버깅 완료!');
  console.log('📋 결과 요약:');
  console.log(`   - Hand 182 행 수: ${debugResult?.hand182Rows?.length || 0}`);
  console.log(`   - Player 행 수: ${debugResult?.playerRows?.length || 0}`);
  console.log(`   - 자막 생성: ${subtitleResult ? '성공' : '실패'}`);

  return {
    handData: debugResult,
    subtitle: subtitleResult
  };
}

// 실행 명령어들
console.log('\n📌 사용 가능한 명령어:');
console.log('1. debugHand182()     - Hand 시트 데이터 확인');
console.log('2. testSubtitle182()  - 자막 생성 테스트');
console.log('3. runFullTest()      - 전체 테스트 실행');
console.log('\n예시: runFullTest().then(console.log)');