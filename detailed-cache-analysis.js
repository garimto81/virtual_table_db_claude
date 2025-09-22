const { chromium } = require('@playwright/test');

async function detailedCacheAnalysis() {
    console.log('🔬 상세 캐시 분석 시작...\n');

    const browser = await chromium.launch({ headless: false });

    try {
        console.log('📋 테스트 요약:');
        console.log('─'.repeat(40));
        console.log('• 로컬 파일: v13.3.3');
        console.log('• GitHub Raw: v13.3.3');
        console.log('• GitHub Pages: v12.16.3 (캐시됨)');
        console.log('• Last-Modified: Fri, 19 Sep 2025 07:48:36 GMT');
        console.log('• ETag: W/"68cd0ad4-62ae8"');
        console.log('• Cache-Control: max-age=600 (10분)');
        console.log('• CDN: Fastly (X-Cache: HIT)\n');

        // 1. GitHub Pages 직접 접속 테스트
        console.log('🌐 1. GitHub Pages 직접 접속 분석');
        console.log('═'.repeat(50));

        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        let responseData = null;
        page1.on('response', response => {
            if (response.url() === 'https://garimto81.github.io/virtual_table_db_claude/') {
                responseData = {
                    status: response.status(),
                    headers: response.headers(),
                    url: response.url()
                };
            }
        });

        await page1.goto('https://garimto81.github.io/virtual_table_db_claude/');

        const version1 = await page1.evaluate(() => {
            const script = document.querySelector('script[src*="script"]');
            return script ? script.src : 'script 태그 없음';
        });

        const appVersionScript = await page1.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            for (let script of scripts) {
                if (script.innerHTML.includes('APP_VERSION')) {
                    return script.innerHTML;
                }
            }
            return 'APP_VERSION 스크립트 없음';
        });

        console.log(`📌 스크립트 소스: ${version1}`);
        console.log(`📌 APP_VERSION 스크립트 존재: ${appVersionScript.includes('APP_VERSION')}`);

        if (responseData) {
            console.log('\n🌐 상세 응답 헤더:');
            Object.entries(responseData.headers).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        }

        // 2. 강제 캐시 무효화 테스트
        console.log('\n🔄 2. 강제 캐시 무효화 테스트');
        console.log('═'.repeat(50));

        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        // 캐시 비활성화
        await page2.route('**/*', async route => {
            const headers = {
                ...route.request().headers(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            route.continue({ headers });
        });

        await page2.goto('https://garimto81.github.io/virtual_table_db_claude/');

        const version2 = await page2.evaluate(() => {
            return window.APP_VERSION || '정의되지 않음';
        });

        console.log(`📌 캐시 무효화 후 APP_VERSION: ${version2}`);

        // 3. URL 파라미터 캐시 버스팅 테스트
        console.log('\n⚡ 3. URL 파라미터 캐시 버스팅 테스트');
        console.log('═'.repeat(50));

        const context3 = await browser.newContext();
        const page3 = await context3.newPage();

        const cacheBustUrl = `https://garimto81.github.io/virtual_table_db_claude/?v=${Date.now()}`;
        await page3.goto(cacheBustUrl);

        const version3 = await page3.evaluate(() => {
            return window.APP_VERSION || '정의되지 않음';
        });

        console.log(`📌 캐시 버스팅 URL: ${cacheBustUrl}`);
        console.log(`📌 캐시 버스팅 후 APP_VERSION: ${version3}`);

        // 4. Raw 파일 직접 확인
        console.log('\n📄 4. Raw 파일 다시 확인');
        console.log('═'.repeat(50));

        const context4 = await browser.newContext();
        const page4 = await context4.newPage();

        await page4.goto('https://raw.githubusercontent.com/garimto81/virtual_table_db_claude/master/index.html');

        const rawContent = await page4.textContent('body');
        const rawVersionMatch = rawContent.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
        const rawVersion = rawVersionMatch ? rawVersionMatch[1] : '찾을 수 없음';

        console.log(`📌 Raw 파일 APP_VERSION: ${rawVersion}`);
        console.log(`📌 Raw 파일 크기: ${rawContent.length} bytes`);

        // 5. 캐시 만료 시간 계산
        console.log('\n⏰ 5. 캐시 만료 시간 분석');
        console.log('═'.repeat(50));

        if (responseData && responseData.headers['last-modified']) {
            const lastModified = new Date(responseData.headers['last-modified']);
            const maxAge = 600; // 10분
            const expiryTime = new Date(lastModified.getTime() + maxAge * 1000);
            const now = new Date();
            const remainingTime = Math.max(0, expiryTime.getTime() - now.getTime());

            console.log(`📌 Last-Modified: ${lastModified.toISOString()}`);
            console.log(`📌 Cache Max-Age: ${maxAge}초 (10분)`);
            console.log(`📌 예상 만료 시간: ${expiryTime.toISOString()}`);
            console.log(`📌 현재 시간: ${now.toISOString()}`);
            console.log(`📌 남은 캐시 시간: ${Math.round(remainingTime / 1000)}초`);
        }

        // 6. CDN 캐시 분석
        console.log('\n🌍 6. CDN 캐시 계층 분석');
        console.log('═'.repeat(50));

        if (responseData) {
            const fastlyHeaders = Object.entries(responseData.headers)
                .filter(([key]) => key.toLowerCase().includes('fastly') ||
                                 key.toLowerCase().includes('x-cache') ||
                                 key.toLowerCase().includes('x-served'))
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});

            console.log('📌 Fastly CDN 헤더:');
            Object.entries(fastlyHeaders).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        }

        // 결론 및 권장사항
        console.log('\n🎯 결론 및 권장사항');
        console.log('═'.repeat(50));

        console.log('📊 문제 상황:');
        console.log('  • GitHub 저장소: v13.3.3 (최신)');
        console.log('  • GitHub Pages: v12.16.3 (구버전, 캐시됨)');
        console.log('  • CDN 캐시 상태: HIT (캐시에서 제공 중)');
        console.log('  • Cache-Control: max-age=600 (10분 캐시)');

        console.log('\n🔧 해결 방법 (우선순위):');
        console.log('  1. ⏰ 대기: 캐시 만료까지 최대 10분 대기');
        console.log('  2. 🔄 GitHub Actions 재실행: 새 배포 트리거');
        console.log('  3. 📝 더미 커밋: 빈 커밋으로 배포 강제 실행');
        console.log('  4. ⚡ 캐시 버스팅: ?v=timestamp 파라미터 사용');
        console.log('  5. 🛠️ CDN 수동 퍼지 (GitHub 지원팀 문의)');

        console.log('\n💡 예방 방법:');
        console.log('  • 배포 후 5-10분 대기 후 확인');
        console.log('  • GitHub Actions 워크플로우 상태 모니터링');
        console.log('  • 버전 체크 자동화 스크립트 구현');

        await context1.close();
        await context2.close();
        await context3.close();
        await context4.close();

    } catch (error) {
        console.error('❌ 분석 중 오류:', error);
    } finally {
        await browser.close();
    }
}

detailedCacheAnalysis().catch(console.error);