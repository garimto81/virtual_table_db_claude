/**
 * 중복 플레이어 자동 제거 시스템 v3.4.13
 * 페이지 로드 시 자동으로 중복 플레이어를 검출하고 삭제합니다.
 * 중복 조건: 같은 테이블 + 같은 이름 + 같은 좌석
 *
 * v3.4.12 변경사항:
 * - 로그 모달에 중복 검사 과정 실시간 표시
 * - 모든 검사 단계를 사용자가 시각적으로 확인 가능
 * - 검사 완료 후 3초 뒤 모달 자동 닫기로 UX 개선
 */

/**
 * 로그 출력 헬퍼 함수
 * @param {string} message - 로그 메시지
 */
function logDuplicateRemover(message) {
    console.log(message);

    // UI 로그에도 표시 (있는 경우)
    if (window.actionHistory && window.actionHistory.log) {
        window.actionHistory.log('DUPLICATE_REMOVER', message);
    }

    // 로그 모달에도 표시 (전역 함수 접근)
    if (window.logMessage && typeof window.logMessage === 'function') {
        window.logMessage(`[중복검사] ${message.replace(/\[DuplicateRemover[^\]]*\]/, '').trim()}`);
    }
}

/**
 * 메인 중복 제거 함수
 * @returns {Promise<Object>} 제거 결과
 */
async function removeDuplicatePlayers() {
    try {
        // 로그 모달 열기 및 진행 상황 표시 (전역 함수 접근)
        if (window.openLogModal && typeof window.openLogModal === 'function') {
            window.openLogModal();
            if (window.logMessage && typeof window.logMessage === 'function') {
                const logDisplay = document.getElementById('log-display');
                if (logDisplay) {
                    logDisplay.innerHTML = ''; // 기존 로그 클리어
                }
            }
        }

        logDuplicateRemover('[DuplicateRemover v3.4.13] 중복 검사 시작');

        // UI 차단하지 않음 - 백그라운드로 처리

        // 데이터 소스 확인
        if (!window.state || !window.state.playerDataByTable) {
            logDuplicateRemover('[DuplicateRemover] window.state.playerDataByTable이 없음');
            return { success: false, message: '플레이어 데이터 없음' };
        }

        // APPS_SCRIPT_URL 확인
        if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) {
            logDuplicateRemover('[DuplicateRemover] APPS_SCRIPT_URL이 없어서 원본 데이터 가져올 수 없음');
            logDuplicateRemover('[DuplicateRemover] 로컬 데이터로 폴백하여 중복 검사 중...');
            return await analyzeLocalDataForDuplicates();
        }

        // Google Sheets에서 원본 CSV 데이터 가져오기 (조용히)
        logDuplicateRemover('[DuplicateRemover] 서버 데이터 확인 중...');

        const formData = new FormData();
        formData.append('action', 'loadType'); // Type 시트 원본 데이터 요청

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success || !result.csvData) {
            logDuplicateRemover('[DuplicateRemover] 원본 데이터 가져오기 실패: ' + result.message);
            logDuplicateRemover('[DuplicateRemover] 로컬 데이터로 폴백하여 중복 검사 중...');
            return await analyzeLocalDataForDuplicates();
        }

        // 원본 CSV 데이터에서 중복 분석
        logDuplicateRemover('[DuplicateRemover] 📊 원본 데이터 분석 시작...');

        return await analyzeRawCsvData(result.csvData);

    } catch (error) {
        logDuplicateRemover('[DuplicateRemover] 중복 제거 중 오류: ' + error.message);
        return {
            success: false,
            message: `오류 발생: ${error.message}`,
            removedCount: 0
        };
    } finally {
        // 검사 완료 알림
        logDuplicateRemover('[DuplicateRemover v3.4.13] ✅ 검사 완료');

        // 3초 후 모달 자동 닫기 (전역 함수 접근)
        setTimeout(() => {
            if (window.closeLogModal && typeof window.closeLogModal === 'function') {
                window.closeLogModal();
            }
        }, 3000);
    }
}

/**
 * 원본 CSV 데이터에서 중복 분석
 * @param {string} csvData - Type 시트의 원본 CSV 데이터
 * @returns {Object} 중복 제거 결과
 */
