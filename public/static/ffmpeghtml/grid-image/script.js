const CACHE_KEY_TPL = 'ffmpeg_v21_meta';
const CACHE_KEY_TRANS = 'ffmpeg_v21_trans';
const state = {
    tpl: null, files: [], transforms: [], stickers: [],
    previewScale: 1, selection: { type: null, index: null },
    canvasW: 1080, canvasH: 1080, currentPresetId: null,
    canvasW: 1080, canvasH: 1080, currentPresetId: null,
    outputMode: 'image', padding: 10, isSplitMode: false,
    exportSlots: false
};
const els = {
    box: document.getElementById('preview-box'),
    bgLayer: document.getElementById('bg-layer'),
    slotsLayer: document.getElementById('slots-layer'),
    stickersLayer: document.getElementById('stickers-layer'),
    fileList: document.getElementById('fileList'),
    stickerList: document.getElementById('stickerList'),
    output: document.getElementById('outputCode'),
    bgStatus: document.getElementById('bgStatus'),
    bgLink: document.getElementById('bgLink'),
    main: document.querySelector('.main'),
    toolbar: document.getElementById('slotToolbar'),
    presetSelect: document.getElementById('presetSelect'),
    resSelect: document.getElementById('resSelect'),
    canvasW: document.getElementById('canvasW'),
    canvasH: document.getElementById('canvasH'),
    cacheMsg: document.getElementById('cacheMsg'),
    animSettings: document.getElementById('animSettings'),
    outFileName: document.getElementById('outFileName')
};
// --- Grid Logic ---
const presets = {
    generate: (type, W, H, PAD = 10) => {
        // const PAD = 10; -> using argument
        let slots = [];
        const add = (x, y, w, h) => slots.push({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
        if (type === '1') {
            add(PAD, PAD, W - PAD * 2, H - PAD * 2);
        }
        else if (type === 'hero_left') {
            let w1 = (W - PAD * 3) * 0.66;
            let w2 = (W - PAD * 3) - w1;
            let h2 = (H - PAD * 3) / 2;
            add(PAD, PAD, w1, H - PAD * 2);
            add(PAD * 2 + w1, PAD, w2, h2);
            add(PAD * 2 + w1, PAD * 2 + h2, w2, h2);
        }
        else if (type === 'hero_top') {
            let h1 = (H - PAD * 3) * 0.6;
            let h2 = (H - PAD * 3) - h1;
            let wBot = (W - PAD * 4) / 3;
            add(PAD, PAD, W - PAD * 2, h1);
            add(PAD, PAD * 2 + h1, wBot, h2);
            add(PAD * 2 + wBot, PAD * 2 + h1, wBot, h2);
            add(PAD * 3 + wBot * 2, PAD * 2 + h1, wBot, h2);
        }
        else if (type === 'center_focus') {
            let wSide = (W - PAD * 4) * 0.2;
            let wMid = (W - PAD * 4) * 0.6;
            let h = H - PAD * 2;
            add(PAD, PAD, wSide, h);
            add(PAD * 2 + wSide, PAD, wMid, h);
            add(PAD * 3 + wSide + wMid, PAD, wSide, h);
        }
        else if (type === 'rows_2') {
            let h = (H - PAD * 3) / 2; add(PAD, PAD, W - PAD * 2, h); add(PAD, PAD * 2 + h, W - PAD * 2, h);
        } else if (type === 'rows_3') {
            let h = (H - PAD * 4) / 3; for (let i = 0; i < 3; i++) add(PAD, PAD + i * (h + PAD), W - PAD * 2, h);
        } else if (type === 'mix_1_2') {
            let h = (H - PAD * 3) / 2; add(PAD, PAD, W - PAD * 2, h);
            let w = (W - PAD * 3) / 2; add(PAD, PAD * 2 + h, w, h); add(PAD * 2 + w, PAD * 2 + h, w, h);
        } else if (type === 'mix_2_1') {
            let h = (H - PAD * 3) / 2; let w = (W - PAD * 3) / 2;
            add(PAD, PAD, w, h); add(PAD * 2 + w, PAD, w, h);
            add(PAD, PAD * 2 + h, W - PAD * 2, h);
        } else {
            const count = parseInt(type);
            if (count === 2) { let w = (W - PAD * 3) / 2, h = H - PAD * 2; add(PAD, PAD, w, h); add(PAD * 2 + w, PAD, w, h); }
            else if (count === 3) { let w = (W - PAD * 4) / 3, h = H - PAD * 2; for (let i = 0; i < 3; i++)add(PAD + i * (w + PAD), PAD, w, h); }
            else if (count === 4) { let w = (W - PAD * 3) / 2, h = (H - PAD * 3) / 2; for (let r = 0; r < 2; r++)for (let c = 0; c < 2; c++)add(PAD + c * (w + PAD), PAD + r * (h + PAD), w, h); }
            else if (count === 9) { let w = (W - PAD * 4) / 3, h = (H - PAD * 4) / 3; for (let r = 0; r < 3; r++)for (let c = 0; c < 3; c++)add(PAD + c * (w + PAD), PAD + r * (h + PAD), w, h); }
            else if (count === 6) { let w = (W - PAD * 4) / 3, h = (H - PAD * 3) / 2; for (let r = 0; r < 2; r++)for (let c = 0; c < 3; c++)add(PAD + c * (w + PAD), PAD + r * (h + PAD), w, h); }
            else if ([5, 7, 8].includes(count)) {
                let config = count === 5 ? [2, 3] : (count === 7 ? [3, 4] : [4, 4]);
                let rowH = (H - PAD * (config.length + 1)) / config.length;
                config.forEach((cols, rI) => {
                    let rowY = PAD + rI * (rowH + PAD);
                    let colW = (W - PAD * (cols + 1)) / cols;
                    for (let c = 0; c < cols; c++) add(PAD + c * (colW + PAD), rowY, colW, rowH);
                });
            }
        }
        return { width: W, height: H, slots: slots, isPreset: true };
    }
};
const actions = {
    init: () => {
        window.addEventListener('resize', render.updateBoxSize);
        document.addEventListener('keydown', handleKey);
        els.main.addEventListener('click', (e) => {
            if (e.target === els.main || e.target.id === 'preview-wrap') actions.selectItem(null, null);
        });
    },
    setMode: (mode) => {
        state.outputMode = mode;
        document.getElementById('mode-img').className = mode === 'image' ? 'mode-opt active' : 'mode-opt';
        document.getElementById('mode-vid').className = mode === 'video' ? 'mode-opt active' : 'mode-opt';
        els.animSettings.style.display = mode === 'video' ? 'block' : 'none';
        els.outFileName.innerText = mode === 'video' ? '🎬 Output: output.mp4' : '📄 Output: collage_output.png';
        render.generateCode();
    },
    toggleExportSlots: (val) => {
        state.exportSlots = val;
        render.generateCode();
    },
    updateResolution: (val) => {
        if (val === 'custom') { document.getElementById('customRes').style.display = 'flex'; return; }
        document.getElementById('customRes').style.display = 'none';
        const [w, h] = val.split('x').map(Number);
        els.canvasW.value = w; els.canvasH.value = h;
        actions.customResolution();
    },
    customResolution: () => {
        state.canvasW = parseInt(els.canvasW.value) || 1080;
        state.canvasH = parseInt(els.canvasH.value) || 1080;
        if (state.currentPresetId) actions.loadPreset(state.currentPresetId);
        render.generateCode();
    },
    loadPreset: (val) => {
        if (!val) return;
        state.currentPresetId = val;
        const json = presets.generate(val, state.canvasW, state.canvasH, state.padding);
        actions.applyTemplate(json);
    },
    loadTemplateFile: (input) => {
        const file = input.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const json = JSON.parse(e.target.result);
                els.presetSelect.value = ""; state.currentPresetId = null;
                els.canvasW.value = json.width; els.canvasH.value = json.height; els.resSelect.value = "custom";
                state.canvasW = json.width; state.canvasH = json.height;
                actions.applyTemplate(json);
            } catch (err) { alert("Error: " + err.message); }
        };
        reader.readAsText(file); input.value = '';
    },
    applyTemplate: (json) => {
        state.tpl = json;
        const defT = () => ({ scale: 1, x: 0, y: 0, imgW: 0, imgH: 0, rotate: 0, flipH: false, flipV: false });

        // Try to restore detailed state if matches
        const savedStateStr = localStorage.getItem(CACHE_KEY_TPL);
        let restored = false;

        if (savedStateStr) {
            try {
                const saved = JSON.parse(savedStateStr);

                if (saved.padding !== undefined) {
                    state.padding = saved.padding;
                    document.getElementById('globalGap').value = state.padding;
                }

                if (saved.exportSlots !== undefined) {
                    state.exportSlots = saved.exportSlots;
                    const chk = document.getElementById('chkExportSlots');
                    if (chk) chk.checked = state.exportSlots;
                }

                // Check if the saved state is compatible with the current template request
                // If the user explicitly loaded a preset, json is that preset.
                // We check if the saved state matches the dimensions and slot count.
                if (saved.width === json.width && saved.height === json.height && saved.slots && saved.slots.length === json.slots.length) {

                    // If we are loading from a fresh page load (init), we trust the cache fully.
                    // If the user just clicked a preset, we might want to reset transforms, OR keep them if compatible.
                    // For now, let's prefer restoring if compatible.

                    state.transforms = saved.transforms || json.slots.map(defT);
                    state.stickers = saved.stickers || [];

                    // Restore sticker objects (URLs are lost, so we can only restore geometry if we had persistent assets, 
                    // but for now we just restore the array structure. 
                    // Actually, without the file blobs, stickers are useless. 
                    // So we might skip stickers or strictly restore transforms of slots.
                    // Let's filter stickers that don't have URLs (which is all of them from LS).
                    // Wait, if we export/import JSON, we might not have blobs either.
                    // Let's stick to restoring transforms for now.

                    restored = true;
                }
            } catch (e) { console.error("Cache parse error", e); }
        }

        if (!restored) {
            state.transforms = json.slots.map(defT);
            state.stickers = [];
        }

        els.cacheMsg.style.display = restored ? 'block' : 'none';
        if (restored) setTimeout(() => els.cacheMsg.style.display = 'none', 4000);

        actions.saveCache(); // Save the fresh or restored state
        state.selection = { type: null, index: null };
        render.initTemplateUI(); render.refresh();
    },

    // --- Cache / Import / Export ---
    saveCache: () => {
        // We save the entire essential state to rebuild the view (except actual file blobs)
        const cacheData = {
            width: state.canvasW,
            height: state.canvasH,
            outputMode: state.outputMode,
            currentPresetId: state.currentPresetId,
            transforms: state.transforms,
            // We can't save sticker blobs to LS easily, but we can save their config
            // In a real app we'd use IndexedDB. For now, we omit stickers from LS auto-save to avoid broken images.
            // Or we could save them and show "Missing Image" placeholders?
            // Let's just save transforms for the main grid which is the most annoying thing to lose.
            slots: state.tpl ? state.tpl.slots : [],
            padding: state.padding,
            exportSlots: state.exportSlots
        };
        localStorage.setItem(CACHE_KEY_TPL, JSON.stringify(cacheData));
        localStorage.setItem(CACHE_KEY_TRANS, JSON.stringify(state.transforms)); // Keep legacy key for safety
    },

    // --- IO / File Actions ---
    io: {
        addSplitFile: (files) => {
            if (files.length === 0) return;
            state.isSplitMode = true;
            state.files = [{
                file: files[0],
                url: URL.createObjectURL(files[0]),
                order: 1
            }];
            state.sticker = [];
            render.refresh();
        }
    },

    exportCache: () => {
        if (!state.tpl) return alert("Nothing to export!");
        const data = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            config: {
                width: state.canvasW,
                height: state.canvasH,
                outputMode: state.outputMode,
                presetId: state.currentPresetId,
                padding: state.padding,
                exportSlots: state.exportSlots
            },
            template: state.tpl,
            transforms: state.transforms,
            stickers: state.stickers.map(s => ({
                x: s.x, y: s.y, scale: s.scale, rotate: s.rotate,
                width: s.imgW, height: s.imgH,
                // Note: We cannot export the image logic without base64. 
                // We'll export the geometry.
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grid_layout_${state.canvasW}x${state.canvasH}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    importCache: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Handle both wrapped 'data.config' format and direct/flat format if any
                const cfg = data.config || {};

                if (cfg.padding !== undefined) {
                    state.padding = cfg.padding;
                    document.getElementById('globalGap').value = state.padding;
                }

                if (cfg.exportSlots !== undefined) {
                    state.exportSlots = cfg.exportSlots;
                    const chk = document.getElementById('chkExportSlots');
                    if (chk) chk.checked = state.exportSlots;
                }

                // 1. Setup Canvas
                if (cfg.width) els.canvasW.value = cfg.width;
                if (cfg.height) els.canvasH.value = cfg.height;
                actions.customResolution(); // This sets state.canvasW/H

                // 2. Setup Mode
                if (cfg.outputMode) actions.setMode(cfg.outputMode);

                // 3. Restore Template
                if (data.template) {
                    // We blindly trust the imported template
                    state.tpl = data.template;
                } else if (cfg.presetId) {
                    state.tpl = presets.generate(cfg.presetId, state.canvasW, state.canvasH);
                }

                // 4. Restore Transforms
                if (data.transforms) {
                    state.transforms = data.transforms;
                } else {
                    state.transforms = state.tpl.slots.map(() => ({ scale: 1, x: 0, y: 0, imgW: 0, imgH: 0, rotate: 0, flipH: false, flipV: false }));
                }

                // 5. Restore Stickers (Geometry only, placeholders needed?)
                // Since we don't have the images, maybe we skip stickers or warn user.
                // For now, let's skip stickers to avoid errors, or add them as placeholders.
                // Simple approach: ignore stickers on import unless we solve the image assets.
                state.stickers = [];

                state.selection = { type: null, index: null };
                render.initTemplateUI();
                render.refresh();

                actions.saveCache();
                alert("Configuration loaded! Note: You need to re-add your images.");
            } catch (err) {
                console.error(err);
                alert("Failed to load JSON: " + err.message);
            }
        };
        reader.readAsText(file);
        input.value = "";
    },

    // --- New: Order handling logic ---
    updateFileOrder: (idx, val) => {
        state.files[idx].order = parseInt(val) || (idx + 1);
        render.generateCode();
    },
    updateStickerOrder: (idx, val) => {
        state.stickers[idx].order = parseInt(val) || (state.files.length + idx + 1);
        render.generateCode();
    },
    // ------------------------
    addFiles: (files) => {
        const currentLen = state.files.length;
        for (let i = 0; i < files.length; i++) {
            state.files.push({
                file: files[i],
                url: URL.createObjectURL(files[i]),
                order: currentLen + i + 1
            });
        }
        render.refresh();
    },
    removeFile: (idx) => { state.files.splice(idx, 1); render.refresh(); },
    moveFile: (idx, dir) => {
        const n = idx + dir; if (n >= 0 && n < state.files.length) { [state.files[idx], state.files[n]] = [state.files[n], state.files[idx]]; render.refresh(); }
    },
    clearFiles: () => { state.files = []; state.stickers = []; render.refresh(); },
    addStickers: (files) => {
        if (!state.tpl) return alert("Please select a template first");
        const currentLen = state.stickers.length;
        const fileLen = state.files.length;
        for (let i = 0; i < files.length; i++) {
            state.stickers.push({
                file: files[i],
                url: URL.createObjectURL(files[i]),
                x: state.tpl.width / 2 - 100,
                y: state.tpl.height / 2 - 100,
                scale: 1,
                rotate: 0,
                imgW: 0,
                imgH: 0,
                order: fileLen + currentLen + i + 1
            });
        }
        render.refresh();
    },
    removeSticker: (idx) => { state.stickers.splice(idx, 1); actions.selectItem(null, null); render.refresh(); },
    selectItem: (type, idx) => {
        state.selection = { type, index: idx };
        render.updateSelectionUI();
        if (idx !== null) els.toolbar.classList.add('visible');
        else els.toolbar.classList.remove('visible');

        // Update Slot Settings UI
        const slotDiv = document.getElementById('slotSettings');
        if (type === 'slot') {
            slotDiv.style.display = 'block';
            const s = state.tpl.slots[idx];
            document.getElementById('slotX').value = s.x;
            document.getElementById('slotY').value = s.y;
            document.getElementById('slotW').value = s.w;
            document.getElementById('slotH').value = s.h;
        } else {
            slotDiv.style.display = 'none';
        }
    },
    setGlobalGap: (val) => {
        state.padding = parseInt(val) || 0;
        if (state.currentPresetId) actions.loadPreset(state.currentPresetId);
    },
    updateSlotRect: (key, val) => {
        if (state.selection.type !== 'slot' || state.selection.index === null) return;
        const idx = state.selection.index;
        const v = parseInt(val) || 0;
        state.tpl.slots[idx][key] = v;
        render.refresh();
        // Recalculate code because position changed
        render.generateCode();
    },
    updateSelectionTransform: (updates) => {
        const { type, index } = state.selection;
        if (!type || index === null) return;
        const target = type === 'slot' ? state.transforms[index] : state.stickers[index];
        if (updates.moveX) target.x += updates.moveX;
        if (updates.moveY) target.y += updates.moveY;
        if (updates.scale) target.scale = Math.max(0.1, target.scale + updates.scale);
        if (updates.rotate !== undefined) target.rotate = updates.rotate;
        if (updates.flipH !== undefined) {
            if (type === 'slot') target.flipH = updates.flipH; else target.scaleX = (target.scaleX || 1) * -1;
        }
        if (updates.flipV !== undefined) {
            if (type === 'slot') target.flipV = updates.flipV; else target.scaleY = (target.scaleY || 1) * -1;
        }
        if (updates.reset) { target.x = 0; target.y = 0; target.scale = 1; if (type === 'sticker') { target.x = state.tpl.width / 2 - target.imgW / 2; target.y = state.tpl.height / 2 - target.imgH / 2; } }
        if (type === 'slot') render.updateSlotVisual(index); else render.updateStickerVisual(index);
        actions.saveCache(); render.generateCode();
    },
    toolCenter: () => actions.updateSelectionTransform({ reset: true }),
    toolFit: () => actions.updateSelectionTransform({ reset: true }),
    toolRotate: () => {
        const { type, index } = state.selection;
        const cur = type === 'slot' ? state.transforms[index].rotate : state.stickers[index].rotate;
        actions.updateSelectionTransform({ rotate: type === 'slot' ? (cur + 1) % 4 : (cur + 90) % 360 });
    },
    toolFlip: (axis) => {
        const { type, index } = state.selection;
        if (type === 'slot') {
            const t = state.transforms[index];
            actions.updateSelectionTransform(axis === 'h' ? { flipH: !t.flipH } : { flipV: !t.flipV });
        }
    },
    saveCache: () => { if (state.transforms.length > 0) localStorage.setItem(CACHE_KEY_TRANS, JSON.stringify(state.transforms)); },
    copyCode: () => {
        els.output.select(); document.execCommand('copy');
        const btn = document.querySelector('.btn-primary');
        const old = btn.innerHTML; btn.innerHTML = "✅ Copied"; setTimeout(() => btn.innerHTML = old, 1500);
    }
};
const render = {
    refresh: () => { render.previewBox(); render.lists(); render.generateCode(); },
    initTemplateUI: () => {
        const tpl = state.tpl;
        const hasBg = !!tpl.bgImage;
        els.bgStatus.style.display = hasBg ? 'block' : 'none';
        if (hasBg) { els.bgLink.href = tpl.bgImage; els.bgLayer.style.backgroundImage = `url(${tpl.bgImage})`; }
        else { els.bgLayer.style.backgroundImage = 'none'; els.bgLayer.style.backgroundColor = '#000'; }
        const isTop = tpl.bgLayer === 'top';
        els.bgLayer.style.zIndex = isTop ? 20 : 0; els.slotsLayer.style.zIndex = 10;
    },
    updateBoxSize: () => {
        if (!state.tpl) return;
        const pad = 40;
        const scale = Math.min((els.main.clientWidth - pad) / state.tpl.width, (els.main.clientHeight - pad) / state.tpl.height);
        state.previewScale = scale;
        els.box.style.width = state.tpl.width * scale + 'px';
        els.box.style.height = state.tpl.height * scale + 'px';
        render.layers();
    },
    previewBox: () => { render.updateBoxSize(); },
    layers: () => { render.slots(); render.stickers(); },
    slots: () => {
        els.slotsLayer.innerHTML = '';
        if (!state.tpl) return;
        const offset = (state.tpl.bgImage || state.tpl.isPreset) ? 0 : 1;

        // Split Mode Background (Canvas Preview) - Only if not using bg image/preset for base
        // Actually, for split mode, the base IS the image.

        if (!state.isSplitMode) {
            if (!state.tpl.bgImage && !state.tpl.isPreset && state.files[0]) els.bgLayer.style.backgroundImage = `url(${state.files[0].url})`;
        } else {
            // Clean bg layer for split mode
            els.bgLayer.style.backgroundImage = 'none';
        }

        state.tpl.slots.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'preview-slot';
            div.style.left = (s.x * state.previewScale) + 'px'; div.style.top = (s.y * state.previewScale) + 'px';
            div.style.width = (s.w * state.previewScale) + 'px'; div.style.height = (s.h * state.previewScale) + 'px';
            div.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                actions.selectItem('slot', i); handleMouseDrag(e);
            };

            if (state.isSplitMode) {
                // Split Mode Preview
                if (state.files[0]) {
                    div.style.backgroundImage = `url(${state.files[0].url})`;
                    div.style.backgroundSize = `${state.tpl.width * state.previewScale}px ${state.tpl.height * state.previewScale}px`;
                    div.style.backgroundPosition = `-${s.x * state.previewScale}px -${s.y * state.previewScale}px`;
                    div.style.backgroundRepeat = 'no-repeat';
                }
            } else {
                // Normal Mode
                const fIdx = i + offset;
                if (state.files[fIdx]) {
                    const img = document.createElement('img');
                    img.src = state.files[fIdx].url;
                    const t = state.transforms[i];
                    const update = () => { t.imgW = img.naturalWidth; t.imgH = img.naturalHeight; render.updateSlotVisual(i, img); render.generateCode(); };
                    if (img.complete) update(); else img.onload = update;
                    div.appendChild(img);
                }
            }
            els.slotsLayer.appendChild(div);
        });
        render.updateSelectionUI();
    },
    updateSlotVisual: (idx, imgEl) => {
        if (!imgEl) imgEl = els.slotsLayer.children[idx]?.querySelector('img');
        if (!imgEl) return;
        const s = state.tpl.slots[idx]; const t = state.transforms[idx];
        let effW = (t.rotate % 2 !== 0) ? t.imgH : t.imgW;
        let effH = (t.rotate % 2 !== 0) ? t.imgW : t.imgH;
        const baseScale = Math.max(s.w / effW, s.h / effH);
        const finalScale = baseScale * t.scale;
        const cssW = t.imgW * finalScale * state.previewScale;
        const cssH = t.imgH * finalScale * state.previewScale;
        const left = ((s.w * state.previewScale) / 2) - (cssW / 2) + (t.x * state.previewScale);
        const top = ((s.h * state.previewScale) / 2) - (cssH / 2) + (t.y * state.previewScale);
        let transform = `rotate(${t.rotate * 90}deg) `;
        if (t.flipH) transform += `scaleX(-1) `; if (t.flipV) transform += `scaleY(-1) `;
        Object.assign(imgEl.style, { width: cssW + 'px', height: cssH + 'px', left: left + 'px', top: top + 'px', transform });
    },
    stickers: () => {
        els.stickersLayer.innerHTML = '';
        state.stickers.forEach((s, i) => {
            const div = document.createElement('div'); div.className = 'preview-sticker';
            const img = document.createElement('img'); img.src = s.url;
            img.onload = () => {
                s.imgW = img.naturalWidth; s.imgH = img.naturalHeight;
                if (!s.w) { s.w = s.imgW; s.h = s.imgH; }
                render.updateStickerVisual(i, div);
                render.generateCode();
            };
            div.appendChild(img);
            div.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                actions.selectItem('sticker', i); handleMouseDrag(e);
            };
            els.stickersLayer.appendChild(div);
        });
        render.updateSelectionUI();
    },
    updateStickerVisual: (idx, divEl) => {
        if (!divEl) divEl = els.stickersLayer.children[idx]; if (!divEl) return;
        const s = state.stickers[idx]; const p = state.previewScale;
        divEl.style.left = (s.x * p) + 'px'; div.style.top = (s.y * p) + 'px';
        divEl.style.width = (s.imgW * s.scale * p) + 'px'; div.style.height = (s.imgH * s.scale * p) + 'px';
        divEl.style.transform = `rotate(${s.rotate}deg)`;
    },
    updateSelectionUI: () => {
        const { type, index } = state.selection;
        Array.from(els.slotsLayer.children).forEach((el, i) => el.className = (type === 'slot' && index === i) ? 'preview-slot selected' : 'preview-slot');
        Array.from(els.stickersLayer.children).forEach((el, i) => el.className = (type === 'sticker' && index === i) ? 'preview-sticker selected' : 'preview-sticker');
    },
    lists: () => {
        els.fileList.innerHTML = '';
        if (!state.tpl) return;
        const isPreset = state.tpl.isPreset || !!state.tpl.bgImage;
        state.files.forEach((f, i) => {
            let role = (!isPreset && i === 0) ? 'Background' : `Slot ${i - (isPreset ? 0 : 1) + 1}`;
            // Don't show order input for first image used as background
            const showOrder = !(!isPreset && i === 0);
            const orderHtml = showOrder ?
                `<label style="margin:0;font-size:10px;color:#64748b">Order:</label>
<input type="number" class="order-input" value="${f.order || (i + 1)}" onchange="actions.updateFileOrder(${i}, this.value)">` : '';
            els.fileList.innerHTML += `
<div class="file-item">
<img src="${f.url}" class="file-thumb">
<div class="file-info">
<div class="file-details">
<div class="file-name">${f.file.name}</div>
<div class="file-role">${role}</div>
</div>
${orderHtml}
</div>
<div style="display:flex;gap:2px">
<button class="btn-icon" onclick="actions.moveFile(${i},-1)">↑</button>
<button class="btn-icon" onclick="actions.moveFile(${i},1)">↓</button>
<button class="btn-icon btn-danger" onclick="actions.removeFile(${i})">×</button>
</div>
</div>`;
        });
        if (els.stickerList) {
            els.stickerList.innerHTML = '';
            state.stickers.forEach((s, i) => {
                els.stickerList.innerHTML += `
<div class="file-item">
<img src="${s.url}" class="file-thumb">
<div class="file-info">
<div class="file-details">
<div class="file-name">Sticker ${i + 1}</div>
</div>
<label style="margin:0;font-size:10px;color:#64748b">Order:</label>
<input type="number" class="order-input" value="${s.order || (state.files.length + i + 1)}" onchange="actions.updateStickerOrder(${i}, this.value)">
</div>
<button class="btn-icon btn-danger" onclick="actions.removeSticker(${i})">×</button>
</div>`;
            });
        }
    },
    generateCode: () => {
        els.output.classList.add('updating'); setTimeout(() => els.output.classList.remove('updating'), 200);
        if (!state.tpl) return;
        const tpl = state.tpl;
        const hasBg = !!tpl.bgImage;
        const isPreset = !!tpl.isPreset;
        const offset = (hasBg || isPreset) ? 0 : 1;
        const isVideo = state.outputMode === 'video';
        const duration = parseFloat(document.getElementById('vidDuration').value) || 5;
        const animType = document.getElementById('animType').value;
        let cmd = `ffmpeg -y`;
        const inputFlag = isVideo ? ` -loop 1 -t ${duration}` : '';

        let inputCount = 0;
        if (hasBg) { cmd += ` ${inputFlag} -i "template_bg.png"`; inputCount++; }
        else if (isPreset) {
            const safeW = tpl.width + (tpl.width % 2);
            const safeH = tpl.height + (tpl.height % 2);
            cmd += ` -f lavfi -i color=c=black:s=${safeW}x${safeH}:d=${isVideo ? duration : 0.1}`;
            inputCount++;
        }
        else {
            cmd += ` ${inputFlag} -i "${state.files[0] ? state.files[0].file.name : 'bg.png'}"`;
            inputCount++;
        }

        if (!state.isSplitMode) {
            tpl.slots.forEach((s, i) => {
                const idx = i + offset;
                if (state.files[idx]) { cmd += ` ${inputFlag} -i "${state.files[idx].file.name}"`; inputCount++; }
            });
        } else {
            if (state.files[0]) { cmd += ` ${inputFlag} -i "${state.files[0].file.name}"`; inputCount++; }
        }

        const stStart = inputCount;
        state.stickers.forEach(s => cmd += ` ${inputFlag} -i "${s.file.name}"`);

        let animItems = [];
        tpl.slots.forEach((s, i) => {
            const idx = i + offset;
            if (state.isSplitMode) {
                if (state.files[0]) animItems.push({ type: 'slot', index: i, order: i + 1 });
            } else {
                if (state.files[idx]) {
                    animItems.push({ type: 'slot', index: i, order: state.files[idx].order || (idx + 1) });
                }
            }
        });
        state.stickers.forEach((s, i) => {
            animItems.push({ type: 'sticker', index: i, order: s.order || (state.files.length + i + 1) });
        });
        animItems.sort((a, b) => a.order - b.order);

        const totalItems = animItems.length;
        const activeTime = Math.max(totalItems > 0 ? duration - 1.0 : 0, duration * 0.8);
        const timeStep = totalItems > 0 ? activeTime / totalItems : 0;
        const animDur = Math.min(timeStep * 1.5, 1.2);
        let timeMap = {};
        animItems.forEach((item, rank) => {
            timeMap[`${item.type}_${item.index}`] = rank * timeStep;
        });

        let filters = [];
        let extraMaps = [];

        const safeW = tpl.width + (tpl.width % 2);
        const safeH = tpl.height + (tpl.height % 2);
        if (isPreset) filters.push(`[0:v]null[bg]`);
        else filters.push(`[0:v]scale=${safeW}:${safeH}:force_original_aspect_ratio=increase,crop=${safeW}:${safeH}[bg]`);

        let canvas = "[bg]";
        if (tpl.bgLayer === 'top') {
            filters[0] = isVideo ? `color=c=black:s=${safeW}x${safeH}:d=${duration}[base]` : `color=c=black:s=${safeW}x${safeH}[base]`;
            filters.push(`[0:v]scale=${safeW}:${safeH}:force_original_aspect_ratio=increase,crop=${safeW}:${safeH}[frame]`);
            canvas = "[base]";
        }

        let splitInIdx = inputCount - 1 - state.stickers.length;
        if (state.isSplitMode && state.files[0]) {
            filters.push(`[${splitInIdx}:v]scale=${safeW}:${safeH}:force_original_aspect_ratio=increase,crop=${safeW}:${safeH}[split_master]`);
        }

        let slotInIdx = 1;
        tpl.slots.forEach((s, i) => {
            if (state.isSplitMode) {
                if (!state.files[0]) return;
                filters.push(`[split_master]crop=${s.w}:${s.h}:${s.x}:${s.y}[v${i}_raw]`);

                let currentStream = `[v${i}_raw]`;
                if (state.exportSlots) {
                    filters.push(`${currentStream}split[v${i}_exp][v${i}_cont]`);
                    extraMaps.push({ map: `[v${i}_exp]`, out: `slot_${i + 1}.png` });
                    currentStream = `[v${i}_cont]`;
                }

                const startTime = timeMap[`slot_${i}`] !== undefined ? timeMap[`slot_${i}`] : 0;
                let processedLabel = currentStream;
                if (isVideo && animType === 'fade') {
                    filters.push(`${currentStream}format=rgba,fade=t=in:st=${startTime}:d=${animDur}:alpha=1[v${i}_f]`);
                    processedLabel = `[v${i}_f]`;
                } else {
                    if (currentStream !== `[v${i}]`) {
                        // Rename only if necessary or just use currentStream
                        // If we didn't transform or fade, the stream is just [vN_cont] or [vN_raw]
                    }
                }

                let xExpr = s.x, yExpr = s.y;
                let enableExpr = '';
                if (isVideo && animType !== 'fade') {
                    const p = `min(max(0,t-${startTime})/${animDur},1)`;
                    const ease = `(1-pow(1-${p},3))`;
                    if (animType === 'slide_up') yExpr = `${safeH} - (${safeH} - ${s.y}) * ${ease}`;
                    if (animType === 'slide_down') yExpr = `-${s.h} + (${s.y} + ${s.h}) * ${ease}`;
                    if (animType === 'slide_left') xExpr = `${safeW} + (${s.x} - ${safeW}) * ${ease}`;
                    if (animType === 'slide_right') xExpr = `-${s.w} + (${s.x} + ${s.w}) * ${ease}`;
                }
                filters.push(`${canvas}${processedLabel}overlay=x='${xExpr}':y='${yExpr}'${enableExpr}[tmp${i}]`);
                canvas = `[tmp${i}]`;
                return;
            }

            const fIdx = i + offset;
            if (!state.files[fIdx]) return;
            const t = state.transforms[i];
            if (!t.imgW) return;

            let label = `v${i}_raw`;
            let chain = `[${slotInIdx}:v]`;
            if (t.flipH) chain += `hflip,`; if (t.flipV) chain += `vflip,`;
            if (t.rotate === 1) chain += `transpose=1,`; else if (t.rotate === 2) chain += `transpose=2,transpose=2,`; else if (t.rotate === 3) chain += `transpose=2,`;
            if (chain !== `[${slotInIdx}:v]`) { chain = chain.slice(0, -1) + `[${label}]`; filters.push(chain); } else label = `${slotInIdx}:v`;

            let ew = (t.rotate % 2 !== 0) ? t.imgH : t.imgW, eh = (t.rotate % 2 !== 0) ? t.imgW : t.imgH;
            // Allow scaling down: remove Math.max(..., 1.0)
            const bs = Math.max(s.w / ew, s.h / eh), fs = bs * t.scale;
            const sw = Math.floor(ew * fs), sh = Math.floor(eh * fs);
            filters.push(`[${label}]scale=${sw}:${sh}[v${i}_s]`);

            // Use overlay on transparent background to handle both crop and pad (zoom out) behavior
            // We create a slot-sized transparent canvas and overlay the scaled image on it
            filters.push(`color=color=black@0.0:size=${s.w}x${s.h}[v${i}_bg]`);

            // Calculate offset. t.x/t.y are displacements from center
            // overlay x = (bg_w - img_w)/2 + t.x
            // overlay y = (bg_h - img_h)/2 + t.y
            let ox = (s.w - sw) / 2 + t.x;
            let oy = (s.h - sh) / 2 + t.y;

            // Ensure integer coordinates for ffmpeg
            ox = Math.floor(ox);
            oy = Math.floor(oy);

            filters.push(`[v${i}_bg][v${i}_s]overlay=x=${ox}:y=${oy}:shortest=1[v${i}_cropped]`);
            let currentStream = `[v${i}_cropped]`;

            if (state.exportSlots) {
                filters.push(`${currentStream}split[v${i}_exp][v${i}_cont]`);
                extraMaps.push({ map: `[v${i}_exp]`, out: `slot_${i + 1}.png` });
                currentStream = `[v${i}_cont]`;
            }

            const startTime = timeMap[`slot_${i}`] !== undefined ? timeMap[`slot_${i}`] : 0;
            let processedLabel = currentStream;

            if (isVideo && animType === 'fade') {
                filters.push(`${currentStream}format=rgba,fade=t=in:st=${startTime}:d=${animDur}:alpha=1[v${i}]`);
                processedLabel = `[v${i}]`;
            }

            let xExpr = s.x, yExpr = s.y;
            let enableExpr = '';
            if (isVideo && animType !== 'fade') {
                const p = `min(max(0,t-${startTime})/${animDur},1)`;
                const ease = `(1-pow(1-${p},3))`;
                if (animType === 'slide_up') yExpr = `${safeH} - (${safeH} - ${s.y}) * ${ease}`;
                if (animType === 'slide_down') yExpr = `-${s.h} + (${s.y} + ${s.h}) * ${ease}`;
                if (animType === 'slide_left') xExpr = `${safeW} + (${s.x} - ${safeW}) * ${ease}`;
                if (animType === 'slide_right') xExpr = `-${s.w} + (${s.x} + ${s.w}) * ${ease}`;
            }
            filters.push(`${canvas}${processedLabel}overlay=x='${xExpr}':y='${yExpr}'${enableExpr}[tmp${i}]`);
            canvas = `[tmp${i}]`;
            slotInIdx++;
        });

        if (tpl.bgLayer === 'top') { filters.push(`${canvas}[frame]overlay=0:0[cv_s]`); canvas = "[cv_s]"; }

        state.stickers.forEach((s, i) => {
            const idx = stStart + i;
            const label = `st${i}`;
            let chain = `[${idx}:v]`;
            if (s.rotate === 90) chain += `transpose=1,`;
            else if (s.rotate === 180) chain += `transpose=2,transpose=2,`;
            else if (s.rotate === 270) chain += `transpose=2,`;

            const w = Math.floor(s.imgW * s.scale), we = w + (w % 2);
            chain += `scale=${we}:-2[${label}]`;
            filters.push(chain);

            let finalX = s.x, finalY = s.y;
            if (s.rotate === 90 || s.rotate === 270) {
                const origW = s.imgW * s.scale, origH = s.imgH * s.scale;
                const rotatedW = origH, rotatedH = origW;
                const offX = (origW - rotatedW) / 2;
                const offY = (origH - rotatedH) / 2;
                finalX = s.x + offX; finalY = s.y + offY;
            }

            const startTime = timeMap[`sticker_${i}`] !== undefined ? timeMap[`sticker_${i}`] : 0;
            let processedLabel = `[${label}]`;
            if (isVideo && animType === 'fade') {
                filters.push(`${processedLabel}format=rgba,fade=t=in:st=${startTime}:d=${animDur}:alpha=1[st${i}_f]`);
                processedLabel = `[st${i}_f]`;
            }

            let xExpr = Math.floor(finalX), yExpr = Math.floor(finalY);
            if (isVideo && animType !== 'fade') {
                const p = `min(max(0,t-${startTime})/${animDur},1)`;
                const ease = `(1-pow(1-${p},3))`;
                const sW = s.imgW * s.scale, sH = s.imgH * s.scale;
                if (animType === 'slide_up') yExpr = `${safeH} - (${safeH} - ${finalY}) * ${ease}`;
                if (animType === 'slide_down') yExpr = `-${sH} + (${finalY} + ${sH}) * ${ease}`;
                if (animType === 'slide_left') xExpr = `${safeW} + (${finalX} - ${safeW}) * ${ease}`;
                if (animType === 'slide_right') xExpr = `-${sW} + (${finalX} + ${sW}) * ${ease}`;
            }
            filters.push(`${canvas}${processedLabel}overlay=x='${xExpr}':y='${yExpr}'[tmp_st${i}]`);
            canvas = `[tmp_st${i}]`;
        });

        const last = canvas === "[bg]" ? "[bg]" : canvas;
        const outFile = isVideo ? 'output.mp4' : 'collage_output.png';
        const vidFlags = isVideo ? `-c:v libx264 -pix_fmt yuv420p` : `-frames:v 1`;

        cmd += ` -filter_complex "${filters.join(';')}" -map "${last}" ${vidFlags} ${outFile}`;

        if (extraMaps.length > 0) {
            extraMaps.forEach(m => {
                cmd += ` -map "${m.map}" -frames:v 1 "${m.out}"`;
            });
        }

        els.output.value = cmd;
    }
};
function handleMouseDrag(e) {
    let lx = e.clientX, ly = e.clientY;
    document.onmousemove = (ev) => {
        const dx = (ev.clientX - lx) / state.previewScale, dy = (ev.clientY - ly) / state.previewScale;
        lx = ev.clientX; ly = ev.clientY;
        actions.updateSelectionTransform({ moveX: dx, moveY: dy });
    };
    document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; };
}
function handleKey(e) {
    if (!state.selection.type) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '=', 'Delete', 'r', 'R'].includes(e.key)) e.preventDefault();
    const s = e.shiftKey ? 10 : 1;
    const mv = (x, y) => actions.updateSelectionTransform({ moveX: x * s, moveY: y * s });
    switch (e.key) {
        case 'ArrowUp': mv(0, -1); break; case 'ArrowDown': mv(0, 1); break;
        case 'ArrowLeft': mv(-1, 0); break; case 'ArrowRight': mv(1, 0); break;
        case '+': case '=': actions.updateSelectionTransform({ scale: 0.05 }); break;
        case '-': actions.updateSelectionTransform({ scale: -0.05 }); break;
        case 'r': case 'R': actions.updateSelectionTransform({ reset: true }); break;
        case 'Delete': if (state.selection.type === 'sticker') actions.removeSticker(state.selection.index); break;
    }
}
actions.init();
