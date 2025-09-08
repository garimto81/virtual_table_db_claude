/**
 * ============================================
 * 포커 핸드 로거 - 테이블 관리 모듈
 * Version: 1.0.0
 * Last Modified: 2025-01-08
 * ============================================
 */

class TableManager {
  constructor(appsScriptUrl) {
    this.apiUrl = appsScriptUrl;
    this.currentTable = null;
    this.tables = [];
    this.players = [];
    this.tablePlayers = [];
  }

  // ===== API 통신 =====
  async apiCall(action, data = {}) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data })
      });
      
      // no-cors 모드에서는 response를 읽을 수 없으므로 
      // 실제 구현시 CORS 설정이 필요합니다
      return { success: true };
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.toString() };
    }
  }

  // ===== 테이블 관리 =====
  async loadTables() {
    const result = await this.apiCall('getTables');
    if (result.success) {
      this.tables = result.tables || [];
      this.renderTableList();
    }
    return result;
  }

  async createTable(tableName, stakes = 'No Limit', maxPlayers = 9) {
    const result = await this.apiCall('createTable', {
      tableName,
      stakes,
      maxPlayers
    });
    
    if (result.success) {
      await this.loadTables();
    }
    return result;
  }

  async selectTable(tableId) {
    this.currentTable = this.tables.find(t => t.TableID === tableId);
    if (this.currentTable) {
      await this.loadTablePlayers(tableId);
      this.renderCurrentTable();
    }
  }

  // ===== 플레이어 관리 =====
  async loadPlayers(tableId = null) {
    const result = await this.apiCall('getPlayers', { tableId });
    if (result.success) {
      this.players = result.players || [];
      this.renderPlayerList();
    }
    return result;
  }

  async loadTablePlayers(tableId) {
    const result = await this.apiCall('getPlayers', { tableId });
    if (result.success) {
      this.tablePlayers = result.players || [];
      this.renderTablePlayers();
    }
    return result;
  }

  async addPlayerToCurrentTable(playerName, chips, seatNumber = null, notable = false) {
    if (!this.currentTable) {
      alert('테이블을 먼저 선택해주세요');
      return;
    }

    // 플레이어 생성/업데이트
    const playerResult = await this.apiCall('upsertPlayer', {
      playerData: {
        Name: playerName,
        CurrentTable: this.currentTable.TableID,
        CurrentChips: chips,
        Notable: notable
      }
    });

    if (playerResult.success) {
      // 테이블에 플레이어 추가
      const addResult = await this.apiCall('addPlayerToTable', {
        tableId: this.currentTable.TableID,
        playerId: playerResult.playerId,
        seatNumber: seatNumber,
        chips: chips,
        buyIn: chips
      });

      if (addResult.success) {
        await this.loadTablePlayers(this.currentTable.TableID);
      }
      return addResult;
    }
    return playerResult;
  }

  async updatePlayerChips(playerId, newChips) {
    const result = await this.apiCall('upsertPlayer', {
      playerData: {
        PlayerID: playerId,
        CurrentChips: newChips
      }
    });
    
    if (result.success) {
      await this.loadTablePlayers(this.currentTable.TableID);
    }
    return result;
  }

  async removePlayerFromCurrentTable(playerId) {
    if (!this.currentTable) return;

    const result = await this.apiCall('removePlayerFromTable', {
      tableId: this.currentTable.TableID,
      playerId: playerId
    });

    if (result.success) {
      await this.loadTablePlayers(this.currentTable.TableID);
    }
    return result;
  }

  // ===== UI 렌더링 =====
  renderTableManagementModal() {
    return `
      <div id="table-management-modal" class="modal fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-gray-800 rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">테이블 및 플레이어 관리</h2>
            <button onclick="closeTableManagement()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
          
          <!-- 탭 메뉴 -->
          <div class="flex space-x-1 mb-4 border-b border-gray-700">
            <button class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg bg-gray-700 text-white" 
                    data-tab="tables">테이블 관리</button>
            <button class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg hover:bg-gray-700" 
                    data-tab="players">플레이어 관리</button>
            <button class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg hover:bg-gray-700" 
                    data-tab="current">현재 테이블</button>
          </div>
          
          <!-- 테이블 관리 탭 -->
          <div id="tab-tables" class="tab-content">
            <div class="mb-4">
              <h3 class="text-lg font-bold mb-2">새 테이블 생성</h3>
              <div class="flex gap-2">
                <input type="text" id="new-table-name" placeholder="테이블 이름" 
                       class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1">
                <select id="new-table-stakes" class="bg-gray-700 border border-gray-600 rounded px-2 py-1">
                  <option value="No Limit">No Limit</option>
                  <option value="Pot Limit">Pot Limit</option>
                  <option value="Fixed Limit">Fixed Limit</option>
                </select>
                <input type="number" id="new-table-max-players" placeholder="최대 인원" 
                       value="9" min="2" max="10" 
                       class="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1">
                <button onclick="createNewTable()" class="btn bg-blue-600 px-4 py-1 rounded">생성</button>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-bold mb-2">테이블 목록</h3>
              <div id="table-list" class="space-y-2">
                <!-- 테이블 목록이 여기 표시됨 -->
              </div>
            </div>
          </div>
          
          <!-- 플레이어 관리 탭 -->
          <div id="tab-players" class="tab-content hidden">
            <div class="mb-4">
              <h3 class="text-lg font-bold mb-2">플레이어 등록</h3>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="new-player-name" placeholder="플레이어 이름" 
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1">
                <input type="text" id="new-player-chips" placeholder="초기 칩 (예: 100,000)" 
                       class="bg-gray-700 border border-gray-600 rounded px-2 py-1">
                <select id="new-player-seat" class="bg-gray-700 border border-gray-600 rounded px-2 py-1">
                  <option value="">좌석 자동</option>
                  ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}">좌석 ${n}</option>`).join('')}
                </select>
                <div class="flex items-center gap-2">
                  <label class="flex items-center gap-1">
                    <input type="checkbox" id="new-player-notable" class="h-4 w-4">
                    <span>노터블</span>
                  </label>
                  <button onclick="addNewPlayer()" class="btn bg-green-600 px-4 py-1 rounded ml-auto">추가</button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-bold mb-2">등록된 플레이어</h3>
              <div id="player-list" class="space-y-2">
                <!-- 플레이어 목록이 여기 표시됨 -->
              </div>
            </div>
          </div>
          
          <!-- 현재 테이블 탭 -->
          <div id="tab-current" class="tab-content hidden">
            <div id="current-table-info" class="mb-4">
              <!-- 현재 테이블 정보 표시 -->
            </div>
            
            <div>
              <h3 class="text-lg font-bold mb-2">테이블 플레이어</h3>
              <div id="table-players-grid" class="grid grid-cols-3 gap-2">
                <!-- 테이블 플레이어 목록이 여기 표시됨 -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTableList() {
    const container = document.getElementById('table-list');
    if (!container) return;

    if (this.tables.length === 0) {
      container.innerHTML = '<p class="text-gray-500">등록된 테이블이 없습니다.</p>';
      return;
    }

    container.innerHTML = this.tables.map(table => `
      <div class="bg-gray-700 p-3 rounded flex justify-between items-center">
        <div>
          <div class="font-bold">${table.TableName}</div>
          <div class="text-sm text-gray-400">
            ${table.Stakes} | 최대 ${table.MaxPlayers}명
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="tableManager.selectTable('${table.TableID}')" 
                  class="btn bg-blue-600 px-3 py-1 rounded text-sm">선택</button>
          <button onclick="deleteTable('${table.TableID}')" 
                  class="btn bg-red-600 px-3 py-1 rounded text-sm">삭제</button>
        </div>
      </div>
    `).join('');
  }

  renderPlayerList() {
    const container = document.getElementById('player-list');
    if (!container) return;

    if (this.players.length === 0) {
      container.innerHTML = '<p class="text-gray-500">등록된 플레이어가 없습니다.</p>';
      return;
    }

    container.innerHTML = this.players.map(player => `
      <div class="bg-gray-700 p-3 rounded flex justify-between items-center">
        <div class="flex-1">
          <div class="font-bold flex items-center gap-2">
            ${player.Notable ? '⭐' : ''} ${player.Name}
            ${player.Nickname ? `<span class="text-sm text-gray-400">(${player.Nickname})</span>` : ''}
          </div>
          <div class="text-sm text-gray-400">
            칩: ${this.formatNumber(player.CurrentChips || 0)}
            ${player.CurrentTable ? ` | 테이블: ${this.getTableName(player.CurrentTable)}` : ''}
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="editPlayer('${player.PlayerID}')" 
                  class="btn bg-yellow-600 px-3 py-1 rounded text-sm">수정</button>
          ${player.CurrentTable ? 
            `<button onclick="tableManager.removePlayerFromCurrentTable('${player.PlayerID}')" 
                     class="btn bg-red-600 px-3 py-1 rounded text-sm">테이블 제거</button>` : 
            `<button onclick="addPlayerToTable('${player.PlayerID}')" 
                     class="btn bg-green-600 px-3 py-1 rounded text-sm">테이블 추가</button>`}
        </div>
      </div>
    `).join('');
  }

  renderTablePlayers() {
    const container = document.getElementById('table-players-grid');
    if (!container) return;

    if (this.tablePlayers.length === 0) {
      container.innerHTML = '<p class="text-gray-500 col-span-3">테이블에 플레이어가 없습니다.</p>';
      return;
    }

    // 좌석 번호 순으로 정렬
    const sortedPlayers = [...this.tablePlayers].sort((a, b) => 
      (a.SeatNumber || 999) - (b.SeatNumber || 999)
    );

    container.innerHTML = sortedPlayers.map(player => `
      <div class="bg-gray-700 p-3 rounded">
        <div class="flex justify-between items-start mb-2">
          <span class="text-xs bg-gray-600 px-2 py-1 rounded">
            좌석 ${player.SeatNumber || '-'}
          </span>
          ${player.Notable ? '<span class="text-yellow-400">⭐</span>' : ''}
        </div>
        <div class="font-bold mb-1">${player.Name}</div>
        <div class="flex items-center gap-2 mb-2">
          <input type="text" value="${this.formatNumber(player.CurrentChips || 0)}" 
                 class="bg-gray-600 px-2 py-1 rounded text-sm w-full"
                 onchange="updatePlayerChips('${player.PlayerID}', this.value)">
        </div>
        <div class="flex gap-1">
          <button onclick="adjustChips('${player.PlayerID}', -10000)" 
                  class="btn bg-red-600 px-2 py-1 rounded text-xs">-10k</button>
          <button onclick="adjustChips('${player.PlayerID}', 10000)" 
                  class="btn bg-green-600 px-2 py-1 rounded text-xs">+10k</button>
          <button onclick="doubleChips('${player.PlayerID}')" 
                  class="btn bg-blue-600 px-2 py-1 rounded text-xs">x2</button>
        </div>
      </div>
    `).join('');
  }

  renderCurrentTable() {
    const container = document.getElementById('current-table-info');
    if (!container) return;

    if (!this.currentTable) {
      container.innerHTML = '<p class="text-gray-500">테이블이 선택되지 않았습니다.</p>';
      return;
    }

    container.innerHTML = `
      <div class="bg-gray-700 p-4 rounded">
        <h2 class="text-xl font-bold mb-2">${this.currentTable.TableName}</h2>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-400">스테이크:</span> 
            <span class="font-bold">${this.currentTable.Stakes}</span>
          </div>
          <div>
            <span class="text-gray-400">최대 인원:</span> 
            <span class="font-bold">${this.currentTable.MaxPlayers}명</span>
          </div>
          <div>
            <span class="text-gray-400">현재 인원:</span> 
            <span class="font-bold">${this.tablePlayers.length}명</span>
          </div>
        </div>
      </div>
    `;
  }

  // ===== 유틸리티 함수 =====
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getTableName(tableId) {
    const table = this.tables.find(t => t.TableID === tableId);
    return table ? table.TableName : 'Unknown';
  }

  // ===== 현재 게임에 플레이어 동기화 =====
  syncToCurrentGame() {
    if (!this.currentTable || this.tablePlayers.length === 0) {
      alert('테이블과 플레이어를 먼저 설정해주세요');
      return;
    }

    // state.playersInHand 업데이트
    if (window.state) {
      window.state.playersInHand = this.tablePlayers.map(player => ({
        name: player.Name,
        chips: player.CurrentChips || 0,
        initialChips: player.CurrentChips || 0,
        notable: player.Notable || false,
        hand: [],
        role: null,
        chipsSetAt: new Date().toISOString()
      }));

      // UI 업데이트
      if (window.renderPlayerSelection) window.renderPlayerSelection();
      if (window.renderPlayerDetails) window.renderPlayerDetails();
      
      alert('플레이어 정보가 동기화되었습니다');
    }
  }
}

