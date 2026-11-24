# syntax=docker/dockerfile:1
#
# Two stages, both running as the non-root `build` user:
#
#   ci   Node, Rust and the Tauri system libraries: enough to validate and build.
#   dev  Everything in `ci`, plus sudo, Java and interactive tools.
#
#   docker build --target ci  -t u-choose:ci  .devcontainer
#   docker build --target dev -t u-choose:dev .devcontainer

ARG UBUNTU_VERSION=24.04
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS node

# ------------------------------------------------------------------------------
# CI
# ------------------------------------------------------------------------------
FROM ubuntu:${UBUNTU_VERSION} AS ci

ARG RUST_VERSION=1.100.0
ARG RUSTUP_VERSION=1.29.3
# Match these to the owner of the mounted repo (1000 on most Linux desktops,
# 1001 on GitHub-hosted runners).
ARG BUILD_UID=1000
ARG BUILD_GID=1000

ENV LANG=C.UTF-8

# Tauri v2 prerequisites: https://v2.tauri.app/start/prerequisites/#linux
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        file \
        git \
        libayatana-appindicator3-dev \
        librsvg2-dev \
        libssl-dev \
        libwebkit2gtk-4.1-dev \
        libxdo-dev \
        openssh-client \
        patchelf \
        pkg-config \
        wget \
        xdg-utils \
        xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Node, npm and Yarn, taken from the official image. /usr/local/bin/yarn is a
# symlink into /opt/yarn-v*, so the target has to be copied too. This Yarn only
# hands over to the version in the repo (see yarnPath in .yarnrc.yml).
COPY --from=node /usr/local/bin/ /usr/local/bin/
COPY --from=node /opt/ /opt/
COPY --from=node /usr/local/lib/node_modules/ /usr/local/lib/node_modules/

# The Ubuntu image ships an `ubuntu` user on UID 1000; remove it to free the ID.
RUN userdel --remove ubuntu \
    && groupadd --gid "${BUILD_GID}" build \
    && useradd --uid "${BUILD_UID}" --gid build --create-home --shell /bin/bash build

USER build

ENV CARGO_HOME=/home/build/.cargo \
    RUSTUP_HOME=/home/build/.rustup \
    PATH=/home/build/.cargo/bin:$PATH

# rustup writes ~/.cargo/env, which host .bashrc files commonly source.
RUN set -eu; \
    target="$(uname -m)-unknown-linux-gnu"; \
    url="https://static.rust-lang.org/rustup/archive/${RUSTUP_VERSION}/${target}"; \
    mkdir /tmp/rustup; \
    cd /tmp/rustup; \
    curl -fsSL -o rustup-init "${url}/rustup-init"; \
    echo "$(curl -fsSL "${url}/rustup-init.sha256" | cut -d' ' -f1)  rustup-init" | sha256sum -c -; \
    chmod +x rustup-init; \
    ./rustup-init -y --no-modify-path --profile minimal \
        --default-toolchain "${RUST_VERSION}" --component clippy,rustfmt; \
    rm -rf /tmp/rustup

WORKDIR /workspaces/u-choose

# ------------------------------------------------------------------------------
# Dev
# ------------------------------------------------------------------------------
FROM ci AS dev

USER root

# Java 21 runs the Firebase emulators.
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        bash-completion \
        gh \
        jq \
        less \
        nano \
        openjdk-21-jre-headless \
        procps \
        ripgrep \
        sudo \
        vim-tiny \
    && rm -rf /var/lib/apt/lists/*

# Using sudo
#   The container runs as `build`. To run something as root, prefix it with
#   `sudo` and enter the password:  build
#
#     $ sudo apt-get update
#     [sudo] password for build: build
#
#   The password is public, so it only guards against accidents. Anything
#   installed this way is lost on rebuild: add it to this file to keep it.
RUN echo 'build:build' | chpasswd \
    && usermod --append --groups sudo build

# Git reads the host's ~/.gitconfig (mounted at /etc/gitconfig.host) through the
# system config, leaving ~/.gitconfig writable for VS Code.
RUN git config --system include.path /etc/gitconfig.host \
    && git config --system --add safe.directory /workspaces/u-choose

# ~/.history is a bind-mounted file, which bash cannot replace by renaming. So
# append only, and never truncate.
RUN printf '%s\n' \
        '' \
        'shopt -s histappend' \
        'HISTFILE=/home/build/.history' \
        'HISTSIZE=10000' \
        'HISTFILESIZE=-1' \
        'PROMPT_COMMAND="history -a"' \
        >> /etc/bash.bashrc

# Create the named-volume mount points up front: new volumes copy their owner.
RUN install -d -o build -g build \
        /home/build/.cache \
        /home/build/.cargo/registry

USER build

RUN rustup component add rust-analyzer rust-src

CMD ["sleep", "infinity"]
