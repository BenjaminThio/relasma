cmake_minimum_required(VERSION 3.20)

project(App VERSION 0.1.0 LANGUAGES CXX)

include(CheckIPOSupported)
check_ipo_supported(RESULT ipo_supported OUTPUT ipo_error)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

execute_process(COMMAND node -p "require('node-addon-api').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE)

string(REGEX REPLACE "[\r\n\"]" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

add_compile_definitions(NAPI_DISABLE_CPP_EXCEPTIONS)
add_compile_definitions(NAPI_VERSION=8)

file(GLOB_RECURSE CORE_SOURCES CONFIGURE_DEPENDS
    "${CMAKE_SOURCE_DIR}/src/addon.cpp"
)

add_library(${PROJECT_NAME} SHARED ${CORE_SOURCES} ${CMAKE_JS_SRC})

target_include_directories(${PROJECT_NAME} PRIVATE
    "${CMAKE_SOURCE_DIR}/include"
    "${CMAKE_SOURCE_DIR}/third_party"
    ${CMAKE_JS_INC}
    ${NODE_ADDON_API_DIR}
)

target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB} delayimp.lib)
target_compile_features(${PROJECT_NAME} PUBLIC cxx_std_23)
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

if(ipo_supported AND CMAKE_BUILD_TYPE MATCHES "Release|MinSizeRel")
    set_property(TARGET ${PROJECT_NAME} PROPERTY INTERPROCEDURAL_OPTIMIZATION TRUE)
elseif(ipo_supported)
    set_property(TARGET ${PROJECT_NAME} PROPERTY INTERPROCEDURAL_OPTIMIZATION FALSE)
endif()

if(CMAKE_BUILD_TYPE MATCHES "Release|MinSizeRel")
    target_compile_options(${PROJECT_NAME} PRIVATE
        -O2
        -arch:AVX2
        -fp:fast
        -EHs-c-
        -GR-
        -Gw
        -Gy
    )

    target_compile_definitions(${PROJECT_NAME} PRIVATE NDEBUG)

    target_link_options(${PROJECT_NAME} PRIVATE
        -OPT:REF
        -OPT:ICF
    )

    message(STATUS ">> MSVC BUILD DETECTED")
endif()