// 전역 인스턴스 생성 - index.html의 APPS_SCRIPT_URL 사용
let tableManager;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  // index.html에 정의된 APPS_SCRIPT_URL 사용
  const scriptUrl = window.APPS_SCRIPT_URL || 
    "https://script.google.com/macros/s/AKfycbzWfe_4CAKcMAzzoHzJBstQIC7jQxSVC1BO23nYwlU23Pd5vLPLjfUi-gKyqzDYvPRT/exec";
  tableManager = new TableManager(scriptUrl);
});

// ===== 헬퍼 함수들 =====
function openTableManagement() {
  const modal = document.getElementById('table-management-modal');
  if (!modal) {
    // 모달이 없으면 생성
    const modalHtml = tableManager.renderTableManagementModal();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
  
  const modal2 = document.getElementById('table-management-modal');
  modal2.classList.remove('hidden');
  
  // 탭 이벤트 리스너
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });
  
  // 데이터 로드
  tableManager.loadTables();
  tableManager.loadPlayers();
}

function closeTableManagement() {
  const modal = document.getElementById('table-management-modal');
  modal.classList.add('hidden');
}

function switchTab(tabName) {
  // 모든 탭 컨텐츠 숨기기
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // 모든 탭 버튼 스타일 초기화
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-gray-700', 'text-white');
  });
  
  // 선택된 탭 표시
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-gray-700', 'text-white');
}

