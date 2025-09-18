/**
 * 관리 기능 진단 및 자동 수정 스크립트
 * 브라우저 콘솔에서 실행하여 문제를 진단하고 해결합니다
 */

console.log('🔍 관리 기능 진단 및 수정 시작...\n');
console.log('=' .repeat(50));

// 진단 결과 저장
const diagnosticResults = {
    htmlElements: {},
    functions: {},
    eventListeners: {},
    globalState: {},
    errors: []
};

// 1. HTML 요소 확인
console.log('\n📋 1단계: HTML 요소 확인');
console.log('-'.repeat(30));

const requiredElements = {
    'manage-players-btn': '관리 버튼',
    'registration-modal': '관리 모달',
    'management-menu': '관리 메뉴',
    'player-management-content': '플레이어 관리 컨텐츠',
    'current-players-list': '플레이어 목록',
    'open-table-management-btn': '테이블 관리 버튼',
    'add-player-btn': '플레이어 추가 버튼'
};

Object.entries(requiredElements).forEach(([id, name]) => {
    const element = document.getElementById(id);
    const exists = !!element;
    diagnosticResults.htmlElements[id] = exists;
    console.log(`${exists ? '✅' : '❌'} ${name} (${id}): ${exists ? '존재' : '없음'}`);
});

// 2. JavaScript 함수 확인
console.log('\n📋 2단계: JavaScript 함수 확인');
console.log('-'.repeat(30));

const requiredFunctions = {
    'openRegistrationModal': '모달 열기',
    'renderManagementPlayersList': '플레이어 목록 렌더링',
    'onManagementTableSelected': '테이블 선택 처리',
    'window.deleteLocalPlayer': '플레이어 삭제',
    'updateLocalPlayerChips': '칩 수정',
    'addNewPlayer': '플레이어 추가',
    'autoCloseManagementModal': '모달 자동 닫기'
};

Object.entries(requiredFunctions).forEach(([funcName, desc]) => {
    const funcPath = funcName.split('.');
    let func;

    if (funcPath.length > 1) {
        func = window[funcPath[0]] && window[funcPath[0]][funcPath[1]];
    } else {
        func = window[funcName] || eval(`typeof ${funcName} !== 'undefined' ? ${funcName} : undefined`);
    }

    const exists = typeof func === 'function';
    diagnosticResults.functions[funcName] = exists;
    console.log(`${exists ? '✅' : '❌'} ${desc} (${funcName}): ${exists ? '정의됨' : '미정의'}`);
});

// 3. 전역 상태 확인
console.log('\n📋 3단계: 전역 상태 확인');
console.log('-'.repeat(30));

const globalChecks = {
    'window.managementState': window.managementState,
    'window.state': window.state,
    'APPS_SCRIPT_URL': typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : undefined,
    'el.managePlayersBtn': typeof el !== 'undefined' && el.managePlayersBtn ? el.managePlayersBtn : undefined
};

