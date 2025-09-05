/**
 * ============================================
 * 포커 핸드 로거 - AI 칩 분석 모듈
 * Version: 1.0.1
 * Last Modified: 2025-01-05
 * Parent App: v2.2.2
 * ============================================
 */

const CHIP_MODULE_VERSION = '1.0.1';

// 칩 분석 모듈 초기화
function initChipAnalyzer() {
  console.log(`%c🎲 AI 칩 분석 모듈 초기화 v${CHIP_MODULE_VERSION}`, 'color: #a78bfa; font-weight: bold');
  
  // 칩 컬러 렌더링
  renderChipColorSlots();
  
  // 이벤트 리스너 설정
  setupChipAnalysisListeners();
  
  // localStorage에서 저장된 칩 컬러 로드
  loadSavedChipColors();
  
  // 플레이어 칩 분석 버튼 추가
  addChipAnalysisButtons();
}

// 칩 컬러 슬롯 렌더링
function renderChipColorSlots() {
  const container = document.getElementById('chip-colors-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < state.maxChips; i++) {
    const chip = state.chipColors[i];
    const slot = document.createElement('div');
    slot.className = 'chip-color-sample flex items-center justify-center text-xs';
    slot.dataset.slot = i;
    
    if (chip) {
      slot.style.backgroundColor = chip.color;
      if (chip.image) {
        slot.style.backgroundImage = `url(${chip.image})`;
        slot.style.backgroundSize = 'cover';
      }
      slot.innerHTML = `<span class="text-white font-bold bg-black bg-opacity-50 px-1 rounded">${chip.value || '?'}</span>`;
      slot.title = `칩 값: ${chip.value || '미설정'} (클릭하여 수정)`;
    } else {
      slot.classList.add('bg-gray-700');
      slot.innerHTML = '<span class="text-gray-500">+</span>';
      slot.title = '클릭하여 칩 추가';
    }
    
    slot.addEventListener('click', () => selectChipSlot(i));
    container.appendChild(slot);
  }
  
  // 칩 값 리스트도 업데이트
  renderChipValuesList();
}

// 칩 값 리스트 렌더링
function renderChipValuesList() {
  const listContainer = document.getElementById('chip-values-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (state.chipColors.length === 0) {
    listContainer.innerHTML = '<p class="text-gray-500 text-sm">등록된 칩이 없습니다.</p>';
    return;
  }
  
  state.chipColors.forEach((chip, index) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 bg-gray-700 p-2 rounded';
    div.innerHTML = `
      <div class="w-6 h-6 rounded-full border-2 border-gray-500" 
           style="background: ${chip.image ? `url(${chip.image})` : chip.color}; background-size: cover;"></div>
      <input type="text" 
             class="bg-gray-600 px-2 py-1 rounded text-sm flex-1" 
             placeholder="칩 값 입력"
             value="${chip.value || ''}"
             data-index="${index}">
      <button class="text-red-500 hover:text-red-400 text-sm px-2" data-remove="${index}">삭제</button>
    `;
    listContainer.appendChild(div);
  });
  
  // 이벤트 리스너 추가
  listContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
      state.chipColors[index].value = value;
      saveChipColors();
      renderChipColorSlots();
    });
  });
  
  listContainer.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.remove);
      if (confirm(`칩 ${state.chipColors[index].value || ''}을(를) 삭제하시겠습니까?`)) {
        state.chipColors.splice(index, 1);
        saveChipColors();
        renderChipColorSlots();
      }
    });
  });
}

// 플레이어별 칩 분석 버튼 추가
function addChipAnalysisButtons() {
  // 각 플레이어 카드에 칩 분석 버튼 추가
  const playerCards = document.querySelectorAll('.player-card');
  
  playerCards.forEach(card => {
    const playerName = card.dataset.player;
    if (!playerName) return;
    
    // 이미 버튼이 있으면 스킵
    if (card.querySelector('.chip-analysis-btn')) return;
    
    const chipsDiv = card.querySelector('div:nth-child(2)'); // 칩 입력 영역
    if (chipsDiv) {
      const btn = document.createElement('button');
      btn.className = 'chip-analysis-btn bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white ml-2';
      btn.innerHTML = '📷';
      btn.title = '칩 스택 AI 분석';
      btn.onclick = (e) => {
        e.stopPropagation();
        openStackAnalysisModal(playerName);
      };
      chipsDiv.appendChild(btn);
    }
  });
}

