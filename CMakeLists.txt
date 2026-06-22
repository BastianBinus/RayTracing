cmake_minimum_required(VERSION 3.10)
project(RayTracing CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Output binaries next to their source
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})

add_subdirectory(src/InOneWeekend)
add_subdirectory(src/TheNextWeek)
add_subdirectory(src/TheRestOfYourLife)