async function createNewTable() {
  const name = document.getElementById('new-table-name').value;
  const stakes = document.getElementById('new-table-stakes').value;
  const maxPlayers = document.getElementById('new-table-max-players').value;
  
  if (!name) {
    alert('테이블 이름을 입력해주세요');
    return;
  }
  
  const result = await tableManager.createTable(name, stakes, maxPlayers);
  if (result.success) {
    alert('테이블이 생성되었습니다');
    document.getElementById('new-table-name').value = '';
  }
}

async function addNewPlayer() {
  const name = document.getElementById('new-player-name').value;
  const chips = document.getElementById('new-player-chips').value.replace(/,/g, '');
  const seat = document.getElementById('new-player-seat').value;
  const notable = document.getElementById('new-player-notable').checked;
  
  if (!name || !chips) {
    alert('플레이어 이름과 칩을 입력해주세요');
    return;
  }
  
  const result = await tableManager.addPlayerToCurrentTable(
    name, 
    parseInt(chips), 
    seat ? parseInt(seat) : null,
    notable
  );
  
  if (result.success) {
    alert('플레이어가 추가되었습니다');
    // 입력 필드 초기화
    document.getElementById('new-player-name').value = '';
    document.getElementById('new-player-chips').value = '';
    document.getElementById('new-player-seat').value = '';
    document.getElementById('new-player-notable').checked = false;
  }
}

function adjustChips(playerId, amount) {
  const player = tableManager.tablePlayers.find(p => p.PlayerID === playerId);
  if (player) {
    const newChips = Math.max(0, (player.CurrentChips || 0) + amount);
    tableManager.updatePlayerChips(playerId, newChips);
  }
}

function doubleChips(playerId) {
  const player = tableManager.tablePlayers.find(p => p.PlayerID === playerId);
  if (player) {
    const newChips = (player.CurrentChips || 0) * 2;
    tableManager.updatePlayerChips(playerId, newChips);
  }
}

function updatePlayerChips(playerId, value) {
  const chips = parseInt(value.replace(/,/g, '')) || 0;
  tableManager.updatePlayerChips(playerId, chips);
}

// 초기화 - index.html에서 이벤트 리스너를 설정하므로 여기서는 제거