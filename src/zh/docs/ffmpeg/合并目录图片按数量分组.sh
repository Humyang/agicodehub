for img in "frames/"*.jpg; do
  ffmpeg -i "$img" -filter:v "crop=842:507:597:932" "cropped/$(basename "$img")" -y
done

for f in *.png; do ffmpeg -i "$f" -vf "crop=637:308:802:1131" "res/${f%.png}.jpg" -y; done

#!/bin/bash
shopt -s nullglob
for img in frames/*.{jpg}; do
    ffmpeg -i "$img" -filter:v "crop=531:89:908:1350" "cropped/$(basename "$img")"
done

ffmpeg -i "cropped/frame_%04d.jpg" -filter_complex "tile=5x4" "combined.png" -y

ffmpeg -i "Wan_首尾帧生视频_light to dark 的切换效果 (2).mp4" -i 1130e65e-6c62-4183-8e9c-d977ec212b3a.png -filter_complex "[1]format=rgba,alphaextract[alpha];[0]chromakey=color=green:similarity=0.1:blend=0.1[chroma];[chroma][alpha]alphamerge" step1.mp4

ffmpeg -i "Wan_首尾帧生视频_light to dark 的切换效果 (2)_ysku0xe7fl_split.mp4" -i 1130e65e-6c62-4183-8e9c-d977ec212b3a.png -filter_complex "[1]format=rgba,alphaextract[alpha];[0]chromakey=color=green:similarity=0.1:blend=0.1[chroma];[chroma][alpha]alphamerge" step1.webm
