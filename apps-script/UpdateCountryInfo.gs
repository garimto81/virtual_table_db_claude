/**
 * Google Apps Script - Type 시트 국가 정보 업데이트 (1회성 스크립트)
 * 정확한 이름 매칭으로 J열(Country)과 K열(CountryVerified) 업데이트
 * 
 * Type 시트 구조:
 * A: Camera Preset
 * B: Player
 * C: Table
 * D: Notable
 * E: Chips
 * F: UpdatedAt
 * G: Seat
 * H: Status
 * I: pic (기존)
 * J: Country (추가)
 * K: CountryVerified (추가)
 */

// Players.csv 기반 정확한 매핑 데이터
const PLAYER_COUNTRY_MAP = {
  // 캐나다 (CA)
  'Denis Ouellette': 'CA',
  'Dominik Lavoie': 'CA',
  'Joel Kogan': 'CA',
  'Razi Khaddage': 'CA',
  'Altug Meydanli': 'CA',
  'Simon Marciano': 'CA',
  'Ronen Revizada': 'CA',
  'David Bonneau': 'CA',
  'Nicholas Thibodeau': 'CA',
  'David Barbosa': 'CA',
  'Patrick Cartier': 'CA',
  'Ian Monahoyios': 'CA',
  'Benjamin Menache': 'CA',
  'Vera Greenstein': 'CA',
  'Alain Couture': 'CA',
  'Simon Doyon': 'CA',
  'Eric Laliberte': 'CA',
  'Michael Zenetzis': 'CA',
  'Bianca Perron': 'CA',
  'Rong Xu': 'CA',
  'Dawn Schwemler': 'CA',
  'Cory Bath': 'CA',
  'Ralph Villeneuve': 'CA',
  'Andrew Anastasiades': 'CA',
  'Ofer Cohen': 'CA',
  'Sivaanjan Sivakumar': 'CA',
  'Donald Somers': 'CA',
  'Erica Freeman': 'CA',
  'Michael Saragossi': 'CA',
  'Ariel Sherker': 'CA',
  'Edward Bell': 'CA',
  'Mehdi Serrar': 'CA',
  'Tom Biasi-Gelb': 'CA',
  'Mathieu Boucher': 'CA',
  'Khaled Abdelhamid Ahmed': 'CA',
  'Ricardo Cermeno-Sandoval': 'CA',
  'Ardeshir Heidarijam': 'CA',
  'Jean-Luc Joseph': 'CA',
  'Benjamin Fortier Dion': 'CA',
  'Mathieu Pare': 'CA',
  'Haralambos Margaritis': 'CA',
  'Adam Doummar': 'CA',
  'Kevin Klun': 'CA',
  'Maxime Lemieux': 'CA',
  'Alessandro Guerrera': 'CA',
  'Bryan Robitaille-Fequet': 'CA',
  'Danny Landry': 'CA',
  
  // 일본 (JP)
  'Daisuke Watanabe': 'JP',
  
  // 이란 (IR)  
  'Kianoosh Haghighi': 'IR',
  
  // 프랑스 (FR)
  'Sami Ouladitto': 'FR',
  'Audrey Slama': 'FR'
};

/**
 * STEP 1: Type 시트에 Country 열 헤더 추가 (1회만 실행)
 */
function initializeCountryColumns() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
  if (!sheet) {
    console.error('Type 시트를 찾을 수 없습니다');
    return;
  }
  
  // 헤더 확인 및 추가 (J열과 K열)
  const headers = sheet.getRange(1, 1, 1, 11).getValues()[0];
  
  // J열: Country
  if (!headers[9] || headers[9] !== 'Country') {
    sheet.getRange(1, 10).setValue('Country');
    console.log('Country 열 추가됨 (J열)');
  }
  
  // K열: CountryVerified  
  if (!headers[10] || headers[10] !== 'CountryVerified') {
    sheet.getRange(1, 11).setValue('CountryVerified');
    console.log('CountryVerified 열 추가됨 (K열)');
  }
  
  // 헤더 스타일 설정
  sheet.getRange(1, 10, 1, 2)
    .setBackground('#f0f0f0')
    .setFontWeight('bold')
    .setBorder(true, true, true, true, true, true);
  
  return '✅ J열(Country), K열(CountryVerified) 헤더 추가 완료';
}

/**
 * STEP 2: Type 시트의 모든 플레이어 국가 정보 업데이트 (1회성 실행)
 */
