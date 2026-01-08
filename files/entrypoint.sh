#!/bin/sh
echo "Launching ioquake3 server version ${IOQUAKE3_COMMIT}..."

echo "Copying default configs..."
    cp /opt/quake3/default-configs/* /opt/quake3/baseq3/

if [ "$(ls -A /opt/quake3/configs 2>/dev/null)" ]; then
    echo "Copying custom configs..."
    cp /opt/quake3/configs/* /opt/quake3/baseq3/
fi

if [ -z "${SERVER_ARGS}" ]; then
    echo "No additional server arguments found; running default Deathmatch configuration."
    SERVER_ARGS="+exec server_ffa.cfg"
fi

if [ -z "${SERVER_MOTD}" ]; then
    SERVER_MOTD="Welcome to my Quake 3 server!"
fi

if [ -z "${ADMIN_PASSWORD}" ]; then
    ADMIN_PASSWORD=$(cat /dev/urandom | head -c${1:-32} | base64)
    echo "No admin password set; defaulting to ${ADMIN_PASSWORD}."
fi

FASTDL_ARGS=""
if [ -n "${FASTDL_URL}" ]; then
    echo "Fast download enabled via ${FASTDL_URL}."
    FASTDL_ARGS="+seta sv_allowDownload 1 +seta sv_dlURL \"${FASTDL_URL}\""
fi

IOQ3DED_BIN=$(ls /opt/quake3/ioq3ded*)
if [ $(echo ${IOQ3DED_BIN} | wc -l) -gt 1 ]; then
    echo "Found more than one file matching /opt/quake3/ioq3ded*:"
    echo ${IOQ3DED_BIN}
    exit 1
fi

echo "Command line:"
echo ${IOQ3DED_BIN}  "+seta rconPassword " ${ADMIN_PASSWORD} " +g_motd " ${SERVER_MOTD} ${FASTDL_ARGS} ${SERVER_ARGS}

${IOQ3DED_BIN} \
    +set dedicated 1 \
    ${SERVER_ARGS} \
    +seta rconPassword "${ADMIN_PASSWORD}" \    
    +g_motd "${SERVER_MOTD}" \
    ${FASTDL_ARGS} \
    
    