// 칩 슬롯 선택
function selectChipSlot(slotIndex) {
  console.log('칩 슬롯 선택:', slotIndex);
  state.currentChipSlot = slotIndex;
  openChipColorModal();
}

// 칩 컬러 촬영 모달 열기
async function openChipColorModal() {
  console.log('칩 컬러 모달 열기 시도');
  const modal = document.getElementById('chip-color-modal');
  if (!modal) {
    console.error('칩 컬러 모달을 찾을 수 없습니다!');
    return;
  }
  
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.remove('opacity-0'), 10);
  
  try {
    const video = document.getElementById('chip-video');
    if (!video) {
      console.error('비디오 요소를 찾을 수 없습니다!');
      return;
    }
    
    console.log('카메라 스트림 요청 중...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    console.log('카메라 스트림 획득 성공');
    video.srcObject = stream;
  } catch (err) {
    console.error('카메라 접근 실패:', err);
    alert('카메라를 사용할 수 없습니다.\n' + err.message);
    closeChipColorModal();
  }
}

// 칩 사진 촬영
function captureChipPhoto() {
  const video = document.getElementById('chip-video');
  const canvas = document.getElementById('chip-canvas');
  const valueInput = document.getElementById('chip-value-input');
  const context = canvas.getContext('2d');
  
  if (!video.videoWidth) {
    alert('비디오가 아직 준비되지 않았습니다.');
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  // 작은 크기로 리사이즈 (저장 공간 절약)
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = 200;
  resizedCanvas.height = 200;
  const resizedContext = resizedCanvas.getContext('2d');
  resizedContext.drawImage(canvas, 0, 0, 200, 200);
  
  const imageData = resizedCanvas.toDataURL('image/jpeg', 0.6);
  
  // 중앙 색상 추출
  const centerX = Math.floor(canvas.width / 2);
  const centerY = Math.floor(canvas.height / 2);
  const pixel = context.getImageData(centerX, centerY, 1, 1).data;
  const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  
  // 칩 값 가져오기
  const chipValue = parseInt(valueInput.value.replace(/\D/g, '')) || 0;
  
  // 칩 정보 저장
  if (state.currentChipSlot !== null) {
    if (!state.chipColors[state.currentChipSlot]) {
      state.chipColors[state.currentChipSlot] = {};
    }
    state.chipColors[state.currentChipSlot].color = color;
    state.chipColors[state.currentChipSlot].image = imageData;
    state.chipColors[state.currentChipSlot].value = chipValue;
    
    saveChipColors();
    renderChipColorSlots();
    closeChipColorModal();
    
    alert(`칩 등록 완료!\n값: ${chipValue.toLocaleString()}`);
  }
}

// 칩 컬러 모달 닫기
function closeChipColorModal() {
  const modal = document.getElementById('chip-color-modal');
  const video = document.getElementById('chip-video');
  const valueInput = document.getElementById('chip-value-input');
  
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  
  if (valueInput) valueInput.value = '';
  if (modal) modal.classList.add('hidden');
  state.currentChipSlot = null;
}

// 스택 분석 모달 열기
async function openStackAnalysisModal(playerName) {
  state.currentAnalyzingPlayer = playerName;
  state.stackImages = [];
  
  const modal = document.getElementById('stack-analysis-modal');
  if (!modal) return;
  
  document.getElementById('analyzing-player-name').textContent = playerName;
  document.getElementById('stack-images-container').innerHTML = '';
  document.getElementById('analyze-stack-btn').disabled = true;
  
  modal.classList.remove('hidden');
  
  try {
    const video = document.getElementById('stack-video');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      } 
    });
    video.srcObject = stream;
  } catch (err) {
    console.error('카메라 접근 실패:', err);
    alert('카메라를 사용할 수 없습니다.\n' + err.message);
    closeStackAnalysisModal();
  }
}