async function analyzeRawCsvData(csvData) {
    try {
        logDuplicateRemover('[DuplicateRemover] 원본 CSV 데이터 파싱 시작...');

        // CSV 데이터를 라인별로 분할
        const lines = csvData.split('\n').filter(line => line.trim());
        logDuplicateRemover(`[DuplicateRemover] CSV 라인 수: ${lines.length}`);

        const duplicateGroups = new Map(); // key: table|name|seat, value: 배열 인덱스들
        const allRows = [];

        // 헤더 스킵하고 데이터 행만 처리
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));

            if (columns.length < 8) continue; // 최소 8개 컬럼 필요

            const player = columns[0] || '';
            const table = columns[1] || '';
            const seat = columns[6] || '';
            const status = (columns[7] || 'IN').toUpperCase();

            // IN 상태인 플레이어만 처리
            if (player && table && status === 'IN') {
                const key = `${table}|${player}|${seat}`;

                if (!duplicateGroups.has(key)) {
                    duplicateGroups.set(key, []);
                }
                duplicateGroups.get(key).push(i);
                allRows.push({ rowIndex: i, player, table, seat, line });

                logDuplicateRemover(`[DuplicateRemover] 원본 데이터: ${player} (${table}, 좌석: ${seat}) - 라인 ${i}`);
            }
        }

        // 중복 발견
        const duplicatesToRemove = [];
        duplicateGroups.forEach((rowIndices, key) => {
            if (rowIndices.length > 1) {
                logDuplicateRemover(`[DuplicateRemover] 🔍 원본에서 중복 발견: ${key} - ${rowIndices.length}개 행`);

                // 첫 번째만 남기고 나머지는 삭제 대상
                for (let i = 1; i < rowIndices.length; i++) {
                    const rowIndex = rowIndices[i];
                    const row = allRows.find(r => r.rowIndex === rowIndex);
                    if (row) {
                        duplicatesToRemove.push({
                            table: row.table,
                            name: row.player,
                            seat: row.seat,
                            rowIndex: row.rowIndex
                        });
                    }
                }
            }
        });

        if (duplicatesToRemove.length === 0) {
            logDuplicateRemover('[DuplicateRemover] 원본 CSV에서 중복 없음');
            showDuplicateRemovalProgress('원본 데이터 깨끗함 - 중복 없음');
            return {
                success: true,
                message: '원본 CSV에서 중복 없음',
                removedCount: 0
            };
        }

        logDuplicateRemover(`[DuplicateRemover] 원본에서 ${duplicatesToRemove.length}개 중복 발견`);
        showDuplicateRemovalProgress(`원본에서 ${duplicatesToRemove.length}개 중복 발견 - 구글 시트에서 삭제 중...`);

        // 실제 구글 시트에서 삭제
        const removalResults = await removeDuplicatesFromSheets(duplicatesToRemove);
        return removalResults;

    } catch (error) {
        console.error('[DuplicateRemover] 원본 CSV 분석 오류:', error);
        return await analyzeLocalDataForDuplicates();
    }
}

/**
 * 로컬 데이터에서 중복 분석 (폴백)
 * @returns {Object} 중복 분석 결과
 */
