/**
 * ============================================
 * 모바일 최적화 카메라 모듈
 * Version: 1.0.0
 * 모바일 디바이스에서 더 나은 카메라 경험 제공
 * ============================================
 */

// 모바일 디바이스 감지
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// iOS 디바이스 감지
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 개선된 카메라 설정
async function getOptimizedCameraStream() {
  const isMobile = isMobileDevice();
  const isApple = isIOS();
  
  console.log(`📱 디바이스 타입: ${isMobile ? '모바일' : '데스크탑'} ${isApple ? '(iOS)' : ''}`);
  
  // 모바일 최적화 설정
  const constraints = {
    video: {
      // 후면 카메라 우선 (폰에서 더 고화질)
      facingMode: { ideal: 'environment' },
      
      // 해상도 설정 (모바일에서는 낮은 해상도가 더 빠름)
      width: { 
        min: 640,
        ideal: isMobile ? 1280 : 1920,
        max: isMobile ? 1920 : 3840
      },
      height: { 
        min: 480,
        ideal: isMobile ? 720 : 1080,
        max: isMobile ? 1080 : 2160
      },
      
      // 프레임률 (모바일에서는 낮게)
      frameRate: { 
        ideal: isMobile ? 15 : 30,
        max: 30
      },
      
      // iOS Safari 호환성
      aspectRatio: { ideal: 16/9 }
    },
    audio: false  // 오디오 불필요
  };
  
  try {
    // 먼저 권한 체크
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log(`📷 카메라 권한 상태: ${result.state}`);
        
        if (result.state === 'denied') {
          throw new Error('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        }
      } catch (e) {
        console.log('권한 API 미지원 (iOS Safari 등)');
      }
    }
    
    // 카메라 스트림 요청
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // 실제 설정 확인
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    console.log('📹 실제 카메라 설정:', {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      facingMode: settings.facingMode
    });
    
    return stream;
    
  } catch (error) {
    console.error('❌ 카메라 접근 실패:', error);
    
    // 에러별 상세 메시지
    let userMessage = '카메라를 사용할 수 없습니다.\n\n';
    
    if (error.name === 'NotAllowedError') {
      userMessage += '📱 카메라 권한을 허용해주세요.\n';
      if (isIOS()) {
        userMessage += 'iOS: 설정 > Safari > 카메라 에서 허용';
      } else {
        userMessage += 'Android: 브라우저 설정 > 사이트 권한에서 허용';
      }
    } else if (error.name === 'NotFoundError') {
      userMessage += '📷 카메라를 찾을 수 없습니다.';
    } else if (error.name === 'NotReadableError') {
      userMessage += '🔒 다른 앱이 카메라를 사용 중입니다.';
    } else if (error.name === 'OverconstrainedError') {
      userMessage += '⚙️ 요청한 카메라 설정을 지원하지 않습니다.';
    } else if (error.name === 'TypeError') {
      userMessage += '🔐 HTTPS 연결이 필요합니다.';
    }
    
    throw new Error(userMessage);
  }
}

// 개선된 카메라 미리보기 설정
function setupCameraPreview(video, stream) {
  video.srcObject = stream;
  
  // iOS 호환성 설정
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  
  // 비디오 준비 대기
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play()
        .then(() => {
          console.log('✅ 카메라 미리보기 시작');
          resolve();
        })
        .catch(reject);
    };
    
    // 타임아웃 설정 (5초)
    setTimeout(() => {
      reject(new Error('카메라 시작 시간 초과'));
    }, 5000);
  });
}

// 개선된 사진 촬영
function capturePhotoEnhanced(video, quality = 0.8) {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('비디오가 아직 준비되지 않았습니다.');
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // 원본 비디오 크기 사용
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // 이미지 그리기
  context.drawImage(video, 0, 0);
  
  // 모바일에서 메모리 절약을 위한 리사이즈
  const maxSize = isMobileDevice() ? 1280 : 1920;
  
  if (canvas.width > maxSize || canvas.height > maxSize) {
    const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    const newWidth = Math.floor(canvas.width * scale);
    const newHeight = Math.floor(canvas.height * scale);
    
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    
    const resizedContext = resizedCanvas.getContext('2d');
    resizedContext.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    console.log(`📐 이미지 리사이즈: ${canvas.width}x${canvas.height} → ${newWidth}x${newHeight}`);
    
    return resizedCanvas.toDataURL('image/jpeg', quality);
  }
  
  return canvas.toDataURL('image/jpeg', quality);
}

