<?php

namespace Noin\FilamentFormsTinyeditor\Contracts;

use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

interface FileAttachmentProvider
{
    public function attribute($attribute): static;

    public function getFileAttachmentUrl(mixed $file): ?string;

    public function saveUploadedFileAttachment(TemporaryUploadedFile $file): mixed;

    public function getDefaultFileAttachmentVisibility(): ?string;

    public function isExistingRecordRequiredToSaveNewFileAttachments(): bool;

    /**
     * @param  array<mixed>  $exceptIds
     */
    public function cleanUpFileAttachments(array $exceptIds): void;
}