async function analyzeLocalDataForDuplicates() {
    try {
        logDuplicateRemover('[DuplicateRemover] 로컬 데이터로 폴백하여 중복 검사 중...');
        logDuplicateRemover('[DuplicateRemover] 📊 로컬 데이터 분석 시작...');

        const playerDataByTable = window.state.playerDataByTable;
        const tableNames = Object.keys(playerDataByTable);

        // 전체 플레이어 수 계산
        let totalPlayers = 0;
        tableNames.forEach(table => {
            const playerCount = playerDataByTable[table].length;
            totalPlayers += playerCount;
            logDuplicateRemover(`[DuplicateRemover]   ${table}: ${playerCount}명`);
        });

        logDuplicateRemover(`[DuplicateRemover] 로컬 데이터 ${totalPlayers}명 분석 중...`);

        const seen = new Map(); // key: "table|name|seat", value: 첫 번째 플레이어
        const duplicatePlayers = [];

        // 모든 테이블의 플레이어를 검사
        tableNames.forEach(table => {
            playerDataByTable[table].forEach(player => {
                const key = `${table}|${player.name}|${player.seat || ''}`;
                logDuplicateRemover(`[DuplicateRemover] 🔍 로컬 검사: key="${key}"`);

                if (seen.has(key)) {
                    // 중복 발견
                    duplicatePlayers.push({
                        table: table,
                        name: player.name,
                        seat: player.seat,
                        player: player
                    });
                    logDuplicateRemover(`[DuplicateRemover] ❌ 로컬 중복 발견: ${table} - ${player.name}`);
                } else {
                    // 첫 번째 발견
                    seen.set(key, player);
                }
            });
        });

        if (duplicatePlayers.length === 0) {
            logDuplicateRemover('[DuplicateRemover] 로컬에서 중복 없음');
            return {
                success: true,
                message: '로컬 데이터에서 중복 없음',
                removedCount: 0
            };
        }

        logDuplicateRemover(`[DuplicateRemover] 로컬에서 ${duplicatePlayers.length}개 중복 발견`);
        showDuplicateRemovalProgress(`${duplicatePlayers.length}개 중복 발견됨 - 구글 시트에서 삭제 중...`);

        // 로컬에서 발견된 중복도 실제 구글 시트에서 삭제 처리
        const removalResults = await removeDuplicatesFromSheets(duplicatePlayers);

        // 완료 메시지
        if (removalResults.success) {
            logDuplicateRemover(`[DuplicateRemover] ✅ 로컬 데이터 분석 완료 - ${removalResults.removedCount}명 제거`);
        }

        return removalResults;

    } catch (error) {
        logDuplicateRemover('[DuplicateRemover] 로컬 분석 오류: ' + error.message);
        return {
            success: false,
            message: `로컬 분석 오류: ${error.message}`,
            removedCount: 0
        };
    }
}

/**
 * 구글 시트에서 실제 중복 제거
 * @param {Array} duplicatesToRemove - 삭제할 중복 플레이어 배열
 * @returns {Object} 삭제 결과
 */
async function removeDuplicatesFromSheets(duplicatesToRemove) {
    try {
        if (duplicatesToRemove.length === 0) {
            return { success: true, message: '삭제할 중복 없음', removedCount: 0 };
        }

        // 테이블별로 그룹화
        const byTable = new Map();
        duplicatesToRemove.forEach(duplicate => {
            const tableName = duplicate.table;
            if (!byTable.has(tableName)) {
                byTable.set(tableName, []);
            }
            byTable.get(tableName).push(duplicate);
        });

        let totalRemoved = 0;
        const removedPlayers = [];

        // 각 테이블에서 중복 제거
        for (const [tableName, playersToRemove] of byTable) {
            try {
                logDuplicateRemover(`[DuplicateRemover] 🗑️ ${tableName} 테이블에서 ${playersToRemove.length}명 중복 제거 중...`);

                // 삭제할 플레이어 이름 목록 추출
                const playerNamesToDelete = playersToRemove.map(p => p.name);

                // batchUpdate 호출
                const formData = new FormData();
                formData.append('action', 'batchUpdate');
                formData.append('table', tableName);
                formData.append('players', JSON.stringify([])); // 빈 배열 (추가할 플레이어 없음)
                formData.append('deleted', JSON.stringify(playerNamesToDelete)); // 삭제할 플레이어

                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    totalRemoved += playersToRemove.length;
                    removedPlayers.push(...playersToRemove);
                    logDuplicateRemover(`[DuplicateRemover] ✅ ${tableName}에서 ${playersToRemove.length}명 삭제 완료`);
                } else {
                    console.error(`[DuplicateRemover] ❌ ${tableName} 삭제 실패:`, result.message);
                }

            } catch (error) {
                console.error(`[DuplicateRemover] ${tableName} 삭제 중 오류:`, error);
            }
        }

        const message = `${totalRemoved}명의 중복 플레이어가 제거되었습니다`;
        logDuplicateRemover(`[DuplicateRemover] ${message}`);
        showDuplicateRemovalProgress(message);

        return {
            success: true,
            message: message,
            removedCount: totalRemoved,
            removedPlayers: removedPlayers
        };

    } catch (error) {
        console.error('[DuplicateRemover] 시트 삭제 오류:', error);
        return {
            success: false,
            message: `시트 삭제 오류: ${error.message}`,
            removedCount: 0
        };
    }
}