// 스택 사진 촬영
function captureStackPhoto() {
  const video = document.getElementById('stack-video');
  const canvas = document.getElementById('stack-canvas');
  const context = canvas.getContext('2d');
  
  if (!video.videoWidth) {
    alert('비디오가 아직 준비되지 않았습니다.');
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  // 리사이즈 (API 전송용)
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = 800;
  resizedCanvas.height = 600;
  const resizedContext = resizedCanvas.getContext('2d');
  resizedContext.drawImage(canvas, 0, 0, 800, 600);
  
  const imageData = resizedCanvas.toDataURL('image/jpeg', 0.8);
  state.stackImages.push(imageData);
  
  // 이미지 프리뷰 추가
  const container = document.getElementById('stack-images-container');
  const img = document.createElement('img');
  img.src = imageData;
  img.className = 'rounded-lg border-2 border-gray-600';
  img.style.width = '100%';
  img.style.height = '100px';
  img.style.objectFit = 'cover';
  container.appendChild(img);
  
  // 분석 버튼 활성화
  if (state.stackImages.length > 0) {
    document.getElementById('analyze-stack-btn').disabled = false;
  }
  
  // 최대 4장까지만 촬영
  if (state.stackImages.length >= 4) {
    document.getElementById('capture-stack-btn').disabled = true;
    alert('최대 4장까지 촬영 가능합니다.');
  }
}

// AI 칩 스택 분석
async function analyzeChipStack() {
  if (state.stackImages.length === 0) {
    alert('먼저 사진을 촬영해주세요.');
    return;
  }
  
  // 분석 중 오버레이 표시
  document.getElementById('analyzing-overlay').classList.remove('hidden');
  
  try {
    // 칩 컬러 정보 준비
    const chipInfo = state.chipColors
      .filter(c => c && c.value)
      .map(c => `${c.value}원 칩`)
      .join(', ');
    
    // Gemini API 호출을 위한 이미지 준비
    const imageParts = state.stackImages.map(imageData => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageData.split(',')[1] // base64 부분만 추출
      }
    }));
    
    // Gemini API 요청
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `이 포커 칩 스택 사진들을 분석해주세요. 
              등록된 칩 정보: ${chipInfo || '정보 없음'}
              
              다음 형식으로 간단히 답변해주세요:
              - 예상 칩 개수: [숫자]개
              - 예상 총액: [숫자]원
              
              정확한 숫자로만 답변하고 추가 설명은 하지 마세요.`
            },
            ...imageParts
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 256,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Gemini API 응답:', data);
    
    if (data.candidates && data.candidates[0]) {
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // 숫자 추출
      const amountMatch = analysisText.match(/총액[:\s]*([0-9,]+)/);
      let estimatedValue = 0;
      
      if (amountMatch) {
        estimatedValue = parseInt(amountMatch[1].replace(/,/g, ''));
      } else {
        // 다른 패턴 시도
        const numbers = analysisText.match(/[0-9,]+(?:원|만원)?/g);
        if (numbers && numbers.length > 0) {
          const lastNumber = numbers[numbers.length - 1];
          estimatedValue = parseKoreanNumber(lastNumber);
        }
      }
      
      // 결과 저장
      if (!state.playerStacks[state.currentAnalyzingPlayer]) {
        state.playerStacks[state.currentAnalyzingPlayer] = {};
      }
      state.playerStacks[state.currentAnalyzingPlayer].images = [...state.stackImages];
      state.playerStacks[state.currentAnalyzingPlayer].estimatedStack = estimatedValue;
      state.playerStacks[state.currentAnalyzingPlayer].analysis = analysisText;
      
      // 플레이어 칩 업데이트
      const player = state.playersInHand.find(p => p.name === state.currentAnalyzingPlayer);
      if (player) {
        player.chips = estimatedValue.toString();
        renderPlayerDetails();
      }
      
      // 결과 표시
      alert(`${state.currentAnalyzingPlayer}의 칩 분석 완료!\n\n추정 칩: ${estimatedValue.toLocaleString()}원\n\n${analysisText}`);
      
      // 모달 닫기
      closeStackAnalysisModal();
    } else {
      throw new Error('API 응답에서 결과를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('AI 분석 실패:', error);
    alert('AI 분석에 실패했습니다.\n' + error.message);
  } finally {
    // 오버레이 숨기기
    document.getElementById('analyzing-overlay').classList.add('hidden');
  }
}

