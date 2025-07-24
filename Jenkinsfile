pipeline {
    agent {
        label 'ansible-agent'
    }

    parameters {
        // Define boolean variables for project deployment - user input
        booleanParam(name: 'LaunchCI', defaultValue: true, description: 'Launch CI tests')
    }

    environment {
        // Static vars
        REPO_SO_BASE_URL = 'git@git.smart-origin.com:SmartOrigin'
        REPO_BACKEND_NAME = 'c2c_ui'
        WORKDIR = 'tmp_c2c_ci'
        PODMAN_ARGS = '-p c2c_ci -f podman-compose.ci.yml'
    }

    stages {
        stage('Launch CI tests') {
            //The when block control is this stage should be run base on the params given
            when {
                expression {
                    params.LaunchCI == true
                }
            }         
            steps {
                script {
                    sh """
                        pwd
                        podman-compose ${env.PODMAN_ARGS} up -d
                        sleep 60
                        """
                        try { sh "podman-compose ${env.PODMAN_ARGS} exec test /c2c_ci/launch_ci.sh" }
                        catch (Exception e) {
                            currentBuild.result = 'FAILURE' // Mark the build as failed
                            error "CI failed: ${e.getMessage()}"
                        }
                        sh "podman-compose ${env.PODMAN_ARGS} down"
                }
            }
        }
    }
    post {
        // Your post-build actions here
        failure {
            // Actions to take when any step or stage fails
            echo 'The build has failed. Take a look at the logs and try again'
        }
        success {
            // Actions to take when any step or stage fails
            echo 'The build has succeded. Enjoy!'
        }
    }
}
