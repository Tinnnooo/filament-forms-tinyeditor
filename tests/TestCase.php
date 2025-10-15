<?php

namespace Noin\FilamentFormsTinyeditor\Tests;

use Noin\FilamentFormsTinyeditor\FilamentFormsTinyeditorServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

class TestCase extends Orchestra
{
    protected function getPackageProviders($app)
    {
        return [
            FilamentFormsTinyeditorServiceProvider::class,
        ];
    }
}
