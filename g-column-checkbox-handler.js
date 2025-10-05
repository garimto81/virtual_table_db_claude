/**
 * G열 드롭다운 핸들러
 * G열 드롭다운에서 'A' 선택 가능, D열 연동 제거 버전
 *
 * 기존 로직: G열 체크박스 체크 시 → D열에 'A' 입력
 * 변경 로직: G열 드롭다운에서 'A' 선택 → D열 연동 없음 (독립적 동작)
 */

// G열 드롭다운 처리 (D열 연동 제거됨)
class GColumnDropdownHandler {
    constructor() {
        this.dropdownStates = new Map(); // 드롭다운 선택 상태 저장
        this.D_COLUMN_AUTO_FILL_DISABLED = true; // D열 자동 입력 비활성화
        this.availableOptions = ['', 'A', 'B', 'C']; // 사용 가능한 옵션들
    }

    /**
     * G열 드롭다운 선택 변경 처리
     * @param {number} rowNumber - 행 번호
     * @param {string} selectedValue - 선택된 값 ('', 'A', 'B', 'C')
     */
    handleGColumnDropdown(rowNumber, selectedValue) {
        console.log(`📝 G열 드롭다운 선택 변경: 행 ${rowNumber}, 선택값: "${selectedValue}"`);

        // 드롭다운 선택 상태 저장
        this.dropdownStates.set(rowNumber, selectedValue);

        // 기존 로직 (제거됨):
        // if (selectedValue === 'A') {
        //     this.updateDColumn(rowNumber, 'A');
        // }

        // 새 로직: D열 연동 없음 (빈칸 유지)
        if (this.D_COLUMN_AUTO_FILL_DISABLED) {
            console.log(`⚠️ D열 자동 입력 비활성화됨 - D열 업데이트 안 함 (빈칸 유지)`);
            return {
                success: true,
                message: `G열 드롭다운에서 "${selectedValue}" 선택됨 (D열 연동 없음)`,
                gColumn: selectedValue,
                dColumn: null // D열 업데이트 없음 - 빈칸 유지
            };
        }

        // 레거시 코드 (비활성화됨)
        // return this.legacyUpdateDColumn(rowNumber, selectedValue === 'A');
    }

    // 하위 호환성을 위한 체크박스 메소드 (드롭다운으로 리다이렉트)
    handleGColumnCheckbox(rowNumber, isChecked) {
        const selectedValue = isChecked ? 'A' : '';
        return this.handleGColumnDropdown(rowNumber, selectedValue);
    }

    /**
     * 레거시 D열 업데이트 (비활성화됨)
     * @deprecated D열 연동 제거됨
     */
    legacyUpdateDColumn(rowNumber, isChecked) {
        console.warn('⚠️ 레거시 D열 업데이트 호출됨 - 이 기능은 제거되었습니다');
        return {
            success: false,
            message: 'D열 자동 입력 기능이 제거되었습니다'
        };
    }

    /**
     * Apps Script를 통한 G열 체크박스 업데이트
     * D열 연동 없이 G열만 업데이트
     */
    async updateGColumnOnly(rowNumber, isChecked) {
        const updateData = {
            action: 'updateGColumn',
            rowNumber: rowNumber,
            gColumnValue: isChecked ? 'TRUE' : 'FALSE',
            // D열 업데이트 제거
            skipDColumn: true
        };

        console.log(`✅ G열만 업데이트: 행 ${rowNumber}, 값: ${updateData.gColumnValue}`);
        console.log(`❌ D열 업데이트 스킵 (연동 제거됨)`);

        return updateData;
    }

    /**
     * 드롭다운 선택 상태 조회
     */
    getDropdownState(rowNumber) {
        return this.dropdownStates.get(rowNumber) || '';
    }

    /**
     * 하위 호환성을 위한 체크박스 상태 조회
     */
    getCheckboxState(rowNumber) {
        const dropdownValue = this.dropdownStates.get(rowNumber) || '';
        return dropdownValue === 'A';
    }

    /**
     * 모든 드롭다운 상태 초기화
     */
    clearAllDropdowns() {
        this.dropdownStates.clear();
        console.log('✅ 모든 G열 드롭다운 상태 초기화됨');
    }

    /**
     * 하위 호환성을 위한 체크박스 초기화
     */
    clearAllCheckboxes() {
        this.clearAllDropdowns();
    }
}

// 전역 인스턴스 생성 (드롭다운 핸들러)
const gColumnHandler = new GColumnDropdownHandler();

