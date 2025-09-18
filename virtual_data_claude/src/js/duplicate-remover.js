/**
 * 중복 플레이어 제거 모듈
 * 앱 시작 시 로컬 데이터를 검사하여 중복된 플레이어를 실제 제거
 *
 * @version 3.4.2
 * @date 2025-09-18
 */

/**
 * UI 잠금 및 진행 상황 표시 함수
 */
function showDuplicateRemovalProgress(message) {
    console.log(message);

    // UI 잠금
    const lockUI = () => {
        // 모든 버튼과 입력 필드 비활성화
        const buttons = document.querySelectorAll('button, input, select, textarea');
        buttons.forEach(element => {
            element.disabled = true;
            element.style.opacity = '0.5';
        });
    };

    // 로깅 모달 표시 (기존 스낵바 시스템 활용)
    if (window.actionHistory && window.actionHistory.showSnackbar) {
        window.actionHistory.showSnackbar(
            '🔍 중복 플레이어 검사 중... 잠시만 기다려주세요',
            null,
            'info',
            10000 // 10초간 표시
        );
    }

    lockUI();
}

function hideDuplicateRemovalProgress() {
    // UI 잠금 해제
    const unlockUI = () => {
        const buttons = document.querySelectorAll('button, input, select, textarea');
        buttons.forEach(element => {
            element.disabled = false;
            element.style.opacity = '';
        });
    };

    unlockUI();
}

/**
 * 중복 플레이어의 정의:
 * - 같은 테이블(table) + 같은 이름(name) + 같은 좌석(seat) = 중복
 * - 칩(chips)은 무관
 * - 첫 번째 발견된 플레이어만 유지하고 나머지는 삭제
 *
 * 예시:
 * Table1/Player1/Seat1 (유지)
 * Table1/Player1/Seat1 (삭제 - 완전 중복)
 * Table1/Player1/Seat2 (유지 - 다른 좌석이므로 중복 아님)
 * Table2/Player1/Seat1 (유지 - 다른 테이블)
 */