/**
 * 중복 제거 진행 상황 표시 (v3.4.6 - 간소화됨)
 * @param {string} message - 표시할 메시지
 */
function showDuplicateRemovalProgress(message) {
    // 콘솔에만 출력하고 UI는 방해하지 않음
    console.log(`[DuplicateRemover] ${message}`);

    // 중요한 경우에만 짧은 스낵바 표시 (2초)
    if (message.includes('제거되었습니다') || message.includes('오류')) {
        if (window.showFeedback) {
            window.showFeedback(message, false);
        }
    }
}

/**
 * 진행 상황 숨기고 UI 잠금 해제 (v3.4.6 - 더 이상 사용하지 않음)
 */
function hideProgressAndUnlockUI() {
    // v3.4.6: UI를 차단하지 않으므로 이 함수는 사용되지 않음
    console.log('[DuplicateRemover v3.4.6] 백그라운드 처리 완료');
}

/**
 * 로컬 데이터로 중복 검사 (간단한 버전)
 * @returns {Object} 검사 결과
 */
function removeDuplicatesFromLocalData() {
    return analyzeLocalDataForDuplicates();
}

/**
 * 페이지 로드 시 자동 실행되는 중복 검사 (v3.4.6 - 조용한 백그라운드 실행)
 */
function runDuplicateCheck() {
    try {
        // 디버그 모드가 아니면 조용히 시작
        if (!window.DEBUG_MODE) {
            console.log('[DuplicateRemover v3.4.6] 초기화');
        } else {
            console.log('[DuplicateRemover] 🚀 중복 검사 시작:', new Date().toLocaleTimeString());
        }

        // window.state 확인
        if (!window.state) {
            console.warn('[DuplicateRemover] ⏳ window.state 없음 - 3초 후 재시도');
            setTimeout(runDuplicateCheck, 3000);
            return;
        }

        if (!window.state.playerDataByTable) {
            console.warn('[DuplicateRemover] ⏳ window.state.playerDataByTable 없음 - 3초 후 재시도');
            setTimeout(runDuplicateCheck, 3000);
            return;
        }

        logDuplicateRemover('[DuplicateRemover] ✅ window.state 준비 완료');

        // 중복 검사 실행
        removeDuplicatePlayers().then(result => {
            if (result.success) {
                if (result.removedCount > 0) {
                    logDuplicateRemover(`[DuplicateRemover] ✅ 중복 제거 완료: ${result.removedCount}명 제거`);
                } else {
                    logDuplicateRemover('[DuplicateRemover] ✅ 중복 없음 - 시트가 깨끗합니다');
                }
            } else {
                console.error('[DuplicateRemover] ❌ 중복 제거 실패:', result.message);
            }
        }).catch(error => {
            console.error('[DuplicateRemover] ❌ 중복 제거 중 오류:', error);
        });

    } catch (error) {
        console.error('[DuplicateRemover] runDuplicateCheck 오류:', error);
    }
}

/**
 * 모듈 초기화
 */
function initDuplicateRemover() {
    logDuplicateRemover('[DuplicateRemover] 모듈 초기화 시작...');

    if (document.readyState === 'loading') {
        logDuplicateRemover('[DuplicateRemover] DOM 로딩 중 - DOMContentLoaded 이벤트 대기');
        document.addEventListener('DOMContentLoaded', () => {
            logDuplicateRemover('[DuplicateRemover] ✅ DOMContentLoaded 이벤트 발생 - 5초 후 실행 예약');
            setTimeout(() => {
                logDuplicateRemover('[DuplicateRemover] ⏰ 타이머 실행됨 - 중복 검사 시작');
                runDuplicateCheck();
            }, 5000);
        });
    } else {
        logDuplicateRemover('[DuplicateRemover] DOM 이미 로드됨 - 3초 후 실행 예약');
        setTimeout(() => {
            logDuplicateRemover('[DuplicateRemover] ⏰ 타이머 실행됨 - 중복 검사 시작');
            runDuplicateCheck();
        }, 3000);
    }
}

// 전역 함수로 노출
window.removeDuplicatePlayers = removeDuplicatePlayers;
window.removeDuplicatesFromLocalData = removeDuplicatesFromLocalData;

// 모듈 자동 초기화
initDuplicateRemover();