function updateAllPlayerCountries() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
  if (!sheet) {
    console.error('Type 시트를 찾을 수 없습니다');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const batchUpdates = [];
  let matchCount = 0;
  let totalCount = 0;
  let skippedCount = 0;
  
  // 2행부터 시작 (1행은 헤더)
  for (let i = 1; i < data.length; i++) {
    const playerName = data[i][1]; // B열: Player
    if (!playerName || playerName.trim() === '') continue;
    
    totalCount++;
    
    // 이미 Country 정보가 있는 경우 스킵
    const existingCountry = data[i][9]; // J열: Country
    if (existingCountry && existingCountry.trim() !== '') {
      skippedCount++;
      console.log(`스킵: ${playerName} (기존: ${existingCountry})`);
      continue;
    }
    
    const country = PLAYER_COUNTRY_MAP[playerName.trim()];
    
    if (country) {
      // 국가 정보가 있는 경우
      batchUpdates.push({
        range: sheet.getRange(i + 1, 10), // J열
        value: country
      });
      batchUpdates.push({
        range: sheet.getRange(i + 1, 11), // K열
        value: 'TRUE'
      });
      matchCount++;
      
      console.log(`✅ ${playerName}: ${country}`);
    } else {
      // 매칭되지 않은 경우
      batchUpdates.push({
        range: sheet.getRange(i + 1, 10), // J열
        value: 'CA' // 기본값: 캐나다
      });
      batchUpdates.push({
        range: sheet.getRange(i + 1, 11), // K열
        value: 'FALSE'
      });
      
      console.log(`❌ ${playerName}: 매칭 없음 (기본값 CA 적용)`);
    }
  }
  
  // 배치 업데이트 실행
  if (batchUpdates.length > 0) {
    batchUpdates.forEach(update => {
      update.range.setValue(update.value);
    });
    
    // 타임스탬프 업데이트 (F열: UpdatedAt)
    const timestamp = new Date();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && !data[i][9]) { // 플레이어가 있고 Country가 비어있었던 경우
        sheet.getRange(i + 1, 6).setValue(timestamp);
      }
    }
  }
  
  // 결과 요약
  const summary = `
=== 국가 정보 업데이트 완료 ===
총 플레이어: ${totalCount}명
매칭 성공: ${matchCount}명
기본값 적용: ${totalCount - matchCount - skippedCount}명
이미 있음: ${skippedCount}명
매칭률: ${(matchCount/totalCount*100).toFixed(1)}%
`;
  
  console.log(summary);
  
  return {
    success: true,
    totalProcessed: totalCount,
    matched: matchCount,
    defaulted: totalCount - matchCount - skippedCount,
    skipped: skippedCount,
    matchRate: (matchCount/totalCount*100).toFixed(1) + '%',
    summary: summary
  };
}

/**
 * 특정 플레이어의 국가 정보 수동 업데이트 (필요시 사용)
 */
function updatePlayerCountry(playerName, countryCode) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
  if (!sheet) {
    return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === playerName) { // B열: Player
      sheet.getRange(i + 1, 10).setValue(countryCode); // J열: Country
      sheet.getRange(i + 1, 11).setValue('TRUE'); // K열: CountryVerified
      sheet.getRange(i + 1, 6).setValue(new Date()); // F열: UpdatedAt
      
      return {
        success: true,
        message: `${playerName}의 국가를 ${countryCode}로 업데이트했습니다`,
        row: i + 1
      };
    }
  }
  
  return {success: false, message: '플레이어를 찾을 수 없습니다'};
}

/**
 * 국가별 통계 가져오기 (J열 기준)
 */