async function removeDuplicatePlayers() {
    console.log('[DuplicateRemover] 중복 플레이어 검사 시작...');

    // 🔒 UI 잠금 및 로깅 모달 표시
    showDuplicateRemovalProgress('[DuplicateRemover] 중복 플레이어 검사 시작...');

    try {
        // 🔍 모든 가능한 데이터 소스 확인
        console.log('[DuplicateRemover] 📊 데이터 소스 분석:');
        console.log('  window.state:', !!window.state);
        console.log('  window.state.playerDataByTable:', !!(window.state && window.state.playerDataByTable));
        console.log('  window.state.allPlayers:', !!(window.state && window.state.allPlayers));
        console.log('  window.playerData:', !!window.playerData);
        console.log('  window.state.players:', !!(window.state && window.state.players));
        console.log('  window.state.originalPlayerData:', !!(window.state && window.state.originalPlayerData));
        console.log('  window.state.rawPlayerData:', !!(window.state && window.state.rawPlayerData));

        if (window.state && window.state.playerDataByTable) {
            console.log('  playerDataByTable 테이블 수:', Object.keys(window.state.playerDataByTable).length);
            Object.entries(window.state.playerDataByTable).forEach(([table, players]) => {
                console.log(`    ${table}: ${Array.isArray(players) ? players.length : 0}명`);
            });
        }

        if (!window.state) {
            console.warn('[DuplicateRemover] window.state가 없음');
            return { success: false, message: 'window.state 없음' };
        }

        // 🔍 Apps Script URL 확인
        if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) {
            console.warn('[DuplicateRemover] APPS_SCRIPT_URL이 없어서 원본 데이터 가져올 수 없음');
            return { success: false, message: 'APPS_SCRIPT_URL 없음' };
        }

        // 🔍 Google Sheets에서 원본 데이터 직접 가져오기
        console.log('[DuplicateRemover] Google Sheets에서 원본 데이터 가져오는 중...');

        const formData = new FormData();
        formData.append('action', 'getAllPlayers'); // 모든 플레이어 데이터 요청

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            console.error('[DuplicateRemover] 원본 데이터 가져오기 실패:', result.message);

            // 폴백: 로컬 데이터 사용하되 중복 검사 로직 강화
            console.log('[DuplicateRemover] 🔄 로컬 데이터로 폴백...');
            showDuplicateRemovalProgress('로컬 데이터로 폴백하여 중복 검사 중...');

            return await analyzeLocalDataForDuplicates();
        }

        const allPlayers = result.players || [];
        console.log('[DuplicateRemover] ✅ Google Sheets에서 원본 데이터 가져옴');
        showDuplicateRemovalProgress(`Google Sheets에서 ${allPlayers.length}명 데이터 가져옴`);

        console.log(`[DuplicateRemover] 로컬 데이터 로드 완료: ${allPlayers.length}명`);

        // 🔍 데이터 구조 분석을 위한 샘플 출력
        console.log('[DuplicateRemover] 📊 데이터 샘플 (처음 10명):');
        allPlayers.slice(0, 10).forEach((player, idx) => {
            console.log(`  ${idx+1}. table:"${player.table}" name:"${player.name}" seat:"${player.seat}" originalSeat:"${player.originalSeat}" chips:"${player.chips}"`);
        });

        // 🔍 전체 플레이어 이름만 출력 (중복 확인용)
        console.log('[DuplicateRemover] 📋 전체 플레이어 이름 목록:');
        const nameList = allPlayers.map(p => `${p.table}/${p.name}`);
        console.log(nameList.join(', '));

        // 중복 검사
        const seen = new Map(); // key: "table|name|seat", value: 첫 번째 플레이어
        const duplicatePlayers = [];

        allPlayers.forEach((player) => {
            // 유효한 데이터인지 확인
            if (!player.Table || !player.player) {
                return; // 빈 데이터는 건너뛰기
            }

            // 중복 검사: 테이블 + 이름 + 좌석
            const key = `${player.Table}|${player.player}|${player.Seat || ''}`;

            console.log(`[DuplicateRemover] 🔍 검사 중: key="${key}"`);

            if (seen.has(key)) {
                // 중복 발견
                duplicatePlayers.push(player);
                console.log(`[DuplicateRemover] ❌ 중복 발견: ${player.Table} - ${player.player} - Seat${player.Seat}`);
            } else {
                // 첫 번째 발견
                seen.set(key, player);
                console.log(`[DuplicateRemover] ✅ 첫 번째: key="${key}" 등록`);
            }
        });

        if (duplicatePlayers.length === 0) {
            console.log('[DuplicateRemover] 중복 플레이어 없음');
            return { success: true, message: '중복 없음', removedCount: 0 };
        }

        console.log(`[DuplicateRemover] 중복 플레이어 ${duplicatePlayers.length}명 발견`);

        if (duplicatePlayers.length > 0) {
            console.log('[DuplicateRemover] 🔍 발견된 중복 플레이어:');
            duplicatePlayers.forEach(player => {
                console.log(`  ❌ ${player.table} / ${player.name} / Seat${player.seat}`);
            });

            // APPS_SCRIPT_URL 확인
            if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) {
                console.warn('[DuplicateRemover] APPS_SCRIPT_URL이 없어서 삭제 불가능');
                return {
                    success: true,
                    message: `${duplicatePlayers.length}개 중복 발견 (삭제 불가)`,
                    removedCount: 0,
                    duplicatesFound: duplicatePlayers
                };
            }

            // 테이블별로 중복 제거 실행
            let totalRemoved = 0;
            const removedPlayers = [];

            // 테이블별로 그룹화
            const tableGroups = new Map();
            duplicatePlayers.forEach(player => {
                if (!tableGroups.has(player.table)) {
                    tableGroups.set(player.table, []);
                }
                tableGroups.get(player.table).push(player);
            });

            // 각 테이블별로 batchUpdate 실행
            for (const [table, tableDuplicates] of tableGroups) {
                console.log(`[DuplicateRemover] ${table} 테이블의 중복 ${tableDuplicates.length}개 제거 중...`);

                try {
                    // 해당 테이블의 전체 플레이어에서 중복 제거
                    const tableAllPlayers = allPlayers.filter(p => p.table === table);
                    const uniquePlayers = tableAllPlayers.filter(player => {
                        const key = `${player.table}|${player.name}|${player.seat || 0}`;
                        if (seen.has(key)) {
                            return seen.get(key) === player; // 첫 번째만 유지
                        }
                        return false;
                    });

                    // 삭제할 플레이어 이름 목록
                    const deletedNames = tableDuplicates.map(p => p.name);

                    // batchUpdate API 사용
                    const formData = new FormData();
                    formData.append('action', 'batchUpdate');
                    formData.append('table', table);
                    formData.append('players', JSON.stringify(uniquePlayers));
                    formData.append('deleted', JSON.stringify(deletedNames));

                    const response = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        totalRemoved += tableDuplicates.length;
                        removedPlayers.push(...tableDuplicates);
                        console.log(`[DuplicateRemover] ${table}: ${tableDuplicates.length}개 중복 제거 성공`);
                    } else {
                        console.error(`[DuplicateRemover] ${table} 업데이트 실패:`, result.message);
                    }
                } catch (error) {
                    console.error(`[DuplicateRemover] ${table} 오류:`, error);
                }
            }

            if (totalRemoved > 0) {
                console.log(`[DuplicateRemover] ✅ 총 ${totalRemoved}개 중복 플레이어 제거 완료`);

                // 제거된 플레이어 정보 출력
                console.log('[DuplicateRemover] 제거된 플레이어:');
                removedPlayers.forEach(player => {
                    console.log(`  - ${player.table} / ${player.name} / Seat${player.seat}`);
                });

                return {
                    success: true,
                    message: `${totalRemoved}개 중복 제거`,
                    removedCount: totalRemoved,
                    removedPlayers: removedPlayers
                };
            } else {
                return {
                    success: false,
                    message: '중복 제거 실패'
                };
            }
        }

    } catch (error) {
        console.error('[DuplicateRemover] 오류 발생:', error);
        return {
            success: false,
            message: error.message
        };
    } finally {
        // 작업 완료 후 UI 잠금 해제
        hideDuplicateRemovalProgress();
    }
}