// 한국어 숫자 파싱
function parseKoreanNumber(str) {
  if (!str) return 0;
  
  str = str.replace(/,/g, '').replace(/원/g, '');
  let value = parseFloat(str) || 0;
  
  if (str.includes('만')) {
    const parts = str.split('만');
    value = (parseFloat(parts[0]) || 0) * 10000;
    if (parts[1]) {
      value += parseFloat(parts[1]) || 0;
    }
  }
  
  return Math.floor(value);
}

// 스택 분석 모달 닫기
function closeStackAnalysisModal() {
  const modal = document.getElementById('stack-analysis-modal');
  const video = document.getElementById('stack-video');
  
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  
  if (modal) modal.classList.add('hidden');
  
  // 상태 초기화
  state.currentAnalyzingPlayer = null;
  state.stackImages = [];
  document.getElementById('capture-stack-btn').disabled = false;
}

// 칩 컬러 저장
function saveChipColors() {
  localStorage.setItem('pokerChipColors', JSON.stringify(state.chipColors));
  console.log('칩 컬러 저장:', state.chipColors.length, '개');
}

// 저장된 칩 컬러 로드
function loadSavedChipColors() {
  const saved = localStorage.getItem('pokerChipColors');
  if (saved) {
    try {
      state.chipColors = JSON.parse(saved);
      console.log('칩 컬러 로드:', state.chipColors.length, '개');
      renderChipColorSlots();
    } catch (e) {
      console.error('칩 컬러 로드 실패:', e);
      state.chipColors = [];
    }
  }
}

// 이벤트 리스너 설정
function setupChipAnalysisListeners() {
  // 이벤트 위임을 사용하여 동적으로 생성되는 요소도 처리
  document.addEventListener('click', (e) => {
    // 칩 추가 버튼 클릭 처리
    if (e.target && e.target.id === 'add-chip-color-btn') {
      console.log('칩 추가 버튼 클릭됨');
      e.preventDefault();
      e.stopPropagation();
      
      if (state.chipColors.length < state.maxChips) {
        const emptySlot = state.chipColors.length;
        selectChipSlot(emptySlot);
      } else {
        alert('최대 5개까지만 등록 가능합니다.');
      }
    }
  });
  
  // 모든 버튼 클릭을 이벤트 위임으로 처리
  document.addEventListener('click', (e) => {
    const targetId = e.target.id;
    
    // 칩 촬영 관련 버튼들
    if (targetId === 'capture-chip-btn') {
      console.log('칩 촬영 버튼 클릭');
      e.preventDefault();
      captureChipPhoto();
    } else if (targetId === 'close-chip-modal') {
      console.log('칩 모달 닫기');
      e.preventDefault();
      closeChipColorModal();
    }
    // 스택 분석 관련 버튼들
    else if (targetId === 'capture-stack-btn') {
      console.log('스택 촬영 버튼 클릭');
      e.preventDefault();
      captureStackPhoto();
    } else if (targetId === 'analyze-stack-btn') {
      console.log('AI 분석 시작');
      e.preventDefault();
      if (!e.target.disabled) {
        analyzeChipStack();
      }
    } else if (targetId === 'close-stack-modal') {
      console.log('스택 모달 닫기');
      e.preventDefault();
      closeStackAnalysisModal();
    }
  });
}

// MutationObserver로 플레이어 카드 변경 감지
const playerObserver = new MutationObserver(() => {
  addChipAnalysisButtons();
});

// 플레이어 섹션 감시 시작
document.addEventListener('DOMContentLoaded', () => {
  const playerSection = document.getElementById('player-details-section');
  if (playerSection) {
    playerObserver.observe(playerSection, { childList: true, subtree: true });
  }
});

// 모듈 내보내기 (전역으로 노출)
window.chipAnalyzer = {
  init: initChipAnalyzer,
  analyzeStack: analyzeChipStack,
  captureChip: captureChipPhoto,
  captureStack: captureStackPhoto
};

console.log('✅ 칩 분석 모듈 로드 완료');