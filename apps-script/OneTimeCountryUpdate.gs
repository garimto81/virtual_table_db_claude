/**
 * Google Apps Script - Type 시트 국가 정보 1회성 업데이트
 * J열(Country)과 K열(CountryVerified)에 데이터 입력
 * 
 * 실행 방법:
 * 1. runOneTimeCountryUpdate() 함수 실행
 */

const SHEET_ID = '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U';

// 플레이어-국가 매핑 데이터
const PLAYER_COUNTRY_MAP = {
  // 캐나다 (CA) - 50명
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
  
  // 일본 (JP) - 1명
  'Daisuke Watanabe': 'JP',
  
  // 이란 (IR) - 1명
  'Kianoosh Haghighi': 'IR',
  
  // 프랑스 (FR) - 2명
  'Sami Ouladitto': 'FR',
  'Audrey Slama': 'FR'
};

/**
 * 메인 실행 함수 - 이것만 실행하면 됨!
 */
function runOneTimeCountryUpdate() {
  try {
    console.log('=== 1회성 국가 정보 업데이트 시작 ===');
    console.log(new Date().toLocaleString('ko-KR'));
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
    if (!sheet) {
      throw new Error('Type 시트를 찾을 수 없습니다');
    }
    
    // Step 1: 헤더 확인 및 추가
    console.log('\n[Step 1] 헤더 확인...');
    const headers = sheet.getRange(1, 1, 1, 11).getValues()[0];
    
    if (!headers[9] || headers[9] !== 'Country') {
      sheet.getRange(1, 10).setValue('Country');
      sheet.getRange(1, 10).setBackground('#f0f0f0').setFontWeight('bold');
      console.log('✅ J열에 Country 헤더 추가됨');
    }
    
    if (!headers[10] || headers[10] !== 'CountryVerified') {
      sheet.getRange(1, 11).setValue('CountryVerified');
      sheet.getRange(1, 11).setBackground('#f0f0f0').setFontWeight('bold');
      console.log('✅ K열에 CountryVerified 헤더 추가됨');
    }
    
    // Step 2: 데이터 업데이트
    console.log('\n[Step 2] 플레이어 국가 정보 업데이트...');
    const data = sheet.getDataRange().getValues();
    let updateCount = 0;
    let skipCount = 0;
    let defaultCount = 0;
    const timestamp = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const playerName = data[i][1]; // B열: Player
      
      // 빈 행 건너뛰기
      if (!playerName || playerName.toString().trim() === '') {
        continue;
      }
      
      // 이미 Country가 있으면 건너뛰기
      const existingCountry = data[i][9]; // J열
      if (existingCountry && existingCountry.toString().trim() !== '') {
        skipCount++;
        console.log(`⏩ 스킵: ${playerName} (기존: ${existingCountry})`);
        continue;
      }
      
      // 국가 매핑 확인
      const country = PLAYER_COUNTRY_MAP[playerName.toString().trim()];
      
      if (country) {
        // 매칭 성공
        sheet.getRange(i + 1, 10).setValue(country); // J열
        sheet.getRange(i + 1, 11).setValue('TRUE'); // K열
        sheet.getRange(i + 1, 6).setValue(timestamp); // F열: UpdatedAt
        updateCount++;
        console.log(`✅ ${playerName} → ${country}`);
      } else {
        // 매칭 실패 - 기본값 적용
        sheet.getRange(i + 1, 10).setValue('CA'); // J열: 기본값 캐나다
        sheet.getRange(i + 1, 11).setValue('FALSE'); // K열
        sheet.getRange(i + 1, 6).setValue(timestamp); // F열: UpdatedAt
        defaultCount++;
        console.log(`⚠️ ${playerName} → CA (기본값)`);
      }
    }
    
    // Step 3: 결과 요약
    console.log('\n=== 업데이트 완료 ===');
    console.log(`✅ 매칭 성공: ${updateCount}명`);
    console.log(`⚠️ 기본값 적용: ${defaultCount}명`);
    console.log(`⏩ 스킵 (기존 데이터): ${skipCount}명`);
    console.log(`📊 전체: ${updateCount + defaultCount + skipCount}명`);
    
    // Step 4: 국가별 통계
    console.log('\n=== 국가별 통계 ===');
    const stats = getCountryStatistics();
    if (stats.success) {
      stats.stats.forEach(stat => {
        console.log(`${stat.flag} ${stat.country}: ${stat.count}명 (검증: ${stat.verifiedCount}명)`);
      });
    }
    
    return {
      success: true,
      updated: updateCount,
      defaulted: defaultCount,
      skipped: skipCount,
      total: updateCount + defaultCount + skipCount
    };
    
  } catch (error) {
    console.error('오류 발생:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 국가별 통계 조회
 */
function getCountryStatistics() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Type');
    if (!sheet) {
      return {success: false, message: 'Type 시트를 찾을 수 없습니다'};
    }
    
    const data = sheet.getDataRange().getValues();
    const stats = {};
    
    for (let i = 1; i < data.length; i++) {
      const playerName = data[i][1]; // B열: Player
      const country = data[i][9] || 'UNKNOWN'; // J열: Country
      const verified = data[i][10]; // K열: CountryVerified
      const status = data[i][7]; // H열: Status
      
      if (playerName && status === 'IN') {
        if (!stats[country]) {
          stats[country] = {
            count: 0,
            verifiedCount: 0
          };
        }
        
        stats[country].count++;
        if (verified === 'TRUE') {
          stats[country].verifiedCount++;
        }
      }
    }
    
    const sortedStats = Object.entries(stats)
      .map(([country, data]) => ({
        country,
        flag: getCountryFlag(country),
        count: data.count,
        verifiedCount: data.verifiedCount
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      success: true,
      stats: sortedStats
    };
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return {success: false, error: error.toString()};
  }
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

/**
 * 테스트 함수
 */
function testMapping() {
  console.log('=== 매핑 테스트 ===');
  
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
}