// UI에 드롭다운 렌더링 함수
function renderGColumnDropdown(rowNumber, currentValue) {
    const selectedValue = currentValue || '';

    return `
        <div class="g-column-dropdown-wrapper">
            <select id="g-dropdown-${rowNumber}"
                    onchange="handleGDropdownChange(${rowNumber}, this.value)"
                    class="g-column-dropdown bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    data-row="${rowNumber}">
                <option value="" ${selectedValue === '' ? 'selected' : ''}>선택</option>
                <option value="A" ${selectedValue === 'A' ? 'selected' : ''}>A</option>
                <option value="B" ${selectedValue === 'B' ? 'selected' : ''}>B</option>
                <option value="C" ${selectedValue === 'C' ? 'selected' : ''}>C</option>
            </select>
            <label class="text-xs text-gray-400 ml-2">
                G열 선택 (D열 연동 없음)
            </label>
        </div>
    `;
}

// 하위 호환성을 위한 체크박스 렌더링 함수
function renderGColumnCheckbox(rowNumber, currentValue) {
    const isChecked = currentValue === 'TRUE' || currentValue === true || currentValue === 'A';
    const dropdownValue = isChecked ? 'A' : '';

    return renderGColumnDropdown(rowNumber, dropdownValue);
}

// 드롭다운 변경 이벤트 핸들러
function handleGDropdownChange(rowNumber, selectedValue) {
    console.log(`🔄 G열 드롭다운 변경: 행 ${rowNumber}, 선택값: "${selectedValue}"`);

    // G열 드롭다운 핸들러 호출 (D열 연동 없음)
    const result = gColumnHandler.handleGColumnDropdown(rowNumber, selectedValue);

    if (result.success) {
        console.log(`✅ ${result.message}`);

        // UI 업데이트 (G열만)
        updateGColumnUI(rowNumber, selectedValue);

        // D열은 업데이트하지 않음 (빈칸 유지)
        console.log(`ℹ️ D열 입력 로직 제거됨 - D열 빈칸 유지`);
    }
}

// 하위 호환성을 위한 체크박스 변경 이벤트 핸들러
function handleGCheckboxChange(rowNumber, isChecked) {
    console.log(`🔄 G열 체크박스 변경 (호환모드): 행 ${rowNumber}, 상태: ${isChecked}`);
    const selectedValue = isChecked ? 'A' : '';
    handleGDropdownChange(rowNumber, selectedValue);
}

// G열 UI만 업데이트 (드롭다운)
function updateGColumnUI(rowNumber, selectedValue) {
    const gCell = document.querySelector(`#g-cell-${rowNumber}`);
    if (gCell) {
        gCell.textContent = selectedValue || '';
        gCell.classList.toggle('has-value', selectedValue !== '');
    }

    // 드롭다운 요소도 업데이트
    const gDropdown = document.querySelector(`#g-dropdown-${rowNumber}`);
    if (gDropdown) {
        gDropdown.value = selectedValue || '';
    }
}

// 테스트 함수 (드롭다운)
function testGColumnDropdown() {
    console.log('========== G열 드롭다운 테스트 ==========');
    console.log('D열 입력 로직 제거 확인 (빈칸 유지)');

    // 테스트 1: 드롭다운에서 'A' 선택
    console.log('\n테스트 1: G열 드롭다운에서 "A" 선택');
    const result1 = gColumnHandler.handleGColumnDropdown(1, 'A');
    console.log('결과:', result1);
    console.log('D열 업데이트:', result1.dColumn); // null이어야 함

    // 테스트 2: 드롭다운에서 'B' 선택
    console.log('\n테스트 2: G열 드롭다운에서 "B" 선택');
    const result2 = gColumnHandler.handleGColumnDropdown(1, 'B');
    console.log('결과:', result2);
    console.log('D열 업데이트:', result2.dColumn); // null이어야 함

    // 테스트 3: 드롭다운 선택 해제 (빈값)
    console.log('\n테스트 3: G열 드롭다운 선택 해제');
    const result3 = gColumnHandler.handleGColumnDropdown(1, '');
    console.log('결과:', result3);
    console.log('D열 업데이트:', result3.dColumn); // null이어야 함

    // 테스트 4: 레거시 함수 호출 시도
    console.log('\n테스트 4: 레거시 D열 업데이트 시도');
    const result4 = gColumnHandler.legacyUpdateDColumn(1, true);
    console.log('결과:', result4); // 실패해야 함

    console.log('\n========== 테스트 완료 ==========');
    console.log('✅ G열 드롭다운에서 A, B, C 선택 가능');
    console.log('✅ D열 입력 로직 완전 제거 (빈칸 유지)');
}

// 하위 호환성을 위한 체크박스 테스트 함수
function testGColumnCheckbox() {
    console.log('========== G열 체크박스 테스트 (호환모드) ==========');
    testGColumnDropdown();
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GColumnDropdownHandler,
        gColumnHandler,
        renderGColumnDropdown,
        renderGColumnCheckbox, // 하위 호환성
        handleGDropdownChange,
        handleGCheckboxChange, // 하위 호환성
        testGColumnDropdown,
        testGColumnCheckbox // 하위 호환성
    };
}