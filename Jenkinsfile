// Jenkins declarative pipeline for the Playwright demo framework.
//
// Prerequisites in Jenkins:
//   1. A Node.js installation named "NodeJS-20" configured under
//      Manage Jenkins -> Tools -> NodeJS installations.
//   2. (Optional) A "Secret text" credential with ID "qase-testops-api-token"
//      holding the Qase.IO API token. If absent, the Qase reporter stays
//      disabled and tests still run.
//   3. Plugins: NodeJS, HTML Publisher, JUnit, AnsiColor, Credentials Binding.
//
// Trigger the job manually, on push (via multibranch), or via cron by adding
// a `triggers { ... }` block below.

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    parameters {
        choice(
            name: 'QASE_MODE',
            choices: ['off', 'testops'],
            description: 'Enable Qase.IO reporting for this run.'
        )
        string(
            name: 'QASE_PROJECT',
            defaultValue: 'SAUCEPW',
            description: 'Qase project code (used only when QASE_MODE=testops).'
        )
    }

    environment {
        CI = 'true'
        BASE_URL = 'https://www.saucedemo.com'
        STANDARD_USER = 'standard_user'
        LOCKED_OUT_USER = 'locked_out_user'
        PROBLEM_USER = 'problem_user'
        PERFORMANCE_GLITCH_USER = 'performance_glitch_user'
        VALID_PASSWORD = 'secret_sauce'
        INVALID_USER = 'invalid_user'
        INVALID_PASSWORD = 'wrong_password'
        HEADLESS = 'true'
        BROWSER = 'chromium'
        REQRES_BASE_URL = 'https://reqres.in/api'
        QASE_MODE = "${params.QASE_MODE}"
        QASE_TESTOPS_PROJECT = "${params.QASE_PROJECT}"
        QASE_TESTOPS_RUN_TITLE = "Jenkins - ${env.BUILD_NUMBER} - ${env.BRANCH_NAME ?: 'main'}"
        QASE_TESTOPS_RUN_COMPLETE = 'true'
        // Ask the reporter to expose the completed run as a public view-only
        // link (parity with the GitHub Actions workflow). The link is grepped
        // out of the tee'd log in the "Extract Qase link" stage below.
        QASE_TESTOPS_SHOW_PUBLIC_REPORT_LINK = 'true'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        ansiColor('xterm')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
        }

        stage('Install browsers') {
            steps {
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Run tests') {
            steps {
                script {
                    // CI excludes @known-bug tests -- known SauceDemo defects
                    // are tracked separately (see README) and should not block
                    // the build. Run `npm test` locally to see them fail red.
                    //
                    // We tee stdout/stderr to test-results/reporter.log so the
                    // next stage can grep the Qase public URL out of it.
                    sh 'mkdir -p test-results'
                    if (params.QASE_MODE == 'testops') {
                        withCredentials([string(
                            credentialsId: 'qase-testops-api-token',
                            variable: 'QASE_TESTOPS_API_TOKEN'
                        )]) {
                            sh 'set -o pipefail; npm run test:ci 2>&1 | tee test-results/reporter.log'
                        }
                    } else {
                        sh 'set -o pipefail; npm run test:ci 2>&1 | tee test-results/reporter.log'
                    }
                }
            }
        }

        stage('Extract Qase link') {
            when { expression { return params.QASE_MODE == 'testops' } }
            steps {
                script {
                    def link = sh(
                        script: '''grep -oE 'https://app\\.qase\\.io/public/report/[a-zA-Z0-9_-]+' test-results/reporter.log | head -1 || true''',
                        returnStdout: true
                    ).trim()

                    if (link) {
                        echo "Qase public report link: ${link}"
                        // Surface it prominently on the build's page.
                        currentBuild.description = """<a href='${link}' target='_blank' rel='noopener'>Qase public run report</a>"""
                    } else {
                        echo 'No Qase public report link found in reporter output. Skipping build description.'
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
            archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report'
            ])
        }
    }
}
