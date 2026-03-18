@php
    $extraAttributeBag = $getExtraAttributeBag();
    $fieldWrapperView = $getFieldWrapperView();
    $key = $getKey();
    $statePath = $getStatePath();
    $textareaID = 'tiny-editor-'.str_replace(['.','#','$'], '-', $getId().'-'.rand());
    $livewireKey = $getLivewireKey();
@endphp
<x-dynamic-component :component="$fieldWrapperView" :field="$field" class="relative z-0">
        <x-filament::input.wrapper :valid="!$errors->has($statePath)" x-cloak :attributes="\Filament\Support\prepare_inherited_attributes($extraAttributeBag)" class="p-1">
            <div
                wire:ignore
                x-ignore
                x-load
                x-cloak
                x-load-src="{{ \Filament\Support\Facades\FilamentAsset::getAlpineComponentSrc('tinymce-editor', 'noin/filament-forms-tinyeditor') }}"
                x-load-js="[@js(\Filament\Support\Facades\FilamentAsset::getScriptSrc($getLanguageId(), 'noin/filament-forms-tinyeditor'))]"
                x-load-css="[@js(\Filament\Support\Facades\FilamentAsset::getStyleHref('tinymce-editor', 'noin/filament-forms-tinyeditor'))]"
                x-data="tinymceEditor({
                    state: $wire.{{ $applyStateBindingModifiers("entangle('{$statePath}')", isOptimisticallyLive: false) }},
                    statePath: '{{ $statePath }}',
                    selector: '#{{ $textareaID }}',
                    plugins: '{{ $getPlugins() }}',
                    external_plugins: {{ $getExternalPlugins() }},
                    toolbar: '{{ $getToolbar() }}',
                    toolbar_groups: @js($getToolbarGroups()),
                    content_style: '{{ $contentStyle() }}',
                    @if(!$getTextPattern())
                        text_patterns @js($getTextPattern()),
                    @endif
                    language: '{{ $getInterfaceLanguage() }}',
                    language_url: '{{ $getLanguageURL($getInterfaceLanguage()) }}',
                    directionality: '{{ $getDirection() }}',
                    @if($getHeight())
                        height: @js($getHeight()),
                    @endif
                    @if($getMaxHeight())
                        max_height: @js($getMaxHeight()),
                    @endif
                    @if ($getMinHeight())
                        min_height: @js($getMinHeight()),
                    @endif
                    @if ($getWidth())
                        width: @js($getWidth()),
                    @endif
                    @if ($getTinyMaxWidth())
                        max_width: @js($getTinyMaxWidth()),
                    @endif
                    @if ($getMinWidth())
                        min_width: @js($getMinWidth()),
                    @endif
                    resize: @js($getResize()),
                    @if(!filament()->hasdarkModeForced() && $darkMode() == 'media')
                        skin: (window.matchMedia('(prefers-color-schema: dark)').matches ? 'oxide-dark' : 'oxide'),
                        content_css: (window.matchMedia('(prefers-color-schema: dark)').matches ? 'dark' : 'default'),
                    @elseif(!filament()->hasDarkModeForced() && $darkMode() == 'class')
                        skin: (document.querySelector('html').getAttribute('class').includes('dark') ? 'oxide-dark' : 'oxide'),
                        content_css: (document.querySelector('html').getAttribute('class').includes('dark') ? 'dark' : 'default'),
                    @elseif(!filament()->hasDarkModeForced() && $darkMode() == 'force')
                        skin: 'oxide-dark',
                        cotent_css: 'default',
                    @elseif(!filament()->hasDarkModeForced() && $darkMode() == false)
                        skin: 'oxide',
                        content_css: 'default',
                    @elseif(!filament()->hasDarkModeForced() && $darkMode() == 'custom')
                        skin: '{{ $skinsUI() }}',
                        content_css: '{{ $skinsContent() }}',
                    @else
                        skin: ((localStorage.getItem('theme') ?? 'system') == 'dark' || (localStorage.getItem('theme') === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'oxide-dark' : 'oxide',
                        content_css: ((localStorage.getItem('theme') ?? 'system') == 'dark' || (localStorage.getItem('theme') === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'default',
                    @endif
                    toolbar_sticky: {{ $getToolbarSticky() ? 'true' : 'false' }},
                    toolbar_sticky_offset: {{ $getToolbarStickyOffset() }},
                    toolbar_mode: '{{ $getToolbarMode() }}',
                    toolbar_location: '{{ $getToolbarLocation() }}',
                    inline: {{ $getInlineOption() ? 'true' : 'false' }},
                    toolbar_persist: {{ $getToolbarPersist() ? 'true' : 'false'}},
                    menubar: {{ $getShowMenuBar() ? 'true' : 'false' }},
                    relative_urls: {{ $getRelativeUrls() ? 'true' : 'false' }},
                    remove_script_host: {{ $getRemoveScriptHost() ? 'true' : 'false' }},
                    convert_urls: {{ $getConvertUrls() ? 'true' : 'false' }},
                    font_size_formats: '{{ $getFontSizes() }}',
                    fontfamily: '{{ $getFontFamilies() }}',
                    setup: null,
                    disabled: @js($isDisabled),
                    locale: '{{ app()->getLocale() }}',
                    placeholder: @js($getPlaceholder()),
                    image_list: {!! $getImageList() !!},
                    @if ($getImagesUploadUrl !== false)
                        images_upload_url: @js($getImagesUploadUrl()),
                    @endif
                    image_advtab: @js($isImageAdvtab()),
                    image_description: @js($isImageDescription()),
                    image_class_list: @js($getImageClassList()),
                    license_key: '{{ $getLicenseKey() }}',
                    custom_configs: @js($getCustomConfigs()),
                    mergeable_blocks: @js($getMergeableBlocks()),
                    getMentionSourceResultsUsing: async (search) => {
                        return await $wire.callSchemaComponentMethod(
                            @js($key),
                            'getMentionSourceResultsForJs',
                            { search }
                        )
                    },
                    mention_mode: '{{ $getMentionMode() }}',
                    afterMentionSelected: async (data) => {
                        await $wire.callSchemaComponentMethod(
                            @js($key),
                            'afterMentionSelected',
                            { data }
                        );
                    },
        })"
                >
                @unless ($isDisabled())
                    <textarea id="{{ $textareaID }}" x-ref="tinymce" placeholder="{{ $getPlaceholder() }}" {{ $getExtraInputAttributeBag()
                        ->merge([
                            $applyStateBindingModifiers('wire:model') => $statePath,
                        ], escape: false) }}>
                    </textarea>
                @else
                    <div x-html="state" @style([
                        'max-height: ' . $getPreviewMaxHeight() . 'px' => $getPreviewMaxHeight() > 0,
                        'min-height: ' . $getPreviewMinHeight() . 'px' => $getPreviewMinHeight() > 0,
                    ])
                        class="block w-full p-3 overflow-y-auto prose transition duration-75 rounded-lg shadow-sm max-w-none opacity-70 dark:prose-invert dark:text-white">
                    </div>
                @endunless
            </div>
        </x-filament::input.wrapper>
</x-dynamic-component>
