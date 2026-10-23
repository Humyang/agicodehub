// scripts/image-optimizer.js
const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')
const { existsSync } = require('fs')

const IMAGE_SIZES = [
    { width: 320, suffix: 'xs' }, //0
    { width: 640, suffix: 'sm' }, //1
    { width: 768, suffix: 'md' }, //2
    { width: 1024, suffix: 'lg' },//3
    { width: 1366, suffix: 'xl' },//4
    { width: 1920, suffix: 'xxl' },//5
    { width: 3840, suffix: 'xxxl' },//6
];

/**
 * 递归遍历目录中的所有图片文件
 */
async function findImageFilesRecursively(dir, fileList = [], baseDir = process.cwd()) {
    try {
        const files = await fs.readdir(dir)

        for (const file of files) {
            const filePath = path.join(dir, file)
            const stat = await fs.stat(filePath)

            if (stat.isDirectory()) {
                // 递归遍历子目录
                await findImageFilesRecursively(filePath, fileList, baseDir)
            } else if (isImageFile(file)) {
                fileList.push({
                    path: filePath,
                    name: file,
                    relativePath: path.relative(baseDir, filePath)
                })
            }
        }

        return fileList
    } catch (error) {
        console.error('Error traversing directory:', error)
        throw error
    }
}

/**
 * 检查文件是否为图片
 */
function isImageFile(filename) {
    return /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(filename)
}

/**
 * 生成图片的多种尺寸版本
 */
async function generateImageVariants(inputPath, outputDir, filename, baseDir = process.cwd()) {
    try {
        // 确保输出目录存在
        await fs.mkdir(outputDir, { recursive: true })

        const results = []

        for (const size of IMAGE_SIZES) {
            const outputFilename = `${path.parse(filename).name}-${size.suffix}.webp`
            const outputPath = path.join(outputDir, outputFilename)

            await sharp(inputPath)
                .resize(size.width)
                .webp({
                    quality: 80,
                    effort: 6
                })
                .toFile(outputPath)

            // 获取文件信息
            const stats = await fs.stat(outputPath)

            // 计算相对于baseDir的路径
            const relativeVariantPath = path.relative(baseDir, outputPath)

            results.push({
                original: filename,
                variant: outputFilename,
                width: size.width,
                path: relativeVariantPath,
                size: stats.size
            })

            console.log(`Generated: ${outputFilename} (${size.width}px)`)
        }

        return results
    } catch (error) {
        console.error(`Error processing ${filename}:`, error)
        throw error
    }
}

/**
 * 生成图片的模糊占位符
 */
async function generateBlurDataURL(inputPath) {
    try {
        const { data, info } = await sharp(inputPath)
            .resize(20) // 缩小到20px宽
            .jpeg({ quality: 20 }) // 低质量JPEG
            .toBuffer({ resolveWithObject: true })

        return `data:image/jpeg;base64,${data.toString('base64')}`
    } catch (error) {
        console.error('Error generating blur data URL:', error)
        return null
    }
}

/**
 * 批量处理目录中的所有图片
 */
async function optimizeImages(inputDir, outputDir) {
    try {
        console.log('Starting image optimization...')

        // 检查输入目录是否存在
        if (!existsSync(inputDir)) {
            console.log(`Input directory ${inputDir} does not exist, skipping optimization.`)
            return []
        }

        const files = await fs.readdir(inputDir)
        const imageFiles = files.filter(file =>
            /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file)
        )

        if (imageFiles.length === 0) {
            console.log('No image files found to optimize.')
            return []
        }

        console.log(`Found ${imageFiles.length} images to optimize.`)

        const allResults = []
        const imageMap = {} // 用于存储图片信息，可在组件中使用

        for (const file of imageFiles) {
            const inputPath = path.join(inputDir, file)

            console.log(`Processing: ${file}`)

            // 生成多种尺寸
            const variants = await generateImageVariants(inputPath, outputDir, file)

            // 生成模糊占位符
            const blurDataURL = await generateBlurDataURL(inputPath)

            // 存储图片信息
            imageMap[file] = {
                original: file,
                variants,
                blurDataURL
            }

            allResults.push(...variants)
        }

        // 保存图片映射信息，供组件使用
        const mapOutputPath = path.join(outputDir, 'image-map.json')
        await fs.writeFile(mapOutputPath, JSON.stringify(imageMap, null, 2))

        console.log(`Optimization complete! Processed ${imageFiles.length} images.`)
        console.log(`Generated ${allResults.length} variants.`)
        console.log(`Image map saved to: ${mapOutputPath}`)

        return allResults
    } catch (error) {
        console.error('Error in optimizeImages:', error)
        throw error
    }
}
/**
 * 优化目录中的所有图片（包括子目录）
 */
