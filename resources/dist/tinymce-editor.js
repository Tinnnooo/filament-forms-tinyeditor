// resources/js/tinymce-editor.js
function tinymceEditor({
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
  removeImagesEventCallback = null
}) {
  window.filamentTinyMceEditors = window.filamentTinyMceEditors || {};
  const editors = window.filamentTinyMceEditors;
  return {
    id: null,
    state,
    statePath,
    selector,
    language,
    language_url,
    directionality,
    height,
    max_height,
    min_height,
    width,
    max_width,
    min_width,
    resize,
    skin,
    content_css,
    content_style,
    plugins,
    external_plugins,
    toolbar,
    toolbar_groups,
    text_patterns,
    toolbar_sticky,
    menubar,
    relative_urls,
    remove_script_host,
    convert_urls,
    font_size_formats,
    fontfamily,
    setup,
    image_list,
    image_advtab,
    image_description,
    image_class_list,
    images_upload_url,
    images_upload_base_path,
    license_key,
    custom_configs,
    updatedAt: Date.now(),
    disabled,
    locale,
    placeholder,
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
        if (!editor || editor.removed) return;
        if (editor.getContent() === value) return;
        if (mergeable_blocks.length > 0 && this.applyMergeableBlockUpdate(value)) {
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
    destroy() {
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
      if (editor) {
        try {
          tinymce.remove(editor);
        } catch (_) {
        }
      }
      delete editors[this.statePath];
      if (Array.isArray(window.tinySettingsCopy)) {
        window.tinySettingsCopy = window.tinySettingsCopy.filter(
          (settings) => settings.id !== editorId
        );
      }
    },
    applyMergeableBlockUpdate(incomingContent) {
      const editor = this.editor();
      if (!editor || editor.removed || !incomingContent) return false;
      let handled = false;
      for (const blockId of mergeable_blocks) {
        const re = new RegExp(
          '<div\\s+id="' + blockId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"\\s*>([\\s\\S]*?)</div>',
          "i"
        );
        const incomingMatch = incomingContent.match(re);
        const currentEl = editor.dom.get(blockId);
        if (currentEl && incomingMatch) {
          currentEl.innerHTML = incomingMatch[1];
          handled = true;
          continue;
        }
        if (!currentEl && incomingMatch) {
          const body = editor.getBody();
          const prevMsgEl = editor.dom.get("prev-message");
          let bookmark;
          try {
            bookmark = editor.selection.getBookmark(2, true);
          } catch (_) {
            bookmark = null;
          }
          const spacer = editor.dom.create("p", {}, "\xA0");
          const blockDiv = editor.dom.create("div", {
            id: blockId
          });
          blockDiv.innerHTML = incomingMatch[1];
          if (prevMsgEl) {
            body.insertBefore(spacer, prevMsgEl);
            body.insertBefore(blockDiv, prevMsgEl);
          } else {
            body.appendChild(spacer);
            body.appendChild(blockDiv);
          }
          if (bookmark) {
            try {
              editor.selection.moveToBookmark(bookmark);
            } catch (_) {
            }
          }
          handled = true;
          continue;
        }
        if (currentEl && !incomingMatch) {
          const prev = currentEl.previousSibling;
          if (prev && prev.nodeName === "P" && (prev.innerHTML.trim() === "&nbsp;" || prev.innerHTML.trim() === "\xA0" || prev.textContent.trim() === "")) {
            editor.dom.remove(prev);
          }
          editor.dom.remove(currentEl);
          handled = true;
          continue;
        }
      }
      if (handled) {
        this.state = editor.getContent();
      }
      return handled;
    },
    initEditor(content) {
      let _this = this;
      let $wire = this.$wire;
      const defaultFontFamilyFormats = "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace;";
      const fontFamilyFormats = fontfamily || defaultFontFamilyFormats;
      const tinyMceConfig = {
        selector,
        language,
        language_url,
        directionality,
        statusbar: false,
        promotion: false,
        height,
        max_height,
        min_height,
        width,
        max_width,
        min_width,
        resize,
        skin,
        content_css,
        plugins,
        external_plugins,
        toolbar,
        toolbar_groups,
        text_patterns,
        toolbar_sticky,
        toolbar_sticky_offset,
        toolbar_mode,
        toolbar_location,
        inline,
        toolbar_persist,
        menubar,
        menu: {
          file: {
            title: "File",
            items: "newdocument restoredraft | preview | export print | deleteallconversations"
          },
          edit: {
            title: "Edit",
            items: "undo redo | cut copy paste pastetext | selectall | searchreplace"
          },
          view: {
            title: "View",
            items: "code | visualaid visualchars visualblocks | spellchecker | preview fullscreen | showcomments"
          },
          insert: {
            title: "Insert",
            items: "image link media addcomment pageembed codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor tableofcontents | insertdatetime"
          },
          format: {
            title: "Format",
            items: "bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamily fontsize align lineheight | forecolor backcolor | language | removeformat"
          },
          tools: {
            title: "Tools",
            items: "spellchecker spellcheckerlanguage | a11ycheck code wordcount"
          },
          table: {
            title: "Table",
            items: "inserttable | cell row column | advtablesort | tableprops deletetable"
          },
          help: { title: "Help", items: "help" }
        },
        font_size_formats,
        fontfamily,
        fontFamilyFormats,
        relative_urls,
        remove_script_host,
        convert_urls,
        image_list,
        image_advtab,
        image_description,
        image_class_list,
        images_upload_url,
        images_upload_base_path,
        license_key,
        setup: function(editor) {
          if (!window.tinySettingsCopy) {
            window.tinySettingsCopy = [];
          }
          if (editor.settings && !window.tinySettingsCopy.some(
            (obj) => obj.id === editor.settings.id
          )) {
            window.tinySettingsCopy.push(editor.settings);
          }
          editor.on("blur", function(e) {
            if (_this.destroyed) return;
            _this.updatedAt = Date.now();
            _this.state = editor.getContent();
          });
          editor.on("change", function(e) {
            if (_this.destroyed) return;
            _this.updatedAt = Date.now();
            _this.state = editor.getContent();
          });
          editor.on("init", function(e) {
            if (_this.destroyed) {
              tinymce.remove(editor);
              return;
            }
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
          editor.on("OpenWindow", function(e) {
            const target = e.target.container.closest(".fi-modal");
            if (target) {
              target.setAttribute("x-trap.noscroll", "false");
            }
          });
          editor.on("CloseWindow", function(e) {
            const target = e.target.container.closest(".fi-modal");
            if (target) {
              target.setAttribute("x-trap.noscroll", "isOpen");
            }
          });
          if (typeof setup === "function") {
            setup(editor);
          }
          if (getMentionSourceResultsUsing) {
            editor.ui.registry.addAutocompleter("mentions", {
              trigger: "@",
              minChars: 0,
              columns: 1,
              highlightOn: ["item_label", "item_description"],
              fetch: async function(pattern) {
                const lowerPattern = pattern.toLowerCase();
                const items = await getMentionSourceResultsUsing(lowerPattern);
                return items.map(function(item) {
                  return {
                    type: "cardmenuitem",
                    value: JSON.stringify(item),
                    label: item.label,
                    items: [
                      {
                        type: "cardcontainer",
                        direction: "vertical",
                        items: [
                          {
                            type: "cardtext",
                            text: item.label,
                            name: "item_label"
                          },
                          {
                            type: "cardtext",
                            text: item.description || "",
                            name: "item_description"
                          }
                        ]
                      }
                    ]
                  };
                });
              },
              onAction: async function(autocompleteApi, rng, value) {
                editor.selection.setRng(rng);
                const data = JSON.parse(value);
                let html;
                if (mention_mode === "mailto" && data.value) {
                  html = '<a href="mailto:' + data.value + '">@' + data.label + "</a>&nbsp;";
                } else {
                  html = '<span style="color: #2563eb; font-weight: 600;">@' + data.label + "</span>&nbsp;";
                }
                editor.insertContent(html);
                if (afterMentionSelected) {
                  await afterMentionSelected(data);
                }
                autocompleteApi.hide();
              }
            });
          }
        },
        images_upload_handler: (blobInfo, progress) => new Promise((success, failure) => {
          if (!blobInfo.blob()) return;
          const pathJoin = (path1, path2) => {
            if (path1) {
              return path1.replace(/\/$/, "") + "/" + path2.replace(/^\//, "");
            }
            return path2;
          };
          const finishCallback = () => {
            if (_this.destroyed) {
              failure("Editor was destroyed");
              return;
            }
            $wire.getFormComponentFileAttachmentUrl(statePath).then((url) => {
              if (!url) {
                failure("Image upload failed");
                return;
              }
              success(
                pathJoin(images_upload_base_path, url)
              );
            });
          };
          const errorCallback = () => {
            failure("Image upload failed");
          };
          const progressCallback = (e) => {
            if (_this.destroyed) return;
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
        init_instance_callback: function(editor) {
          const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
          const isEnabled = removeImagesEventCallback && typeof removeImagesEventCallback === "function";
          if (!MutationObserver || !isEnabled) return;
          _this.mutationObserver?.disconnect();
          _this.mutationObserver = new MutationObserver(function(mutations) {
            if (_this.destroyed) return;
            const addedImages = [];
            mutations.forEach(function(mutationRecord) {
              Array.from(mutationRecord.addedNodes).forEach(
                function(currentNode) {
                  if (currentNode.nodeName === "IMG" && currentNode.className !== "mce-clonedresizable") {
                    if (addedImages.indexOf(
                      currentNode.src
                    ) >= 0)
                      return;
                    addedImages.push(
                      currentNode.getAttribute("src")
                    );
                    return;
                  }
                  if (currentNode.nodeType !== 1) return;
                  const imgs = currentNode.getElementsByTagName("img");
                  Array.from(imgs).forEach(function(img) {
                    if (addedImages.includes(img.src)) return;
                    addedImages.push(
                      img.getAttribute("src")
                    );
                  });
                }
              );
            });
            const removedImages = [];
            mutations.forEach(function(mutationRecord) {
              Array.from(mutationRecord.removedNodes).forEach(
                function(currentNode) {
                  if (currentNode.nodeName === "IMG" && currentNode.className !== "mce-clonedresizable") {
                    if (removedImages.includes(currentNode.src)) return;
                    removedImages.push(
                      currentNode.getAttribute("src")
                    );
                    return;
                  }
                  if (currentNode.nodeType !== 1) return;
                  const imgs = currentNode.getElementsByTagName("img");
                  Array.from(imgs).forEach(function(img) {
                    if (addedImages.includes(img.src)) return;
                    addedImages.push(img.getAttribute("src"));
                  });
                }
              );
            });
            removedImages.forEach(function(imageSrc) {
              if (addedImages.includes(imageSrc)) return;
              removeImagesEventCallback(imageSrc);
            });
          });
          _this.mutationObserver.observe(editor.getBody(), {
            childList: true,
            subtree: true
          });
        },
        automatic_uploads: true,
        ...custom_configs
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
      if (!editor || editor.removed || this.isSyncing) return;
      this.isSyncing = true;
      editor.setProgressState(true);
      editor.mode.set("readonly");
    },
    finishSync() {
      const editor = this.editor();
      this.isSyncing = false;
      if (!editor || editor.removed) return;
      editor.setProgressState(false);
      editor.mode.set("design");
    }
  };
}
export {
  tinymceEditor as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvdGlueW1jZS1lZGl0b3IuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRpbnltY2VFZGl0b3Ioe1xuICAgIHN0YXRlLFxuICAgIHN0YXRlUGF0aCxcbiAgICBzZWxlY3RvcixcbiAgICBwbHVnaW5zLFxuICAgIGV4dGVybmFsX3BsdWdpbnMsXG4gICAgdG9vbGJhcixcbiAgICB0b29sYmFyX2dyb3VwcyxcbiAgICBjb250ZW50X3N0eWxlID0gXCJcIixcbiAgICB0ZXh0X3BhdHRlcm5zLFxuICAgIGxhbmd1YWdlID0gXCJlblwiLFxuICAgIGxhbmd1YWdlX3VybCA9IG51bGwsXG4gICAgZGlyZWN0aW9uYWxpdHkgPSBcImx0clwiLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgbWF4X2hlaWdodCA9IDAsXG4gICAgbWluX2hlaWdodCA9IDEwMCxcbiAgICB3aWR0aCA9IG51bGwsXG4gICAgbWF4X3dpZHRoID0gMCxcbiAgICBtaW5fd2lkdGggPSA0MDAsXG4gICAgcmVzaXplID0gZmFsc2UsXG4gICAgc2tpbiA9IFwib3hpZGVcIixcbiAgICBjb250ZW50X2NzcyA9IFwiZGVmYXVsdFwiLFxuICAgIHRvb2xiYXJfc3RpY2t5ID0gdHJ1ZSxcbiAgICB0b29sYmFyX3N0aWNreV9vZmZzZXQgPSA2NCxcbiAgICB0b29sYmFyX21vZGUgPSBcInNsaWRpbmdcIixcbiAgICB0b29sYmFyX2xvY2F0aW9uID0gXCJhdXRvXCIsXG4gICAgaW5saW5lID0gZmFsc2UsXG4gICAgdG9vbGJhcl9wZXJzaXN0ID0gZmFsc2UsXG4gICAgbWVudWJhciA9IGZhbHNlLFxuICAgIHJlbGF0aXZlX3VybHMgPSB0cnVlLFxuICAgIHJlbW92ZV9zY3JpcHRfaG9zdCA9IHRydWUsXG4gICAgY29udmVydF91cmxzID0gdHJ1ZSxcbiAgICBmb250X3NpemVfZm9ybWF0cyA9IFwiXCIsXG4gICAgZm9udGZhbWlseSA9IFwiXCIsXG4gICAgc2V0dXAgPSBudWxsLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgbG9jYWxlID0gXCJlblwiLFxuICAgIHBsYWNlaG9sZGVyID0gbnVsbCxcbiAgICBpbWFnZV9saXN0ID0gbnVsbCxcbiAgICBpbWFnZXNfdXBsb2FkX3VybCA9IG51bGwsXG4gICAgaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGggPSBudWxsLFxuICAgIGltYWdlX2FkdnRhYiA9IGZhbHNlLFxuICAgIGltYWdlX2Rlc2NyaXB0aW9uID0gZmFsc2UsXG4gICAgaW1hZ2VfY2xhc3NfbGlzdCA9IG51bGwsXG4gICAgbGljZW5zZV9rZXkgPSBcImdwbFwiLFxuICAgIGN1c3RvbV9jb25maWdzID0ge30sXG4gICAgbWVyZ2VhYmxlX2Jsb2NrcyA9IFtdLFxuICAgIGdldE1lbnRpb25Tb3VyY2VSZXN1bHRzVXNpbmcsXG4gICAgbWVudGlvbl9tb2RlID0gXCJ0ZXh0XCIsXG4gICAgYWZ0ZXJNZW50aW9uU2VsZWN0ZWQsXG4gICAgcmVtb3ZlSW1hZ2VzRXZlbnRDYWxsYmFjayA9IG51bGwsXG59KSB7XG4gICAgd2luZG93LmZpbGFtZW50VGlueU1jZUVkaXRvcnMgPSB3aW5kb3cuZmlsYW1lbnRUaW55TWNlRWRpdG9ycyB8fCB7fTtcblxuICAgIGNvbnN0IGVkaXRvcnMgPSB3aW5kb3cuZmlsYW1lbnRUaW55TWNlRWRpdG9ycztcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBudWxsLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIHN0YXRlUGF0aDogc3RhdGVQYXRoLFxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZSxcbiAgICAgICAgbGFuZ3VhZ2VfdXJsOiBsYW5ndWFnZV91cmwsXG4gICAgICAgIGRpcmVjdGlvbmFsaXR5OiBkaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIG1heF9oZWlnaHQ6IG1heF9oZWlnaHQsXG4gICAgICAgIG1pbl9oZWlnaHQ6IG1pbl9oZWlnaHQsXG4gICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgbWF4X3dpZHRoOiBtYXhfd2lkdGgsXG4gICAgICAgIG1pbl93aWR0aDogbWluX3dpZHRoLFxuICAgICAgICByZXNpemU6IHJlc2l6ZSxcbiAgICAgICAgc2tpbjogc2tpbixcbiAgICAgICAgY29udGVudF9jc3M6IGNvbnRlbnRfY3NzLFxuICAgICAgICBjb250ZW50X3N0eWxlOiBjb250ZW50X3N0eWxlLFxuICAgICAgICBwbHVnaW5zOiBwbHVnaW5zLFxuICAgICAgICBleHRlcm5hbF9wbHVnaW5zOiBleHRlcm5hbF9wbHVnaW5zLFxuICAgICAgICB0b29sYmFyOiB0b29sYmFyLFxuICAgICAgICB0b29sYmFyX2dyb3VwczogdG9vbGJhcl9ncm91cHMsXG4gICAgICAgIHRleHRfcGF0dGVybnM6IHRleHRfcGF0dGVybnMsXG4gICAgICAgIHRvb2xiYXJfc3RpY2t5OiB0b29sYmFyX3N0aWNreSxcbiAgICAgICAgbWVudWJhcjogbWVudWJhcixcbiAgICAgICAgcmVsYXRpdmVfdXJsczogcmVsYXRpdmVfdXJscyxcbiAgICAgICAgcmVtb3ZlX3NjcmlwdF9ob3N0OiByZW1vdmVfc2NyaXB0X2hvc3QsXG4gICAgICAgIGNvbnZlcnRfdXJsczogY29udmVydF91cmxzLFxuICAgICAgICBmb250X3NpemVfZm9ybWF0czogZm9udF9zaXplX2Zvcm1hdHMsXG4gICAgICAgIGZvbnRmYW1pbHk6IGZvbnRmYW1pbHksXG4gICAgICAgIHNldHVwOiBzZXR1cCxcbiAgICAgICAgaW1hZ2VfbGlzdDogaW1hZ2VfbGlzdCxcbiAgICAgICAgaW1hZ2VfYWR2dGFiOiBpbWFnZV9hZHZ0YWIsXG4gICAgICAgIGltYWdlX2Rlc2NyaXB0aW9uOiBpbWFnZV9kZXNjcmlwdGlvbixcbiAgICAgICAgaW1hZ2VfY2xhc3NfbGlzdDogaW1hZ2VfY2xhc3NfbGlzdCxcbiAgICAgICAgaW1hZ2VzX3VwbG9hZF91cmw6IGltYWdlc191cGxvYWRfdXJsLFxuICAgICAgICBpbWFnZXNfdXBsb2FkX2Jhc2VfcGF0aDogaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGgsXG4gICAgICAgIGxpY2Vuc2Vfa2V5OiBsaWNlbnNlX2tleSxcbiAgICAgICAgY3VzdG9tX2NvbmZpZ3M6IGN1c3RvbV9jb25maWdzLFxuICAgICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgICAgIGRpc2FibGVkLFxuICAgICAgICBsb2NhbGU6IGxvY2FsZSxcbiAgICAgICAgcGxhY2Vob2xkZXI6IHBsYWNlaG9sZGVyLFxuICAgICAgICBpc1N5bmNpbmc6IGZhbHNlLFxuXG4gICAgICAgIHVud2F0Y2hTdGF0ZTogbnVsbCxcbiAgICAgICAgbXV0YXRpb25PYnNlcnZlcjogbnVsbCxcbiAgICAgICAgZGVzdHJveWVkOiBmYWxzZSxcblxuICAgICAgICBpbml0KCkge1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5kZWxldGUoKTtcblxuICAgICAgICAgICAgdGhpcy5pbml0RWRpdG9yKHN0YXRlLmluaXRpYWxWYWx1ZSk7XG5cbiAgICAgICAgICAgIHRoaXMudW53YXRjaFN0YXRlID0gdGhpcy4kd2F0Y2goXCJzdGF0ZVwiLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcigpO1xuXG4gICAgICAgICAgICAgICAgaWYoIWVkaXRvciB8fCBlZGl0b3IucmVtb3ZlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0Q29udGVudCgpID09PSB2YWx1ZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBtZXJnZWFibGVfYmxvY2tzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseU1lcmdlYWJsZUJsb2NrVXBkYXRlKHZhbHVlKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydFN5bmMoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRvbmUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vZmYoXCJTZXRDb250ZW50XCIsIGRvbmUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmlzaFN5bmMoKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiU2V0Q29udGVudFwiLCBkb25lKTtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0Q29udGVudCh2YWx1ZSA/PyBcIlwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlc3Ryb3koKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLnVud2F0Y2hTdGF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51bndhdGNoU3RhdGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy51bndhdGNoU3RhdGUgPSBudWxsO1xuXG4gICAgICAgICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHRoaXMubXV0YXRpb25PYnNlcnZlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKCk7XG5cbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBlZGl0b3IoKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JJZCA9IGVkaXRvcnNbdGhpcy5zdGF0ZVBhdGhdO1xuXG4gICAgICAgICAgICBpZiAoIWVkaXRvcklkKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIHRpbnltY2UuZ2V0KGVkaXRvcklkKSB8fCBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvcklkID0gZWRpdG9yc1t0aGlzLnN0YXRlUGF0aF07XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBlZGl0b3JJZCA/IHRpbnltY2UuZ2V0KGVkaXRvcklkKSA6IG51bGw7XG5cbiAgICAgICAgICAgIHRoaXMubXV0YXRpb25PYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbnltY2UucmVtb3ZlKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgICAgICAgICAgICAvLyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JzW3RoaXMuc3RhdGVQYXRoXTtcblxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh3aW5kb3cudGlueVNldHRpbmdzQ29weSkpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cudGlueVNldHRpbmdzQ29weSA9IHdpbmRvdy50aW55U2V0dGluZ3NDb3B5LmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgKHNldHRpbmdzKSA9PiBzZXR0aW5ncy5pZCAhPT0gZWRpdG9ySWRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgIFxuICAgICAgICBhcHBseU1lcmdlYWJsZUJsb2NrVXBkYXRlKGluY29taW5nQ29udGVudCkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3IoKTtcblxuICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLnJlbW92ZWQgfHwgIWluY29taW5nQ29udGVudCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJsb2NrSWQgb2YgbWVyZ2VhYmxlX2Jsb2Nrcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgICAgICAgICAgJzxkaXZcXFxccytpZD1cIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tJZC5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1wiXFxcXHMqPihbXFxcXHNcXFxcU10qPyk8L2Rpdj4nLFxuICAgICAgICAgICAgICAgICAgICBcImlcIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5jb21pbmdNYXRjaCA9IGluY29taW5nQ29udGVudC5tYXRjaChyZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEVsID0gZWRpdG9yLmRvbS5nZXQoYmxvY2tJZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBDYXNlIDE6IEJvdGggaGF2ZSB0aGUgYmxvY2sgXHUyMDE0IHVwZGF0ZSBpbm5lckhUTUwgb25seVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RWwgJiYgaW5jb21pbmdNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RWwuaW5uZXJIVE1MID0gaW5jb21pbmdNYXRjaFsxXTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENhc2UgMjogSW5jb21pbmcgaGFzIHRoZSBibG9jaywgY3VycmVudCBkb2Vzbid0IFx1MjAxNFxuICAgICAgICAgICAgICAgIC8vIGZpcnN0LXRpbWUgaW5zZXJ0aW9uLiAgSW5zZXJ0IHZpYSBET00gYmVmb3JlXG4gICAgICAgICAgICAgICAgLy8gcHJldi1tZXNzYWdlIChvciBhdCB0aGUgZW5kIG9mIHRoZSBib2R5KS5cbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRFbCAmJiBpbmNvbWluZ01hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBlZGl0b3IuZ2V0Qm9keSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmV2TXNnRWwgPSBlZGl0b3IuZG9tLmdldChcInByZXYtbWVzc2FnZVwiKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIGN1cnNvciBzbyB3ZSBjYW4gcmVzdG9yZSBpdCBhZnRlciBET00gaW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgICAgIGxldCBib29rbWFyaztcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9va21hcmsgPSBlZGl0b3Iuc2VsZWN0aW9uLmdldEJvb2ttYXJrKDIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib29rbWFyayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBCdWlsZCB0aGUgbmV3IG5vZGVzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwYWNlciA9IGVkaXRvci5kb20uY3JlYXRlKFwicFwiLCB7fSwgXCJcXHUwMGEwXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9ja0RpdiA9IGVkaXRvci5kb20uY3JlYXRlKFwiZGl2XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBibG9ja0lkLFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBibG9ja0Rpdi5pbm5lckhUTUwgPSBpbmNvbWluZ01hdGNoWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2TXNnRWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuaW5zZXJ0QmVmb3JlKHNwYWNlciwgcHJldk1zZ0VsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkuaW5zZXJ0QmVmb3JlKGJsb2NrRGl2LCBwcmV2TXNnRWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChzcGFjZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChibG9ja0Rpdik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXN0b3JlIGN1cnNvciBwb3NpdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoYm9va21hcmspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5tb3ZlVG9Cb29rbWFyayhib29rbWFyayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgcmVzdG9yYXRpb24gZmFpbHMsIGN1cnNvciBzdGF5cyB3aGVyZXZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRpbnlNQ0UgbGVmdCBpdCBcdTIwMTQgYWNjZXB0YWJsZSBmb3IgYW4gaW5zZXJ0LlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENhc2UgMzogQ3VycmVudCBoYXMgdGhlIGJsb2NrIGJ1dCBpbmNvbWluZyBkb2Vzbid0IFx1MjAxNFxuICAgICAgICAgICAgICAgIC8vIGJsb2NrIHdhcyBjbGVhcmVkLiAgUmVtb3ZlIHRoZSBET00gbm9kZS5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEVsICYmICFpbmNvbWluZ01hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc3BhY2VyIDxwPiZuYnNwOzwvcD4gdGhhdCBwcmVjZWRlcyB0aGUgYmxvY2tcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJldiA9IGN1cnJlbnRFbC5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYubm9kZU5hbWUgPT09IFwiUFwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAocHJldi5pbm5lckhUTUwudHJpbSgpID09PSBcIiZuYnNwO1wiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldi5pbm5lckhUTUwudHJpbSgpID09PSBcIlxcdTAwYTBcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXYudGV4dENvbnRlbnQudHJpbSgpID09PSBcIlwiKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5kb20ucmVtb3ZlKHByZXYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5kb20ucmVtb3ZlKGN1cnJlbnRFbCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gU3luYyBBbHBpbmUvTGl2ZXdpcmUgc3RhdGUgdG8gcmVmbGVjdCBhY3R1YWwgZWRpdG9yXG4gICAgICAgICAgICAgICAgLy8gY29udGVudC4gIFRoZSAkd2F0Y2ggd2lsbCByZS1maXJlIGJ1dCB0aGUgZWFybHlcbiAgICAgICAgICAgICAgICAvLyBlcXVhbGl0eSBjaGVjayB3aWxsIHNob3J0LWNpcmN1aXQgaXQuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IGVkaXRvci5nZXRDb250ZW50KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRFZGl0b3IoY29udGVudCkge1xuICAgICAgICAgICAgbGV0IF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGxldCAkd2lyZSA9IHRoaXMuJHdpcmU7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRGb250RmFtaWx5Rm9ybWF0cyA9XG4gICAgICAgICAgICAgICAgXCJBcmlhbD1hcmlhbCxoZWx2ZXRpY2Esc2Fucy1zZXJpZjsgQ291cmllciBOZXc9Y291cmllciBuZXcsY291cmllcixtb25vc3BhY2U7XCI7XG5cbiAgICAgICAgICAgIGNvbnN0IGZvbnRGYW1pbHlGb3JtYXRzID0gZm9udGZhbWlseSB8fCBkZWZhdWx0Rm9udEZhbWlseUZvcm1hdHM7XG5cbiAgICAgICAgICAgIGNvbnN0IHRpbnlNY2VDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZSxcbiAgICAgICAgICAgICAgICBsYW5ndWFnZV91cmw6IGxhbmd1YWdlX3VybCxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb25hbGl0eTogZGlyZWN0aW9uYWxpdHksXG4gICAgICAgICAgICAgICAgc3RhdHVzYmFyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBwcm9tb3Rpb246IGZhbHNlLFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgIG1heF9oZWlnaHQ6IG1heF9oZWlnaHQsXG4gICAgICAgICAgICAgICAgbWluX2hlaWdodDogbWluX2hlaWdodCxcbiAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICAgbWF4X3dpZHRoOiBtYXhfd2lkdGgsXG4gICAgICAgICAgICAgICAgbWluX3dpZHRoOiBtaW5fd2lkdGgsXG4gICAgICAgICAgICAgICAgcmVzaXplOiByZXNpemUsXG4gICAgICAgICAgICAgICAgc2tpbjogc2tpbixcbiAgICAgICAgICAgICAgICBjb250ZW50X2NzczogY29udGVudF9jc3MsXG4gICAgICAgICAgICAgICAgcGx1Z2luczogcGx1Z2lucyxcbiAgICAgICAgICAgICAgICBleHRlcm5hbF9wbHVnaW5zOiBleHRlcm5hbF9wbHVnaW5zLFxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHRvb2xiYXIsXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9ncm91cHM6IHRvb2xiYXJfZ3JvdXBzLFxuICAgICAgICAgICAgICAgIHRleHRfcGF0dGVybnM6IHRleHRfcGF0dGVybnMsXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9zdGlja3k6IHRvb2xiYXJfc3RpY2t5LFxuICAgICAgICAgICAgICAgIHRvb2xiYXJfc3RpY2t5X29mZnNldDogdG9vbGJhcl9zdGlja3lfb2Zmc2V0LFxuICAgICAgICAgICAgICAgIHRvb2xiYXJfbW9kZTogdG9vbGJhcl9tb2RlLFxuICAgICAgICAgICAgICAgIHRvb2xiYXJfbG9jYXRpb246IHRvb2xiYXJfbG9jYXRpb24sXG4gICAgICAgICAgICAgICAgaW5saW5lOiBpbmxpbmUsXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9wZXJzaXN0OiB0b29sYmFyX3BlcnNpc3QsXG4gICAgICAgICAgICAgICAgbWVudWJhcjogbWVudWJhcixcbiAgICAgICAgICAgICAgICBtZW51OiB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkZpbGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBcIm5ld2RvY3VtZW50IHJlc3RvcmVkcmFmdCB8IHByZXZpZXcgfCBleHBvcnQgcHJpbnQgfCBkZWxldGVhbGxjb252ZXJzYXRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVkaXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkVkaXRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBcInVuZG8gcmVkbyB8IGN1dCBjb3B5IHBhc3RlIHBhc3RldGV4dCB8IHNlbGVjdGFsbCB8IHNlYXJjaHJlcGxhY2VcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdmlldzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiVmlld1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwiY29kZSB8IHZpc3VhbGFpZCB2aXN1YWxjaGFycyB2aXN1YWxibG9ja3MgfCBzcGVsbGNoZWNrZXIgfCBwcmV2aWV3IGZ1bGxzY3JlZW4gfCBzaG93Y29tbWVudHNcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJJbnNlcnRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBcImltYWdlIGxpbmsgbWVkaWEgYWRkY29tbWVudCBwYWdlZW1iZWQgY29kZXNhbXBsZSBpbnNlcnR0YWJsZSB8IGNoYXJtYXAgZW1vdGljb25zIGhyIHwgcGFnZWJyZWFrIG5vbmJyZWFraW5nIGFuY2hvciB0YWJsZW9mY29udGVudHMgfCBpbnNlcnRkYXRldGltZVwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkZvcm1hdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwiYm9sZCBpdGFsaWMgdW5kZXJsaW5lIHN0cmlrZXRocm91Z2ggc3VwZXJzY3JpcHQgc3Vic2NyaXB0IGNvZGVmb3JtYXQgfCBzdHlsZXMgYmxvY2tzIGZvbnRmYW1pbHkgZm9udHNpemUgYWxpZ24gbGluZWhlaWdodCB8IGZvcmVjb2xvciBiYWNrY29sb3IgfCBsYW5ndWFnZSB8IHJlbW92ZWZvcm1hdFwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0b29sczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiVG9vbHNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBcInNwZWxsY2hlY2tlciBzcGVsbGNoZWNrZXJsYW5ndWFnZSB8IGExMXljaGVjayBjb2RlIHdvcmRjb3VudFwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0YWJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiVGFibGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBcImluc2VydHRhYmxlIHwgY2VsbCByb3cgY29sdW1uIHwgYWR2dGFibGVzb3J0IHwgdGFibGVwcm9wcyBkZWxldGV0YWJsZVwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBoZWxwOiB7IHRpdGxlOiBcIkhlbHBcIiwgaXRlbXM6IFwiaGVscFwiIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmb250X3NpemVfZm9ybWF0czogZm9udF9zaXplX2Zvcm1hdHMsXG4gICAgICAgICAgICAgICAgZm9udGZhbWlseTogZm9udGZhbWlseSxcbiAgICAgICAgICAgICAgICBmb250RmFtaWx5Rm9ybWF0czogZm9udEZhbWlseUZvcm1hdHMsXG4gICAgICAgICAgICAgICAgcmVsYXRpdmVfdXJsczogcmVsYXRpdmVfdXJscyxcbiAgICAgICAgICAgICAgICByZW1vdmVfc2NyaXB0X2hvc3Q6IHJlbW92ZV9zY3JpcHRfaG9zdCxcbiAgICAgICAgICAgICAgICBjb252ZXJ0X3VybHM6IGNvbnZlcnRfdXJscyxcbiAgICAgICAgICAgICAgICBpbWFnZV9saXN0OiBpbWFnZV9saXN0LFxuICAgICAgICAgICAgICAgIGltYWdlX2FkdnRhYjogaW1hZ2VfYWR2dGFiLFxuICAgICAgICAgICAgICAgIGltYWdlX2Rlc2NyaXB0aW9uOiBpbWFnZV9kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBpbWFnZV9jbGFzc19saXN0OiBpbWFnZV9jbGFzc19saXN0LFxuICAgICAgICAgICAgICAgIGltYWdlc191cGxvYWRfdXJsOiBpbWFnZXNfdXBsb2FkX3VybCxcbiAgICAgICAgICAgICAgICBpbWFnZXNfdXBsb2FkX2Jhc2VfcGF0aDogaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGgsXG4gICAgICAgICAgICAgICAgbGljZW5zZV9rZXk6IGxpY2Vuc2Vfa2V5LFxuICAgICAgICAgICAgICAgIHNldHVwOiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93LnRpbnlTZXR0aW5nc0NvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy50aW55U2V0dGluZ3NDb3B5ID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0dGluZ3MgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICF3aW5kb3cudGlueVNldHRpbmdzQ29weS5zb21lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChvYmopID0+IG9iai5pZCA9PT0gZWRpdG9yLnNldHRpbmdzLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRpbnlTZXR0aW5nc0NvcHkucHVzaChlZGl0b3Iuc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiYmx1clwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmRlc3Ryb3llZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy51cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3RhdGUgPSBlZGl0b3IuZ2V0Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5kZXN0cm95ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMudXBkYXRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN0YXRlID0gZWRpdG9yLmdldENvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiaW5pdFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbnltY2UucmVtb3ZlKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3JzW190aGlzLnN0YXRlUGF0aF0gPSBlZGl0b3IuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5pZCA9IGVkaXRvci5pZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN0YXJ0U3luYyhlZGl0b3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9uZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9mZihcIlNldENvbnRlbnRcIiwgZG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmZpbmlzaFN5bmMoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiU2V0Q29udGVudFwiLCBkb25lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5zZXRDb250ZW50KGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oXCJPcGVuV2luZG93XCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldC5jb250YWluZXIuY2xvc2VzdChcIi5maS1tb2RhbFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ4LXRyYXAubm9zY3JvbGxcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiQ2xvc2VXaW5kb3dcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0LmNvbnRhaW5lci5jbG9zZXN0KFwiLmZpLW1vZGFsXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcIngtdHJhcC5ub3Njcm9sbFwiLCBcImlzT3BlblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZXR1cCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR1cChlZGl0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVnaXN0ZXIgQG1lbnRpb24gYXV0b2NvbXBsZXRlciB3aGVuIGdldE1lbnRpb25Tb3VyY2VSZXN1bHRzVXNpbmcgaXMgcHJvdmlkZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdldE1lbnRpb25Tb3VyY2VSZXN1bHRzVXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci51aS5yZWdpc3RyeS5hZGRBdXRvY29tcGxldGVyKFwibWVudGlvbnNcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6IFwiQFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbkNoYXJzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbnM6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0T246IFtcIml0ZW1fbGFiZWxcIiwgXCJpdGVtX2Rlc2NyaXB0aW9uXCJdLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmV0Y2g6IGFzeW5jICBmdW5jdGlvbiAocGF0dGVybikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb3dlclBhdHRlcm4gPSBwYXR0ZXJuLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgZ2V0TWVudGlvblNvdXJjZVJlc3VsdHNVc2luZyhsb3dlclBhdHRlcm4pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NhcmRtZW51aXRlbScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KGl0ZW0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBpdGVtLmxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYXJkY29udGFpbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ3ZlcnRpY2FsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2FyZHRleHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBpdGVtLmxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnaXRlbV9sYWJlbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYXJkdGV4dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGl0ZW0uZGVzY3JpcHRpb24gfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdpdGVtX2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkFjdGlvbjogYXN5bmMgZnVuY3Rpb24gKGF1dG9jb21wbGV0ZUFwaSwgcm5nLCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLnNldFJuZyhybmcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaHRtbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW50aW9uX21vZGUgPT09IFwibWFpbHRvXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cIm1haWx0bzonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnZhbHVlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCI+QCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubGFiZWwgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9hPiZuYnNwO1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIHN0eWxlPVwiY29sb3I6ICMyNTYzZWI7IGZvbnQtd2VpZ2h0OiA2MDA7XCI+QCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubGFiZWwgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9zcGFuPiZuYnNwO1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmluc2VydENvbnRlbnQoaHRtbCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWZ0ZXJNZW50aW9uU2VsZWN0ZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYWZ0ZXJNZW50aW9uU2VsZWN0ZWQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvY29tcGxldGVBcGkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBpbWFnZXNfdXBsb2FkX2hhbmRsZXI6IChibG9iSW5mbywgcHJvZ3Jlc3MpID0+XG4gICAgICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKChzdWNjZXNzLCBmYWlsdXJlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWJsb2JJbmZvLmJsb2IoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoSm9pbiA9IChwYXRoMSwgcGF0aDIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgxLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIi9cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoMi5yZXBsYWNlKC9eXFwvLywgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaW5pc2hDYWxsYmFjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihfdGhpcy5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZShcIkVkaXRvciB3YXMgZGVzdHJveWVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldEZvcm1Db21wb25lbnRGaWxlQXR0YWNobWVudFVybChzdGF0ZVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCh1cmwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZShcIkltYWdlIHVwbG9hZCBmYWlsZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoSm9pbihpbWFnZXNfdXBsb2FkX2Jhc2VfcGF0aCwgdXJsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmUoXCJJbWFnZSB1cGxvYWQgZmFpbGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NDYWxsYmFjayA9IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoX3RoaXMuZGVzdHJveWVkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcyhlLmRldGFpbC5wcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkd2lyZS51cGxvYWQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYGNvbXBvbmVudEZpbGVBdHRhY2htZW50cy4ke3N0YXRlUGF0aH1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2JJbmZvLmJsb2IoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5pc2hDYWxsYmFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzQ2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgICAgICAgaW5pdF9pbnN0YW5jZV9jYWxsYmFjazogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBNdXRhdGlvbk9ic2VydmVyID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lk1vek11dGF0aW9uT2JzZXJ2ZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNFbmFibGVkID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUltYWdlc0V2ZW50Q2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZW1vdmVJbWFnZXNFdmVudENhbGxiYWNrID09PSBcImZ1bmN0aW9uXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFNdXRhdGlvbk9ic2VydmVyIHx8ICFpc0VuYWJsZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5tdXRhdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMubXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChtdXRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5kZXN0cm95ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkZWRJbWFnZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24gKG11dGF0aW9uUmVjb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShtdXRhdGlvblJlY29yZC5hZGRlZE5vZGVzKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY3VycmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5ub2RlTmFtZSA9PT0gXCJJTUdcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmNsYXNzTmFtZSAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtY2UtY2xvbmVkcmVzaXphYmxlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWRJbWFnZXMuaW5kZXhPZihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLnNyY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkSW1hZ2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmdldEF0dHJpYnV0ZShcInNyY1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZS5ub2RlVHlwZSAhPT0gMSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWdzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShpbWdzKS5mb3JFYWNoKGZ1bmN0aW9uIChpbWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkZWRJbWFnZXMuaW5jbHVkZXMoaW1nLnNyYykpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkSW1hZ2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZy5nZXRBdHRyaWJ1dGUoXCJzcmNcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZWRJbWFnZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24gKG11dGF0aW9uUmVjb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShtdXRhdGlvblJlY29yZC5yZW1vdmVkTm9kZXMpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjdXJyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLm5vZGVOYW1lID09PSBcIklNR1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUuY2xhc3NOYW1lICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1jZS1jbG9uZWRyZXNpemFibGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92ZWRJbWFnZXMuaW5jbHVkZXMoY3VycmVudE5vZGUuc3JjKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZEltYWdlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoXCJzcmNcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudE5vZGUubm9kZVR5cGUgIT09IDEpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1ncyA9IGN1cnJlbnROb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW1nXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGltZ3MpLmZvckVhY2goZnVuY3Rpb24gKGltZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRlZEltYWdlcy5pbmNsdWRlcyhpbWcuc3JjKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWRJbWFnZXMucHVzaChpbWcuZ2V0QXR0cmlidXRlKFwic3JjXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkSW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGltYWdlU3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkSW1hZ2VzLmluY2x1ZGVzKGltYWdlU3JjKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlSW1hZ2VzRXZlbnRDYWxsYmFjayhpbWFnZVNyYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMubXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKGVkaXRvci5nZXRCb2R5KCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBhdXRvbWF0aWNfdXBsb2FkczogdHJ1ZSxcblxuICAgICAgICAgICAgICAgIC4uLmN1c3RvbV9jb25maWdzLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGlueW1jZS5pbml0KHRpbnlNY2VDb25maWcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUVkaXRvckNvbnRlbnQoY29udGVudCkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3IoKTtcblxuICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLnJlbW92ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgZWRpdG9yLnNldENvbnRlbnQoY29udGVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHV0Q3Vyc29yVG9FbmQoKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IucmVtb3ZlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLnNlbGVjdChlZGl0b3IuZ2V0Qm9keSgpLCB0cnVlKTtcblxuICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5jb2xsYXBzZShmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRTeW5jKCkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5lZGl0b3IoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLnJlbW92ZWQgfHwgdGhpcy5pc1N5bmNpbmcpIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBlZGl0b3Iuc2V0UHJvZ3Jlc3NTdGF0ZSh0cnVlKTtcbiAgICAgICAgICAgIGVkaXRvci5tb2RlLnNldChcInJlYWRvbmx5XCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmlzaFN5bmMoKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmVkaXRvcigpO1xuXG4gICAgICAgICAgICB0aGlzLmlzU3luY2luZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IucmVtb3ZlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBlZGl0b3Iuc2V0UHJvZ3Jlc3NTdGF0ZShmYWxzZSk7XG4gICAgICAgICAgICBlZGl0b3IubW9kZS5zZXQoXCJkZXNpZ25cIik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZSxTQUFSLGNBQStCO0FBQUEsRUFDbEM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBLGdCQUFnQjtBQUFBLEVBQ2hCO0FBQUEsRUFDQSxXQUFXO0FBQUEsRUFDWCxlQUFlO0FBQUEsRUFDZixpQkFBaUI7QUFBQSxFQUNqQixTQUFTO0FBQUEsRUFDVCxhQUFhO0FBQUEsRUFDYixhQUFhO0FBQUEsRUFDYixRQUFRO0FBQUEsRUFDUixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUEsRUFDUCxjQUFjO0FBQUEsRUFDZCxpQkFBaUI7QUFBQSxFQUNqQix3QkFBd0I7QUFBQSxFQUN4QixlQUFlO0FBQUEsRUFDZixtQkFBbUI7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
