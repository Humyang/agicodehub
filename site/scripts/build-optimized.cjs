// scripts/build-optimized.js
const { optimizeImagesRecursively } = require('./image-optimizer.cjs')
const { generateImageMap } = require('./image-optimizer.cjs')

async function buildWithOptimization() {
    console.log('🚀 Starting optimized build process...')

    const startTime = Date.now()

    try {

        // 生成image-map.json
        await generateImageMap('docs/public', 'images', 'optimized-images')
        // 优化 public/images 目录中的图片
        await optimizeImagesRecursively(
            'docs/public', 'images', 'optimized-images'
        )

        const optimizationTime = Date.now() - startTime
        console.log(`✅ Image optimization completed in ${optimizationTime}ms`)

        // 执行 Next.js 构建
        const { execSync } = require('child_process')
        console.log('📦 Starting Next.js build...')

        execSync('npm run build', {
            stdio: 'inherit',
            env: {
                ...process.env,
                OPTIMIZED_IMAGES: 'true'  // 设置环境变量
            }
        })

        const totalTime = Date.now() - startTime
        console.log(`🎉 Build completed in ${totalTime}ms`)

    } catch (error) {
        console.error('❌ Build failed:', error)
        process.exit(1)
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    buildWithOptimization()
}

module.exports = buildWithOptimization