async function optimizeImagesRecursively(baseDir, inputSubDir, outputSubDir) {
    try {
        console.log('Starting recursive image optimization...')

        const inputDir = path.join(baseDir, inputSubDir)
        const outputBaseDir = path.join(baseDir, outputSubDir)

        const imageFiles = await findImageFilesRecursively(inputDir, [], baseDir)

        if (imageFiles.length === 0) {
            console.log('No image files found to optimize.')
            return []
        }

        console.log(`Found ${imageFiles.length} images to optimize.`)

        const allResults = []
        const imageMap = {}

        // 检查是否已存在image-map.json，如果是增量处理则加载现有映射
        let existingImageMap = {}
        const mapOutputPath = path.join(outputBaseDir, 'image-map.json')
        try {
            if (existsSync(mapOutputPath)) {
                const existingData = await fs.readFile(mapOutputPath, 'utf8')
                existingImageMap = JSON.parse(existingData)
                console.log(`Loaded existing image map with ${Object.keys(existingImageMap).length} entries`)
            }
        } catch (error) {
            console.log('No existing image map found or error loading, starting fresh')
        }

        for (const imageFile of imageFiles) {
            // 创建对应的输出目录结构
            const relativeDir = path.relative(inputDir, path.dirname(imageFile.path))
            const outputDir = path.join(outputBaseDir, relativeDir)

            // 检查是否已经处理过此图片
            if (existingImageMap[imageFile.relativePath]) {
                const existingEntry = existingImageMap[imageFile.relativePath]

                // 检查是否需要更新变体（新增尺寸类型）
                const needsUpdate = await checkIfVariantsNeedUpdate(
                    existingEntry,
                    outputDir,
                    imageFile.name
                )

                if (!needsUpdate) {
                    imageMap[imageFile.relativePath] = existingEntry
                    allResults.push(...existingEntry.variants)
                    continue
                } else {
                    console.log(`Updating variants for: ${imageFile.relativePath}`)

                    // 只生成缺失的变体，而不是重新生成所有变体
                    const existingVariants = existingEntry.variants || []
                    const missingVariants = await generateMissingVariants(
                        imageFile.path,
                        outputDir,
                        imageFile.name,
                        existingVariants,
                        baseDir
                    )

                    // 合并现有变体和新增变体
                    const updatedVariants = [...existingVariants, ...missingVariants]

                    // 更新图片信息
                    imageMap[imageFile.relativePath] = {
                        ...existingEntry,
                        variants: updatedVariants
                    }

                    allResults.push(...updatedVariants)
                    continue
                }
            }

            console.log(`Processing: ${imageFile.relativePath}`)

            // 生成多种尺寸
            const variants = await generateImageVariants(
                imageFile.path,
                outputDir,
                imageFile.name,
                baseDir
            )

            // 生成模糊占位符
            const blurDataURL = await generateBlurDataURL(imageFile.path)

            // 存储图片信息
            imageMap[imageFile.relativePath] = {
                original: imageFile.name,
                path: imageFile.relativePath,
                variants,
                blurDataURL
            }

            allResults.push(...variants)
        }

        // 保存图片映射信息
        await fs.writeFile(mapOutputPath, JSON.stringify(imageMap, null, 2))

        console.log(`Optimization complete! Processed ${imageFiles.length} images.`)
        console.log(`Generated ${allResults.length} variants.`)

        return allResults
    } catch (error) {
        console.error('Error in optimizeImagesRecursively:', error)
        throw error
    }
}


/**
 * 检查所有图片变体文件是否存在
 */
async function checkVariantsExist(variants) {
    for (const variant of variants) {
        try {
            await fs.access(variant.path)
        } catch (error) {
            return false // 如果任何一个变体文件不存在，返回false
        }
    }
    return true // 所有变体文件都存在
}
/**
 * 检查是否需要更新变体（新增尺寸类型或文件缺失）
 */
async function checkIfVariantsNeedUpdate(existingEntry, outputDir, filename) {
    const baseName = path.parse(filename).name

    // 使用全局 IMAGE_SIZES 而不是硬编码的尺寸
    const currentSuffixes = IMAGE_SIZES.map(size => size.suffix)
    const existingVariants = existingEntry.variants || []

    // 检查现有变体是否完整
    const existingSuffixes = existingVariants.map(variant => {
        const match = variant.variant.match(/-([^-]+)\.webp$/)
        return match ? match[1] : null
    }).filter(Boolean)

    // 如果有新的尺寸类型，需要更新
    const hasNewSizes = currentSuffixes.some(suffix => !existingSuffixes.includes(suffix))
    if (hasNewSizes) {
        console.log(`New size variants detected for ${filename}`)
        return true
    }

    // 检查现有变体文件是否都存在
    for (const variant of existingVariants) {
        try {
            await fs.access(variant.path)
        } catch (error) {
            console.log(`Missing variant file: ${variant.path}`)
            return true
        }
    }

    return false
}

/**
 * 查找已存在的图片变体文件
 */