/**
 * 로컬 데이터로 폴백하여 중복 분석
 */
async function analyzeLocalDataForDuplicates() {
    console.log('[DuplicateRemover] 📊 로컬 데이터 분석 시작...');

    try {
        const allPlayers = [];

        // playerDataByTable에서 데이터 수집
        if (window.state && window.state.playerDataByTable) {
            Object.entries(window.state.playerDataByTable).forEach(([table, players]) => {
                if (Array.isArray(players)) {
                    players.forEach(player => {
                        allPlayers.push({
                            ...player,
                            table: table
                        });
                    });
                }
            });
        }

        console.log(`[DuplicateRemover] 로컬 데이터 ${allPlayers.length}명 분석 중...`);
        showDuplicateRemovalProgress(`로컬 데이터 ${allPlayers.length}명 분석 중...`);

        // 중복 검사
        const seen = new Map();
        const duplicatePlayers = [];

        allPlayers.forEach((player) => {
            if (!player.table || !player.name) {
                return;
            }

            // 테이블 + 이름으로만 중복 검사 (좌석은 자동 할당되었을 수 있음)
            const key = `${player.table}|${player.name}`;

            console.log(`[DuplicateRemover] 🔍 로컬 검사: key="${key}"`);

            if (seen.has(key)) {
                duplicatePlayers.push(player);
                console.log(`[DuplicateRemover] ❌ 로컬 중복 발견: ${player.table} - ${player.name}`);
            } else {
                seen.set(key, player);
            }
        });

        if (duplicatePlayers.length === 0) {
            console.log('[DuplicateRemover] 로컬 데이터에서 중복 없음');
            return {
                success: true,
                message: '로컬 데이터에서 중복 없음',
                removedCount: 0
            };
        }

        console.log(`[DuplicateRemover] 로컬에서 ${duplicatePlayers.length}개 중복 발견`);
        showDuplicateRemovalProgress(`${duplicatePlayers.length}개 중복 발견됨 - 스킵 (로컬 데이터 한계)`);

        return {
            success: true,
            message: `로컬에서 ${duplicatePlayers.length}개 중복 발견 (제거 불가)`,
            removedCount: 0,
            duplicatesFound: duplicatePlayers
        };

    } catch (error) {
        console.error('[DuplicateRemover] 로컬 분석 오류:', error);
        return {
            success: false,
            message: '로컬 분석 실패'
        };
    }
}

/**
 * 로컬 데이터에서 중복 제거 (메모리상에서만)
 */
