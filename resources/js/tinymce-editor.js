export default function tinymceEditor({
    state,
    statePath,
    selector,
    plugins,
    external_plugins,
    toolbar,
    toolbar_groups,
    content_style = "",
    text_patterns,
    language = "en",
    language_url = null,
    directionality = "ltr",
    height = null,
    max_height = 0,
    min_height = 100,
    width = null,
    max_width = 0,
    min_width = 400,
    resize = false,
    skin = "oxide",
    content_css = "default",
    toolbar_sticky = true,
    toolbar_sticky_offset = 64,
    toolbar_mode = "sliding",
    toolbar_location = "auto",
    inline = false,
    toolbar_persist = false,
    menubar = false,
    relative_urls = true,
    remove_script_host = true,
    convert_urls = true,
    font_size_formats = "",
    fontfamily = "",
    setup = null,
    disabled = false,
    locale = "en",
    placeholder = null,
    image_list = null,
    images_upload_url = null,
    images_upload_base_path = null,
    image_advtab = false,
    image_description = false,
    image_class_list = null,
    license_key = "gpl",
    custom_configs = {},
    mergeable_blocks = [],
    getMentionSourceResultsUsing,
    mention_mode = "text",
    afterMentionSelected,
    removeImagesEventCallback = null,
}) {
    window.filamentTinyMceEditors = window.filamentTinyMceEditors || {};

    const editors = window.filamentTinyMceEditors;

    return {
        id: null,
        state: state,
        statePath: statePath,
        selector: selector,
        language: language,
        language_url: language_url,
        directionality: directionality,
        height: height,
        max_height: max_height,
        min_height: min_height,
        width: width,
        max_width: max_width,
        min_width: min_width,
        resize: resize,
        skin: skin,
        content_css: content_css,
        content_style: content_style,
        plugins: plugins,
        external_plugins: external_plugins,
        toolbar: toolbar,
        toolbar_groups: toolbar_groups,
        text_patterns: text_patterns,
        toolbar_sticky: toolbar_sticky,
        menubar: menubar,
        relative_urls: relative_urls,
        remove_script_host: remove_script_host,
        convert_urls: convert_urls,
        font_size_formats: font_size_formats,
        fontfamily: fontfamily,
        setup: setup,
        image_list: image_list,
        image_advtab: image_advtab,
        image_description: image_description,
        image_class_list: image_class_list,
        images_upload_url: images_upload_url,
        images_upload_base_path: images_upload_base_path,
        license_key: license_key,
        custom_configs: custom_configs,
        mergeable_blocks: mergeable_blocks,
        updatedAt: Date.now(),
        disabled,
        locale: locale,
        placeholder: placeholder,
        isSyncing: false,

        unwatchState: null,
        mutationObserver: null,
        destroyed: false,

        init() {
            this.destroyed = false;

            this.delete();

            this.initEditor(state.initialValue);

            this.unwatchState = this.$watch("state", (value) => {
                const editor = this.editor();

                if(!editor || editor.removed) return;
                if (editor.getContent() === value) return;

                if (
                    this.mergeable_blocks.length > 0 &&
                    this.applyMergeableBlockUpdate(value)
                ) {
                    return;
                }

                this.startSync();

                const done = () => {
                    editor.off("SetContent", done);
                    this.finishSync();
                };

                editor.on("SetContent", done);
                editor.setContent(value ?? "");
            });
        },

        destroy(){
            this.destroyed = true;

            if (typeof this.unwatchState === "function") {
                this.unwatchState();
            }

            this.unwatchState = null;

            this.mutationObserver?.disconnect();
            this.mutationObserver = null;

            this.delete();

            this.id = null;
            this.isSyncing = false;
        },

        editor() {
            const editorId = editors[this.statePath];

            if (!editorId) return null;

            return tinymce.get(editorId) || null;
        }, 

        delete() {
            const editorId = editors[this.statePath];
            const editor = editorId ? tinymce.get(editorId) : null;

            this.mutationObserver?.disconnect();
            this.mutationObserver = null;

            if(editor) {
                try{
                    tinymce.remove(editor);
                } catch (_) {
                    // 
                }
            }

            delete editors[this.statePath];

            if(Array.isArray(window.tinySettingsCopy)) {
                window.tinySettingsCopy = window.tinySettingsCopy.filter(
                    (settings) => settings.id !== editorId
                );
            }
        },

        applyMergeableBlockUpdate(incomingContent) {
            const editor = this.editor();

            if (!editor || editor.removed || !incomingContent) return false;

            let handled = false;

            for (const blockId of this.mergeable_blocks) {
                const re = new RegExp(
                    '<div\\s+id="' +
                        blockId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                        '"\\s*>([\\s\\S]*?)</div>',
                    "i"
                );

                const incomingMatch = incomingContent.match(re);
                const currentEl = editor.dom.get(blockId);

                // Case 1: Both have the block - update innerHTML only
                if (currentEl && incomingMatch) {
                    currentEl.innerHTML = incomingMatch[1];
                    handled = true;
                    continue;
                }

                // Case 2: Incoming has the block, current doesn't -
                // first-time insertion. Insert via DOM before
                // prev-message (or at the end of the body)

                if (!currentEl && incomingMatch) {
                    const body = editor.getBody();
                    const prevMsgEl = editor.dom.get("prev-message");

                    // Save cursor so we can restore it after DOM insertion
                    let bookmark;
                    try {
                        bookmark = editor.selection.getBookmark(2, true);
                    } catch (_) {
                        bookmark = null;
                    }

                    // Build the new nodes
                    const spacer = editor.dom.create("p", {}, "\u00a0");
                    const blockDiv = editor.dom.create("div", {
                        id: blockId,
                    });
                    blockDiv.innerHTML = incomingMatch[1];

                    if (prevMsgEl) {
                        body.insertBefore(spacer, prevMsgEl);
                        body.insertBefore(blockDiv, prevMsgEl);
                    } else {
                        body.appendChild(spacer);
                        body.appendChild(blockDiv);
                    }

                    // Restore cursor position
                    if (bookmark) {
                        try {
                            editor.selection.moveToBookmark(bookmark);
                        } catch (_) {
                            // If restoration fails, cursor stays wherever
                            // TinyMCE left it — acceptable for an insert.
                        }
                    }
                    handled = true;
                    continue;
                }

                // Case 3: Current has the block but incoming doesn't
                // block was cleared. Remove the DOM node
                if (currentEl && !incomingMatch) {
                    // Remove the spacer <p?$nbsp;</p> that precede the block
                    const prev = currentEl.previousSibling;
                    if (
                        prev &&
                        prev.nodeName === "P" &&
                        (prev.innerHTML.trim() === "&nbsp;" ||
                            prev.innerHTML.trim() === "\u00a0" ||
                            prev.textContent.trim() === "")
                    ) {
                        editor.dom.remove(prev);
                    }
                    editor.dom.remove(currentEl);
                    handled = true;
                    continue;
                }
            }

            if (handled) {
                // Sync Alpine/Livewire state to reflect actual editor
                // content.  The $watch will re-fire but the early
                // equality check will short-circuit it.
                this.state = editor.getContent();
            }

            return handled;
        },

        initEditor(content) {
            let _this = this;
            let $wire = this.$wire;

            const defaultFontFamilyFormats =
                "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace;";
            const fontFamilyFormats = fontfamily || defaultFontFamilyFormats;

            const tinyMceConfig = {
                selector: selector,
                language: language,
                language_url: language_url,
                directionality: directionality,
                statusbar: false,
                promotion: false,
                height: height,
                max_height: max_height,
                min_height: min_height,
                width: width,
                max_width: max_width,
                min_width: min_width,
                resize: resize,
                skin: skin,
                content_css: content_css,
                plugins: plugins,
                external_plugins: external_plugins,
                toolbar: toolbar,
                toolbar_groups: toolbar_groups,
                text_patterns: text_patterns,
                toolbar_sticky: toolbar_sticky,
                toolbar_sticky_offset: toolbar_sticky_offset,
                toolbar_mode: toolbar_mode,
                toolbar_location: toolbar_location,
                inline: inline,
                toolbar_persist: toolbar_persist,
                menubar: menubar,
                menu: {
                    file: {
                        title: "File",
                        items: "newdocument restoredraft | preview | export print | deleteallconversations",
                    },
                    edit: {
                        title: "Edit",
                        items: "undo redo | cut copy paste pastetext | selectall | searchreplace",
                    },
                    view: {
                        title: "View",
                        items: "code | visualaid visualchars visualblocks | spellchecker | preview fullscreen | showcomments",
                    },
                    insert: {
                        title: "Insert",
                        items: "image link media addcomment pageembed codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor tableofcontents | insertdatetime",
                    },
                    format: {
                        title: "Format",
                        items: "bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamily fontsize align lineheight | forecolor backcolor | language | removeformat",
                    },
                    tools: {
                        title: "Tools",
                        items: "spellchecker spellcheckerlanguage | a11ycheck code wordcount",
                    },
                    table: {
                        title: "Table",
                        items: "inserttable | cell row column | advtablesort | tableprops deletetable",
                    },
                    help: { title: "Help", items: "help" },
                },
                font_size_formats: font_size_formats,
                fontfamily: fontfamily,
                fontFamilyFormats: fontFamilyFormats,
                relative_urls: relative_urls,
                remove_script_host: remove_script_host,
                convert_urls: convert_urls,
                image_list: image_list,
                image_advtab: image_advtab,
                image_description: image_description,
                image_class_list: image_class_list,
                images_upload_url: images_upload_url,
                images_upload_base_path: images_upload_base_path,
                license_key: license_key,
                setup: function (editor) {
                    if (!window.tinySettingsCopy) {
                        window.tinySettingsCopy = [];
                    }

                    if (
                        editor.settings &&
                        !window.tinySettingsCopy.some(
                            (obj) => obj.id === editor.settings.id
                        )
                    ) {
                        window.tinySettingsCopy.push(editor.settings);
                    }

                    editor.on("blur", function (e) {
                        if(_this.destroyed) return;

                        _this.updatedAt = Date.now();
                        _this.state = editor.getContent();
                    });

                    editor.on("change", function (e) {
                        if(_this.destroyed) return;

                        _this.updatedAt = Date.now();
                        _this.state = editor.getContent();
                    });

                    editor.on("init", function (e) {
                        if(_this.destroyed){
                            tinymce.remove(editor);
                            return;
                        };

                        editors[_this.statePath] = editor.id;
                        _this.id = editor.id;

                        if (content != null) {
                            _this.startSync(editor);

                            const done = () => {
                                editor.off("SetContent", done);
                                _this.finishSync(editor);
                            };

                            editor.on("SetContent", done);

                            editor.setContent(content);
                        }
                    });

                    editor.on("OpenWindow", function (e) {
                        const target = e.target.container.closest(".fi-modal");

                        if (target) {
                            target.setAttribute("x-trap.noscroll", "false");
                        }
                    });

                    editor.on("CloseWindow", function (e) {
                        const target = e.target.container.closest(".fi-modal");

                        if (target) {
                            target.setAttribute("x-trap.noscroll", "isOpen");
                        }
                    });

                    if (typeof setup === "function") {
                        setup(editor);
                    }

                    // Register @mention autocompleter when getMentionSourceResultsUsing is provided
                    if (getMentionSourceResultsUsing) {
                        const debouncePromise = (fn, delay) => {
                            let timeoutId;
                            return (...args) => {
                                return new Promise((resolve, reject) => {
                                    clearTimeout(timeoutId);
                                    timeoutId = setTimeout(async () => {
                                        try {
                                            const result = await fn(...args);
                                            resolve(result);
                                        } catch (error ){
                                            reject(error);
                                        }
                                    }, delay);
                                });
                            };
                        };

                        const fetchMentionsDebounced = debouncePromise(async (pattern) => {
                            const lowerPattern = pattern.toLowerCase();
                            const items = await getMentionSourceResultsUsing(lowerPattern);

                            console.log('test');

                            return items.map(function (item) {
                                return {
                                    type: 'cardmenuitem',
                                    value: JSON.stringify(item),
                                    label: item.label,
                                    items: [
                                        {
                                            type: 'cardcontainer',
                                            direction: 'vertical',
                                            items: [
                                                {
                                                    type: 'cardtext',
                                                    text: item.label,
                                                    name: 'item_label',
                                                },
                                                {
                                                    type: 'cardtext',
                                                    text: item.description || '',
                                                    name: 'item_description',
                                                }
                                            ]
                                        }
                                    ]
                                };
                            });
                        }, 500);

                        editor.ui.registry.addAutocompleter("mentions", {
                            trigger: "@",
                            minChars: 0,
                            columns: 1,
                            highlightOn: ["item_label", "item_description"],
                            fetch: function (pattern) {
                                return fetchMentionsDebounced(pattern);
                            },
                            onAction: async function (autocompleteApi, rng, value) {
                                editor.selection.setRng(rng);
                                let data = JSON.parse(value);
                                let html;

                                if (
                                    mention_mode === "mailto" &&
                                    data.value
                                ) {
                                    html =
                                        '<a href="mailto:' +
                                        data.value +
                                        '">@' +
                                        data.label +
                                        "</a>&nbsp;";
                                } else {
                                    html =
                                        '<span style="color: #2563eb; font-weight: 600;">@' +
                                        data.label +
                                        "</span>&nbsp;";
                                }

                                editor.insertContent(html);

                                if(afterMentionSelected){
                                    await afterMentionSelected(data);
                                }

                                autocompleteApi.hide();
                            },
                        });
                    }
                },
                images_upload_handler: (blobInfo, progress) =>
                    new Promise((success, failure) => {
                        if (!blobInfo.blob()) return;

                        const pathJoin = (path1, path2) => {
                            if (path1) {
                                return (
                                    path1.replace(/\/$/, "") +
                                    "/" +
                                    path2.replace(/^\//, "")
                                );
                            }
                            return path2;
                        };

                        const finishCallback = () => {
                            $wire
                                .getFormComponentFileAttachmentUrl(statePath)
                                .then((url) => {
                                    if (!url) {
                                        failure("Image upload failed");
                                        return;
                                    }
                                    success(
                                        pathJoin(images_upload_base_path, url)
                                    );
                                });
                        };

                        const errorCallback = () => {};

                        const progressCallback = (e) => {
                            progress(e.detail.progress);
                        };

                        $wire.upload(
                            `componentFileAttachments.${statePath}`,
                            blobInfo.blob(),
                            finishCallback,
                            errorCallback,
                            progressCallback
                        );
                    }),

                init_instance_callback: function (editor) {
                    const MutationObserver =
                        window.MutationObserver ||
                        window.WebKitMutationObserver ||
                        window.MozMutationObserver;

                    const isEnabled =
                        removeImagesEventCallback &&
                        typeof removeImagesEventCallback === "function";

                    if (!MutationObserver || !isEnabled) return;

                    _this.mutationObserver?.disconnect();

                    _this.mutationObserver = new MutationObserver(function (
                        mutations
                    ) {
                        if (_this.destroyed) return;

                        const addedImages = [];

                        mutations.forEach(function (mutationRecord) {
                            Array.from(mutationRecord.addedNodes).forEach(
                                function (currentNode) {
                                    if (
                                        currentNode.nodeName === "IMG" &&
                                        currentNode.className !==
                                            "mce-clonedresizable"
                                    ) {
                                        if (
                                            addedImages.indexOf(
                                                currentNode.src
                                            ) >= 0
                                        )
                                            return;

                                        addedImages.push(
                                            currentNode.getAttribute("src")
                                        );
                                        return;
                                    }

                                    const imgs =
                                        currentNode.getElementsByTagName("img");

                                    Array.from(imgs).forEach(function (img) {
                                        if (addedImages.includes(img.src)) return;

                                        addedImages.push(
                                            img.getAttribute("src")
                                        );
                                    });
                                }
                            );
                        });

                        const removedImages = [];

                        mutations.forEach(function (mutationRecord) {
                            Array.from(mutationRecord.removedNodes).forEach(
                                function (currentNode) {
                                    if (
                                        currentNode.nodeName === "IMG" &&
                                        currentNode.className !==
                                            "mce-clonedresizable"
                                    ) {
                                        if (removedImages.includes(currentNode.src)) return;

                                        removedImages.push(
                                            currentNode.getAttribute("src")
                                        );
                                        return;
                                    }

                                    if (currentNode.nodeType === 1) {
                                        const imgs =
                                            currentNode.getElementsByTagName(
                                                "img"
                                            );

                                        Array.from(imgs).forEach(function (
                                            img
                                        ) {
                                            if (addedImages.includes(img.src)) return;

                                            addedImages.push(
                                                img.getAttribute("src")
                                            );
                                        });
                                    }
                                }
                            );
                        });

                        removedImages.forEach(function (imageSrc) {
                            if (addedImages.includes(imageSrc)) return;

                            if (
                                removeImagesEventCallback &&
                                typeof removeImagesEventCallback === "function"
                            ) {
                                removeImagesEventCallback(imageSrc);
                            }
                        });
                    });

                    _this.mutationObserver.observe(editor.getBody(), {
                        childList: true,
                        subtree: true,
                    });
                },
                automatic_uploads: true,
                ...custom_configs,
            };

            tinymce.init(tinyMceConfig);
        },

        updateEditorContent(content) {
            const editor = this.editor();
            
            if (!editor || editor.removed) return;

            editor.setContent(content);
        },

        putCursorToEnd() {
            const editor = this.editor();

            if (!editor || editor.removed) return;

            editor.selection.select(editor.getBody(), true);
            editor.selection.collapse(false);
        },

        startSync() {
            const editor = this.editor();

            if(!editor || editor.removed || this.isSyncing) return;

            if (this.isSyncing) return;

            this.isSyncing = true;

            editor.setProgressState(true);
            editor.mode.set("readonly");
        },

        finishSync() {
            const editor = this.editor();

            this.isSyncing = false;

            if(!editor || editor.removed) return;

            editor.setProgressState(false);
            editor.mode.set("design");
        },
    };
}
