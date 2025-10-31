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
  removeImagesEventCallback = null
}) {
  let editors = window.filamentTinyMceEditors || {};
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
    init() {
      this.delete();
      this.initEditor(state.initialValue);
      this.$watch("state", (value) => {
        if (this.editor().getContent() === value) return;
        this.startSync();
        const done = () => {
          this.editor().off("SetContent", done);
          this.finishSync();
        };
        this.editor().on("SetContent", done);
        this.editor().setContent(value ?? "");
      });
    },
    editor() {
      return tinymce.get(editors[this.statePath]);
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
            _this.updatedAt = Date.now();
            _this.state = editor.getContent();
          });
          editor.on("change", function(e) {
            _this.updatedAt = Date.now();
            _this.state = editor.getContent();
          });
          editor.on("init", function(e) {
            editors[_this.statePath] = editor.id;
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
            let target = e.target.container.closest(".fi-modal");
            if (target) {
              target.setAttribute("x-trap.noscroll", "false");
            }
          });
          editor.on("CloseWindow", function(e) {
            let target = e.target.container.closest(".fi-modal");
            if (target) {
              target.setAttribute("x-trap.noscroll", "isOpen");
            }
          });
          if (typeof setup === "function") {
            setup(editor);
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
          };
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
        init_instance_callback: function(editor) {
          var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
          var isEnabled = removeImagesEventCallback && typeof removeImagesEventCallback === "function";
          if (!isEnabled) return;
          var observer = new MutationObserver(function(mutations, instance) {
            var addedImages = [];
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
                  var imgs = currentNode.getElementsByTagName("img");
                  Array.from(imgs).forEach(function(img) {
                    if (addedImages.indexOf(img.src) >= 0)
                      return;
                    addedImages.push(
                      img.getAttribute("src")
                    );
                  });
                }
              );
            });
            var removedImages = [];
            mutations.forEach(function(mutationRecord) {
              Array.from(mutationRecord.removedNodes).forEach(
                function(currentNode) {
                  if (currentNode.nodeName === "IMG" && currentNode.className !== "mce-clonedresizable") {
                    if (removedImages.indexOf(
                      currentNode.src
                    ) >= 0)
                      return;
                    removedImages.push(
                      currentNode.getAttribute("src")
                    );
                    return;
                  }
                  if (currentNode.nodeType === 1) {
                    var imgs = currentNode.getElementsByTagName(
                      "img"
                    );
                    Array.from(imgs).forEach(function(img) {
                      if (addedImages.indexOf(img.src) >= 0)
                        return;
                      addedImages.push(
                        img.getAttribute("src")
                      );
                    });
                  }
                }
              );
            });
            removedImages.forEach(function(imageSrc) {
              if (addedImages.indexOf(imageSrc) >= 0) return;
              if (removeImagesEventCallback && typeof removeImagesEventCallback === "function") {
                removeImagesEventCallback(imageSrc);
              }
            });
          });
          observer.observe(editor.getBody(), {
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
      this.editor().setContent(content);
    },
    putCursorToEnd() {
      this.editor().selection.select(this.editor().getBody(), true);
      this.editor().selection.collapse(false);
    },
    delete() {
      if (editors[this.statePath]) {
        this.editor().destroy();
        delete editors[this.statePath];
      }
    },
    startSync() {
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.editor().setProgressState(true);
      this.editor().mode.set("readonly");
    },
    finishSync() {
      this.isSyncing = false;
      this.editor().setProgressState(false);
      this.editor().mode.set("design");
    }
  };
}
export {
  tinymceEditor as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vanMvdGlueW1jZS1lZGl0b3IuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRpbnltY2VFZGl0b3Ioe1xuICAgIHN0YXRlLFxuICAgIHN0YXRlUGF0aCxcbiAgICBzZWxlY3RvcixcbiAgICBwbHVnaW5zLFxuICAgIGV4dGVybmFsX3BsdWdpbnMsXG4gICAgdG9vbGJhcixcbiAgICB0b29sYmFyX2dyb3VwcyxcbiAgICBjb250ZW50X3N0eWxlID0gXCJcIixcbiAgICB0ZXh0X3BhdHRlcm5zLFxuICAgIGxhbmd1YWdlID0gXCJlblwiLFxuICAgIGxhbmd1YWdlX3VybCA9IG51bGwsXG4gICAgZGlyZWN0aW9uYWxpdHkgPSBcImx0clwiLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgbWF4X2hlaWdodCA9IDAsXG4gICAgbWluX2hlaWdodCA9IDEwMCxcbiAgICB3aWR0aCA9IG51bGwsXG4gICAgbWF4X3dpZHRoID0gMCxcbiAgICBtaW5fd2lkdGggPSA0MDAsXG4gICAgcmVzaXplID0gZmFsc2UsXG4gICAgc2tpbiA9IFwib3hpZGVcIixcbiAgICBjb250ZW50X2NzcyA9IFwiZGVmYXVsdFwiLFxuICAgIHRvb2xiYXJfc3RpY2t5ID0gdHJ1ZSxcbiAgICB0b29sYmFyX3N0aWNreV9vZmZzZXQgPSA2NCxcbiAgICB0b29sYmFyX21vZGUgPSBcInNsaWRpbmdcIixcbiAgICB0b29sYmFyX2xvY2F0aW9uID0gXCJhdXRvXCIsXG4gICAgaW5saW5lID0gZmFsc2UsXG4gICAgdG9vbGJhcl9wZXJzaXN0ID0gZmFsc2UsXG4gICAgbWVudWJhciA9IGZhbHNlLFxuICAgIHJlbGF0aXZlX3VybHMgPSB0cnVlLFxuICAgIHJlbW92ZV9zY3JpcHRfaG9zdCA9IHRydWUsXG4gICAgY29udmVydF91cmxzID0gdHJ1ZSxcbiAgICBmb250X3NpemVfZm9ybWF0cyA9IFwiXCIsXG4gICAgZm9udGZhbWlseSA9IFwiXCIsXG4gICAgc2V0dXAgPSBudWxsLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgbG9jYWxlID0gXCJlblwiLFxuICAgIHBsYWNlaG9sZGVyID0gbnVsbCxcbiAgICBpbWFnZV9saXN0ID0gbnVsbCxcbiAgICBpbWFnZXNfdXBsb2FkX3VybCA9IG51bGwsXG4gICAgaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGggPSBudWxsLFxuICAgIGltYWdlX2FkdnRhYiA9IGZhbHNlLFxuICAgIGltYWdlX2Rlc2NyaXB0aW9uID0gZmFsc2UsXG4gICAgaW1hZ2VfY2xhc3NfbGlzdCA9IG51bGwsXG4gICAgbGljZW5zZV9rZXkgPSBcImdwbFwiLFxuICAgIGN1c3RvbV9jb25maWdzID0ge30sXG4gICAgcmVtb3ZlSW1hZ2VzRXZlbnRDYWxsYmFjayA9IG51bGwsXG59KSB7XG4gICAgbGV0IGVkaXRvcnMgPSB3aW5kb3cuZmlsYW1lbnRUaW55TWNlRWRpdG9ycyB8fCB7fTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBudWxsLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIHN0YXRlUGF0aDogc3RhdGVQYXRoLFxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZSxcbiAgICAgICAgbGFuZ3VhZ2VfdXJsOiBsYW5ndWFnZV91cmwsXG4gICAgICAgIGRpcmVjdGlvbmFsaXR5OiBkaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIG1heF9oZWlnaHQ6IG1heF9oZWlnaHQsXG4gICAgICAgIG1pbl9oZWlnaHQ6IG1pbl9oZWlnaHQsXG4gICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgbWF4X3dpZHRoOiBtYXhfd2lkdGgsXG4gICAgICAgIG1pbl93aWR0aDogbWluX3dpZHRoLFxuICAgICAgICByZXNpemU6IHJlc2l6ZSxcbiAgICAgICAgc2tpbjogc2tpbixcbiAgICAgICAgY29udGVudF9jc3M6IGNvbnRlbnRfY3NzLFxuICAgICAgICBjb250ZW50X3N0eWxlOiBjb250ZW50X3N0eWxlLFxuICAgICAgICBwbHVnaW5zOiBwbHVnaW5zLFxuICAgICAgICBleHRlcm5hbF9wbHVnaW5zOiBleHRlcm5hbF9wbHVnaW5zLFxuICAgICAgICB0b29sYmFyOiB0b29sYmFyLFxuICAgICAgICB0b29sYmFyX2dyb3VwczogdG9vbGJhcl9ncm91cHMsXG4gICAgICAgIHRleHRfcGF0dGVybnM6IHRleHRfcGF0dGVybnMsXG4gICAgICAgIHRvb2xiYXJfc3RpY2t5OiB0b29sYmFyX3N0aWNreSxcbiAgICAgICAgbWVudWJhcjogbWVudWJhcixcbiAgICAgICAgcmVsYXRpdmVfdXJsczogcmVsYXRpdmVfdXJscyxcbiAgICAgICAgcmVtb3ZlX3NjcmlwdF9ob3N0OiByZW1vdmVfc2NyaXB0X2hvc3QsXG4gICAgICAgIGNvbnZlcnRfdXJsczogY29udmVydF91cmxzLFxuICAgICAgICBmb250X3NpemVfZm9ybWF0czogZm9udF9zaXplX2Zvcm1hdHMsXG4gICAgICAgIGZvbnRmYW1pbHk6IGZvbnRmYW1pbHksXG4gICAgICAgIHNldHVwOiBzZXR1cCxcbiAgICAgICAgaW1hZ2VfbGlzdDogaW1hZ2VfbGlzdCxcbiAgICAgICAgaW1hZ2VfYWR2dGFiOiBpbWFnZV9hZHZ0YWIsXG4gICAgICAgIGltYWdlX2Rlc2NyaXB0aW9uOiBpbWFnZV9kZXNjcmlwdGlvbixcbiAgICAgICAgaW1hZ2VfY2xhc3NfbGlzdDogaW1hZ2VfY2xhc3NfbGlzdCxcbiAgICAgICAgaW1hZ2VzX3VwbG9hZF91cmw6IGltYWdlc191cGxvYWRfdXJsLFxuICAgICAgICBpbWFnZXNfdXBsb2FkX2Jhc2VfcGF0aDogaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGgsXG4gICAgICAgIGxpY2Vuc2Vfa2V5OiBsaWNlbnNlX2tleSxcbiAgICAgICAgY3VzdG9tX2NvbmZpZ3M6IGN1c3RvbV9jb25maWdzLFxuICAgICAgICB1cGRhdGVkQXQ6IERhdGUubm93KCksXG4gICAgICAgIGRpc2FibGVkLFxuICAgICAgICBsb2NhbGU6IGxvY2FsZSxcbiAgICAgICAgcGxhY2Vob2xkZXI6IHBsYWNlaG9sZGVyLFxuICAgICAgICBpc1N5bmNpbmc6IGZhbHNlLFxuXG4gICAgICAgIGluaXQoKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZSgpO1xuXG4gICAgICAgICAgICB0aGlzLmluaXRFZGl0b3Ioc3RhdGUuaW5pdGlhbFZhbHVlKTtcblxuICAgICAgICAgICAgdGhpcy4kd2F0Y2goXCJzdGF0ZVwiLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lZGl0b3IoKS5nZXRDb250ZW50KCkgPT09IHZhbHVlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydFN5bmMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkb25lID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvcigpLm9mZihcIlNldENvbnRlbnRcIiwgZG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoU3luYygpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IoKS5vbihcIlNldENvbnRlbnRcIiwgZG9uZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IoKS5zZXRDb250ZW50KHZhbHVlID8/IFwiXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZWRpdG9yKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRpbnltY2UuZ2V0KGVkaXRvcnNbdGhpcy5zdGF0ZVBhdGhdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0RWRpdG9yKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIGxldCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBsZXQgJHdpcmUgPSB0aGlzLiR3aXJlO1xuXG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0Rm9udEZhbWlseUZvcm1hdHMgPVxuICAgICAgICAgICAgICAgIFwiQXJpYWw9YXJpYWwsaGVsdmV0aWNhLHNhbnMtc2VyaWY7IENvdXJpZXIgTmV3PWNvdXJpZXIgbmV3LGNvdXJpZXIsbW9ub3NwYWNlO1wiO1xuICAgICAgICAgICAgY29uc3QgZm9udEZhbWlseUZvcm1hdHMgPSBmb250ZmFtaWx5IHx8IGRlZmF1bHRGb250RmFtaWx5Rm9ybWF0cztcblxuICAgICAgICAgICAgY29uc3QgdGlueU1jZUNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlLFxuICAgICAgICAgICAgICAgIGxhbmd1YWdlX3VybDogbGFuZ3VhZ2VfdXJsLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbmFsaXR5OiBkaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgICAgICAgICBzdGF0dXNiYXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHByb21vdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgbWF4X2hlaWdodDogbWF4X2hlaWdodCxcbiAgICAgICAgICAgICAgICBtaW5faGVpZ2h0OiBtaW5faGVpZ2h0LFxuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgICAgICBtYXhfd2lkdGg6IG1heF93aWR0aCxcbiAgICAgICAgICAgICAgICBtaW5fd2lkdGg6IG1pbl93aWR0aCxcbiAgICAgICAgICAgICAgICByZXNpemU6IHJlc2l6ZSxcbiAgICAgICAgICAgICAgICBza2luOiBza2luLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRfY3NzOiBjb250ZW50X2NzcyxcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBwbHVnaW5zLFxuICAgICAgICAgICAgICAgIGV4dGVybmFsX3BsdWdpbnM6IGV4dGVybmFsX3BsdWdpbnMsXG4gICAgICAgICAgICAgICAgdG9vbGJhcjogdG9vbGJhcixcbiAgICAgICAgICAgICAgICB0b29sYmFyX2dyb3VwczogdG9vbGJhcl9ncm91cHMsXG4gICAgICAgICAgICAgICAgdGV4dF9wYXR0ZXJuczogdGV4dF9wYXR0ZXJucyxcbiAgICAgICAgICAgICAgICB0b29sYmFyX3N0aWNreTogdG9vbGJhcl9zdGlja3ksXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9zdGlja3lfb2Zmc2V0OiB0b29sYmFyX3N0aWNreV9vZmZzZXQsXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9tb2RlOiB0b29sYmFyX21vZGUsXG4gICAgICAgICAgICAgICAgdG9vbGJhcl9sb2NhdGlvbjogdG9vbGJhcl9sb2NhdGlvbixcbiAgICAgICAgICAgICAgICBpbmxpbmU6IGlubGluZSxcbiAgICAgICAgICAgICAgICB0b29sYmFyX3BlcnNpc3Q6IHRvb2xiYXJfcGVyc2lzdCxcbiAgICAgICAgICAgICAgICBtZW51YmFyOiBtZW51YmFyLFxuICAgICAgICAgICAgICAgIG1lbnU6IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiRmlsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwibmV3ZG9jdW1lbnQgcmVzdG9yZWRyYWZ0IHwgcHJldmlldyB8IGV4cG9ydCBwcmludCB8IGRlbGV0ZWFsbGNvbnZlcnNhdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiRWRpdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwidW5kbyByZWRvIHwgY3V0IGNvcHkgcGFzdGUgcGFzdGV0ZXh0IHwgc2VsZWN0YWxsIHwgc2VhcmNocmVwbGFjZVwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB2aWV3OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJWaWV3XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogXCJjb2RlIHwgdmlzdWFsYWlkIHZpc3VhbGNoYXJzIHZpc3VhbGJsb2NrcyB8IHNwZWxsY2hlY2tlciB8IHByZXZpZXcgZnVsbHNjcmVlbiB8IHNob3djb21tZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBpbnNlcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkluc2VydFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwiaW1hZ2UgbGluayBtZWRpYSBhZGRjb21tZW50IHBhZ2VlbWJlZCBjb2Rlc2FtcGxlIGluc2VydHRhYmxlIHwgY2hhcm1hcCBlbW90aWNvbnMgaHIgfCBwYWdlYnJlYWsgbm9uYnJlYWtpbmcgYW5jaG9yIHRhYmxlb2Zjb250ZW50cyB8IGluc2VydGRhdGV0aW1lXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiRm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogXCJib2xkIGl0YWxpYyB1bmRlcmxpbmUgc3RyaWtldGhyb3VnaCBzdXBlcnNjcmlwdCBzdWJzY3JpcHQgY29kZWZvcm1hdCB8IHN0eWxlcyBibG9ja3MgZm9udGZhbWlseSBmb250c2l6ZSBhbGlnbiBsaW5laGVpZ2h0IHwgZm9yZWNvbG9yIGJhY2tjb2xvciB8IGxhbmd1YWdlIHwgcmVtb3ZlZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRvb2xzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJUb29sc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwic3BlbGxjaGVja2VyIHNwZWxsY2hlY2tlcmxhbmd1YWdlIHwgYTExeWNoZWNrIGNvZGUgd29yZGNvdW50XCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRhYmxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJUYWJsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFwiaW5zZXJ0dGFibGUgfCBjZWxsIHJvdyBjb2x1bW4gfCBhZHZ0YWJsZXNvcnQgfCB0YWJsZXByb3BzIGRlbGV0ZXRhYmxlXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGhlbHA6IHsgdGl0bGU6IFwiSGVscFwiLCBpdGVtczogXCJoZWxwXCIgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZvbnRfc2l6ZV9mb3JtYXRzOiBmb250X3NpemVfZm9ybWF0cyxcbiAgICAgICAgICAgICAgICBmb250ZmFtaWx5OiBmb250ZmFtaWx5LFxuICAgICAgICAgICAgICAgIGZvbnRGYW1pbHlGb3JtYXRzOiBmb250RmFtaWx5Rm9ybWF0cyxcbiAgICAgICAgICAgICAgICByZWxhdGl2ZV91cmxzOiByZWxhdGl2ZV91cmxzLFxuICAgICAgICAgICAgICAgIHJlbW92ZV9zY3JpcHRfaG9zdDogcmVtb3ZlX3NjcmlwdF9ob3N0LFxuICAgICAgICAgICAgICAgIGNvbnZlcnRfdXJsczogY29udmVydF91cmxzLFxuICAgICAgICAgICAgICAgIGltYWdlX2xpc3Q6IGltYWdlX2xpc3QsXG4gICAgICAgICAgICAgICAgaW1hZ2VfYWR2dGFiOiBpbWFnZV9hZHZ0YWIsXG4gICAgICAgICAgICAgICAgaW1hZ2VfZGVzY3JpcHRpb246IGltYWdlX2Rlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIGltYWdlX2NsYXNzX2xpc3Q6IGltYWdlX2NsYXNzX2xpc3QsXG4gICAgICAgICAgICAgICAgaW1hZ2VzX3VwbG9hZF91cmw6IGltYWdlc191cGxvYWRfdXJsLFxuICAgICAgICAgICAgICAgIGltYWdlc191cGxvYWRfYmFzZV9wYXRoOiBpbWFnZXNfdXBsb2FkX2Jhc2VfcGF0aCxcbiAgICAgICAgICAgICAgICBsaWNlbnNlX2tleTogbGljZW5zZV9rZXksXG4gICAgICAgICAgICAgICAgc2V0dXA6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cudGlueVNldHRpbmdzQ29weSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnRpbnlTZXR0aW5nc0NvcHkgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5zZXR0aW5ncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIXdpbmRvdy50aW55U2V0dGluZ3NDb3B5LnNvbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG9iaikgPT4gb2JqLmlkID09PSBlZGl0b3Iuc2V0dGluZ3MuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cudGlueVNldHRpbmdzQ29weS5wdXNoKGVkaXRvci5zZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oXCJibHVyXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy51cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3RhdGUgPSBlZGl0b3IuZ2V0Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnVwZGF0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zdGF0ZSA9IGVkaXRvci5nZXRDb250ZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbihcImluaXRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvcnNbX3RoaXMuc3RhdGVQYXRoXSA9IGVkaXRvci5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zdGFydFN5bmMoZWRpdG9yKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvbmUgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vZmYoXCJTZXRDb250ZW50XCIsIGRvbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5maW5pc2hTeW5jKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbihcIlNldENvbnRlbnRcIiwgZG9uZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0Q29udGVudChjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiT3BlbldpbmRvd1wiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGUudGFyZ2V0LmNvbnRhaW5lci5jbG9zZXN0KFwiLmZpLW1vZGFsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ4LXRyYXAubm9zY3JvbGxcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKFwiQ2xvc2VXaW5kb3dcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0YXJnZXQgPSBlLnRhcmdldC5jb250YWluZXIuY2xvc2VzdChcIi5maS1tb2RhbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFwieC10cmFwLm5vc2Nyb2xsXCIsIFwiaXNPcGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNldHVwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHVwKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGltYWdlc191cGxvYWRfaGFuZGxlcjogKGJsb2JJbmZvLCBwcm9ncmVzcykgPT5cbiAgICAgICAgICAgICAgICAgICAgbmV3IFByb21pc2UoKHN1Y2Nlc3MsIGZhaWx1cmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmxvYkluZm8uYmxvYigpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhKb2luID0gKHBhdGgxLCBwYXRoMikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDEucmVwbGFjZSgvXFwvJC8sIFwiXCIpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiL1wiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgyLnJlcGxhY2UoL15cXC8vLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaW5pc2hDYWxsYmFjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2lyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0Rm9ybUNvbXBvbmVudEZpbGVBdHRhY2htZW50VXJsKHN0YXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlKFwiSW1hZ2UgdXBsb2FkIGZhaWxlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhKb2luKGltYWdlc191cGxvYWRfYmFzZV9wYXRoLCB1cmwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yQ2FsbGJhY2sgPSAoKSA9PiB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NDYWxsYmFjayA9IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MoZS5kZXRhaWwucHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpcmUudXBsb2FkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBjb21wb25lbnRGaWxlQXR0YWNobWVudHMuJHtzdGF0ZVBhdGh9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9iSW5mby5ibG9iKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluaXNoQ2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0NhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgIGluaXRfaW5zdGFuY2VfY2FsbGJhY2s6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPVxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5XZWJLaXRNdXRhdGlvbk9ic2VydmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuTW96TXV0YXRpb25PYnNlcnZlcjtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgaXNFbmFibGVkID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUltYWdlc0V2ZW50Q2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZW1vdmVJbWFnZXNFdmVudENhbGxiYWNrID09PSBcImZ1bmN0aW9uXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VuYWJsZWQpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRlZEltYWdlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAobXV0YXRpb25SZWNvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKG11dGF0aW9uUmVjb3JkLmFkZGVkTm9kZXMpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjdXJyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLm5vZGVOYW1lID09PSBcIklNR1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUuY2xhc3NOYW1lICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1jZS1jbG9uZWRyZXNpemFibGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZEltYWdlcy5pbmRleE9mKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUuc3JjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWRJbWFnZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUuZ2V0QXR0cmlidXRlKFwic3JjXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImltZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oaW1ncykuZm9yRWFjaChmdW5jdGlvbiAoaW1nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkSW1hZ2VzLmluZGV4T2YoaW1nLnNyYykgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWRJbWFnZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLmdldEF0dHJpYnV0ZShcInNyY1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlbW92ZWRJbWFnZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24gKG11dGF0aW9uUmVjb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShtdXRhdGlvblJlY29yZC5yZW1vdmVkTm9kZXMpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjdXJyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLm5vZGVOYW1lID09PSBcIklNR1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUuY2xhc3NOYW1lICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1jZS1jbG9uZWRyZXNpemFibGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkSW1hZ2VzLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5zcmNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkSW1hZ2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmdldEF0dHJpYnV0ZShcInNyY1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudE5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1ncyA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpbWdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oaW1ncykuZm9yRWFjaChmdW5jdGlvbiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZEltYWdlcy5pbmRleE9mKGltZy5zcmMpID49XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZEltYWdlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nLmdldEF0dHJpYnV0ZShcInNyY1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkSW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGltYWdlU3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkSW1hZ2VzLmluZGV4T2YoaW1hZ2VTcmMpID49IDApIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUltYWdlc0V2ZW50Q2FsbGJhY2sgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHJlbW92ZUltYWdlc0V2ZW50Q2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVJbWFnZXNFdmVudENhbGxiYWNrKGltYWdlU3JjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShlZGl0b3IuZ2V0Qm9keSgpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGF1dG9tYXRpY191cGxvYWRzOiB0cnVlLFxuICAgICAgICAgICAgICAgIC4uLmN1c3RvbV9jb25maWdzLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGlueW1jZS5pbml0KHRpbnlNY2VDb25maWcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUVkaXRvckNvbnRlbnQoY29udGVudCkge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IoKS5zZXRDb250ZW50KGNvbnRlbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHB1dEN1cnNvclRvRW5kKCkge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IoKS5zZWxlY3Rpb24uc2VsZWN0KHRoaXMuZWRpdG9yKCkuZ2V0Qm9keSgpLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yKCkuc2VsZWN0aW9uLmNvbGxhcHNlKGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGUoKSB7XG4gICAgICAgICAgICBpZiAoZWRpdG9yc1t0aGlzLnN0YXRlUGF0aF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvcigpLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZWRpdG9yc1t0aGlzLnN0YXRlUGF0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnRTeW5jKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTeW5jaW5nKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5lZGl0b3IoKS5zZXRQcm9ncmVzc1N0YXRlKHRydWUpO1xuXG4gICAgICAgICAgICB0aGlzLmVkaXRvcigpLm1vZGUuc2V0KFwicmVhZG9ubHlcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluaXNoU3luYygpIHtcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVkaXRvcigpLnNldFByb2dyZXNzU3RhdGUoZmFsc2UpO1xuXG4gICAgICAgICAgICB0aGlzLmVkaXRvcigpLm1vZGUuc2V0KFwiZGVzaWduXCIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWUsU0FBUixjQUErQjtBQUFBLEVB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
