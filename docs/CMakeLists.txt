# Build Mscgen documentation

ADD_CUSTOM_TARGET( MscgenDocs ALL )
FILE(GLOB MSGGEN_SRC_FILES *.msc)
SET(MSCGEN_RESULTS)
FOREACH(file ${MSGGEN_SRC_FILES})
    SET(SRC ${file})
    STRING(REGEX REPLACE "\\.msc$" ".png" DST ${SRC})
    ADD_CUSTOM_COMMAND(SOURCE ${SRC}
        TARGET MscgenDocs
        COMMAND mscgen
        ARGS -T png -i ${SRC} -o ${DST}
        OUTPUTS ${DST})
    SET(MSCGEN_RESULTS ${MSCGEN_RESULTS} ${DST})
ENDFOREACH(file)
ADD_CUSTOM_COMMAND(SOURCE MscgenDocs
    TARGET MscgenDocs
    DEPENDS ${MSCGEN_RESULTS}
    )
