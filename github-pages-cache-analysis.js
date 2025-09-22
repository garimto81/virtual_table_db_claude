const { chromium, firefox, webkit } = require('playwright');

class GitHubPagesCacheAnalyzer {
    constructor() {
        this.baseUrl = 'https://garimto81.github.io/virtual_table_db_claude/';
        this.results = {
            timestamp: new Date().toISOString(),
            tests: []
        };
    }

    async runComprehensiveAnalysis() {
        console.log('🔍 GitHub Pages 캐시 문제 심층 분석 시작...\n');

        // 모든 브라우저에서 테스트
        const browsers = [
            { name: 'Chromium', engine: chromium },
            { name: 'Firefox', engine: firefox },
            { name: 'WebKit', engine: webkit }
        ];

        for (const { name, engine } of browsers) {
            await this.analyzeWithBrowser(name, engine);
        }

        await this.analyzeGitHubRepository();
        this.generateFinalReport();
    }

    async analyzeWithBrowser(browserName, browserEngine) {
        console.log(`\n🌐 ${browserName} 브라우저 분석 시작...`);

        const browser = await browserEngine.launch({
            headless: false,
            slowMo: 500
        });

        // 일반 컨텍스트와 시크릿 모드 컨텍스트
        const contexts = [
            { name: 'Normal', context: await browser.newContext() },
            { name: 'Incognito', context: await browser.newContext() }
        ];

        for (const { name: contextName, context } of contexts) {
            console.log(`\n📊 ${browserName} - ${contextName} 모드 테스트`);

            const page = await context.newPage();

            // 네트워크 요청 모니터링
            const networkLogs = [];
            page.on('response', response => {
                networkLogs.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers(),
                    fromCache: response.fromServiceWorker()
                });
            });

            // 콘솔 로그 캡처
            const consoleLogs = [];
            page.on('console', msg => {
                consoleLogs.push(`${msg.type()}: ${msg.text()}`);
            });

            await this.testDifferentUrls(page, `${browserName}-${contextName}`, networkLogs, consoleLogs);