async function findExistingVariants(outputDir, filename, baseDir = process.cwd()) {
    const variants = []
    const baseName = path.parse(filename).name

    for (const size of IMAGE_SIZES) {
        const variantFilename = `${baseName}-${size.suffix}.webp`
        const variantPath = path.join(outputDir, variantFilename)

        try {
            await fs.access(variantPath)
            const stats = await fs.stat(variantPath)

            // 计算相对于baseDir的路径
            const relativeVariantPath = path.relative(baseDir, variantPath)

            variants.push({
                original: filename,
                variant: variantFilename,
                width: size.width,
                path: relativeVariantPath,
                size: stats.size
            })
        } catch (error) {
            // 变体文件不存在，跳过
        }
    }

    return variants
}

/**
 * 为指定目录生成image-map.json文件（不重新优化图片）
 */
async function generateImageMap(baseDir, inputSubDir, outputSubDir, options = {}) {
    const { includeImagesWithoutVariants = false, updateMissingVariants = false } = options

    try {
        console.log('Generating image map...')

        const inputDir = path.join(baseDir, inputSubDir)
        const outputBaseDir = path.join(baseDir, outputSubDir)

        const imageFiles = await findImageFilesRecursively(inputDir, [], baseDir)

        if (imageFiles.length === 0) {
            console.log('No image files found.')
            return {}
        }

        console.log(`Found ${imageFiles.length} images.`)

        const imageMap = {}

        for (const imageFile of imageFiles) {
            // 创建对应的输出目录结构
            const relativeDir = path.relative(inputDir, path.dirname(imageFile.path))
            const outputDir = path.join(outputBaseDir, relativeDir)

            // 查找已存在的变体文件
            let variants = await findExistingVariants(outputDir, imageFile.name, baseDir)

            // 如果启用了更新缺失变体，检查并生成缺失的变体
            if (updateMissingVariants && variants.length > 0) {
                const missingVariants = await generateMissingVariants(
                    imageFile.path,
                    outputDir,
                    imageFile.name,
                    variants,
                    baseDir
                )
                variants = [...variants, ...missingVariants]
            }

            // 如果没有找到任何变体且不包含无变体图片，则跳过
            if (variants.length === 0 && !includeImagesWithoutVariants) {
                console.log(`Skipping: ${imageFile.relativePath} (no variants found)`)
                continue
            }

            // 生成模糊占位符（只在有变体时生成）
            const blurDataURL = variants.length > 0 ?
                await generateBlurDataURL(imageFile.path) : null

            // 计算相对于baseDir的路径（不包含baseDir前缀）
            const relativePath = path.relative(baseDir, imageFile.path)

            // 存储图片信息
            imageMap[relativePath] = {
                original: imageFile.name,
                path: relativePath,
                variants,
                blurDataURL
            }

            // console.log(`Mapped: ${relativePath} (${variants.length} variants)`)
        }

        // 保存图片映射信息
        const mapOutputPath = path.join(outputBaseDir, 'image-map.json')
        await fs.writeFile(mapOutputPath, JSON.stringify(imageMap, null, 2))

        console.log(`Image map generation complete! Mapped ${Object.keys(imageMap).length} images.`)
        console.log(`Image map saved to: ${mapOutputPath}`)

        return imageMap
    } catch (error) {
        console.error('Error in generateImageMap:', error)
        throw error
    }
}

/**
 * 生成缺失的变体文件
 */
async function generateMissingVariants(inputPath, outputDir, filename, existingVariants, baseDir = process.cwd()) {
    const missingVariants = []
    const existingSuffixes = existingVariants.map(v => {
        const match = v.variant.match(/-([^-]+)\.webp$/)
        return match ? match[1] : null
    }).filter(Boolean)

    for (const size of IMAGE_SIZES) {
        if (!existingSuffixes.includes(size.suffix)) {
            const outputFilename = `${path.parse(filename).name}-${size.suffix}.webp`
            const outputPath = path.join(outputDir, outputFilename)

            try {
                await sharp(inputPath)
                    .resize(size.width)
                    .webp({
                        quality: 80,
                        effort: 6
                    })
                    .toFile(outputPath)

                const stats = await fs.stat(outputPath)

                // 计算相对于baseDir的路径
                const relativeVariantPath = path.relative(baseDir, outputPath)

                missingVariants.push({
                    original: filename,
                    variant: outputFilename,
                    width: size.width,
                    path: relativeVariantPath,
                    size: stats.size
                })

                console.log(`Generated missing variant: ${outputFilename} (${size.width}px)`)
            } catch (error) {
                console.error(`Error generating missing variant ${outputFilename}:`, error)
            }
        }
    }

    return missingVariants
}
module.exports = {
    generateImageVariants,
    generateBlurDataURL,
    optimizeImages,
    findImageFilesRecursively,
    optimizeImagesRecursively,
    isImageFile,
    generateImageMap, // 新增导出
    findExistingVariants // 新增导出
}