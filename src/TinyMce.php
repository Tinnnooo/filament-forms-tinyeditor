<?php

namespace Noin\FilamentFormsTinyeditor;

class TinyMce
{
    public static function version(): string
    {
        return config('filament-forms-tinyeditor.version.tiny', '8.1.0');
    }

    public static function languageVersion(): string
    {
        return config('filament-forms-tinyeditor.version.language.version', '25.9.22');
    }

    public static function languagePackage(): string
    {
        return config('filament-forms-tinyeditor.version.language.package', 'langs8');
    }

    public static array $languages = [
        'ar',
        'az',
        'bg_BG',
        'bn_BD',
        'ca',
        'cs',
        'cy',
        'da',
        'de',
        'dv',
        'el',
        'eo',
        'es',
        'et',
        'es_MX',
        'eu',
        'fa',
        'fi',
        'fr_FR',
        'ga',
        'gl',
        'he_IL',
        'hr',
        'hu_HU',
        'hy',
        'id',
        'is_IS',
        'it',
        'ja',
        'kab',
        'kk',
        'ko_KR',
        'ku',
        'lt',
        'lv',
        'nb_NO',
        'nl',
        'nl_BE',
        'oc',
        'pl',
        'pt_BR',
        'ro',
        'ru',
        'sk',
        'sl_SI',
        'sq',
        'sr',
        'sv_SE',
        'ta',
        'tg',
        'th_TH',
        'tr',
        'ug',
        'uk',
        'vi',
    ];

    public static function getLanguageURL(string $lang): string
    {
        return 'https://cdn.jsdelivr.net/npm/tinymce-i18n@'.static::languageVersion().'/'.static::languagePackage().'/'.$lang.'.min.js';
    }

    public static function getLanguages(): array
    {
        $languages = [];

        foreach (static::$languages as $lang) {
            $languages["tinymce-lang-{$lang}"] = static::getLanguageURL($lang);
        }

        return $languages;
    }
}
