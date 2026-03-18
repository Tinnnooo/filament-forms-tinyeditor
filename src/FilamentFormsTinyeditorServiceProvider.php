<?php

namespace Noin\FilamentFormsTinyeditor;

use Filament\Forms\ComponentContainer;
use Filament\Forms\Form;
use Filament\Support\Assets\AlpineComponent;
use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Noin\FilamentFormsTinyeditor\Components\TinyEditor;
use Spatie\LaravelPackageTools\Commands\InstallCommand;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class FilamentFormsTinyeditorServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-forms-tinyeditor';

    public function configurePackage(Package $package): void
    {
        /*
         * This class is a Package Service Provider
         *
         * More info: https://github.com/spatie/laravel-package-tools
         */
        $package
            ->name(static::$name)
            ->hasConfigFile()
            ->hasViews()
            ->hasAssets()
            ->hasInstallCommand(function (InstallCommand $command) {
                $command->publishConfigFile()
                    ->copyAndRegisterServiceProviderInApp();
            });

        if (file_exists(__DIR__.'/../../../vendor/tinymce/tinymce')) {
            $this->publishes([__DIR__.'/../../../vendor/tinymce/tinymce' => public_path('vendor/tinymce')], 'public');
        } elseif (file_exists(base_path('vendor/tinymce/tinymce'))) {
            $this->publishes([base_path('vendor/tinymce/tinymce') => public_path('vendor/tinymce')], 'public');
        }
    }

    public function packageBooted(): void
    {
        $this->setupComponentsForEditor();

        $tinyMceVersion = config('filament-forms-tinyeditor.version.tiny', '8.1.2');
        $tinyMceLincenseKey = config('filament-forms-tinyeditor.version.license_key', 'no-api-key');
        $tinyMceLanguages = TinyMce::getLanguages();

        $languages = [];
        $optionalLanguages = config('filament-forms-tinyeditor.languages', []);

        if (! is_array($optionalLanguages)) {
            $optionalLanguages = [];
        }

        foreach ($tinyMceLanguages as $locale => $language) {
            $tinyMceLocale = str_replace('tinymce-lang-', '', $locale);
            $languages[] = Js::make(
                $locale,
                array_key_exists($tinyMceLocale, $optionalLanguages) ? $optionalLanguages[$tinyMceLocale] : $language
            )
                ->loadedOnRequest();
        }

        $provider = config('filament-forms-tinyeditor.provider', 'cloud');

        $tinyMceJs = 'https://cdn.jsdelivr.net/npm/tinymce@'.$tinyMceVersion.'/tinymce.min.js';

        if ($tinyMceLincenseKey != 'no-api-key') {
            $tinyMceJs = 'https://cdn.tiny.cloud/1/'.$tinyMceLincenseKey.'/tinymce/'.$tinyMceVersion.'/tinymce.min.js';
        }

        if ($provider == 'vendor') {
            $tinyMceJs = asset('vendor/tinymce/tinymce.min.js');
        }

        FilamentAsset::register([
            Css::make('tinymce-editor', __DIR__.'/../resources/css/tinymce-editor.css')->loadedOnRequest(),
            Js::make('tinymce', $tinyMceJs),
            AlpineComponent::make('tinymce-editor', __DIR__.'/../resources/dist/tinymce-editor.js'),
        ], package: $this->getAssetPackageName());
    }

    protected function getAssetPackageName(): ?string
    {
        return 'noin/filament-forms-tinyeditor';
    }

    private function setupComponentsForEditor(): void
    {
        ComponentContainer::macro('getMentionSourceResults', function (string $statePath, string $search) {
            /** @var Form $this */
            foreach ($this->getComponents() as $component) {
                if ($component instanceof TinyEditor && $component->getStatePath() === $statePath) {
                    return $component->getMentionSourceResultsForJs($search);
                }

                foreach ($component->getChildComponentContainers() as $container) {
                    if ($container->isHidden()) {
                        continue;
                    }

                    if ($results = $container->getMentionSourceResults($statePath, $search)) {
                        return $results;
                    }
                }
            }

            return [];
        });

        ComponentContainer::macro('afterMentionSelected', function (string $statePath, $data) {
            /** @var Form $this */
            foreach ($this->getComponents() as $component) {
                if ($component instanceof TinyEditor && $component->getStatePath() === $statePath) {
                    $component->afterMentionSelected($data);
                }

                foreach ($component->getChildComponentContainers() as $container) {
                    if ($container->isHidden()) {
                        continue;
                    }

                    $container->afterMentionSelected($statePath, $data);
                }
            }
        });
    }
}