function getCountryStatistics() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
  if (!sheet) {
    return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
  }
  
  const data = sheet.getDataRange().getValues();
  const stats = {};
  const players = [];
  const unverifiedPlayers = [];
  
  for (let i = 1; i < data.length; i++) {
    const playerName = data[i][1]; // B열: Player
    const country = data[i][9] || 'CA'; // J열: Country (기본값 CA)
    const verified = data[i][10]; // K열: CountryVerified
    const chips = data[i][4] || 0; // E열: Chips
    const status = data[i][7] || 'IN'; // H열: Status
    
    if (playerName && status === 'IN') {
      // 통계 집계
      if (!stats[country]) {
        stats[country] = {
          count: 0,
          totalChips: 0,
          verifiedCount: 0,
          players: []
        };
      }
      
      stats[country].count++;
      stats[country].totalChips += parseInt(chips);
      if (verified === 'TRUE') {
        stats[country].verifiedCount++;
      } else {
        unverifiedPlayers.push(playerName);
      }
      stats[country].players.push(playerName);
      
      // 플레이어 목록
      players.push({
        name: playerName,
        country: country,
        chips: chips,
        verified: verified === 'TRUE'
      });
    }
  }
  
  // 평균 계산 및 정렬
  const sortedStats = Object.entries(stats)
    .map(([country, data]) => ({
      country,
      flag: getCountryFlag(country),
      count: data.count,
      verifiedCount: data.verifiedCount,
      totalChips: data.totalChips,
      avgChips: Math.round(data.totalChips / data.count),
      players: data.players
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    success: true,
    stats: sortedStats,
    totalPlayers: players.length,
    countries: Object.keys(stats).length,
    unverifiedPlayers: unverifiedPlayers
  };
}

/**
 * 1회성 실행 메인 함수 - 이것만 실행하면 됨!
 */
function runOneTimeCountryUpdate() {
  console.log('=== 1회성 국가 정보 업데이트 시작 ===');
  
  // Step 1: 헤더 초기화
  console.log('Step 1: 헤더 초기화...');
  const headerResult = initializeCountryColumns();
  console.log(headerResult);
  
  // Step 2: 국가 정보 업데이트
  console.log('\nStep 2: 국가 정보 업데이트...');
  const updateResult = updateAllPlayerCountries();
  
  // Step 3: 통계 출력
  console.log('\nStep 3: 통계 확인...');
  const stats = getCountryStatistics();
  
  if (stats.success) {
    console.log('\n=== 국가별 현황 ===');
    stats.stats.forEach(stat => {
      console.log(`${stat.flag} ${stat.country}: ${stat.count}명 (검증: ${stat.verifiedCount}명)`);
    });
    
    if (stats.unverifiedPlayers.length > 0) {
      console.log('\n=== 미검증 플레이어 ===');
      console.log(stats.unverifiedPlayers.join(', '));
    }
  }
  
  return updateResult;
}

/**
 * 테스트 함수 (실행 전 확인용)
 */
function testCountryMapping() {
  console.log('=== 국가 매핑 테스트 ===');
  
  const testNames = [
    'Daisuke Watanabe',
    'Kianoosh Haghighi',
    'Denis Ouellette',
    'Sami Ouladitto',
    'Unknown Player'
  ];
  
  testNames.forEach(name => {
    const country = PLAYER_COUNTRY_MAP[name] || 'CA (기본값)';
    const flag = getCountryFlag(country);
    console.log(`${flag} ${name}: ${country}`);
  });
  
  console.log(`\n총 ${Object.keys(PLAYER_COUNTRY_MAP).length}명의 매핑 데이터 준비됨`);
  
  return 'Test complete';
}

/**
 * 메뉴 추가 (선택사항)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('국가 정보 관리')
    .addItem('Country 열 초기화', 'initializeCountryColumns')
    .addItem('모든 플레이어 국가 업데이트', 'updateAllPlayerCountries')
    .addItem('통계 보기', 'showCountryStats')
    .addSeparator()
    .addItem('테스트', 'testCountryMapping')
    .addToUi();
}

/**
 * 통계 표시 (UI)
 */
function showCountryStats() {
  const result = getCountryStatistics();
  if (!result.success) {
    SpreadsheetApp.getUi().alert(result.message);
    return;
  }
  
  let message = '=== 국가별 통계 ===\n\n';
  result.stats.forEach(stat => {
    const flag = getCountryFlag(stat.country);
    message += `${flag} ${stat.country}: ${stat.count}명 (평균 ${stat.avgChips} 칩)\n`;
  });
  
  message += `\n총 ${result.totalPlayers}명, ${result.countries}개국`;
  
  SpreadsheetApp.getUi().alert(message);
}

/**
 * 국가 플래그 가져오기
 */
function getCountryFlag(countryCode) {
  const flags = {
    'CA': '🇨🇦',
    'US': '🇺🇸',
    'KR': '🇰🇷',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'FR': '🇫🇷',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'IR': '🇮🇷',
    'UNKNOWN': '❓'
  };
  return flags[countryCode] || '🌍';
}