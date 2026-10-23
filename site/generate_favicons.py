#!/usr/bin/env python3
"""
根据SVG文件生成各种格式的favicon图标
使用svglib替代cairosvg以避免系统依赖问题
"""

import os
import sys
from PIL import Image
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

def generate_favicons(svg_file_path, output_dir="."):
    """
    根据SVG文件生成各种favicon格式
    
    Args:
        svg_file_path (str): 输入的SVG文件路径
        output_dir (str): 输出目录
    """
    
    # 检查输入文件是否存在
    if not os.path.exists(svg_file_path):
        raise FileNotFoundError(f"SVG文件不存在: {svg_file_path}")
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 定义需要生成的图标尺寸和格式
    icon_configs = [
        # (文件名, 宽度, 高度, 格式)
        ("safari-pinned-tab.svg", None, None, "svg"),  # 保持SVG格式
        ("favicon.ico", 32, 32, "ico"),
        ("favicon-32x32.png", 32, 32, "png"),
        ("favicon-16x16.png", 16, 16, "png"),
        ("android-chrome-512x512.png", 512, 512, "png"),
        ("logo.png", 512, 512, "png"),
        ("logo-128px.png", 128, 128, "png"),
        ("logo.webp", 512, 512, "webp"),
        ("android-chrome-192x192.png", 192, 192, "png"),
        ("mstile-150x150.png", 150, 150, "png"),
        ("apple-touch-icon.png", 180, 180, "png"),  # 新增Apple Touch图标
    ]
    
    print(f"正在从 {svg_file_path} 生成favicon图标...")
    
    for filename, width, height, format_type in icon_configs:
        output_path = os.path.join(output_dir, filename)
        
        try:
            if format_type == "svg":
                # 对于SVG格式，直接复制文件
                with open(svg_file_path, 'rb') as src, open(output_path, 'wb') as dst:
                    dst.write(src.read())
                print(f"✓ 生成: {filename}")
                
            else:
                # 使用svglib转换SVG为可渲染对象
                drawing = svg2rlg(svg_file_path)
                
                if width and height:
                    # 保存原始尺寸
                    original_width = drawing.width
                    original_height = drawing.height
                    
                    # 计算缩放比例并保持宽高比
                    scale_x = width / original_width
                    scale_y = height / original_height
                    scale = min(scale_x, scale_y)  # 保持比例

                    # 计算缩放后的实际尺寸
                    scaled_width = original_width * scale
                    scaled_height = original_height * scale

                    # 计算居中偏移量 - 注意Y轴方向
                    offset_x = (width - scaled_width) / 2
                    offset_y = (height - scaled_height) / 2

                    # 重置变换并应用新的变换
                    # 先平移后缩放，确保在正确的位置
                    drawing.width = width
                    drawing.height = height
                    
                    # 创建新的变换矩阵：先平移再缩放
                    drawing.transform = [scale, 0, 0, scale, offset_x, offset_y]


                if format_type == "ico":
                    # 对于ICO格式，先生成PNG然后转换
                    temp_png = os.path.join(output_dir, "temp_favicon.png")
                    renderPM.drawToFile(drawing, temp_png, fmt="PNG")
                    
                    # 转换为ICO格式
                    img = Image.open(temp_png)
                    img.save(output_path, format='ICO')
                    os.remove(temp_png)  # 删除临时文件
                    
                else:
                    # 对于PNG格式
                    renderPM.drawToFile(drawing, output_path, fmt="PNG")
                    
                print(f"✓ 生成: {filename}")
                
        except Exception as e:
            print(f"✗ 生成 {filename} 时出错: {str(e)}")
    
    print(f"\n所有图标已生成到目录: {output_dir}")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python generate_favicons.py <svg文件路径> [输出目录]")
        print("示例: python generate_favicons.py icon.svg ./output")
        sys.exit(1)
    
    svg_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "."
    
    try:
        generate_favicons(svg_file, output_dir)
    except Exception as e:
        print(f"错误: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()