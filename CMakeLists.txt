cmake_minimum_required (VERSION 2.8)

project (BeefManager)

add_subdirectory(docs)

# Main Parse build/upload

add_custom_target( ParseDeploy ALL
    COMMAND parse deploy
    WORKING_DIRECTORY ${SRC_PATH}
    COMMENT Deploying to Parse cloud...
    )

FILE(GLOB_RECURSE CLOUD_FILES
    RELATIVE cloud
    *.ejs
    *.js
    )

FILE(GLOB_RECURSE PUBLIC_FILES
    RELATIVE public
    *
    )

add_dependencies( ParseDeploy ${CLOUD_FILES} ${PUBLIC_FILES} config/global.json)