            await context.close();
        }

        await browser.close();
    }

    async testDifferentUrls(page, testId, networkLogs, consoleLogs) {
        const timestamp = Date.now();
        const testUrls = [
            { name: 'Direct Access', url: this.baseUrl },
            { name: 'Cache Busting', url: `${this.baseUrl}?nocache=${timestamp}` },
            { name: 'Direct index.html', url: `${this.baseUrl}index.html` },
            { name: 'Cache Busting + index', url: `${this.baseUrl}index.html?v=${timestamp}` }
        ];

        for (const { name, url } of testUrls) {
            console.log(`  📍 ${name} 테스트: ${url}`);

            try {
                // 페이지 로드
                const response = await page.goto(url, {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });

                // 페이지가 완전히 로드될 때까지 대기
                await page.waitForTimeout(2000);

                // 버전 정보 추출
                const versionInfo = await this.extractVersionInfo(page);

                // 네트워크 헤더 분석
                const mainDocResponse = networkLogs.find(log =>
                    log.url === url || log.url === url.split('?')[0]
                );

                const testResult = {
                    testId,
                    testName: name,
                    url,
                    timestamp: new Date().toISOString(),
                    status: response.status(),
                    versionInfo,
                    headers: mainDocResponse?.headers || {},
                    consoleLogs: [...consoleLogs],
                    screenshot: `screenshot-${testId}-${name.replace(/\s+/g, '-')}.png`
                };

                // 스크린샷 저장
                await page.screenshot({
                    path: `C:\\claude01\\${testResult.screenshot}`,
                    fullPage: true
                });

                this.results.tests.push(testResult);

                console.log(`    ✅ Status: ${response.status()}`);
                console.log(`    📱 Version: ${versionInfo.appVersion || 'Not found'}`);
                console.log(`    🏷️ Title: ${versionInfo.pageTitle || 'Not found'}`);

                // 캐시 관련 헤더 출력
                const cacheHeaders = this.analyzeCacheHeaders(mainDocResponse?.headers || {});
                if (cacheHeaders.length > 0) {
                    console.log(`    🗄️ Cache Headers: ${JSON.stringify(cacheHeaders)}`);
                }

            } catch (error) {
                console.error(`    ❌ Error: ${error.message}`);
                this.results.tests.push({
                    testId,
                    testName: name,
                    url,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            // 각 테스트 간 간격
            await page.waitForTimeout(1000);
        }
    }

    async extractVersionInfo(page) {
        try {
            // 페이지 제목에서 버전 추출
            const pageTitle = await page.title();

            // APP_VERSION 변수 추출
            const appVersion = await page.evaluate(() => {
                // 전역 변수 확인
                if (typeof APP_VERSION !== 'undefined') {
                    return APP_VERSION;
                }

                // 스크립트 태그에서 직접 추출
                const scripts = document.getElementsByTagName('script');
                for (let script of scripts) {
                    const content = script.innerHTML;
                    if (content.includes('APP_VERSION')) {
                        const match = content.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
                        if (match) return match[1];
                    }
                }

                return null;
            });

            // 메타 태그에서 버전 정보 확인
            const metaVersion = await page.evaluate(() => {
                const meta = document.querySelector('meta[name="version"]');
                return meta ? meta.getAttribute('content') : null;
            });

            // 콘솔에서 버전 로그 확인
            const consoleVersion = await page.evaluate(() => {
                // 콘솔 로그를 캡처할 수 있는 방법이 제한적이므로
                // 현재 로드된 스크립트에서 버전 정보 찾기
                const allText = document.documentElement.innerText;
                const versionMatch = allText.match(/v\d+\.\d+\.\d+/gi);
                return versionMatch ? versionMatch[0] : null;
            });

            return {
                pageTitle,
                appVersion,
                metaVersion,
                consoleVersion,
                extractedAt: new Date().toISOString()
            };

        } catch (error) {
            return { error: error.message };
        }
    }

    analyzeCacheHeaders(headers) {
        const cacheRelatedHeaders = {};
        const relevantKeys = [
            'cache-control', 'etag', 'last-modified', 'expires',
            'age', 'x-cache', 'cf-cache-status', 'x-github-request-id',
            'server', 'date'
        ];

        for (const key of relevantKeys) {
            if (headers[key]) {
                cacheRelatedHeaders[key] = headers[key];
            }
        }

        return cacheRelatedHeaders;
    }

    async analyzeGitHubRepository() {
        console.log('\n🐙 GitHub 저장소 구조 분석...');

        const { chromium } = require('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            // GitHub 저장소 메인 페이지
            await page.goto('https://github.com/garimto81/virtual_table_db_claude');
            await page.waitForSelector('[data-testid="file-view"]', { timeout: 10000 });

            // 파일 목록 추출
            const fileList = await page.evaluate(() => {
                const files = [];
                const fileElements = document.querySelectorAll('[data-testid="file-view"] .js-navigation-item');

                fileElements.forEach(element => {
                    const nameElement = element.querySelector('a[title]');
                    const typeElement = element.querySelector('[aria-label*="file"], [aria-label*="directory"]');

                    if (nameElement) {
                        files.push({
                            name: nameElement.textContent.trim(),
                            type: typeElement ? typeElement.getAttribute('aria-label') : 'unknown',
                            href: nameElement.href
                        });
                    }
                });

                return files;
            });

            console.log('📁 루트 디렉토리 파일 목록:');
            fileList.forEach(file => {
                console.log(`  ${file.type.includes('directory') ? '📁' : '📄'} ${file.name}`);
            });

            // index.html 존재 여부 확인
            const hasIndexHtml = fileList.some(file => file.name === 'index.html');
            console.log(`\n📄 index.html 존재: ${hasIndexHtml ? '✅' : '❌'}`);

            // GitHub Actions 페이지 확인
            await page.goto('https://github.com/garimto81/virtual_table_db_claude/actions');
            await page.waitForTimeout(2000);

            // 최근 워크플로우 실행 상태 확인
            const workflows = await page.evaluate(() => {
                const workflowElements = document.querySelectorAll('[data-testid="workflow-run-list"] .Box-row');
                const results = [];

                workflowElements.forEach((element, index) => {
                    if (index < 5) { // 최근 5개만
                        const status = element.querySelector('[data-testid="workflow-run-status"]');
                        const title = element.querySelector('a[data-testid="workflow-run-link"]');
                        const time = element.querySelector('relative-time');

                        results.push({
                            status: status ? status.getAttribute('aria-label') : 'unknown',
                            title: title ? title.textContent.trim() : 'unknown',
                            time: time ? time.getAttribute('datetime') : 'unknown'
                        });
                    }
                });

                return results;
            });

            console.log('\n🔄 최근 GitHub Actions 워크플로우:');
            workflows.forEach((workflow, index) => {
                console.log(`  ${index + 1}. ${workflow.status} - ${workflow.title} (${workflow.time})`);
            });

            // GitHub Pages 설정 확인
            await page.goto('https://github.com/garimto81/virtual_table_db_claude/settings/pages');
            await page.waitForTimeout(2000);

            const pagesConfig = await page.evaluate(() => {
                // Pages 설정 정보 추출 시도
                const sourceInfo = document.querySelector('[data-testid="pages-source-branch"]');
                const statusInfo = document.querySelector('[data-testid="pages-status"]');

                return {
                    source: sourceInfo ? sourceInfo.textContent.trim() : 'Not accessible',
                    status: statusInfo ? statusInfo.textContent.trim() : 'Not accessible',
                    url: window.location.href
                };
            });

            console.log('\n⚙️ GitHub Pages 설정:');
            console.log(`  소스: ${pagesConfig.source}`);
            console.log(`  상태: ${pagesConfig.status}`);

            this.results.github = {
                fileList,
                hasIndexHtml,
                workflows,
                pagesConfig
            };

        } catch (error) {
            console.error(`❌ GitHub 분석 중 오류: ${error.message}`);
            this.results.github = { error: error.message };
        }

        await browser.close();
    }

    generateFinalReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 최종 분석 결과 보고서');
        console.log('='.repeat(80));

        // 결과 JSON 파일로 저장
        const reportPath = `C:\\claude01\\github-pages-analysis-${Date.now()}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

        console.log(`\n💾 상세 분석 결과가 저장되었습니다: ${reportPath}`);

        // 요약 분석
        this.analyzeFindingsAndRecommendations();
    }

    analyzeFindingsAndRecommendations() {
        console.log('\n🔍 주요 발견사항:');

        // 버전 정보 일관성 체크
        const versions = this.results.tests
            .filter(test => test.versionInfo && test.versionInfo.appVersion)
            .map(test => test.versionInfo.appVersion);

        const uniqueVersions = [...new Set(versions)];
        console.log(`\n📊 발견된 APP_VERSION: ${uniqueVersions.join(', ')}`);

        if (uniqueVersions.length > 1) {
            console.log('⚠️  서로 다른 버전이 감지되었습니다!');
        } else if (uniqueVersions.length === 0) {
            console.log('❌ APP_VERSION을 찾을 수 없습니다!');
        } else {
            console.log('✅ 일관된 버전이 감지되었습니다.');
        }

        // 캐시 헤더 분석
        console.log('\n🗄️ 캐시 설정 분석:');
        const cacheHeaders = this.results.tests
            .map(test => test.headers)
            .filter(headers => Object.keys(headers).length > 0);

        if (cacheHeaders.length > 0) {
            const commonHeaders = cacheHeaders[0];
            console.log(`  Cache-Control: ${commonHeaders['cache-control'] || 'Not set'}`);
            console.log(`  ETag: ${commonHeaders['etag'] || 'Not set'}`);
            console.log(`  Last-Modified: ${commonHeaders['last-modified'] || 'Not set'}`);
            console.log(`  Server: ${commonHeaders['server'] || 'Not set'}`);
        }

        // 추천 해결책
        console.log('\n💡 추천 해결책:');
        console.log('1. 강제 캐시 무효화를 위한 버전 파라미터 사용');
        console.log('2. GitHub Actions에서 빌드 시 타임스탬프 추가');
        console.log('3. Cache-Control 헤더 설정 최적화');
        console.log('4. CDN 캐시 수동 purge 요청');
        console.log('5. 브라우저별 하드 리프레시 가이드 제공');
    }
}

// 분석 실행
async function runAnalysis() {
    const analyzer = new GitHubPagesCacheAnalyzer();
    await analyzer.runComprehensiveAnalysis();
}

// 스크립트가 직접 실행되는 경우
if (require.main === module) {
    runAnalysis().catch(console.error);
}

module.exports = GitHubPagesCacheAnalyzer;