Object.entries(globalChecks).forEach(([name, value]) => {
    const exists = !!value;
    diagnosticResults.globalState[name] = exists;
    console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? '존재' : '없음'}`);
    if (exists && name === 'APPS_SCRIPT_URL') {
        console.log(`   URL: ${value.substring(0, 50)}...`);
    }
});

// 4. 이벤트 리스너 확인
console.log('\n📋 4단계: 이벤트 리스너 확인');
console.log('-'.repeat(30));

const manageBtn = document.getElementById('manage-players-btn');
if (manageBtn) {
    // Chrome DevTools API 사용 (가능한 경우)
    if (typeof getEventListeners !== 'undefined') {
        const listeners = getEventListeners(manageBtn);
        const hasClickListener = listeners.click && listeners.click.length > 0;
        console.log(`${hasClickListener ? '✅' : '❌'} 관리 버튼 클릭 리스너: ${hasClickListener ? '연결됨' : '없음'}`);
    } else {
        console.log('⚠️ 이벤트 리스너 확인 불가 (Chrome DevTools에서 실행 필요)');
    }
}

// 5. 문제 자동 수정 시도
console.log('\n🔧 문제 자동 수정 시도');
console.log('-'.repeat(30));

let fixCount = 0;

// 5-1. managementState 초기화
if (!window.managementState) {
    window.managementState = {
        selectedTable: null,
        originalPlayers: [],
        currentPlayers: [],
        changes: { added: [], modified: [], deleted: [] }
    };
    console.log('✅ window.managementState 초기화 완료');
    fixCount++;
}

// 5-2. deleteLocalPlayer 전역 함수 확인
if (typeof window.deleteLocalPlayer !== 'function') {
    // renderManagementPlayersList 함수 내부에 정의된 deleteLocalPlayer를 찾아서 전역으로 노출
    if (typeof deleteLocalPlayer === 'function') {
        window.deleteLocalPlayer = deleteLocalPlayer;
        console.log('✅ deleteLocalPlayer 함수 전역 노출 완료');
        fixCount++;
    } else {
        console.log('⚠️ deleteLocalPlayer 함수를 찾을 수 없음');
    }
}

// 5-3. 관리 버튼 이벤트 리스너 재연결
if (manageBtn && typeof openRegistrationModal === 'function') {
    manageBtn.onclick = null; // 기존 이벤트 제거
    manageBtn.addEventListener('click', () => {
        console.log('관리 버튼 클릭됨');
        openRegistrationModal();
    });
    console.log('✅ 관리 버튼 이벤트 리스너 재연결 완료');
    fixCount++;
}

// 5-4. 모달 자동 닫기 함수 확인 및 수정
if (typeof autoCloseManagementModal !== 'function') {
    // 모달 자동 닫기 함수 정의
    window.autoCloseManagementModal = function() {
        console.log('[AutoClose] 모달 자동 닫기 시작...');
        setTimeout(() => {
            const modal = document.getElementById('registration-modal');
            if (modal) {
                modal.classList.add('hidden', 'opacity-0');
                console.log('[AutoClose] 모달 닫기 완료');
            }
        }, 2000);
    };
    console.log('✅ autoCloseManagementModal 함수 정의 완료');
    fixCount++;
}

// 6. 수동 테스트 함수 제공
console.log('\n🧪 수동 테스트 함수');
console.log('-'.repeat(30));

// 테스트 함수들을 전역으로 노출
window.testFunctions = {
    // 모달 열기
    openModal: function() {
        const modal = document.getElementById('registration-modal');
        if (modal) {
            modal.classList.remove('hidden', 'opacity-0');
            console.log('✅ 모달 열림');
            return true;
        }
        console.log('❌ 모달을 찾을 수 없음');
        return false;
    },

    // 모달 닫기
    closeModal: function() {
        const modal = document.getElementById('registration-modal');
        if (modal) {
            modal.classList.add('hidden', 'opacity-0');
            console.log('✅ 모달 닫힘');
            return true;
        }
        console.log('❌ 모달을 찾을 수 없음');
        return false;
    },

    // 플레이어 목록 렌더링
    renderPlayers: function() {
        if (typeof renderManagementPlayersList === 'function') {
            renderManagementPlayersList();
            console.log('✅ 플레이어 목록 렌더링 시도');
            return true;
        }
        console.log('❌ renderManagementPlayersList 함수 없음');
        return false;
    },

    // 테스트 플레이어 추가
    addTestPlayer: function() {
        if (window.managementState && window.managementState.currentPlayers) {
            window.managementState.currentPlayers.push({
                name: 'TestPlayer' + Date.now(),
                chips: 10000,
                seat: window.managementState.currentPlayers.length + 1,
                table: 'TestTable'
            });
            console.log('✅ 테스트 플레이어 추가됨');
            this.renderPlayers();
            return true;
        }
        console.log('❌ managementState가 초기화되지 않음');
        return false;
    },

    // 모달 자동 닫기 테스트
    testAutoClose: function() {
        this.openModal();
        console.log('⏱️ 2초 후 자동으로 닫힙니다...');
        if (typeof autoCloseManagementModal === 'function') {
            autoCloseManagementModal();
            return true;
        }
        console.log('❌ autoCloseManagementModal 함수 없음');
        return false;
    }
};

console.log('\n사용 가능한 테스트 함수:');
console.log('  testFunctions.openModal()     - 모달 열기');
console.log('  testFunctions.closeModal()    - 모달 닫기');
console.log('  testFunctions.renderPlayers() - 플레이어 목록 렌더링');
console.log('  testFunctions.addTestPlayer() - 테스트 플레이어 추가');
console.log('  testFunctions.testAutoClose() - 자동 닫기 테스트');

// 7. 최종 진단 결과
console.log('\n📊 진단 결과 요약');
console.log('='.repeat(50));

const htmlCount = Object.values(diagnosticResults.htmlElements).filter(v => v).length;
const funcCount = Object.values(diagnosticResults.functions).filter(v => v).length;
const stateCount = Object.values(diagnosticResults.globalState).filter(v => v).length;

console.log(`HTML 요소: ${htmlCount}/${Object.keys(diagnosticResults.htmlElements).length} ✅`);
console.log(`JS 함수: ${funcCount}/${Object.keys(diagnosticResults.functions).length} ✅`);
console.log(`전역 상태: ${stateCount}/${Object.keys(diagnosticResults.globalState).length} ✅`);
console.log(`자동 수정: ${fixCount}개 항목 수정됨`);

if (htmlCount === Object.keys(diagnosticResults.htmlElements).length &&
    funcCount === Object.keys(diagnosticResults.functions).length &&
    stateCount === Object.keys(diagnosticResults.globalState).length) {
    console.log('\n✅ 모든 체크 통과! 관리 기능이 정상 작동해야 합니다.');
} else {
    console.log('\n⚠️ 일부 문제가 남아있습니다. 페이지를 새로고침하거나 수동으로 수정이 필요할 수 있습니다.');
}

console.log('\n💡 팁: 관리 버튼을 클릭해보거나 testFunctions.openModal()을 실행해보세요.');

// 진단 결과 반환
diagnosticResults;