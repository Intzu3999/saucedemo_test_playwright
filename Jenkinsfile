// Jenkins declarative pipeline for the Playwright demo framework.
//
// Prerequisites in Jenkins:
//   1. A Node.js installation named "NodeJS-20" configured under
//      Manage Jenkins -> Tools -> NodeJS installations.
//   2. (Optional) A "Secret text" credential with ID "qase-testops-api-token"
//      holding the Qase.IO API token. If absent, the reporter stays disabled.
//   3. Plugins: NodeJS, HTML Publisher, JUnit, (optional) Credentials Binding.
//
// Trigger the job manually, on push (via multibranch), or via cron by adding a
// `triggers { ... }` block below.

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
            defaultValue: 'DEMO',
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
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        ansiColor('xterm')
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
                    if (params.QASE_MODE == 'testops') {
                        withCredentials([string(
                            credentialsId: 'qase-testops-api-token',
                            variable: 'QASE_TESTOPS_API_TOKEN'
                        )]) {
                            sh 'npx playwright test'
                        }
                    } else {
                        sh 'npx playwright test'
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