// 파일 입력 대체 방법 (카메라 접근 불가 시)
function createFileInputFallback() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';  // 모바일에서 카메라 앱 직접 열기
  
  return new Promise((resolve, reject) => {
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('파일이 선택되지 않았습니다.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    
    input.click();
  });
}

// 개선된 칩 컬러 모달 열기
async function openChipColorModalEnhanced() {
  const modal = document.getElementById('chip-color-modal');
  const video = document.getElementById('chip-video');
  
  if (!modal || !video) {
    console.error('모달 또는 비디오 요소를 찾을 수 없습니다.');
    return;
  }
  
  modal.classList.remove('hidden');
  
  // 로딩 표시
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10';
  loadingDiv.innerHTML = '<div class="text-white">카메라 준비 중...</div>';
  video.parentElement.appendChild(loadingDiv);
  
  try {
    // 카메라 스트림 획득
    const stream = await getOptimizedCameraStream();
    
    // 미리보기 설정
    await setupCameraPreview(video, stream);
    
    // 로딩 제거
    loadingDiv.remove();
    
    // 카메라 방향 전환 버튼 추가 (모바일만)
    if (isMobileDevice()) {
      addCameraSwitchButton(video);
    }
    
  } catch (error) {
    console.error('카메라 오류:', error);
    loadingDiv.remove();
    
    // 폴백: 파일 선택
    if (confirm(error.message + '\n\n갤러리에서 사진을 선택하시겠습니까?')) {
      try {
        const imageData = await createFileInputFallback();
        handleCapturedImage(imageData);
        modal.classList.add('hidden');
      } catch (e) {
        console.error('파일 선택 실패:', e);
      }
    } else {
      modal.classList.add('hidden');
    }
  }
}

// 카메라 전환 버튼 추가 (전면/후면)
function addCameraSwitchButton(video) {
  const existingBtn = document.getElementById('switch-camera-btn');
  if (existingBtn) return;
  
  const btn = document.createElement('button');
  btn.id = 'switch-camera-btn';
  btn.className = 'absolute top-2 right-2 bg-white bg-opacity-50 p-2 rounded-full';
  btn.innerHTML = '🔄';
  btn.title = '카메라 전환';
  
  let currentFacingMode = 'environment';
  
  btn.onclick = async () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // 기존 스트림 정지
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: currentFacingMode } }
      });
      await setupCameraPreview(video, stream);
    } catch (e) {
      console.error('카메라 전환 실패:', e);
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    }
  };
  
  video.parentElement.style.position = 'relative';
  video.parentElement.appendChild(btn);
}

// 캡처된 이미지 처리
function handleCapturedImage(imageData) {
  console.log('📸 이미지 캡처 완료');
  
  // 칩 값 입력 처리
  const valueInput = document.getElementById('chip-value-input');
  const chipValue = valueInput ? parseInt(valueInput.value.replace(/\D/g, '')) || 0 : 0;
  
  // 상태에 저장
  if (state.currentChipSlot !== null) {
    if (!state.chipColors[state.currentChipSlot]) {
      state.chipColors[state.currentChipSlot] = {};
    }
    
    state.chipColors[state.currentChipSlot].image = imageData;
    state.chipColors[state.currentChipSlot].value = chipValue;
    
    // 색상 추출 (간단한 구현)
    extractDominantColor(imageData).then(color => {
      state.chipColors[state.currentChipSlot].color = color;
      saveChipColors();
      renderChipColorSlots();
    });
  }
}

// 이미지에서 주요 색상 추출
async function extractDominantColor(imageData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 50; // 샘플링을 위한 작은 크기
      canvas.height = 50;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(25, 25, 1, 1).data;
      const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
      
      resolve(color);
    };
    img.src = imageData;
  });
}

// 모듈 내보내기
window.mobileCamera = {
  getOptimizedCameraStream,
  setupCameraPreview,
  capturePhotoEnhanced,
  createFileInputFallback,
  openChipColorModalEnhanced,
  isMobileDevice,
  isIOS
};

console.log('📱 모바일 카메라 모듈 로드 완료');