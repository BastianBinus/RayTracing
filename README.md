# Ray Tracing

Peter Shirley's *Ray Tracing in One Weekend* series — online book reader with reading progress, plus a place for the C++ implementations.

## Reading the books

Open `index.html` in a browser, or visit the [GitHub Pages site](https://bastianbinus.github.io/RayTracing/).

Each book page remembers where you left off. A table of contents appears on the left side on wider screens.

## Project structure

```
RayTracing/
│
├── index.html                        # Book library landing page
├── site/
│   ├── style.css                     # Landing page styles
│   └── progress.js                   # Reading progress + TOC (injected into book pages)
│
├── InOneWeekend/
│   ├── Book.html                     # Book I — online reader
│   ├── InOneWeekend.png              # Cover image
│   └── src/                          # ← Write your Book I C++ code here
│
├── TheNextWeek/
│   ├── Book.html                     # Book II — online reader
│   ├── image.png
│   └── src/                          # ← Book II C++ code
│
├── TheRestOfYourLife/
│   ├── Book.html                     # Book III — online reader
│   ├── image.png
│   └── src/                          # ← Book III C++ code
│
└── output/                           # ← Rendered .ppm images go here
```

## Writing C++ code

Put your source files in the `src/` folder for whichever book you're working through. Example layout:

```
InOneWeekend/src/
├── main.cpp
├── vec3.h
├── ray.h
└── ...
```

Compile and redirect output to the `output/` folder:

```bash
cd InOneWeekend/src
g++ -O2 -std=c++17 -o raytracer main.cpp
./raytracer > ../../output/render.ppm
```

## Viewing renders

`.ppm` files can be opened directly in most image viewers on Windows (Photos app, IrfanView) and macOS (Preview). To convert to PNG:

```bash
# ImageMagick
convert output/render.ppm output/render.png

# ffmpeg
ffmpeg -i output/render.ppm output/render.png
```

`.ppm` files are gitignored by default (they're large generated files). Remove that line from `.gitignore` if you want to commit your renders.