function removeDuplicatesFromLocalData(playerData) {
    if (!playerData || !Array.isArray(playerData)) {
        return playerData;
    }

    const seen = new Set();
    const filtered = [];

    playerData.forEach(player => {
        // 테이블/이름/좌석 모두 포함하여 중복 체크
        const key = `${player.table}|${player.name}|${player.seat || 0}`;
        if (!seen.has(key)) {
            seen.add(key);
            filtered.push(player);
        }
    });

    const removedCount = playerData.length - filtered.length;
    if (removedCount > 0) {
        console.log(`[DuplicateRemover] 로컬 데이터에서 ${removedCount}개 중복 제거`);
    }

    return filtered;
}

/**
 * 앱 초기화 시 자동 실행 (매 페이지 로드마다)
 */
function initDuplicateRemover() {
    console.log('[DuplicateRemover] 🔧 초기화... (매 새로고침마다 실행)');
    console.log('[DuplicateRemover] 스크립트 로드 시간:', new Date().toLocaleTimeString());

    // 매번 페이지 로드/새로고침 시 실행
    const runDuplicateCheck = async () => {
        console.log('[DuplicateRemover] 🚀 페이지 로드 감지 - 중복 검사 실행 시작');
        console.log('[DuplicateRemover] 현재 시간:', new Date().toLocaleTimeString());

        // window.state가 정의될 때까지 대기
        let attempts = 0;
        while ((!window.state || !window.state.playerDataByTable) && attempts < 20) {
            console.log('[DuplicateRemover] ⏳ window.state 대기 중... (시도: ' + (attempts + 1) + '/20)');
            console.log('[DuplicateRemover] window.state 상태:', !!window.state);
            console.log('[DuplicateRemover] playerDataByTable 상태:', !!(window.state && window.state.playerDataByTable));
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초로 증가
            attempts++;
        }

        if (!window.state || !window.state.playerDataByTable) {
            console.error('[DuplicateRemover] ❌ window.state를 찾을 수 없음 - 중복 검사 건너뜀');
            console.log('[DuplicateRemover] 최종 window.state:', window.state);
            return;
        }

        console.log('[DuplicateRemover] ✅ window.state 준비 완료');

        const result = await removeDuplicatePlayers();

        if (result.success) {
            if (result.removedCount > 0) {
                console.log(`[DuplicateRemover] 🧹 ${result.removedCount}명 중복 제거 완료`);

                // 스낵바로 알림
                if (window.actionHistory && window.actionHistory.showSnackbar) {
                    window.actionHistory.showSnackbar(
                        `🧹 중복 플레이어 ${result.removedCount}명 자동 제거됨`,
                        null,
                        'info'
                    );
                }

                // 데이터 새로고침
                if (typeof loadPlayerData === 'function') {
                    setTimeout(() => {
                        loadPlayerData();
                    }, 500);
                }
            } else {
                console.log('[DuplicateRemover] 중복 없음 - 시트가 깨끗합니다');
            }
        } else {
            console.warn('[DuplicateRemover] 중복 검사 실패:', result.message);
        }
    };

    // DOMContentLoaded 이벤트에 연결
    console.log('[DuplicateRemover] document.readyState:', document.readyState);

    if (document.readyState === 'loading') {
        console.log('[DuplicateRemover] DOM 로딩 중 - DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[DuplicateRemover] ✅ DOMContentLoaded 이벤트 발생 - 5초 후 실행 예약');
            // 다른 초기화가 완료되도록 충분히 대기
            setTimeout(() => {
                console.log('[DuplicateRemover] ⏰ 타이머 실행됨 - 중복 검사 시작');
                runDuplicateCheck();
            }, 5000); // 5초로 증가
        });
    } else {
        console.log('[DuplicateRemover] DOM 이미 로드됨 - 3초 후 실행 예약');
        // 이미 로드된 경우
        setTimeout(() => {
            console.log('[DuplicateRemover] ⏰ 타이머 실행됨 - 중복 검사 시작');
            runDuplicateCheck();
        }, 3000); // 3초로 증가
    }
}

// 전역 함수로 노출
window.removeDuplicatePlayers = removeDuplicatePlayers;
window.removeDuplicatesFromLocalData = removeDuplicatesFromLocalData;

// 모듈 자동 초기화
console.log('[DuplicateRemover] 📄 스크립트 파일 실행 중...');
initDuplicateRemover();
console.log('[DuplicateRemover] 📄 스크립트 파일 실행 완료');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        removeDuplicatePlayers,
        removeDuplicatesFromLocalData,
        initDuplicateRemover
    };
}