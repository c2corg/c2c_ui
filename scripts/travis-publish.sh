#!/bin/sh -e

REPO="c2corg/c2c_ui"

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "Not publishing docker images out of Pull Requests"
  exit 0
fi

build_image() {
  local DOCKER_TAG DOCKER_FILE
  DOCKER_TAG="$1"
  DOCKER_FILE="$2"

  echo "Building docker image '${DOCKER_TAG}'"
  docker build -f "${DOCKER_FILE}" -t "${DOCKER_TAG}" .
  docker inspect "${DOCKER_TAG}"
  docker history "${DOCKER_TAG}"
}

publish_image() {
  local DOCKER_IMAGE
  DOCKER_IMAGE="$1"

  echo "Pushing image '${DOCKER_IMAGE}' to docker hub"
  docker push "${DOCKER_IMAGE}"
}

docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"

if [ "$TRAVIS_BRANCH" = "master" ]; then
  build_image "${REPO}:latest" Dockerfile
  publish_image "${REPO}:latest"
elif [ ! -z "$TRAVIS_TAG" ]; then
  build_image "${REPO}:${TRAVIS_TAG}" Dockerfile
  publish_image "${REPO}:${TRAVIS_TAG}"
elif [ ! -z "$TRAVIS_BRANCH" ]; then
  build_image "${REPO}:${TRAVIS_BRANCH}" Dockerfile
  publish_image "${REPO}:${TRAVIS_BRANCH}"
else
  echo "Don't know how to build image, not pushing any image"
fi
