# Filament Forms TinyEditor

<img src="https://banners.beyondco.de/TinyMCE%20Editor.png?theme=light&packageManager=composer+require&packageName=noin%2Ffilament-forms-tinyeditor&pattern=tinyCheckers&style=style_2&description=&md=1&showWatermark=0&fontSize=100px&images=https%3A%2F%2Flaravel.com%2Fimg%2Flogomark.min.svg&widths=150" alt="Noin"/>

[![Latest Version on Packagist](https://img.shields.io/packagist/v/noin/filament-forms-tinyeditor.svg?style=flat-square)](https://packagist.org/packages/noin/filament-forms-tinyeditor) [![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/Tinnnooo/filament-forms-tinyeditor/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/Tinnnooo/filament-forms-tinyeditor/actions?query=workflow%3Arun-tests+branch%3Amain) [![GitHub Code Style Action Status](https://img.shields.io/github/actions/workflow/status/Tinnnooo/filament-forms-tinyeditor/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/Tinnnooo/filament-forms-tinyeditor/actions?query=workflow%3A"Fix+PHP+code+style+issues"+branch%3Amain) [![Total Downloads](https://img.shields.io/packagist/dt/noin/filament-forms-tinyeditor.svg?style=flat-square)](https://packagist.org/packages/noin/filament-forms-tinyeditor)

---

## 📝 Overview

**Filament Forms TinyEditor** provides a **TinyMCE editor field** for your Filament forms.  
It combines and improves upon two existing community plugins:

- [TinyEditor by mohamedsabil83](https://github.com/mohamedsabil83/filament-forms-tinyeditor)  
- [TinyEditor by amidesfahani](https://github.com/amidesfahani/filament-tinyeditor)

The goal is to unify both approaches into a single, reliable, and customizable **TinyMCE integration** for the Filament admin panel — offering an effortless way to add rich-text editing to your forms.

---

## 📦 Installation

Install the package via Composer:

```bash
composer require noin/filament-forms-tinyeditor
```

After installation, the TinyEditor field will be automatically registered and ready to use.

## ⚙️ Usage Example

Add the TinyEditor field to your Filament form:

```bash
use Noin\FilamentFormsTinyeditor\TinyEditor;

TinyEditor::make('content');
```

## ⚙️ Configuration

You can publish the configuration file to customize the default TinyMCE settings:

```bash
php artisan vendor:publish --tag="filament-forms-tinyeditor-config"
```

This will create a configuration file at:
```arduino
config/filament-forms-tinyeditor.php
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

-   [Tinnnooo](https://github.com/Tinnnooo)
-   [MohamedSabil83](https://github.com/mohamedsabil83)
-   [amidesfahani](https://github.com/amidesfahani)
-   [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
