const { chromium } = require('playwright');

async function analyzeCacheHeaders() {
    console.log('🔍 GitHub Pages 네트워크 캐시 분석 시작...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const requests = [];
    const responses = [];

    // 네트워크 요청/응답 모니터링
    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });
    });

    page.on('response', response => {
        responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            fromServiceWorker: response.fromServiceWorker(),
            fromCache: response.fromCache?.() || false,
            timestamp: new Date().toISOString()
        });
    });

    try {
        console.log('📍 첫 번째 요청 (일반 접속)');
        await page.goto('https://garimto81.github.io/virtual_table_db_claude/', {
            waitUntil: 'networkidle'
        });

        await page.waitForTimeout(2000);

        // 버전 정보 추출
        const versionInfo = await page.evaluate(() => {
            return {
                appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
                title: document.title,
                lastModified: document.lastModified,
                readyState: document.readyState
            };
        });

        console.log(`📱 첫 번째 요청 버전: ${versionInfo.appVersion}`);
        console.log(`🏷️ 페이지 제목: ${versionInfo.title}`);

        // 메인 HTML 응답 분석
        const mainResponse = responses.find(r =>
            r.url === 'https://garimto81.github.io/virtual_table_db_claude/' ||
            r.url === 'https://garimto81.github.io/virtual_table_db_claude/index.html'
        );

        if (mainResponse) {
            console.log('\n🗄️ 첫 번째 요청 - 캐시 헤더 분석:');
            console.log(`  Status: ${mainResponse.status}`);
            console.log(`  Cache-Control: ${mainResponse.headers['cache-control'] || 'Not set'}`);
            console.log(`  ETag: ${mainResponse.headers['etag'] || 'Not set'}`);
            console.log(`  Last-Modified: ${mainResponse.headers['last-modified'] || 'Not set'}`);
            console.log(`  Age: ${mainResponse.headers['age'] || 'Not set'}`);
            console.log(`  Server: ${mainResponse.headers['server'] || 'Not set'}`);
            console.log(`  X-Cache: ${mainResponse.headers['x-cache'] || 'Not set'}`);
            console.log(`  CF-Cache-Status: ${mainResponse.headers['cf-cache-status'] || 'Not set'}`);
            console.log(`  X-GitHub-Request-Id: ${mainResponse.headers['x-github-request-id'] || 'Not set'}`);
            console.log(`  From Cache: ${mainResponse.fromCache}`);
        }

        // 캐시 무효화 테스트
        console.log('\n📍 두 번째 요청 (캐시 버스팅)');
        const timestamp = Date.now();

        // 기존 네트워크 로그 클리어
        requests.length = 0;
        responses.length = 0;

        await page.goto(`https://garimto81.github.io/virtual_table_db_claude/?nocache=${timestamp}`, {
            waitUntil: 'networkidle'
        });

        await page.waitForTimeout(2000);

        const versionInfo2 = await page.evaluate(() => {
            return {
                appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
                title: document.title
            };
        });

        console.log(`📱 두 번째 요청 버전: ${versionInfo2.appVersion}`);

        const mainResponse2 = responses.find(r =>
            r.url.includes('garimto81.github.io/virtual_table_db_claude')
        );

        if (mainResponse2) {
            console.log('\n🗄️ 두 번째 요청 - 캐시 헤더 분석:');
            console.log(`  Status: ${mainResponse2.status}`);
            console.log(`  Cache-Control: ${mainResponse2.headers['cache-control'] || 'Not set'}`);
            console.log(`  Age: ${mainResponse2.headers['age'] || 'Not set'}`);
            console.log(`  From Cache: ${mainResponse2.fromCache}`);
        }

        // 하드 리프레시 시뮬레이션
        console.log('\n📍 세 번째 요청 (하드 리프레시 시뮬레이션)');

        // Cache 무효화 헤더와 함께 요청
        await page.setExtraHTTPHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        requests.length = 0;
        responses.length = 0;

        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const versionInfo3 = await page.evaluate(() => {
            return {
                appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
                title: document.title
            };
        });

        console.log(`📱 세 번째 요청 버전: ${versionInfo3.appVersion}`);

        // 원시 HTML 소스 직접 확인
        console.log('\n📍 원시 HTML 소스 직접 분석');

        const htmlContent = await page.content();
        const versionMatch = htmlContent.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);

        console.log(`📄 HTML 소스에서 추출한 버전: ${versionMatch ? versionMatch[1] : 'Not found'}`);
        console.log(`📄 HTML 소스에서 추출한 제목: ${titleMatch ? titleMatch[1] : 'Not found'}`);

        // 최종 분석
        console.log('\n' + '='.repeat(80));
        console.log('📋 최종 분석 결과');
        console.log('='.repeat(80));

        const allVersions = [versionInfo.appVersion, versionInfo2.appVersion, versionInfo3.appVersion];
        const uniqueVersions = [...new Set(allVersions.filter(v => v))];

        console.log(`🔍 발견된 모든 버전: ${uniqueVersions.join(', ')}`);

        if (uniqueVersions.length === 1) {
            console.log('✅ 모든 요청에서 동일한 버전 확인됨');
            if (uniqueVersions[0] === '13.3.3') {
                console.log('🎉 최신 버전 13.3.3이 정상적으로 배포되어 있음!');
                console.log('💡 이전 테스트에서 12.16.3이 보인 것은 일시적인 캐시 문제였을 가능성');
            } else {
                console.log(`⚠️ 예상 버전 13.3.3과 다른 버전 ${uniqueVersions[0]} 감지`);
            }
        } else {
            console.log('❌ 요청별로 다른 버전이 반환되고 있음 - 캐시 불일치 문제 확인');
        }

        // 캐시 전략 추천
        console.log('\n💡 캐시 최적화 추천사항:');

        if (mainResponse) {
            const cacheControl = mainResponse.headers['cache-control'];
            const age = mainResponse.headers['age'];

            if (!cacheControl || cacheControl.includes('max-age')) {
                console.log('1. Cache-Control 헤더 최적화 필요');
            }

            if (age && parseInt(age) > 3600) {
                console.log('2. CDN 캐시 TTL이 너무 길어 보임 (1시간 이상)');
            }

            if (!mainResponse.headers['etag']) {
                console.log('3. ETag 헤더 설정 권장');
            }
        }

        console.log('4. 강제 배포 시 타임스탬프 파라미터 사용');
        console.log('5. GitHub Actions에서 빌드 시 고유 ID 생성');

    } catch (error) {
        console.error(`❌ 분석 중 오류 발생: ${error.message}`);
    } finally {
        await browser.close();
    }
}

analyzeCacheHeaders().catch(console.error);