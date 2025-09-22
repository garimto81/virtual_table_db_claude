const { chromium } = require('@playwright/test');
const fs = require('fs');

async function analyzeGitHubPagesCache() {
    console.log('🔍 GitHub Pages 캐시 분석 시작...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 네트워크 요청 모니터링
    const networkRequests = [];
    const responses = new Map();

    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });
    });

    page.on('response', response => {
        responses.set(response.url(), {
            status: response.status(),
            headers: response.headers(),
            url: response.url(),
            timestamp: new Date().toISOString()
        });
    });

    try {
        console.log('📊 1단계: GitHub Pages 사이트 테스트');
        console.log('=' .repeat(50));

        // GitHub Pages 접속
        await page.goto('https://garimto81.github.io/virtual_table_db_claude/', {
            waitUntil: 'networkidle'
        });

        // APP_VERSION 확인
        const appVersion = await page.evaluate(() => {
            return window.APP_VERSION || 'APP_VERSION이 정의되지 않음';
        });

        console.log(`📌 GitHub Pages APP_VERSION: ${appVersion}`);

        // 페이지 소스에서 APP_VERSION 검색
        const content = await page.content();
        const versionMatch = content.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
        const sourceVersion = versionMatch ? versionMatch[1] : '소스에서 찾을 수 없음';

        console.log(`📌 HTML 소스 APP_VERSION: ${sourceVersion}`);

        // 콘솔 메시지 확인
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        });

        // index.html 응답 헤더 분석
        const indexResponse = responses.get('https://garimto81.github.io/virtual_table_db_claude/');
        if (indexResponse) {
            console.log('\n🌐 GitHub Pages 응답 헤더:');
            console.log('─'.repeat(30));
            Object.entries(indexResponse.headers).forEach(([key, value]) => {
                if (key.toLowerCase().includes('cache') ||
                    key.toLowerCase().includes('etag') ||
                    key.toLowerCase().includes('modified') ||
                    key.toLowerCase().includes('fastly') ||
                    key.toLowerCase().includes('cdn')) {
                    console.log(`${key}: ${value}`);
                }
            });
        }

        console.log('\n📊 2단계: GitHub 저장소 Raw 파일 테스트');
        console.log('=' .repeat(50));

        // 새 탭으로 GitHub 저장소 접속
        const newPage = await context.newPage();
        await newPage.goto('https://github.com/garimto81/virtual_table_db_claude/blob/master/index.html');

        // Raw 파일 버전 확인을 위한 변수 초기화
        let rawVersion = 'Raw에서 찾을 수 없음';

        // Raw 버튼 클릭
        const rawButton = await newPage.locator('a[data-testid="raw-button"]');
        if (await rawButton.isVisible()) {
            await rawButton.click();
            await newPage.waitForLoadState('networkidle');

            // Raw 파일 내용에서 APP_VERSION 확인
            const rawContent = await newPage.textContent('body');
            const rawVersionMatch = rawContent.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
            rawVersion = rawVersionMatch ? rawVersionMatch[1] : 'Raw에서 찾을 수 없음';

            console.log(`📌 GitHub Raw APP_VERSION: ${rawVersion}`);
        }

        console.log('\n📊 3단계: 시크릿 모드 캐시 테스트');
        console.log('=' .repeat(50));

        // 시크릿 모드 브라우저 생성
        const incognitoContext = await browser.newContext();
        const incognitoPage = await incognitoContext.newPage();

        // 시크릿 모드에서 접속
        await incognitoPage.goto('https://garimto81.github.io/virtual_table_db_claude/', {
            waitUntil: 'networkidle'
        });

        const incognitoVersion = await incognitoPage.evaluate(() => {
            return window.APP_VERSION || 'APP_VERSION이 정의되지 않음';
        });

        console.log(`📌 시크릿 모드 APP_VERSION: ${incognitoVersion}`);

        // 하드 새로고침 (Ctrl+Shift+R)
        await incognitoPage.keyboard.press('Control+Shift+F5');
        await incognitoPage.waitForLoadState('networkidle');

        const hardRefreshVersion = await incognitoPage.evaluate(() => {
            return window.APP_VERSION || 'APP_VERSION이 정의되지 않음';
        });

        console.log(`📌 하드 새로고침 후 APP_VERSION: ${hardRefreshVersion}`);

        console.log('\n📊 4단계: 파일 크기 및 수정 시간 비교');
        console.log('=' .repeat(50));

        // GitHub Pages 파일 크기
        const githubPagesSize = content.length;
        console.log(`📌 GitHub Pages 파일 크기: ${githubPagesSize} bytes`);

        // 현재 시간
        console.log(`📌 테스트 시간: ${new Date().toISOString()}`);

        console.log('\n📊 5단계: 네트워크 요청 분석');
        console.log('=' .repeat(50));

        const mainIndexRequest = networkRequests.find(req =>
            req.url === 'https://garimto81.github.io/virtual_table_db_claude/' ||
            req.url === 'https://garimto81.github.io/virtual_table_db_claude/index.html'
        );

        if (mainIndexRequest) {
            console.log('📌 메인 요청 헤더:');
            Object.entries(mainIndexRequest.headers).forEach(([key, value]) => {
                if (key.toLowerCase().includes('cache') ||
                    key.toLowerCase().includes('if-') ||
                    key.toLowerCase().includes('accept')) {
                    console.log(`  ${key}: ${value}`);
                }
            });
        }

        console.log('\n📊 6단계: CDN 및 캐시 계층 분석');
        console.log('=' .repeat(50));

        // 응답 헤더에서 CDN 정보 추출
        if (indexResponse) {
            const headers = indexResponse.headers;

            console.log('📌 캐시 관련 헤더 상세 분석:');

            if (headers['cache-control']) {
                console.log(`  Cache-Control: ${headers['cache-control']}`);
            }

            if (headers['etag']) {
                console.log(`  ETag: ${headers['etag']}`);
            }

            if (headers['last-modified']) {
                console.log(`  Last-Modified: ${headers['last-modified']}`);
            }

            if (headers['x-served-by'] || headers['x-cache'] || headers['cf-cache-status']) {
                console.log('📌 CDN 정보:');
                if (headers['x-served-by']) console.log(`  X-Served-By: ${headers['x-served-by']}`);
                if (headers['x-cache']) console.log(`  X-Cache: ${headers['x-cache']}`);
                if (headers['cf-cache-status']) console.log(`  CF-Cache-Status: ${headers['cf-cache-status']}`);
            }

            // Fastly 관련 헤더
            Object.entries(headers).forEach(([key, value]) => {
                if (key.toLowerCase().includes('fastly') ||
                    key.toLowerCase().includes('x-github')) {
                    console.log(`  ${key}: ${value}`);
                }
            });
        }

        console.log('\n📊 7단계: 결과 요약 및 권장사항');
        console.log('=' .repeat(50));

        console.log('📌 버전 비교 요약:');
        console.log(`  GitHub Pages (일반): ${appVersion}`);
        console.log(`  GitHub Pages (시크릿): ${incognitoVersion}`);
        console.log(`  하드 새로고침 후: ${hardRefreshVersion}`);
        console.log(`  GitHub Raw: ${rawVersion || 'N/A'}`);

        // 캐시 문제 진단
        if (sourceVersion !== (rawVersion || 'N/A') && rawVersion !== 'Raw에서 찾을 수 없음') {
            console.log('\n🚨 캐시 문제 감지됨!');
            console.log('📋 추천 해결 방법:');
            console.log('  1. GitHub Pages 캐시 무효화 대기 (최대 10분)');
            console.log('  2. 강제 캐시 버스팅: ?v=' + Date.now() + ' 파라미터 추가');
            console.log('  3. GitHub Actions 워크플로우 재실행');
            console.log('  4. 새 커밋으로 배포 트리거');
        } else {
            console.log('\n✅ 버전이 일치합니다. 캐시 문제 없음.');
        }

        await incognitoContext.close();
        await newPage.close();

    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
analyzeGitHubPagesCache().catch(console.error);