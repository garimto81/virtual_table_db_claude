/**
 * 테이블 관리 모듈 v59 - IN/OUT 두 가지 상태만 사용
 * Type 시트 기반 간단한 테이블/플레이어 관리
 */

class TableManagementV59 {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currentTable = null;
    }

    // API 호출 헬퍼
    async apiCall(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('payload', JSON.stringify({ action, ...data }));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API 호출 실패:', error);
            throw error;
        }
    }

    // 테이블 목록 가져오기
    async getTableList() {
        const result = await this.apiCall('getTableList');
        return result.tables || [];
    }

    // 테이블별 플레이어 가져오기 (IN 상태만)
    async getPlayersByTable(tableName) {
        const result = await this.apiCall('getPlayersByTable', { tableName });
        return result.players || [];
    }

    // 플레이어 추가/수정
    async upsertPlayer(playerData) {
        return await this.apiCall('upsertPlayer', { playerData });
    }

    // 플레이어 캐시아웃 (OUT 처리)
    async cashOutPlayer(playerName, tableName, finalChips) {
        return await this.apiCall('cashOutPlayer', { 
            playerName, 
            tableName, 
            finalChips 
        });
    }

    // UI 생성
    async openManagementModal() {
        // 모달 생성
        const modal = this.createModal();
        document.body.appendChild(modal);

        // 테이블 목록 로드
        await this.loadTableList();
    }

    // 모달 창 생성
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'table-management-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-900 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-white">테이블 관리 v59</h2>
                    <button id="close-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <!-- 테이블 선택 -->
                <div id="table-selection" class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-300 mb-3">테이블 선택</h3>
                    <div id="table-list" class="grid grid-cols-3 gap-3">
                        <!-- 테이블 목록이 여기 표시됨 -->
                    </div>
                    <div class="mt-4">
                        <input type="text" id="new-table-name" placeholder="새 테이블 이름" 
                               class="bg-gray-800 text-white px-3 py-2 rounded mr-2">
                        <button id="create-table-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            새 테이블 만들기
                        </button>
                    </div>
                </div>

                <!-- 플레이어 목록 -->
                <div id="player-section" class="hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-300">
                            <span id="current-table-name"></span> 플레이어
                        </h3>
                        <button id="back-to-tables" class="text-sm text-gray-400 hover:text-white">
                            ← 테이블 목록으로
                        </button>
                    </div>
                    
                    <!-- 9개 좌석 그리드 -->
                    <div id="seat-grid" class="grid grid-cols-3 gap-3 mb-4">
                        <!-- 좌석 1-9 표시 -->
                    </div>

                    <!-- 좌석 없는 플레이어 -->
                    <div id="no-seat-players" class="hidden bg-gray-800 p-3 rounded mb-4">
                        <div class="text-gray-400 mb-2">대기 중:</div>
                        <div id="waiting-players"></div>
                    </div>

                    <button id="add-player-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        플레이어 추가
                    </button>
                </div>

                <!-- 플레이어 추가/수정 폼 -->
                <div id="player-form" class="hidden bg-gray-800 p-4 rounded mt-4">
                    <h4 class="text-white font-semibold mb-3">플레이어 정보</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="text" id="player-name" placeholder="이름" 
                               class="bg-gray-700 text-white px-3 py-2 rounded">
                        <input type="number" id="player-chips" placeholder="칩" 
                               class="bg-gray-700 text-white px-3 py-2 rounded">
                        <select id="player-seat" class="bg-gray-700 text-white px-3 py-2 rounded">
                            <option value="">좌석 선택</option>
                            ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}">좌석 ${n}</option>`).join('')}
                        </select>
                        <label class="flex items-center text-white">
                            <input type="checkbox" id="player-notable" class="mr-2">
                            노터블 ⭐
                        </label>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <button id="save-player-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            저장
                        </button>
                        <button id="cancel-player-btn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                            취소
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 이벤트 리스너 설정
        this.setupEventListeners(modal);

        return modal;
    }

    // 이벤트 리스너 설정
    setupEventListeners(modal) {
        // 모달 닫기
        modal.querySelector('#close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // ESC 키로 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 테이블 목록으로 돌아가기
        modal.querySelector('#back-to-tables').addEventListener('click', () => {
            this.showTableSelection();
        });

        // 새 테이블 만들기
        modal.querySelector('#create-table-btn').addEventListener('click', () => {
            const input = modal.querySelector('#new-table-name');
            const tableName = input.value.trim();
            if (tableName) {
                this.selectTable(tableName);
                input.value = '';
            }
        });

        // 엔터키로 테이블 생성
        modal.querySelector('#new-table-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('#create-table-btn').click();
            }
        });

        // 플레이어 추가 버튼
        modal.querySelector('#add-player-btn').addEventListener('click', () => {
            this.showPlayerForm();
        });

        // 플레이어 저장
        modal.querySelector('#save-player-btn').addEventListener('click', () => {
            this.savePlayer();
        });

        // 플레이어 폼 취소
        modal.querySelector('#cancel-player-btn').addEventListener('click', () => {
            this.hidePlayerForm();
        });
    }

    // 테이블 목록 로드
    async loadTableList() {
        const tables = await this.getTableList();
        const container = document.querySelector('#table-list');
        
        container.innerHTML = '';
        
        if (tables.length === 0) {
            container.innerHTML = '<p class="text-gray-400 col-span-3">테이블이 없습니다. 새 테이블을 만들어주세요.</p>';
            return;
        }

        tables.forEach(table => {
            const button = document.createElement('button');
            button.className = 'bg-gray-800 hover:bg-gray-700 text-white p-4 rounded text-left transition-colors';
            button.innerHTML = `
                <div class="font-semibold text-lg">${table.name}</div>
                <div class="text-sm text-gray-400 mt-1">
                    플레이어: ${table.playerCount}명
                </div>
            `;
            button.addEventListener('click', () => this.selectTable(table.name));
            container.appendChild(button);
        });
    }

    // 테이블 선택
    async selectTable(tableName) {
        this.currentTable = tableName;
        
        // UI 전환
        document.querySelector('#table-selection').classList.add('hidden');
        document.querySelector('#player-section').classList.remove('hidden');
        document.querySelector('#current-table-name').textContent = tableName;
        
        // 플레이어 로드
        await this.loadPlayers();
    }

    // 플레이어 목록 로드
    async loadPlayers() {
        const players = await this.getPlayersByTable(this.currentTable);
        const grid = document.querySelector('#seat-grid');
        const noSeatSection = document.querySelector('#no-seat-players');
        const waitingContainer = document.querySelector('#waiting-players');
        
        // 좌석 배치 초기화
        const seats = {};
        const noSeatPlayers = [];
        
        players.forEach(p => {
            if (p.seat) {
                seats[p.seat] = p;
            } else {
                noSeatPlayers.push(p);
            }
        });

        // 9개 좌석 표시
        grid.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const seat = document.createElement('div');
            seat.className = 'bg-gray-800 p-4 rounded border-2 border-gray-700 hover:border-gray-600 transition-colors';
            
            const player = seats[i];
            if (player) {
                const notableIcon = player.notable ? '⭐' : '';
                
                seat.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="text-xs text-gray-400">좌석 ${i}</div>
                        <span class="text-green-500 text-xs">● IN</span>
                    </div>
                    <div class="text-white font-semibold">
                        ${player.name} ${notableIcon}
                    </div>
                    <div class="text-sm text-gray-300 mt-1">
                        ${player.chips.toLocaleString()} 칩
                    </div>
                    <div class="mt-3 flex gap-1">
                        <button onclick="tableManager.editPlayer('${player.name}')" 
                                class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                            수정
                        </button>
                        <button onclick="tableManager.showCashOutDialog('${player.name}')" 
                                class="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                            OUT
                        </button>
                    </div>
                `;
            } else {
                seat.innerHTML = `
                    <div class="text-gray-500 text-sm mb-2">좌석 ${i}</div>
                    <div class="text-gray-600 text-xs">비어있음</div>
                    <button onclick="tableManager.addPlayerToSeat(${i})" 
                            class="mt-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded w-full">
                        + 추가
                    </button>
                `;
            }
            
            grid.appendChild(seat);
        }

        // 좌석 없는 플레이어 표시
        if (noSeatPlayers.length > 0) {
            noSeatSection.classList.remove('hidden');
            waitingContainer.innerHTML = noSeatPlayers.map(player => `
                <div class="inline-block bg-gray-700 px-3 py-2 rounded mr-2 mb-2">
                    <span class="text-white">${player.name}</span>
                    ${player.notable ? '⭐' : ''}
                    <span class="text-gray-400 ml-2">(${player.chips.toLocaleString()})</span>
                    <button onclick="tableManager.editPlayer('${player.name}')" 
                            class="ml-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                        수정
                    </button>
                </div>
            `).join('');
        } else {
            noSeatSection.classList.add('hidden');
        }
    }

    // 특정 좌석에 플레이어 추가
    addPlayerToSeat(seatNumber) {
        document.querySelector('#player-seat').value = seatNumber;
        this.showPlayerForm();
    }

    // 캐시아웃 다이얼로그
    async showCashOutDialog(playerName) {
        const players = await this.getPlayersByTable(this.currentTable);
        const player = players.find(p => p.name === playerName);
        
        if (!player) return;
        
        const finalChips = prompt(`${playerName}의 최종 칩을 입력하세요:`, player.chips);
        
        if (finalChips !== null) {
            const result = await this.cashOutPlayer(playerName, this.currentTable, parseInt(finalChips) || 0);
            if (result.success) {
                await this.loadPlayers();
            } else {
                alert('캐시아웃 실패: ' + result.message);
            }
        }
    }

    // 플레이어 수정
    async editPlayer(playerName) {
        const players = await this.getPlayersByTable(this.currentTable);
        const player = players.find(p => p.name === playerName);
        
        if (player) {
            document.querySelector('#player-name').value = player.name;
            document.querySelector('#player-chips').value = player.chips;
            document.querySelector('#player-seat').value = player.seat || '';
            document.querySelector('#player-notable').checked = player.notable;
            
            this.editingPlayer = playerName; // 수정 모드 표시
            this.showPlayerForm();
        }
    }

    // 플레이어 폼 표시
    showPlayerForm() {
        document.querySelector('#player-form').classList.remove('hidden');
        document.querySelector('#player-name').focus();
    }

    // 플레이어 폼 숨기기
    hidePlayerForm() {
        document.querySelector('#player-form').classList.add('hidden');
        // 폼 초기화
        document.querySelector('#player-name').value = '';
        document.querySelector('#player-chips').value = '';
        document.querySelector('#player-seat').value = '';
        document.querySelector('#player-notable').checked = false;
        this.editingPlayer = null;
    }

    // 플레이어 저장
    async savePlayer() {
        const playerData = {
            name: document.querySelector('#player-name').value.trim(),
            table: this.currentTable,
            chips: parseInt(document.querySelector('#player-chips').value) || 0,
            seat: parseInt(document.querySelector('#player-seat').value) || null,
            notable: document.querySelector('#player-notable').checked
        };

        if (!playerData.name) {
            alert('이름을 입력해주세요');
            return;
        }

        const result = await this.upsertPlayer(playerData);
        if (result.success) {
            this.hidePlayerForm();
            await this.loadPlayers();
        } else {
            alert('저장 실패: ' + result.message);
        }
    }

    // 테이블 선택 화면 표시
    showTableSelection() {
        document.querySelector('#table-selection').classList.remove('hidden');
        document.querySelector('#player-section').classList.add('hidden');
        this.currentTable = null;
        this.loadTableList();
    }
}

// 전역 인스턴스 생성
let tableManager;

function initializeTableManagement() {
    const APPS_SCRIPT_URL = window.APPS_SCRIPT_URL || '';
    if (!APPS_SCRIPT_URL) {
        console.error('APPS_SCRIPT_URL이 설정되지 않았습니다');
        return;
    }
    
    tableManager = new TableManagementV59(APPS_SCRIPT_URL);
    console.log('테이블 관리 시스템 v59 (IN/OUT) 초기화 완료');
}

// 관리 버튼 클릭 시 호출될 함수
function openTableManagement() {
    if (!tableManager) {
        initializeTableManagement();
    }
    
    if (tableManager) {
        tableManager.openManagementModal();
    } else {
        alert('테이블 관리 시스템을 초기화할 수 없습니다');
    }
}

// 페이지 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTableManagement);
} else {
    initializeTableManagement();
}