/**
 * 브라우저 콘솔에서 실행하는 빠른 테스트 스크립트
 * 메인 페이지(index.html)에서 실행하세요
 *
 * v1.8.1 업데이트: 중복 제거 모듈 구문 오류 수정 확인
 */

console.log('🚀 중복 제거 및 모달 자동 닫기 테스트 시작...\n');

// 1. 중복 제거 함수 확인
console.log('1️⃣ 중복 제거 함수 정의 확인:');
console.log('removeDuplicatePlayers:', typeof removeDuplicatePlayers === 'function' ? '✅' : '❌');
console.log('removeDuplicatesFromLocalData:', typeof removeDuplicatesFromLocalData === 'function' ? '✅' : '❌');
console.log('window.state.playerDataByTable:', !!(window.state && window.state.playerDataByTable) ? '✅' : '❌');

console.log('\n📋 모달 자동 닫기 함수 확인:');
console.log('autoCloseManagementModal:', typeof autoCloseManagementModal === 'function' ? '✅' : '❌');
console.log('disableModalUI:', typeof disableModalUI === 'function' ? '✅' : '❌');
console.log('enableModalUI:', typeof enableModalUI === 'function' ? '✅' : '❌');

// 2. 모달 요소 확인
console.log('\n2️⃣ 모달 요소 확인:');
const modal = document.getElementById('registration-modal');
console.log('registration-modal 존재:', modal ? '✅' : '❌');

// 3. 일괄 등록 시뮬레이션
console.log('\n3️⃣ 일괄 등록 시뮬레이션:');

function simulateBatchUpdate() {
    console.log('📝 일괄 등록 시작...');

    // 모달 열기
    if (modal) {
        modal.classList.remove('hidden', 'opacity-0');
        console.log('✅ 모달 열림');
    }

    // UI 비활성화
    disableModalUI();
    console.log('🔒 UI 비활성화됨');

    // 3초 후 성공 처리
    setTimeout(() => {
        console.log('✅ 서버 처리 완료!');

        // 자동 닫기 즉시 실행
        console.log('🚪 모달을 바로 닫습니다...');
        autoCloseManagementModal();
    }, 3000);
}

// 중복 제거 테스트 함수
function testDuplicateRemoval() {
    console.log('\n🧹 중복 제거 테스트 시작...');

    if (typeof removeDuplicatePlayers === 'function') {
        removeDuplicatePlayers().then(result => {
            console.log('중복 제거 결과:', result);
            if (result.removedCount > 0) {
                console.log(`✅ ${result.removedCount}명 중복 플레이어 제거됨`);
            } else {
                console.log('✅ 중복 플레이어 없음');
            }
        }).catch(error => {
            console.error('❌ 중복 제거 실패:', error);
        });
    } else {
        console.error('❌ removeDuplicatePlayers 함수가 정의되지 않음');
    }
}

// 테스트 명령어 안내
console.log('\n📌 사용 가능한 테스트 명령어:');
console.log('testDuplicateRemoval() - 중복 플레이어 제거 테스트');
console.log('simulateBatchUpdate() - 일괄 등록 시뮬레이션 (모달 열기 → UI 비활성화 → 3초 후 성공 → 즉시 닫기)');
console.log('autoCloseManagementModal() - 모달 즉시 자동 닫기');
console.log('disableModalUI() - UI 비활성화');
console.log('enableModalUI() - UI 활성화');

// 전역으로 노출
window.simulateBatchUpdate = simulateBatchUpdate;
window.testDuplicateRemoval = testDuplicateRemoval;

console.log('\n💡 팁: testDuplicateRemoval()로 중복 제거를 먼저 테스트하세요!');