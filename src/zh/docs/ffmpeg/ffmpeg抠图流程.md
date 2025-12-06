---
title: ffmpeg 抠图流程
titleTemplate: develop-log
description: agicodehub has a rich but not overwhelming features.
---

# ffmpeg 抠图流程

ffmpeg -i input.mp4 -vf "chromakey=0x020202:0.1:0.2" -c:a copy output.mov

ffmpeg -i input_4vxsyw55bm_split.mp4 -vf "chromakey=0x020202" -c:v libvpx-vp9 -c:a libopus output_input_4vxsyw55bm_split.webm -y

ffmpeg -i "input.mp4" -ss 4 -to 5 "input_4vxsyw55bm_split.mp4" -y;

ffmpeg -i input_4vxsyw55bm_split2.mp4 -i mask.png -filter_complex "[1]format=rgba,alphaextract[alpha];[0]chromakey=color=green:similarity=0.1:blend=0.1[chroma];[chroma][alpha]alphamerge" step1.webm
ffmpeg -i dark-to-light_1000.mp4 -i mask.png -filter_complex "[1]format=rgba,alphaextract[alpha];[0]chromakey=color=green:similarity=0.1:blend=0.1[chroma];[chroma][alpha]alphamerge" dark-to-light.webm -y

ffmpeg -i input.mp4 -vf "scale=1000:1000" input_4vxsyw55bm_split2.mp4
ffmpeg -i dark-to-light.mp4 -vf "scale=1000:1000" dark-to-light_1000.mp4

ffmpeg -i light-to-dark.webm -vf "reverse" dark-to-light.webm

ffmpeg -i light-to-dark.webm -vf "reverse" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 dark-to-light2.webm -y
