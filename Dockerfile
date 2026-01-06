# Build the game in a base container

# --- Build the game in a base container ---
FROM alpine:3.23.2 AS builder
LABEL "Maintainer"="klexx <klexx@pklan.net>"

ARG IOQUAKE3_COMMIT="main"
ENV IOQUAKE3_COMMIT=${IOQUAKE3_COMMIT}

WORKDIR /ioq3
RUN apk --no-cache add git curl g++ gcc cmake samurai
RUN git clone --depth 1 --branch ${IOQUAKE3_COMMIT} https://github.com/ioquake/ioq3.git .
WORKDIR /ioq3/build
RUN cmake -GNinja \
        -DBUILD_CLIENT=OFF \
        -DBUILD_RENDERER_GL1=OFF \
        -DBUILD_RENDERER_GL2=OFF \
        -DPRODUCT_VERSION=${IOQUAKE3_COMMIT} \
        -DBUILD_GAME_QVMS=OFF \
        ..
RUN cmake --build .
RUN cmake --install .

# Copy the game files from the builder container to a new image to minimise size

# --- Final runtime image ---
FROM alpine:3.23.2 AS ioq3ded
LABEL "Maintainer"="klexx <klexx@pklan.net>"

ARG IOQUAKE3_COMMIT="main"
ENV IOQUAKE3_COMMIT=${IOQUAKE3_COMMIT}

RUN adduser ioq3ded -D
COPY --chown=ioq3ded --from=builder /opt/quake3/ioq3ded /opt/quake3/ioq3ded

ADD --chown=ioq3ded files/ /opt/quake3/
RUN chmod +x /opt/quake3/entrypoint.sh

USER ioq3ded
EXPOSE 27960/udp
VOLUME [ "/opt/quake3/baseq3"]
CMD ["/opt/quake3/entrypoint.sh"]